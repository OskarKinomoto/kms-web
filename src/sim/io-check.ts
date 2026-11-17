import { parseParmConf } from '../io';
const p = parseParmConf('n: 5\nf: 10000\nL: 2.3\ntau: 1e-4\nT_o: 270\nS_o: 100\na: .373165\nrun: 1\n');
console.log(p);
if (p.T !== 270 || p.tau !== 1e-4 || p.a !== 0.373165 || p.n !== 5) { console.error('FAIL'); process.exit(1); }
console.log('OK');
