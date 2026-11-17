// Port C++ klasy Simulation (KMS-1): argon, potencjał Lennarda-Jonesa,
// ściana sferyczna (sprężysta, promień L), całkowanie Verleta (18a-c).

export const KB = 8.31e-3; // kJ/(mol·K)
export const ATOM_MASS = 40; // u (argon)
export const R_MIN = 0.38; // nm, położenie minimum potencjału

export interface Params {
  n: number; // atomów na krawędzi kryształu (N = n³)
  f: number; // sztywność ściany
  L: number; // promień ściany [nm]
  tau: number; // krok czasowy [ps]
  T: number; // temperatura początkowa [K]
  a: number; // stała sieci [nm]
  epsilon: number; // głębokość studni LJ [kJ/mol]
}

export const DEFAULT_PARAMS: Params = {
  n: 5, f: 10000, L: 2.3, tau: 1e-3, T: 270, a: 0.38, epsilon: 1,
};

export interface Stats { t: number; H: number; V: number; T: number; P: number; Ekin: number }

export class Simulation {
  readonly N: number;
  readonly r: Float64Array;
  readonly p: Float64Array;
  readonly f: Float64Array;
  time = 0;
  V = 0;
  P = 0;

  constructor(readonly prm: Params, private rand: () => number = Math.random) {
    this.N = prm.n ** 3;
    this.r = new Float64Array(3 * this.N);
    this.p = new Float64Array(3 * this.N);
    this.f = new Float64Array(3 * this.N);
    this.initPositions();
    this.initMomenta();
    this.calcFPV();
  }

  /** Sieć heksagonalna (HCP-podobna) wycentrowana w zerze, bazą jak w main.cpp. */
  private initPositions() {
    const { n, a } = this.prm;
    const b = [
      [a, 0, 0],
      [a / 2, (a * Math.sqrt(3)) / 2, 0],
      [a / 2, (a * Math.sqrt(3)) / 6, a * Math.sqrt(2 / 3)],
    ];
    const c = (n - 1) / 2;
    let i = 0;
    for (let i0 = 0; i0 < n; i0++)
      for (let i1 = 0; i1 < n; i1++)
        for (let i2 = 0; i2 < n; i2++, i++) {
          const v = [i0 - c, i1 - c, i2 - c];
          for (let k = 0; k < 3; k++)
            this.r[3 * i + k] = v[0] * b[0][k] + v[1] * b[1][k] + v[2] * b[2][k];
        }
  }

  /** Rozkład Boltzmanna energii na składową + losowy znak, skalowanie do T, zerowy pęd całkowity. */
  private initMomenta() {
    const { T } = this.prm;
    const N = this.N;
    let sum = 0;
    for (let i = 0; i < 3 * N; i++) {
      const e = -0.5 * KB * T * Math.log(1 - this.rand()); // 1-rand ∈ (0,1]
      this.p[i] = Math.sqrt(2 * ATOM_MASS * e) * (this.rand() < 0.5 ? -1 : 1);
      sum += e;
    }
    sum /= 3 * N;
    if (sum !== 0) {
      const s = Math.sqrt((0.5 * KB * T) / sum);
      for (let i = 0; i < 3 * N; i++) this.p[i] *= s;
    }
    for (let k = 0; k < 3; k++) {
      let s = 0;
      for (let i = 0; i < N; i++) s += this.p[3 * i + k];
      s /= N;
      for (let i = 0; i < N; i++) this.p[3 * i + k] -= s;
    }
  }

  calcFPV() {
    const { r, f, N } = this;
    const { L, f: fw, epsilon } = this.prm;
    f.fill(0);
    let V = 0;
    let P = 0;
    for (let i = 0; i < N; i++) {
      const xi = r[3 * i], yi = r[3 * i + 1], zi = r[3 * i + 2];
      const rs = Math.hypot(xi, yi, zi);
      if (rs >= L) {
        const s = rs - L;
        V += 0.5 * fw * s * s;
        const k = (fw * (L - rs)) / rs;
        f[3 * i] += xi * k; f[3 * i + 1] += yi * k; f[3 * i + 2] += zi * k;
        // f atomu i to w tym miejscu wyłącznie siła ściany
        P += Math.hypot(f[3 * i], f[3 * i + 1], f[3 * i + 2]) / (4 * Math.PI * L * L);
      }
      for (let j = 0; j < i; j++) {
        const dx = xi - r[3 * j], dy = yi - r[3 * j + 1], dz = zi - r[3 * j + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        const q2 = (R_MIN * R_MIN) / d2;
        const q6 = q2 * q2 * q2;
        const q12 = q6 * q6;
        V += epsilon * (q12 - 2 * q6);
        const t = (12 * epsilon * (q12 - q6)) / d2;
        f[3 * i] += dx * t; f[3 * i + 1] += dy * t; f[3 * i + 2] += dz * t;
        f[3 * j] -= dx * t; f[3 * j + 1] -= dy * t; f[3 * j + 2] -= dz * t;
      }
    }
    this.V = V;
    this.P = P;
  }

  step(tau = this.prm.tau) {
    const { r, p, f } = this;
    const n3 = 3 * this.N;
    for (let i = 0; i < n3; i++) {
      p[i] += f[i] * 0.5 * tau; // 18a
      r[i] += (p[i] * tau) / ATOM_MASS; // 18b
    }
    this.calcFPV();
    for (let i = 0; i < n3; i++) p[i] += f[i] * 0.5 * tau; // 18c
    this.time += tau;
  }

  atomEkin(i: number) {
    const { p } = this;
    return (p[3 * i] ** 2 + p[3 * i + 1] ** 2 + p[3 * i + 2] ** 2) / (2 * ATOM_MASS);
  }

  get Ekin() {
    let e = 0;
    for (let i = 0; i < this.N; i++) e += this.atomEkin(i);
    return e;
  }

  get temperature() {
    return (2 * this.Ekin) / (3 * this.N * KB);
  }

  stats(): Stats {
    const Ekin = this.Ekin;
    return {
      t: this.time, H: Ekin + this.V, V: this.V, T: (2 * Ekin) / (3 * this.N * KB), P: this.P, Ekin,
    };
  }
}
