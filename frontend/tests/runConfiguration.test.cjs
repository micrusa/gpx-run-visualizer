const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { DEFAULT_CHART_SETTINGS } = require('../src/components/runs/chartData.ts');

function load(file, open = false, stateChanges = [], hooks = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/runs', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  const req = name => name === 'react' ? { ...React, useState: () => [open, value => stateChanges.push(value)],
      useRef: value => ({ current: hooks.dialog ?? value }), useEffect: callback => { if (hooks.effects) hooks.effects.push(callback); } }
    : name.startsWith('@/components/runs/') ? load(name.slice('@/components/runs/'.length) + '.tsx', open, stateChanges, hooks)
    : require(name);
  new Function('require', 'module', 'exports', code)(req, module, module.exports);
  return module.exports;
}
function find(tree, predicate) {
  const matches = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!React.isValidElement(node)) return;
    if (typeof node.type === 'function') { walk(node.type(node.props)); return; }
    if (predicate(node)) matches.push(node);
    walk(node.props.children);
  }
  walk(tree);
  return matches;
}

test('the configuration gear opens settings for every graph value', () => {
  for (const [metric, label] of [['paceSecondsPerKm', 'Pace'], ['elevationMeters', 'Elevation'], ['gradePercent', 'Grade'], ['heartRate', 'Heart rate']]) {
    const changes = [];
    const { MetricConfiguration } = load('MetricConfiguration.tsx', false, changes);
    const tree = MetricConfiguration({ metric, label, value: DEFAULT_CHART_SETTINGS.smoothing[metric], onChange() {} });
    const gear = find(tree, element => element.type === 'button')[0];
    assert.equal(gear.props['aria-label'], `Configure ${label.toLowerCase()}`);
    assert.equal(gear.props['aria-expanded'], false);
    assert.equal(gear.props['aria-haspopup'], 'dialog');
    assert.equal(find(tree, element => element.type === 'dialog').length, 1);
    gear.props.onClick();
    assert.deepEqual(changes, [true]);
  }
});

test('smoothing can be enabled, disabled, and assigned a valid integer window', () => {
  const { MetricConfiguration } = load('MetricConfiguration.tsx', true);
  const changes = [];
  const tree = MetricConfiguration({ metric: 'elevationMeters', label: 'Elevation', value: { enabled: false, points: 5 }, onChange: value => changes.push(value) });
  const inputs = find(tree, element => element.type === 'input');
  assert.equal(inputs[1].props.disabled, true);
  inputs[0].props.onChange({ target: { checked: true } });
  assert.deepEqual(changes.at(-1), { enabled: true, points: 5 });
  inputs[1].props.onChange({ currentTarget: { valueAsNumber: 11 } });
  assert.equal(changes.at(-1).points, 11);
  const count = changes.length;
  for (const value of [0, -1, 1.5, NaN, Infinity]) inputs[1].props.onChange({ currentTarget: { valueAsNumber: value } });
  assert.equal(changes.length, count);
});

test('pause filtering defaults to 12 min/km and supports editing and disabling', () => {
  const { RunPointFiltering } = load('RunPointFiltering.tsx');
  const changes = [];
  const tree = RunPointFiltering({ value: DEFAULT_CHART_SETTINGS.pointFilter,
    counts: { hidden: 2, total: 10, isSelection: false }, onChange: value => changes.push(value) });
  const inputs = find(tree, element => element.type === 'input');
  const enabled = inputs.find(input => input.props.id === 'pace-filter-enabled');
  const cutoff = inputs.find(input => input.props.id === 'pace-cutoff');
  assert.equal(enabled.props.checked, false);
  assert.equal(cutoff.props.disabled, true);
  assert.equal(cutoff.props.value, 12);
  cutoff.props.onChange({ currentTarget: { valueAsNumber: 12.5 } });
  assert.equal(changes.at(-1).maxPaceSecondsPerKm, 750);
  enabled.props.onChange({ target: { checked: false } });
  assert.equal(changes.at(-1).enabled, false);
  const count = changes.length;
  for (const value of [0, -1, NaN, Infinity]) cutoff.props.onChange({ currentTarget: { valueAsNumber: value } });
  assert.equal(changes.length, count);
});

test('pace filtering has a gear button and keeps its cutoff inside the dialog', () => {
  const states = [];
  const { RunPointFiltering } = load('RunPointFiltering.tsx', false, states);
  const tree = RunPointFiltering({ value: DEFAULT_CHART_SETTINGS.pointFilter,
    counts: { hidden: 2, total: 10, isSelection: false }, onChange() {} });
  const gear = find(tree, element => element.type === 'button' && element.props['aria-label'] === 'Configure pace filter')[0];
  assert.equal(gear.props['aria-haspopup'], 'dialog');
  gear.props.onClick();
  assert.deepEqual(states, [true]);
  const dialog = find(tree, element => element.type === 'dialog')[0];
  assert.equal(find(dialog, element => element.type === 'input' && element.props.id === 'pace-cutoff').length, 1);
});

test('native dialogs open modally and close when their open state is cleared', () => {
  const effects = [];
  let shown = 0, closed = 0;
  const dialog = { open: false, showModal() { shown++; this.open = true; }, close() { closed++; this.open = false; } };
  const { RunSettingsDialog } = load('RunSettingsDialog.tsx', false, [], { dialog, effects });
  const props = { id: 'test-dialog', title: 'Pace smoothing', onClose() {}, children: null };
  RunSettingsDialog({ ...props, open: true });
  effects.pop()();
  assert.equal(shown, 1);
  RunSettingsDialog({ ...props, open: true });
  effects.pop()();
  assert.equal(shown, 1);
  RunSettingsDialog({ ...props, open: false });
  effects.pop()();
  assert.equal(closed, 1);
});

test('dialog supports Close, Escape and outside clicks without dismissing inside clicks', () => {
  const { RunSettingsDialog } = load('RunSettingsDialog.tsx');
  let closed = 0;
  const tree = RunSettingsDialog({ id: 'test-dialog', title: 'Pace smoothing', open: true, onClose: () => closed++, children: null });
  assert.equal(tree.props['aria-labelledby'], 'test-dialog-title');
  assert.equal(tree.props['aria-modal'], 'true');
  find(tree, element => element.type === 'button')[0].props.onClick();
  tree.props.onCancel();
  const target = { getBoundingClientRect: () => ({ left: 100, top: 100, right: 300, bottom: 300 }) };
  tree.props.onClick({ target, currentTarget: target, clientX: 150, clientY: 150 });
  assert.equal(closed, 2);
  tree.props.onClick({ target, currentTarget: target, clientX: 50, clientY: 150 });
  assert.equal(closed, 3);
});

test('efficiency settings expose an optional HR delay with a five-second default', () => {
  const { MetricConfiguration } = load('MetricConfiguration.tsx', true);
  const changes = [];
  const tree = MetricConfiguration({ metric: 'beatsPerKm', label: 'Beats per km',
    value: DEFAULT_CHART_SETTINGS.smoothing.beatsPerKm, onChange() {},
    delay: { value: DEFAULT_CHART_SETTINGS.heartRateDelay, onChange: value => changes.push(value) } });
  const [, , enabled, seconds] = find(tree, element => element.type === 'input');
  assert.equal(enabled.props.checked, false);
  assert.equal(seconds.props.disabled, true);
  assert.equal(seconds.props.value, 5);
  enabled.props.onChange({ target: { checked: true } });
  seconds.props.onChange({ currentTarget: { valueAsNumber: 7.5 } });
  assert.deepEqual(changes, [{ enabled: true, seconds: 5 }, { enabled: false, seconds: 7.5 }]);
});
