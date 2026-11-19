const { test } = require('node:test');
const assert = require('node:assert/strict');
const { exportPointIndices, GEO_CSV_COLUMNS, runGeoCsv } = require('../src/lib/runExportService.ts');
const { DEFAULT_CHART_SETTINGS, graphValues, paceFilterExclusions } = require('../src/components/runs/chartData.ts');

test('GeoCSV exports only retained points in the selected range with processed metric values', () => {
  const points = [300, 240, 360, 900, 300].map((paceSecondsPerKm, index) => ({
    index, segment: 0, latitude: 47, longitude: 7, distanceMeters: index * 10, timeSeconds: index * 5,
    paceSecondsPerKm, elevationMeters: 300, gradePercent: 0, heartRate: 150,
  }));
  const settings = structuredClone(DEFAULT_CHART_SETTINGS);
  settings.pointFilter.enabled = true;
  settings.heartRateDelay.enabled = true;
  settings.smoothing.beatsPerKm.enabled = false;
  const excluded = paceFilterExclusions(points, settings.pointFilter);
  const values = graphValues(points, settings, excluded);
  const indices = exportPointIndices(excluded, { start: 1, end: 3 });
  assert.deepEqual(exportPointIndices(excluded, null), [0, 1, 2, 4]);
  assert.deepEqual(indices, [1, 2]);
  assert.deepEqual(runGeoCsv(points, values, indices).trimEnd().split('\r\n'), [
    GEO_CSV_COLUMNS.map(column => column.name).join(','),
    '"POINT (7 47)",1,0,10,5,300,300,0,150,240,750,1.5',
    '"POINT (7 47)",2,0,20,10,300,300,0,150,360,600,1.5',
  ]);
});

test('GeoCSV leaves unavailable measurements blank and an empty export has no data rows', () => {
  const columns = GEO_CSV_COLUMNS.map(column => column.name).join(',');
  const points = [{ index: 0, segment: 0, longitude: -7, latitude: 47, distanceMeters: 0, timeSeconds: null }];
  const values = graphValues(points, DEFAULT_CHART_SETTINGS);
  assert.equal(runGeoCsv(points, values, [0]), `${columns}\r\n"POINT (-7 47)",0,0,0,,,,,,,,\r\n`);
  assert.equal(runGeoCsv(points, values, exportPointIndices([true], null)), `${columns}\r\n`);
});
