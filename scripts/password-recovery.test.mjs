import assert from 'node:assert/strict';
import test from 'node:test';
import { passwordResetSchema, recoveryEmailSchema } from '../src/features/auth/schemas.ts';

test('recovery accepts a normalized email without caller-controlled redirects', () => {
 assert.deepEqual(recoveryEmailSchema.parse({ email: ' user@example.com ', redirect: 'https://other.example' }), { email: 'user@example.com' });
 for (const email of ['', 'invalid', null, 'a'.repeat(255) + '@example.com']) {
  assert.equal(recoveryEmailSchema.safeParse({ email }).success, false);
 }
});

test('new passwords must match and satisfy length bounds on the server', () => {
 for (const data of [
  { password: 'short', confirmPassword: 'short' },
  { password: 'password123', confirmPassword: 'different' },
  { password: 'x'.repeat(129), confirmPassword: 'x'.repeat(129) },
  { password: 'password123' },
 ]) assert.equal(passwordResetSchema.safeParse(data).success, false);
 for (const password of ['x'.repeat(8), 'x'.repeat(128)]) {
  assert.deepEqual(passwordResetSchema.parse({ password, confirmPassword: password, userId: 'someone-else' }), { password, confirmPassword: password });
 }
});
