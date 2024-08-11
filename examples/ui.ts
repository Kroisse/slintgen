// deno-lint-ignore-file no-explicit-any
export interface CPUData {
  number: number;
  active: boolean;
}
export interface FireSVG {
  source: any;
  width: any;
  height: any;
  image_fit: any;
}
export interface CustomButton {
  text: string;
  active: boolean;
  height: any;
  width: any;
  background: any;
  border_radius: any;
}
export interface Window {
  title: any;
  cpu_data: CPUData[];
  active_cpus: number;
  background: any;
  width: any;
  height: any;
}
