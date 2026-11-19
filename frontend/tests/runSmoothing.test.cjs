const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chartData, DEFAULT_CHART_SETTINGS } = require('../src/components/runs/chartData.ts');

function points(values) {
  return values.map((value, index) => ({ index, segment: 0, latitude: 47, longitude: 7, distanceMeters: index * 10,
    timeSeconds: index, paceSecondsPerKm: value, gradePercent: value / 100, elevationMeters: value, heartRate: value }));
}
function settings() { return structuredClone(DEFAULT_CHART_SETTINGS); }

test('pace defaults to ten points and grade to five while elevation and heart rate stay raw', () => {
  const input = points([100, 100, 100, 200, 100, 100, 100]);
  const raw = JSON.stringify(input);
  const rows = chartData(input, 'distance');
  assert.equal(DEFAULT_CHART_SETTINGS.smoothing.paceSecondsPerKm.points, 10);
  assert.equal(rows[3].paceSecondsPerKm, 800 / 7);
  assert.equal(rows[3].gradePercent, 1.2);
  assert.equal(rows[3].elevationMeters, 200);
  assert.equal(rows[3].heartRate, 200);
  assert.equal(JSON.stringify(input), raw);
});

test('each value can independently use its own enabled state and window size', () => {
  const config = settings();
  config.smoothing.paceSecondsPerKm.enabled = false;
  config.smoothing.gradePercent.points = 3;
  config.smoothing.elevationMeters = { enabled: true, points: 4 };
  config.smoothing.heartRate = { enabled: true, points: 1 };
  const rows = chartData(points([100, 100, 100, 200, 100, 100, 100]), 'distance', null, config);
  assert.equal(rows[3].paceSecondsPerKm, 200);
  assert.ok(Math.abs(rows[3].gradePercent - 4 / 3) < 1e-10);
  assert.equal(rows[3].elevationMeters, 125);
  assert.equal(rows[3].heartRate, 200);
});

test('custom smoothing preserves missing measurements and segment boundaries', () => {
  const config = settings();
  config.smoothing.heartRate = { enabled: true, points: 5 };
  const input = points([100, 100, 500, 500, 200]);
  input[2].heartRate = null;
  input[4].segment = 1;
  const rows = chartData(input, 'distance', null, config).filter(row => row.index != null);
  assert.equal(rows[1].heartRate, 100);
  assert.equal(rows[2].heartRate, null);
  assert.equal(rows[3].heartRate, 500);
  assert.equal(rows[4].heartRate, 200);
});

test('the pace filter is off by default and keeps pace strictly below 12 minutes per km when enabled', () => {
  const input = points([300, 719, 720, 2000, 300]);
  assert.ok(chartData(input, 'distance').every(row => row.paceSecondsPerKm != null));
  const config = settings();
  config.pointFilter.enabled = true;
  const rows = chartData(input, 'distance', null, config);
  assert.ok(rows[1].paceSecondsPerKm != null);
  for (const index of [2, 3]) {
    for (const key of ['paceSecondsPerKm', 'gradePercent', 'elevationMeters', 'heartRate']) assert.equal(rows[index][key], null);
  }
  assert.equal(rows[2].index, 2);
  assert.equal(rows[2].x, .02);
  assert.equal(rows[4].paceSecondsPerKm, 300);
});

test('filtering precedes smoothing and can be customized or turned off', () => {
  const input = points([300, 300, 2000, 300, 300]);
  const config = settings();
  config.pointFilter.enabled = true;
  const filtered = chartData(input, 'distance', null, config);
  assert.equal(filtered[1].paceSecondsPerKm, 300);
  assert.equal(filtered[2].paceSecondsPerKm, null);
  assert.equal(filtered[3].paceSecondsPerKm, 300);
  config.pointFilter.enabled = false;
  assert.equal(chartData(input, 'distance', null, config)[2].paceSecondsPerKm, 640);
  config.pointFilter = { enabled: true, maxPaceSecondsPerKm: 2500 };
  assert.equal(chartData(input, 'distance', null, config)[2].paceSecondsPerKm, 640);
});

test('stationary timed points are pauses, but unknown pace is not automatically discarded', () => {
  const input = points([300, 300, 300]);
  input[0].paceSecondsPerKm = null;
  input[1].paceSecondsPerKm = null;
  input[1].distanceMeters = 0;
  input[2].paceSecondsPerKm = null;
  input[2].timeSeconds = null;
  const config = settings();
  config.pointFilter.enabled = true;
  const rows = chartData(input, 'distance', null, config);
  assert.equal(rows[0].elevationMeters, 300);
  assert.equal(rows[1].elevationMeters, null);
  assert.equal(rows[2].elevationMeters, 300);
});

test('large windows use available samples and both axes retain the same processed values', () => {
  const config = settings();
  config.smoothing.paceSecondsPerKm.points = 1_000_000_000;
  const input = points([100, 200, 300, 400, 500]);
  const distance = chartData(input, 'distance', null, config);
  const time = chartData(input, 'time', { start: 1, end: 3 }, config);
  assert.ok(distance.every(row => row.paceSecondsPerKm === 300));
  assert.deepEqual(time.map(row => row.index), [1, 2, 3]);
  assert.ok(time.every(row => row.paceSecondsPerKm === 300));
});

test('grade-adjusted pace uses smoothed grade and EF uses the resulting speed', () => {
  const input = points([300, 300, 300]);
  input[0].gradePercent = 0;
  input[1].gradePercent = 15;
  input[2].gradePercent = 0;
  input.forEach(point => { point.heartRate = 150; });
  const rows = chartData(input, 'distance');
  const slope = .05;
  const cost = 155.4 * slope ** 5 - 30.4 * slope ** 4 - 43.3 * slope ** 3
    + 46.3 * slope ** 2 + 19.5 * slope + 3.6;
  const adjusted = 300 * 3.6 / cost;
  assert.ok(Math.abs(rows[1].gradeAdjustedPace - adjusted) < 1e-10);
  assert.ok(Math.abs(rows[1].efficiencyFactor - 60000 / adjusted / 150) < 1e-10);
  assert.equal(rows[1].beatsPerKm, 750);
});

test('a five-second HR delay uses historical speed at irregular timestamps within a segment', () => {
  const input = points([300, 600, 200, 300, 300]);
  [0, 4, 7, 8, 14].forEach((timeSeconds, index) => Object.assign(input[index], {
    timeSeconds, gradePercent: 0, heartRate: 150, segment: index >= 3 ? 1 : 0,
  }));
  const config = settings();
  config.smoothing.beatsPerKm.enabled = false;
  config.smoothing.efficiencyFactor.enabled = false;
  const undelayed = chartData(input, 'distance', null, config);
  assert.equal(undelayed[2].beatsPerKm, 500);

  config.heartRateDelay.enabled = true;
  const rows = chartData(input, 'distance', null, config).filter(row => row.index != null);
  assert.deepEqual(rows.map(row => row.beatsPerKm), [null, null, 1000, null, 750]);
  assert.deepEqual(rows.map(row => row.efficiencyFactor), [null, null, 1, null, 200 / 150]);

  input[3].paceSecondsPerKm = null;
  assert.equal(chartData(input, 'distance', null, config).at(-1).beatsPerKm, null);
});

test('efficiency smoothing averages paired speed and heart rate separately', () => {
  const input = points([300, 600, 300]);
  [100, 200, null].forEach((heartRate, index) => Object.assign(input[index], { gradePercent: 0, heartRate }));
  const rows = chartData(input, 'distance');
  assert.deepEqual(rows.map(row => row.beatsPerKm), [1000, 1000, null]);
  assert.deepEqual(rows.map(row => row.efficiencyFactor), [1, 1, null]);
});
