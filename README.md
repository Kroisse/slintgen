# SlintGen

Generate typescript types from a Slint ui file using tree sitter.

## Install

```bash
$ cargo install --git https://github.com/sigmaSd/slintgen
```

## Usage

```bash
$ slintgen ui.slint
```

```bash
$ slintgen ui.slint > ui.ts
```

## Example

**ui.slint**
```slint
struct CPUData {
    number: int,
    active: bool,
}

export component Window inherits Window {
    title: "BurnCPU";
    in-out property <[CPUData]> cpu-data: [];
    in property <int> active-cpus: 0;
    callback toggleCPU(int, bool) -> bool;
```

```bash
$ slintgen ui.slint > ui.ts
```

**ui.ts**
```typescript
export interface CPUData {
  number: number;
  active: boolean;
}

export interface Window {
  title: any;
  cpu_data: CPUData[];
  active_cpus: number;
  toggleCPU: (arg0: number, arg1: boolean) => boolean;
  run: () => Promise<void>;
}
```

## Deno Port

There is also a [deno port](https://github.com/sigmaSd/slintgen/deno) of this tool (It uses tree-sitter wasm bindings).

```bash
$ deno run --reload --allow-read --allow-net https://raw.githubusercontent.com/sigmaSd/slintgen/master/deno/main.ts ui.slint > ui.ts
```
