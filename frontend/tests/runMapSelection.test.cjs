const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

test('map fits the selected route and restores the full route on Back', () => {
  const fits = [];
  const map = { invalidateSize() {}, getContainer: () => ({}), fitBounds: (bounds, options) => fits.push({ points: bounds.points, maxZoom: options.maxZoom }) };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/runs/RunMap.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  const load = name => name === 'react' ? { ...React, useMemo: callback => callback(), useEffect: callback => callback() }
    : name === 'leaflet' ? { latLngBounds: points => ({ points, isValid: () => points.length > 0 }) }
    : name === 'react-leaflet' ? { MapContainer: 'MapContainer', TileLayer: 'TileLayer', Polyline: 'Polyline', CircleMarker: 'CircleMarker', Tooltip: 'Tooltip', useMap: () => map }
    : require(name);
  new Function('require', 'module', 'exports', code)(load, module, module.exports);
  const originalObserver = global.ResizeObserver;
  global.ResizeObserver = class { observe() {} disconnect() {} };
  const points = Array.from({ length: 6 }, (_, index) => ({ index, segment: 0, latitude: 47 + index / 100, longitude: 7 + index / 100 }));
  function render(selection) {
    const tree = module.exports.default({ points, hovered: 3, selection });
    const polylines = [], markers = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!React.isValidElement(node)) return;
      if (typeof node.type === 'function' && node.type.name === 'MapViewport') node.type(node.props);
      if (node.type === 'Polyline') polylines.push(node.props.positions);
      if (node.type === 'CircleMarker') markers.push(node.props.center);
      walk(node.props.children);
    }
    walk(tree);
    return { polylines, markers };
  }
  try {
    render(null);
    const zoomed = render({ start: 2, end: 4 });
    render(null);
    const coordinates = rows => rows.map(point => [point.latitude, point.longitude]);
    assert.deepEqual(fits[0].points, coordinates(points));
    assert.deepEqual(fits[1].points, coordinates(points.slice(2, 5)));
    assert.deepEqual(fits[2].points, fits[0].points);
    assert.equal(fits[1].maxZoom, 18);
    assert.deepEqual(zoomed.polylines.flat(), coordinates(points.slice(2, 5)));
    assert.deepEqual(zoomed.markers.at(-1), coordinates([points[3]])[0]);
  } finally { global.ResizeObserver = originalObserver; }
});
