/// <reference lib="webworker" />
// Worker: wykonuje kroki symulacji i wysyła migawki (pozycje + E_kin atomów).
import { Simulation, type Params, type Stats } from './simulation';

export type ToWorker =
  | { type: 'init'; params: Params }
  | { type: 'run'; running: boolean }
  | { type: 'spf'; value: number };

export interface Snapshot { type: 'frame'; pos: Float32Array; ekin: Float32Array; stats: Stats }

let sim: Simulation | null = null;
let running = true;
let spf = 20;
let timer: ReturnType<typeof setTimeout> | null = null;

function post() {
  if (!sim) return;
  const N = sim.N;
  const pos = new Float32Array(3 * N);
  const ekin = new Float32Array(N);
  for (let i = 0; i < 3 * N; i++) pos[i] = sim.r[i];
  for (let i = 0; i < N; i++) ekin[i] = sim.atomEkin(i);
  const msg: Snapshot = { type: 'frame', pos, ekin, stats: sim.stats() };
  (self as unknown as Worker).postMessage(msg, [pos.buffer, ekin.buffer]);
}

function tick() {
  timer = null;
  if (!sim || !running) return;
  for (let i = 0; i < spf; i++) sim.step();
  post();
  timer = setTimeout(tick, 16);
}

function schedule() {
  if (timer === null && running) timer = setTimeout(tick, 0);
}

self.onmessage = (e: MessageEvent<ToWorker>) => {
  const m = e.data;
  if (m.type === 'init') { sim = new Simulation(m.params); post(); schedule(); }
  else if (m.type === 'run') { running = m.running; schedule(); }
  else if (m.type === 'spf') spf = Math.max(1, Math.floor(m.value));
};
