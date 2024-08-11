// deno-lint-ignore-file no-explicit-any
export interface CPUData {
  number: number;
  active: boolean;
}
export interface Window {
  title: any;
  cpu_data: CPUData[];
  active_cpus: number;
  background: any;
  width: any;
  height: any;
run: () => Promise<void>;
}
