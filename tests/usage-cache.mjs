import assert from 'node:assert/strict';
import {createUsageCache} from '../public/collection-performance.js';
import {sessionUsage} from '../public/maintenance.js';
const sessions=[{id:'s',paddleId:'a',start:'2026-01-01T10:00:00Z',end:'2026-01-01T12:00:00Z',segments:[{paddleId:'a',start:'2026-01-01T10:00:00Z',end:'2026-01-01T10:30:00Z'},{paddleId:'b',start:'2026-01-01T11:00:00Z',end:'2026-01-01T12:00:00Z'}]},{id:'e',paddleId:'a',start:'2026-01-01T00:00:00Z',end:'2026-01-03T00:00:00Z',estimatedHours:5}];
const cache=createUsageCache();for(const id of ['a','b','missing'])assert.equal(cache.hours(id,sessions),sessionUsage(id,sessions));assert.equal(cache.hours('a',sessions),5);assert.equal(cache.hours('b',sessions),1);
sessions[0].segments[0].end='2026-01-01T11:00:00Z';cache.reset(sessions);assert.equal(cache.hours('a',sessions),sessionUsage('a',sessions));const corrected=sessions.filter(s=>s.id!=='e');assert.equal(cache.hours('a',corrected),1);
console.log('PASS: usage cache preserves recorded intervals, breaks, mixed paddles, overlapping estimates, missing paddles and revision/deletion invalidation.');
