// deno-lint-ignore-file no-explicit-any
export interface TileData {
  image: any;
  image_visible: boolean;
  solved: boolean;
}
export interface MainWindow {
  disable_tiles: boolean;
  memory_tiles: TileData[];
  check_if_pair_solved: () => void;
  run: () => Promise<void>;
}
