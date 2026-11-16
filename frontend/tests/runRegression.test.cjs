const { test } = require('node:test');
const assert = require('node:assert/strict');
const { linearRegression } = require('../src/components/runs/regression.ts');

test('fits positive and negative linear relationships', () => {
  for (const slope of [2, -3]) {
    const fit = linearRegression([1, 2, 3, 4].map(x => ({ x, y: slope * x + 5 })));
    assert.equal(fit.r, Math.sign(slope));
    assert.equal(fit.rSquared, 1);
    assert.deepEqual(fit.line, [{ x: 1, y: slope + 5 }, { x: 4, y: slope * 4 + 5 }]);
  }
});

test('handles uncorrelated samples and excludes nonfinite values', () => {
  const fit = linearRegression([{ x: -1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: 1 }, { x: Infinity, y: 9 }]);
  assert.equal(fit.r, 0);
  assert.equal(fit.samples.length, 3);
});

test('does not report correlations for insufficient or constant measurements', () => {
  assert.equal(linearRegression([{ x: 1, y: 2 }]), null);
  assert.equal(linearRegression([1, 2, 3].map(y => ({ x: 1, y }))), null);
  assert.equal(linearRegression([1, 2, 3].map(x => ({ x, y: 2 }))), null);
});
