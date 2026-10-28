import test from 'node:test';
import assert from 'node:assert/strict';
import { partitionEvents, isActiveEvent } from '../src/lib/content.mjs';
const event = { id: 'workshop', status: 'published', date: '2026-10-21' };
test('date-only events expire at midnight in India, not UTC', () => {
  assert.equal(isActiveEvent(event, Date.parse('2026-10-21T18:29:59Z')), true);
  assert.equal(isActiveEvent(event, Date.parse('2026-10-21T18:30:00Z')), false);
});
test('multi-day events stay active until the last day; precise finish times take precedence', () => {
  const multi = { ...event, endDate: '2026-10-23' };
  assert.equal(isActiveEvent(multi, Date.parse('2026-10-23T10:00:00Z')), true);
  assert.equal(isActiveEvent(multi, Date.parse('2026-10-23T18:30:00Z')), false);
  const timed = { ...multi, endsAt: '2026-10-21T18:30:00+05:30' };
  assert.equal(isActiveEvent(timed, Date.parse('2026-10-21T12:59:59Z')), true);
  assert.equal(isActiveEvent(timed, Date.parse('2026-10-21T13:00:00Z')), false);
});
test('future events need no countdown; old countdowns cannot keep completed events upcoming', () => {
  const records = [
    { ...event, countdownTo: '2026-10-21T17:00:00+05:30' },
    { ...event, id: 'later', date: '2026-11-03' },
    { ...event, id: 'next', date: '2026-11-01' },
    { ...event, id: 'undated', date: null },
    { ...event, id: 'draft', date: '2026-11-01', status: 'draft' },
  ];
  const result = partitionEvents(records, Date.parse('2026-10-28T12:00:00+05:30'));
  assert.deepEqual(result.upcoming.map(x => x.id), ['next', 'later']);
  assert.deepEqual(result.past.map(x => x.id), ['workshop', 'undated']);
  assert.equal(partitionEvents(records, Date.parse('2026-11-04T00:00:00+05:30')).upcoming.length, 0);
});
