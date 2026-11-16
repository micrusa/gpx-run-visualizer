const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sampleChart, sampleScatter } = require('../src/components/runs/chartSampling.ts');
const { linearRegression } = require('../src/components/runs/regression.ts');

function rows() {
  return Array.from({ length: 10000 }, (_, index) => ({ index, x: index,
    paceSecondsPerKm: 300, elevationMeters: 100, gradePercent: 0, heartRate: 140 }));
}

test('large line charts retain extrema, endpoints and original sample identities', () => {
  const data = rows();
  data[4567].paceSecondsPerKm = 500;
  data[6543].elevationMeters = -10;
  const sampled = sampleChart(data, ['paceSecondsPerKm', 'elevationMeters'], 600, [0, 9999]);
  assert.ok(sampled.length <= 1200);
  for (const index of [0, 4567, 6543, 9999]) assert.ok(sampled.includes(data[index]));
  assert.ok(sampled.every((point, index) => !index || point.index > sampled[index - 1].index));
});

test('sampling preserves gaps and the measurements on both sides', () => {
  const data = rows();
  data[1234] = { ...data[1234], index: null, paceSecondsPerKm: null, elevationMeters: null };
  data[5678].elevationMeters = null;
  const sampled = sampleChart(data, ['paceSecondsPerKm', 'elevationMeters'], 500, [0, 9999]);
  for (const index of [1233, 1234, 1235, 5677, 5678, 5679]) assert.ok(sampled.includes(data[index]));
});

test('zoom restores detail and retains boundary neighbors for line clipping', () => {
  const data = rows();
  const sampled = sampleChart(data, ['paceSecondsPerKm'], 500, [5000.5, 5050.5]);
  assert.deepEqual(sampled, data.slice(5000, 5052));
});

test('scatter sampling is bounded and deterministic while regression uses all samples', () => {
  const data = Array.from({ length: 10000 }, (_, x) => ({ x, y: x * 2 + 1 }));
  const fit = linearRegression(data);
  const dots = sampleScatter(fit.samples);
  assert.equal(dots.length, 1000);
  assert.equal(new Set(dots).size, 1000);
  assert.deepEqual(dots, sampleScatter(data));
  assert.equal(fit.samples.length, 10000);
  assert.equal(fit.r, 1);
  assert.deepEqual(fit.line, [{ x: 0, y: 1 }, { x: 9999, y: 19999 }]);
  assert.equal(sampleScatter(data.slice(0, 20)).length, 20);
});
