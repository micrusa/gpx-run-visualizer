const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const scales = require('../src/components/runs/chartScale.ts');

function setup() {
  const area = { x: 160, y: 48, width: 800, height: 300 };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/runs/RunChartGestures.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  const load = name => name === 'react' ? { ...React, useRef: value => ({ current: value }) }
    : name === 'recharts' ? { usePlotArea: () => area, ZIndexLayer: ({ children }) => children, DefaultZIndexes: { label: 2000 } }
    : name.endsWith('/chartScale') ? scales : require(name);
  new Function('require', 'module', 'exports', code)(load, module, module.exports);
  const changes = [], resets = [], dragging = [];
  const y = { paceSecondsPerKm: [200, 400], elevationMeters: [100, 200], gradePercent: [-5, 5], heartRate: [100, 180] };
  const tree = module.exports.RunChartGestures({
    metrics: [{ key: 'paceSecondsPerKm', label: 'Pace' }, { key: 'elevationMeters', label: 'Elevation' },
      { key: 'gradePercent', label: 'Grade' }, { key: 'heartRate', label: 'Heart rate' }],
    x: [0, 10], y, onChange: value => changes.push(value), onReset: value => resets.push(value), onDragging: value => dragging.push(value),
  });
  const rects = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!React.isValidElement(node)) return;
    if (node.type === 'rect') rects.push(node);
    walk(node.props.children);
  }
  walk(tree);
  let captured = false;
  const target = { setPointerCapture: () => { captured = true; }, hasPointerCapture: () => captured, releasePointerCapture: () => { captured = false; } };
  const event = (x, y, extra = {}) => ({ button: 0, pointerId: 1, shiftKey: false, clientX: x, clientY: y, currentTarget: target, preventDefault() {}, ...extra });
  return { rects, changes, resets, dragging, event, area, zIndex: tree.props.zIndex };
}

test('Shift-dragging a Y axis scales only that metric and releases pointer capture', () => {
  const { rects, changes, dragging, event } = setup();
  const pace = rects.find(rect => rect.props['aria-label'].startsWith('Scale Pace'));
  pace.props.onPointerDown(event(100, 150, { shiftKey: true }));
  pace.props.onPointerMove(event(100, 100, { shiftKey: true }));
  assert.deepEqual(Object.keys(changes[0].y), ['paceSecondsPerKm']);
  assert.ok(changes[0].y.paceSecondsPerKm[1] - changes[0].y.paceSecondsPerKm[0] < 200);
  pace.props.onPointerUp(event(100, 100));
  assert.deepEqual(dragging, [true, false]);
  const count = changes.length;
  pace.props.onPointerMove(event(100, 50));
  assert.equal(changes.length, count);
});

test('Shift-dragging the X axis changes horizontal scale; double-click resets it', () => {
  const { rects, changes, resets, event } = setup();
  const axis = rects.find(rect => rect.props.className === 'run-scale-x');
  axis.props.onPointerDown(event(300, 350, { shiftKey: true }));
  axis.props.onPointerMove(event(450, 350, { shiftKey: true }));
  assert.ok(changes[0].x[1] - changes[0].x[0] < 10);
  assert.equal(changes[0].y, undefined);
  axis.props.onPointerCancel(event(450, 350));
  axis.props.onDoubleClick();
  assert.deepEqual(resets, ['x']);
});

test('only axes have drag surfaces; the plot remains available for normal hover', () => {
  const { rects } = setup();
  assert.equal(rects.length, 5);
  assert.ok(rects.every(rect => ['run-scale-x', 'run-scale-y'].includes(rect.props.className)));
});

test('axis regions match the chart positions and keyboard scaling/reset works', () => {
  const { rects, changes, resets, area } = setup();
  const axes = rects.filter(rect => rect.props.className === 'run-scale-y');
  assert.deepEqual(axes.map(rect => rect.props.x), [area.x - 76, area.x + area.width, area.x - 152, area.x + area.width + 76]);
  axes[2].props.onKeyDown({ key: 'ArrowUp', shiftKey: true, preventDefault() {} });
  assert.ok(changes[0].y.gradePercent[1] - changes[0].y.gradePercent[0] < 10);
  axes[2].props.onKeyDown({ key: 'Home', preventDefault() {} });
  assert.deepEqual(resets, ['gradePercent']);
});

test('gesture hit areas render above chart labels and plotted lines', () => {
  assert.ok(setup().zIndex > 2000);
});

test('normal axis dragging moves only that axis without changing its scale', () => {
  const { rects, changes, event } = setup();
  const x = rects.find(rect => rect.props.className === 'run-scale-x');
  x.props.onPointerDown(event(400, 350));
  x.props.onPointerMove(event(320, 350));
  assert.deepEqual(changes.at(-1), { x: [1, 11] });
  x.props.onPointerUp(event(320, 350));
  const pace = rects.find(rect => rect.props['aria-label'].startsWith('Scale Pace'));
  pace.props.onPointerDown(event(100, 100));
  pace.props.onPointerMove(event(100, 130));
  assert.deepEqual(changes.at(-1), { y: { paceSecondsPerKm: [180, 380] } });
  pace.props.onPointerUp(event(100, 130));
  const elevation = rects.find(rect => rect.props['aria-label'].startsWith('Scale Elevation'));
  elevation.props.onPointerDown(event(100, 100));
  elevation.props.onPointerMove(event(100, 130));
  assert.deepEqual(changes.at(-1), { y: { elevationMeters: [110, 210] } });
});

test('pressing and releasing Shift during a drag changes mode without jumping', () => {
  const { rects, changes, event } = setup();
  const x = rects.find(rect => rect.props.className === 'run-scale-x');
  x.props.onPointerDown(event(400, 350));
  x.props.onPointerMove(event(320, 350));
  const moved = changes.at(-1).x;
  x.props.onPointerMove(event(320, 350, { shiftKey: true }));
  assert.deepEqual(changes.at(-1).x, moved);
  x.props.onPointerMove(event(400, 350, { shiftKey: true }));
  const scaled = changes.at(-1).x;
  assert.ok(scaled[1] - scaled[0] < 10);
  x.props.onPointerMove(event(400, 350));
  assert.deepEqual(changes.at(-1).x, scaled);
  x.props.onPointerMove(event(320, 350));
  const final = changes.at(-1).x;
  assert.ok(Math.abs((final[1] - final[0]) - (scaled[1] - scaled[0])) < 1e-10);
  assert.ok(final[0] > scaled[0]);
});
