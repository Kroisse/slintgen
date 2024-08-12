import Parser from "npm:web-tree-sitter";

interface Callback {
  name: string;
  args: string[];
  returnType: string | null;
}

async function main() {
  const uiFile = Deno.args[0];
  if (!uiFile) {
    console.error("No UI file specified");
    Deno.exit(1);
  }

  await Parser.init();
  const parser = new Parser();
  const Slint = await fetch(
    import.meta.resolve("./tree-sitter-slint.wasm"),
  )
    .then((r) => r.bytes())
    .then((bytes) => Parser.Language.load(bytes));
  parser.setLanguage(Slint);
  // Read and parse the Slint file
  const sourceCode = Deno.readTextFileSync(uiFile);
  const tree = parser.parse(sourceCode);
  const rootNode = tree.rootNode;
  const cursor = rootNode.walk();

  // Traverse and process nodes
  const seenTypes = new Set<string>();
  console.log("// deno-lint-ignore-file no-explicit-any");
  processNode(cursor, seenTypes);
}

function processNode(
  cursor: Parser.TreeCursor,
  seenTypes: Set<string>,
) {
  do {
    const node = cursor.currentNode;
    const kind = node.type;

    switch (kind) {
      case "struct_definition":
        processStruct(cursor, seenTypes);
        break;
      case "export": {
        const sibling = node.nextSibling;
        if (sibling?.type === "component_definition") {
          cursor.gotoNextSibling();
          processComponent(cursor, seenTypes);
        }
        break;
      }
    }

    if (cursor.gotoFirstChild()) {
      processNode(cursor, seenTypes);
      cursor.gotoParent();
    }
  } while (cursor.gotoNextSibling());
}

function processStruct(
  cursor: Parser.TreeCursor,
  seenTypes: Set<string>,
) {
  const node = cursor.currentNode;
  const structName = findChildByKind(node, "user_type_identifier") ||
    "UnnamedStruct";
  seenTypes.add(structName);

  const fields = extractStructFields(cursor);

  console.log(`export interface ${structName} {`);
  for (const [name, fieldType] of fields) {
    console.log(`  ${mapName(name)}: ${mapType(fieldType, seenTypes)};`);
  }
  console.log("}");
}

function processComponent(
  cursor: Parser.TreeCursor,
  seenTypes: Set<string>,
) {
  const node = cursor.currentNode;
  const componentName = findChildByKind(node, "user_type_identifier") ||
    "UnnamedComponent";

  const [properties, callbacks] = extractComponentProperties(
    cursor,
  );

  console.log(`export interface ${componentName} {`);
  for (const [name, propType] of properties) {
    console.log(`  ${mapName(name)}: ${mapType(propType, seenTypes)};`);
  }
  for (const callback of callbacks) {
    const args = callback.args.map((arg, index) =>
      `arg${index}: ${mapType(arg, seenTypes)}`
    ).join(", ");
    const returnType = callback.returnType
      ? ` => ${mapType(callback.returnType, seenTypes)}`
      : " => void";
    console.log(`  ${mapName(callback.name)}: (${args})${returnType};`);
  }
  console.log("  run: () => Promise<void>;");
  console.log("}");
}

function extractComponentProperties(
  cursor: Parser.TreeCursor,
): [Array<[string, string]>, Callback[]] {
  const properties: Array<[string, string]> = [];
  const callbacks: Callback[] = [];

  const node = cursor.currentNode;

  if (node.type === "component_definition") {
    const propertyCursor = node.walk();
    if (propertyCursor.gotoFirstChild()) {
      do {
        const childNode = propertyCursor.currentNode;
        if (childNode.type === "block") {
          if (propertyCursor.gotoFirstChild()) {
            do {
              const childNode = propertyCursor.currentNode;
              if (childNode.type === "callback") {
                const callbackName =
                  childNode.childForFieldName("name")?.text ?? "";
                const callbackReturn =
                  childNode.childForFieldName("return_type")?.text ??
                    null;
                const callbackArgs = childNode.childrenForFieldName("arguments")
                  .map((arg) => arg.text)
                  .filter((arg) => arg !== ",") ?? [];

                callbacks.push({
                  name: callbackName,
                  args: callbackArgs,
                  returnType: callbackReturn,
                });
              }
              if (childNode.type === "property") {
                const propName = childNode.childForFieldName("name")?.text ??
                  "";
                const propType = childNode.childForFieldName("type")?.text ??
                  "";
                properties.push([propName, propType]);
              }
              if (childNode.type === "property_assignment") {
                const prop = childNode.childForFieldName("property")?.text ??
                  "";
                const propValue = childNode.childForFieldName("value")?.text ??
                  "";
                properties.push([prop, propValue]);
              }
            } while (propertyCursor.gotoNextSibling());
          }
        }
      } while (propertyCursor.gotoNextSibling());
    }
  }
  return [properties, callbacks];
}

function extractStructFields(
  cursor: Parser.TreeCursor,
): Array<[string, string]> {
  const fields: Array<[string, string]> = [];
  const node = cursor.currentNode;

  if (node.type === "struct_definition") {
    const fieldCursor = node.walk();
    if (fieldCursor.gotoFirstChild()) {
      do {
        const childNode = fieldCursor.currentNode;
        if (childNode.type === "struct_block") {
          const fieldNames = [];
          const fieldTypes: string[] = [];
          for (const fieldName of childNode.childrenForFieldName("name")) {
            fieldNames.push(fieldName.text);
          }
          for (const fieldType of childNode.childrenForFieldName("type")) {
            fieldTypes.push(fieldType.text);
          }
          fields.push(
            ...fieldNames.map((name, index) =>
              [name, fieldTypes[index] || ""] as [string, string]
            ),
          );
        }
      } while (fieldCursor.gotoNextSibling());
    }
  }

  return fields;
}

function findChildByKind(
  node: Parser.SyntaxNode,
  kind: string,
): string | null {
  for (const child of node.children) {
    if (child.type === kind) {
      return child.text;
    }
  }
  return null;
}

function mapType(slintType: string, seenTypes: Set<string>): string {
  switch (slintType) {
    case "int":
      return "number";
    case "bool":
      return "boolean";
    case "string":
      return "string";
    default:
      if (slintType.startsWith("[") && slintType.endsWith("]")) {
        return `${mapType(slintType.slice(1, -1), seenTypes)}[]`;
      }
      if (seenTypes.has(slintType)) {
        return slintType;
      }
      return "any";
  }
}

function mapName(slintName: string): string {
  return slintName.replace(/-/g, "_");
}

if (import.meta.main) {
  await main();
}
