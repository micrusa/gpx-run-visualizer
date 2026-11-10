const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chartData } = require('../src/components/runs/chartData.ts');
const { chartDomain } = require('../src/components/runs/chartScale.ts');

function point(index, gradePercent, overrides = {}) {
  return { index, segment: 0, latitude: 47, longitude: 7, distanceMeters: index * 10,
    timeSeconds: index, paceSecondsPerKm: 300, elevationMeters: 100, gradePercent, heartRate: 140, ...overrides };
}

test('grade uses a centered five-point average without modifying raw samples', () => {
  const points = [0, 0, 0, 10, 0, 0, 0].map((grade, index) => point(index, grade));
  const original = JSON.stringify(points);
  const rows = chartData(points, 'distance');
  assert.equal(rows[3].gradePercent, 2);
  assert.equal(rows[0].gradePercent, 0);
  assert.equal(JSON.stringify(points), original);
});

test('smoothing stops at segment boundaries and missing grades', () => {
  const points = [point(0, 2), point(1, 2), point(2, null), point(3, 100), point(4, 100),
    point(5, -20, { segment: 1 }), point(6, -20, { segment: 1 })];
  const rows = chartData(points, 'distance');
  assert.equal(rows.find(row => row.index === 1).gradePercent, 2);
  assert.equal(rows.find(row => row.index === 2).gradePercent, null);
  assert.equal(rows.find(row => row.index === 3).gradePercent, 100);
  assert.equal(rows.find(row => row.index === 5).gradePercent, -20);
  assert.equal(rows.filter(row => row.index === null).length, 1);
});

test('both X axes show the same smoothed grades and preserve missing-time gaps', () => {
  const points = [0, 0, 10, 0, 0].map((grade, index) => point(index, grade, { timeSeconds: index === 2 ? null : index }));
  const distance = chartData(points, 'distance'), time = chartData(points, 'time');
  assert.equal(distance.find(row => row.index === 3).gradePercent, time.find(row => row.index === 3).gradePercent);
  assert.equal(time.filter(row => row.index === null).length, 1);
});

test('a pause spike does not expand pace scales or erase the original tooltip value', () => {
  const points = Array.from({ length: 50 }, (_, index) => point(index, 0, { paceSecondsPerKm: [290, 300, 305, 310][index % 4] }));
  points[25].paceSecondsPerKm = 100000;
  const rows = chartData(points, 'distance');
  const [low, high] = chartDomain(rows, 'paceSecondsPerKm');
  assert.ok(low <= 290 && high >= 310 && high < 1000);
  assert.equal(rows[25].paceSecondsPerKm, 100000);
  assert.equal(points[25].paceSecondsPerKm, 100000);
});

test('flat runs, signed grades, empty data and non-finite samples have valid scales', () => {
  const rows = Array.from({ length: 20 }, (_, index) => point(index, 0));
  rows[10].paceSecondsPerKm = 100000;
  const [low, high] = chartDomain(rows, 'paceSecondsPerKm');
  assert.ok(low < 300 && high > 300 && high < 1000);
  const grade = chartDomain(rows.map(row => ({ ...row, gradePercent: -5 })), 'gradePercent');
  assert.ok(grade[0] < -5 && grade[1] > -5);
  assert.deepEqual(chartDomain([], 'paceSecondsPerKm'), [0, 1]);
  assert.deepEqual(chartDomain([{ ...rows[0], paceSecondsPerKm: Infinity }], 'paceSecondsPerKm'), [0, 1]);
});

test('ordinary changes and short recordings keep their full ranges', () => {
  for (const values of [[100, 200, 300, 400, 500, 600], [100, 10000]]) {
    const rows = values.map((value, index) => point(index, 0, { elevationMeters: value }));
    const [low, high] = chartDomain(rows, 'elevationMeters');
    assert.ok(low <= Math.min(...values) && high >= Math.max(...values));
  }
});

const { scaleDomain, shiftDomain } = require('../src/components/runs/chartScale.ts');

test('manual zoom changes the range around its center and can reveal clipped spikes', () => {
  assert.deepEqual(scaleDomain([200, 400], .5), [250, 350]);
  assert.deepEqual(scaleDomain([200, 400], 2), [100, 500]);
  const automatic = chartDomain(Array.from({ length: 20 }, (_, index) => ({ ...point(index, 0), paceSecondsPerKm: index === 10 ? 10000 : 300 })), 'paceSecondsPerKm');
  assert.ok(automatic[1] < 10000);
  assert.ok(scaleDomain(automatic, 1000, true)[1] > 10000);
});

test('manual zoom supports signed grades and keeps time/pace nonnegative', () => {
  assert.deepEqual(scaleDomain([-5, 5], 2), [-10, 10]);
  assert.deepEqual(scaleDomain([0, 100], 2, true), [0, 200]);
});

test('extreme or invalid drag inputs cannot collapse or corrupt a scale', () => {
  const domain = [200, 400];
  for (const factor of [0, -1, 1e100, Infinity, NaN]) {
    const next = scaleDomain(domain, factor, true);
    assert.ok(next.every(Number.isFinite));
    assert.ok(next[0] >= 0 && next[1] > next[0]);
  }
});

test('axis movement keeps the span and respects nonnegative domains', () => {
  assert.deepEqual(shiftDomain([100, 200], .5), [150, 250]);
  assert.deepEqual(shiftDomain([-5, 5], -.5), [-10, 0]);
  assert.deepEqual(shiftDomain([0, 100], -1, true), [0, 100]);
  assert.deepEqual(shiftDomain([100, 200], Infinity), [100, 200]);
});
