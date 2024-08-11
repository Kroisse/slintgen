// deno-lint-ignore-file no-explicit-any
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
