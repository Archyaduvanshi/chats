const test = require('node:test');
const assert = require('node:assert/strict');
const { toClientUser } = require('../src/services/authService');

test('toClientUser omits phone for non-sensitive responses', () => {
  const payload = toClientUser({
    id: 'user-1',
    username: 'alice',
    phone: '+1234567890',
    role: 'member',
    status: 'approved',
  });

  assert.equal(payload.username, 'alice');
  assert.equal(payload.phone, undefined);
});

test('toClientUser includes phone for self-scoped responses', () => {
  const payload = toClientUser(
    {
      id: 'user-1',
      username: 'alice',
      phone: '+1234567890',
      role: 'member',
      status: 'approved',
    },
    true
  );

  assert.equal(payload.username, 'alice');
  assert.equal(payload.phone, '+1234567890');
});
