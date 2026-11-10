const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

function setup() {
  const highlights = [], selected = [], dragging = [];
  let backs = 0, captured = false;
  const source = fs.readFileSync(path.join(__dirname, '../src/components/runs/RunChartSelection.tsx'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  const load = name => name === 'react' ? { ...React, useRef: value => ({ current: value }), useState: () => [null, value => highlights.push(value)] }
    : name === 'recharts' ? { usePlotArea: () => ({ x: 100, y: 50, width: 800, height: 300 }),
      useXAxisInverseScale: () => pixel => (pixel - 100) / 80, ZIndexLayer: ({ children }) => children, DefaultZIndexes: { label: 2000 } } : require(name);
  new Function('require', 'module', 'exports', code)(load, module, module.exports);
  const tree = module.exports.RunChartSelection({ onSelect: (from, to) => selected.push([from, to]), onBack: () => backs++, onDragging: value => dragging.push(value) });
  let rect;
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!React.isValidElement(node)) return;
    if (node.type === 'rect' && node.props.className === 'run-select-area') rect = node;
    walk(node.props.children);
  }
  walk(tree);
  const target = { setPointerCapture: () => { captured = true; }, hasPointerCapture: () => captured,
    releasePointerCapture: () => { captured = false; }, getBoundingClientRect: () => ({ left: 200, width: 800 }) };
  const event = (clientX, extra = {}) => ({ button: 0, pointerId: 1, clientX, currentTarget: target, preventDefault() {}, ...extra });
  return { rect, event, highlights, selected, dragging, backs: () => backs };
}

test('dragging selects a horizontal range without changing chart scales mid-drag', () => {
  const s = setup();
  s.rect.props.onPointerDown(s.event(400));
  s.rect.props.onPointerMove(s.event(800));
  assert.deepEqual(s.selected, []);
  assert.deepEqual(s.highlights.at(-1), [300, 700]);
  s.rect.props.onPointerUp(s.event(800));
  assert.deepEqual(s.selected, [[2.5, 7.5]]);
  assert.deepEqual(s.dragging, [true, false]);
  assert.equal(s.highlights.at(-1), null);
});

test('reverse drags and release outside the plot clamp safely to its bounds', () => {
  const s = setup();
  s.rect.props.onPointerDown(s.event(800));
  s.rect.props.onPointerUp(s.event(-100));
  assert.deepEqual(s.selected, [[7.5, 0]]);
});

test('simple clicks, cancelled drags and other pointers do not zoom', () => {
  const s = setup();
  s.rect.props.onPointerDown(s.event(400));
  s.rect.props.onPointerUp(s.event(403));
  assert.deepEqual(s.selected, []);
  s.rect.props.onPointerDown(s.event(400));
  s.rect.props.onPointerMove(s.event(800, { pointerId: 2 }));
  s.rect.props.onPointerCancel(s.event(800));
  s.rect.props.onPointerUp(s.event(800));
  assert.deepEqual(s.selected, []);
});

test('double-click and keyboard activation unzoom', () => {
  const s = setup();
  s.rect.props.onDoubleClick();
  s.rect.props.onKeyDown({ key: 'Enter', preventDefault() {} });
  assert.equal(s.backs(), 2);
});
