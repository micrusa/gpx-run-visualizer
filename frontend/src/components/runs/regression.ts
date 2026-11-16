export type RegressionPoint = { x: number; y: number };

export function linearRegression(input: RegressionPoint[]) {
  const samples = input.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (samples.length < 3) return null;
  const meanX = samples.reduce((sum, point) => sum + point.x, 0) / samples.length;
  const meanY = samples.reduce((sum, point) => sum + point.y, 0) / samples.length;
  let xx = 0, yy = 0, xy = 0;
  let min = Infinity, max = -Infinity;
  for (const { x, y } of samples) {
    xx += (x - meanX) ** 2; yy += (y - meanY) ** 2; xy += (x - meanX) * (y - meanY);
    min = Math.min(min, x); max = Math.max(max, x);
  }
  if (xx === 0 || yy === 0) return null;
  const slope = xy / xx;
  const r = Math.max(-1, Math.min(1, xy / Math.sqrt(xx * yy)));
  return { samples, r, rSquared: r * r,
    line: [min, max].map(x => ({ x, y: meanY + slope * (x - meanX) })) };
}
