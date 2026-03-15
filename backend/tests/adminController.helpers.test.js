const test = require('node:test');
const assert = require('node:assert/strict');

const { __testables } = require('../controllers/adminController');

const { buildMonthlyBuckets, mergeMonthlyCounts, getRangeStart } = __testables;

test('buildMonthlyBuckets creates ordered buckets with expected fields', () => {
  const buckets = buildMonthlyBuckets(3);

  assert.equal(buckets.length, 3);
  assert.ok(buckets[0].label);
  assert.equal(typeof buckets[0].newUsers, 'number');
  assert.equal(typeof buckets[0].pickups, 'number');
  assert.equal(typeof buckets[0].opportunities, 'number');
  assert.equal(typeof buckets[0].volunteerResponses, 'number');

  const sorted = [...buckets].sort((a, b) => new Date(a.year, a.month - 1) - new Date(b.year, b.month - 1));
  assert.deepEqual(buckets.map((b) => b.key), sorted.map((b) => b.key));
});

test('mergeMonthlyCounts merges aggregate rows into the right bucket fields', () => {
  const buckets = [
    {
      key: '2026-1',
      label: 'Jan 2026',
      year: 2026,
      month: 1,
      newUsers: 0,
      pickups: 0,
      opportunities: 0,
      volunteerResponses: 0,
    },
    {
      key: '2026-2',
      label: 'Feb 2026',
      year: 2026,
      month: 2,
      newUsers: 0,
      pickups: 0,
      opportunities: 0,
      volunteerResponses: 0,
    },
  ];

  mergeMonthlyCounts(
    buckets,
    [
      { _id: { year: 2026, month: 1 }, count: 7 },
      { _id: { year: 2026, month: 2 }, count: 4 },
    ],
    'opportunities'
  );

  assert.equal(buckets[0].opportunities, 7);
  assert.equal(buckets[1].opportunities, 4);
});

test('getRangeStart returns null for all and valid date for supported ranges', () => {
  assert.equal(getRangeStart('all'), null);

  const todayStart = getRangeStart('today');
  assert.ok(todayStart instanceof Date);
  assert.equal(todayStart.getHours(), 0);

  const weekStart = getRangeStart('week');
  assert.ok(weekStart instanceof Date);

  const monthStart = getRangeStart('month');
  assert.ok(monthStart instanceof Date);
  assert.equal(monthStart.getDate(), 1);
});
