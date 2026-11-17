import type { Stats } from './sim/simulation';

const SERIES: { key: keyof Stats; label: string; color: string }[] = [
  { key: 'T', label: 'T [K]', color: '#ff7a59' },
  { key: 'P', label: 'P', color: '#59c3ff' },
];

// Wykres T(t) i P(t), każda seria skalowana osobno do własnego zakresu.
export class Chart {
  private data: Stats[] = [];
  private ctx: CanvasRenderingContext2D;
  constructor(private canvas: HTMLCanvasElement, private max = 600) {
    this.ctx = canvas.getContext('2d')!;
  }
  clear() { this.data = []; }
  push(s: Stats) { this.data.push(s); if (this.data.length > this.max) this.data.shift(); }
  draw() {
    const { ctx, canvas, data } = this;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (data.length < 2) return;
    ctx.font = '22px system-ui';
    SERIES.forEach((s, k) => {
      const v = data.map((d) => d[s.key] as number);
      const lo = Math.min(...v), hi = Math.max(...v), span = hi - lo || 1;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      v.forEach((y, i) => {
        const px = (i / (this.max - 1)) * w;
        const py = h - 12 - ((y - lo) / span) * (h - 44);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.stroke();
      ctx.fillStyle = s.color;
      ctx.fillText(`${s.label}: ${v[v.length - 1].toPrecision(4)}`, 10 + k * 340, 26);
    });
  }
}
