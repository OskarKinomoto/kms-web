import { DEFAULT_PARAMS, type Params } from './sim/simulation';
import type { Snapshot, ToWorker } from './sim/worker';
import { Renderer } from './render';
import { Chart } from './chart';

const FIELDS: { key: keyof Params; label: string; step: string }[] = [
  { key: 'n', label: 'n (N = n³)', step: '1' },
  { key: 'T', label: 'T₀ [K]', step: '10' },
  { key: 'tau', label: 'τ [ps]', step: '0.0001' },
  { key: 'a', label: 'a [nm]', step: '0.001' },
  { key: 'L', label: 'L [nm]', step: '0.1' },
  { key: 'f', label: 'f (ściana)', step: '1000' },
  { key: 'epsilon', label: 'ε [kJ/mol]', step: '0.1' },
];

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const params: Params = { ...DEFAULT_PARAMS };
const inputs = new Map<keyof Params, HTMLInputElement>();

for (const f of FIELDS) {
  const label = document.createElement('label');
  label.textContent = f.label;
  const input = document.createElement('input');
  input.type = 'number'; input.step = f.step; input.value = String(params[f.key]);
  label.appendChild(input);
  $('fields').appendChild(label);
  inputs.set(f.key, input);
}

const renderer = new Renderer($('view'));
const chart = new Chart($<HTMLCanvasElement>('chart'));
let worker: Worker | null = null;
let latest: Snapshot | null = null;
let running = true;

const send = (m: ToWorker) => worker?.postMessage(m);

function start() {
  for (const [k, input] of inputs) params[k] = Number(input.value);
  params.n = Math.max(1, Math.min(10, Math.round(params.n)));
  inputs.get('n')!.value = String(params.n);
  worker?.terminate();
  worker = new Worker(new URL('./sim/worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<Snapshot>) => { latest = e.data; chart.push(e.data.stats); };
  renderer.setAtoms(params.n ** 3, 0.08);
  renderer.setWall(params.L);
  chart.clear();
  latest = null;
  send({ type: 'init', params });
  send({ type: 'spf', value: Number($<HTMLInputElement>('spf').value) });
  send({ type: 'run', running });
}

$('reset').onclick = start;
$('toggle').onclick = () => {
  running = !running;
  $('toggle').textContent = running ? 'Pauza' : 'Start';
  send({ type: 'run', running });
};
$<HTMLInputElement>('spf').onchange = (e) => send({ type: 'spf', value: Number((e.target as HTMLInputElement).value) });
$<HTMLInputElement>('wall').onchange = (e) => renderer.showWall((e.target as HTMLInputElement).checked);

function loop() {
  if (latest) {
    renderer.update(latest.pos, latest.ekin);
    const s = latest.stats;
    $('stats').textContent =
      `t = ${s.t.toFixed(3)} ps\nT = ${s.T.toFixed(1)} K\nP = ${s.P.toFixed(3)}\n` +
      `V = ${s.V.toFixed(2)}\nE_kin = ${s.Ekin.toFixed(2)}\nH = ${s.H.toFixed(3)}`;
    chart.draw();
    latest = null;
  }
  renderer.render();
  requestAnimationFrame(loop);
}

start();
loop();
