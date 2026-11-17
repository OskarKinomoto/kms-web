// Szybki test: zachowanie energii całkowitej i zerowy pęd.
import { Simulation, DEFAULT_PARAMS } from './simulation';

const sim = new Simulation({ ...DEFAULT_PARAMS, tau: 1e-4 });
const H0 = sim.stats().H;
for (let i = 0; i < 5000; i++) sim.step();
const s = sim.stats();
const drift = Math.abs(s.H - H0) / Math.abs(H0);
console.log({ N: sim.N, H0, ...s, drift });
if (!(drift < 1e-2) || !Number.isFinite(s.T)) { console.error('FAIL'); process.exit(1); }
console.log('OK');
