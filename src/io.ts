import type { Params, Stats } from './sim/simulation';

/** Parsuje parm.conf (linie `klucz: wartość`); nieznane klucze pomija. */
export function parseParmConf(text: string): Partial<Params> {
  const map: Record<string, keyof Params> = {
    n: 'n', f: 'f', L: 'L', tau: 'tau', T_o: 'T', a: 'a', epsilon: 'epsilon',
  };
  const out: Partial<Params> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(\w+)\s*:\s*(\S+)/);
    if (!m || !(m[1] in map)) continue;
    const v = Number(m[2]);
    if (Number.isFinite(v)) out[map[m[1]]] = v;
  }
  return out;
}

export interface Frame { pos: Float32Array; ekin: Float32Array; stats: Stats }

/** Format .xyz (jmol): N, komentarz `# t T P H Ekin`, potem `Ar x y z Ekin`. */
export function toXYZ(frames: Frame[]): string {
  const out: string[] = [];
  for (const { pos, ekin, stats: s } of frames) {
    out.push(String(ekin.length), `# ${s.t} ${s.T} ${s.P} ${s.H} ${s.Ekin}`);
    for (let i = 0; i < ekin.length; i++)
      out.push(`Ar ${pos[3 * i]} ${pos[3 * i + 1]} ${pos[3 * i + 2]} ${ekin[i]}`);
  }
  return out.join('\n') + '\n';
}

export function toStats(frames: Frame[]): string {
  const rows = frames.map(({ stats: s }) =>
    [s.t, s.H, s.V, s.T, s.P, s.Ekin].map((x) => x.toExponential(4)).join('\t'));
  return ['t\tH\tV\tT\tP\tEkin', ...rows].join('\n') + '\n';
}

export function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
