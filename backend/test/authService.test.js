const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { toClientUser, verifyToken } = require('../src/services/authService');

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

test('verifyToken accepts legacy fallback secrets', () => {
  process.env.JWT_SECRET = 'legacy-secret';
  const token = jwt.sign({ id: 'user-1', username: 'alice', role: 'member' }, 'legacy-secret');
  const payload = verifyToken(token);

  assert.equal(payload.username, 'alice');
  assert.equal(payload.id, 'user-1');
});
