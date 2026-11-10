const { test } = require('node:test');
const assert = require('node:assert/strict');
const { selectRange, selectionSummary } = require('../src/lib/runSelectionService.ts');
const { chartData } = require('../src/components/runs/chartData.ts');

function point(index, distanceMeters, timeSeconds, extra = {}) {
  return { index, segment: 0, latitude: 47, longitude: 7, distanceMeters, timeSeconds,
    paceSecondsPerKm: null, gradePercent: null, elevationMeters: null, heartRate: null, ...extra };
}
const points = [
  point(0, 0, 0, { elevationMeters: 100, heartRate: 100 }),
  point(1, 1000, 60, { elevationMeters: 110, heartRate: 140, gradePercent: 1, paceSecondsPerKm: 60 }),
  point(2, 1000, 120, { elevationMeters: 110 }),
  point(3, 2000, 180, { elevationMeters: 100, heartRate: 120, gradePercent: -1, paceSecondsPerKm: 60 }),
];

test('selection snaps to samples in either direction for time and distance', () => {
  assert.deepEqual(selectRange(points, 'time', 45, 130), { start: 1, end: 2 });
  assert.deepEqual(selectRange(points, 'time', 130, 45), { start: 1, end: 2 });
  assert.deepEqual(selectRange(points, 'distance', .8, 1.8), { start: 1, end: 3 });
  assert.deepEqual(selectRange(points, 'distance', .1, 1.1), { start: 0, end: 2 });
});

test('nested selection stays inside its previous period and rejects empty ranges', () => {
  assert.deepEqual(selectRange(points, 'time', -100, 1000, { start: 1, end: 2 }), { start: 1, end: 2 });
  assert.equal(selectRange(points, 'time', 500, 600), null);
  assert.equal(selectRange(points, 'time', 1, 1), null);
  assert.equal(selectRange(points, 'time', NaN, 5), null);
  assert.equal(selectRange([], 'time', 1, 5), null);
  assert.equal(selectRange(points, 'distance', .8, 1.2), null);
});

test('averages include pauses in elapsed pace and ignore missing sensor samples', () => {
  const summary = selectionSummary(points, { start: 0, end: 3 });
  assert.equal(summary.distanceMeters, 2000);
  assert.equal(summary.durationSeconds, 180);
  assert.equal(summary.paceSecondsPerKm, 90); // Not the mean of instantaneous pace values.
  assert.equal(summary.elevationMeters, 105);
  assert.equal(summary.heartRate, 120);
  assert.equal(summary.gradePercent, 0);
  const shorter = selectionSummary(points, { start: 1, end: 3 });
  assert.equal(shorter.paceSecondsPerKm, 120);
  assert.equal(shorter.gradePercent, -1); // Excludes the interval before the selection.
});

test('missing measurements and zero-distance pauses never invent averages', () => {
  const missing = [point(0, 0, null), point(1, 100, 10)];
  const summary = selectionSummary(missing, { start: 0, end: 1 });
  for (const key of ['durationSeconds', 'paceSecondsPerKm', 'elevationMeters', 'heartRate', 'gradePercent']) assert.equal(summary[key], null);
  assert.equal(selectionSummary(points, { start: 1, end: 2 }).paceSecondsPerKm, null);
  assert.equal(selectRange(missing, 'time', 0, 10), null);
});

test('selection does not bridge grade across track segments', () => {
  const samples = [point(0, 0, 0), point(1, 1000, 60, { gradePercent: 1 }),
    point(2, 1000, 100, { segment: 1, gradePercent: 90 }), point(3, 2000, 160, { segment: 1, gradePercent: 1 })];
  assert.equal(selectionSummary(samples, { start: 0, end: 3 }).gradePercent, 1);
});

test('chart zoom keeps original hover indices, smoothing and segment gaps', () => {
  const samples = [0, 0, 10, 0, 0, 2, 2].map((grade, index) => point(index, index * 100, index * 10,
    { segment: index < 5 ? 0 : 1, gradePercent: grade }));
  for (const axis of ['time', 'distance']) {
    const full = chartData(samples, axis), zoomed = chartData(samples, axis, { start: 2, end: 6 });
    assert.deepEqual(zoomed.filter(p => p.index != null).map(p => p.index), [2, 3, 4, 5, 6]);
    assert.equal(zoomed[0].gradePercent, full.find(p => p.index === 2).gradePercent);
    assert.equal(zoomed.filter(p => p.index === null).length, 1);
  }
});
