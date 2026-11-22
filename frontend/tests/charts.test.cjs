const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  defaultWindow,
  shiftWindow,
  formatBucketTick,
  formatBucketLabel,
  formatWindowLabel,
  formatDuration,
  percentDiff,
} = require('../src/components/charts/chartPeriods.ts');
const {
  TREND_METRICS,
  availableTrendMetrics,
  formatTrendValue,
  formatVolumeValue,
  volumeAverage,
  trendDomain,
  trendAxes,
} = require('../src/components/charts/chartMetrics.ts');

test('defaultWindow aligns daily, ISO weekly, and monthly spans', () => {
  assert.deepEqual(defaultWindow('DAILY', '2026-11-22'), { from: '2026-10-24', to: '2026-11-22' });
  // 2026-11-22 is a Sunday -> ISO week 2026-11-16..2026-11-22, 12 weeks back starts 2026-08-31
  assert.deepEqual(defaultWindow('WEEKLY', '2026-11-22'), { from: '2026-08-31', to: '2026-11-22' });
  assert.deepEqual(defaultWindow('MONTHLY', '2026-11-22'), { from: '2025-12-01', to: '2026-11-30' });
});

test('shiftWindow moves cleanly backward and forward without losing alignment', () => {
  const daily = defaultWindow('DAILY', '2026-11-22');
  const prevDaily = shiftWindow('DAILY', daily, -1);
  assert.deepEqual(prevDaily, { from: '2026-09-24', to: '2026-10-23' });
  assert.deepEqual(shiftWindow('DAILY', prevDaily, 1), daily);

  const monthly = defaultWindow('MONTHLY', '2026-11-22');
  const prevMonthly = shiftWindow('MONTHLY', monthly, -1);
  assert.deepEqual(prevMonthly, { from: '2024-12-01', to: '2025-11-30' });
  assert.deepEqual(shiftWindow('MONTHLY', prevMonthly, 1), monthly);
});

test('labels and durations format cleanly across granularities', () => {
  assert.equal(formatBucketTick('DAILY', { key: '2026-11-22', startDate: '2026-11-22' }), '22 Nov');
  assert.equal(formatBucketTick('WEEKLY', { key: '2026-W47', startDate: '2026-11-16' }), 'W47');
  assert.equal(formatBucketTick('MONTHLY', { key: '2026-11', startDate: '2026-11-01' }), 'Nov 26');
  assert.equal(
    formatBucketLabel('WEEKLY', { key: '2026-W47', startDate: '2026-11-16', endDate: '2026-11-22' }),
    'W47 · 16–22 Nov 2026',
  );
  assert.equal(formatWindowLabel('MONTHLY', '2025-12-01', '2026-11-30'), 'Dec 2025 – Nov 2026');
  assert.equal(formatDuration(5100), '1h 25m');
  assert.equal(formatDuration(1505), '25:05');
});

test('volume and trend metric helpers compute averages, domains, and availability', () => {
  const buckets = [
    {
      key: '2026-11-20', startDate: '2026-11-20', endDate: '2026-11-20',
      runCount: 1, distanceMeters: 10000, durationSeconds: 3000, elevationGainMeters: 100,
      averagePaceSecondsPerKm: 300, averageSpeedKmh: 12, averageHeartRate: 150, maxHeartRate: 170,
      beatsPerKm: 750, efficiencyFactor: 1.33, elevationPerKm: 10,
    },
    {
      key: '2026-11-21', startDate: '2026-11-21', endDate: '2026-11-21',
      runCount: 0, distanceMeters: 0, durationSeconds: 0, elevationGainMeters: 0,
      averagePaceSecondsPerKm: null, averageSpeedKmh: null, averageHeartRate: null, maxHeartRate: null,
      beatsPerKm: null, efficiencyFactor: null, elevationPerKm: null,
    },
  ];
  assert.equal(volumeAverage(buckets, 'distanceKm'), 5);
  assert.equal(formatVolumeValue('distanceKm', 12.34), '12.3 km');
  assert.equal(formatTrendValue('distanceKm', 10), '10.0 km');
  assert.equal(formatTrendValue('durationMinutes', 85), '1h 25m');
  assert.equal(formatTrendValue('averagePaceSecondsPerKm', 305), '5:05 /km');
  assert.equal(formatTrendValue('efficiencyFactor', 1.333), '1.33 m/beat');
  assert.equal(availableTrendMetrics(buckets).length, 11);
  const [low, high] = trendDomain(buckets, 'averagePaceSecondsPerKm');
  assert.ok(low < 300 && high > 300);
  const [volLow, volHigh] = trendDomain(buckets, 'distanceKm');
  assert.equal(volLow, 0);
  assert.ok(volHigh > 10);
});

test('percentDiff computes directional percentages and omits missing, zero, or flat comparisons', () => {
  assert.deepEqual(percentDiff(120, 100), { direction: 'up', percent: 20, formatted: '+20.0%' });
  assert.deepEqual(percentDiff(90, 100), { direction: 'down', percent: -10, formatted: '-10.0%' });
  assert.equal(percentDiff(100, 100), null);
  assert.equal(percentDiff(100, 0), null);
  assert.equal(percentDiff(null, 100), null);
  assert.equal(percentDiff(100, null), null);
});

test('trendAxes merges metrics with the same unit into one shared axis and combined domain', () => {
  const buckets = [
    {
      key: '2026-11-20', startDate: '2026-11-20', endDate: '2026-11-20',
      runCount: 1, distanceMeters: 10000, durationSeconds: 3000, elevationGainMeters: 100,
      averagePaceSecondsPerKm: 300, averageSpeedKmh: 12, averageHeartRate: 140, maxHeartRate: 180,
      beatsPerKm: 700, efficiencyFactor: 1.4, elevationPerKm: 10,
    },
  ];
  const selected = TREND_METRICS.filter(m =>
    ['averageHeartRate', 'maxHeartRate', 'averagePaceSecondsPerKm'].includes(m.key),
  );
  const axes = trendAxes(buckets, selected);
  assert.equal(axes.length, 2);
  const bpmAxis = axes.find(axis => axis.unit === 'bpm');
  assert.ok(bpmAxis);
  assert.ok(bpmAxis.domain[0] < 140 && bpmAxis.domain[1] > 180);
  assert.equal(bpmAxis.color, '#505459');
});
