import { test } from 'node:test';
import assert from 'node:assert/strict';

import { reverseDnsName } from '../src/index.js';

test('reverses a simple IPv4 address', () => {
  assert.equal(reverseDnsName('192.0.2.1'), '1.2.0.192.in-addr.arpa');
});

test('reverses an all-zero IPv4 address', () => {
  assert.equal(reverseDnsName('0.0.0.0'), '0.0.0.0.in-addr.arpa');
});

test('reverses the broadcast address', () => {
  assert.equal(reverseDnsName('255.255.255.255'), '255.255.255.255.in-addr.arpa');
});

test('rejects IPv4 with too few octets', () => {
  assert.throws(() => reverseDnsName('192.0.2'), /Invalid IPv4 address/);
});

test('rejects IPv4 with leading zeros in an octet', () => {
  assert.throws(() => reverseDnsName('192.0.2.01'), /leading zero/);
});

test('rejects IPv4 octet above 255', () => {
  assert.throws(() => reverseDnsName('192.0.2.256'), /out of range/);
});

test('reverses a full-form IPv6 address', () => {
  assert.equal(
    reverseDnsName('2001:0db8:0000:0000:0000:0000:0000:0001'),
    '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
  );
});

test('accepts short IPv6 groups and pads them', () => {
  assert.equal(
    reverseDnsName('2001:db8:0:0:0:0:0:1'),
    '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
  );
});

test('reverses the IPv6 loopback address', () => {
  assert.equal(
    reverseDnsName('0:0:0:0:0:0:0:1'),
    '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa',
  );
});

test('rejects compressed IPv6 with ::', () => {
  assert.throws(() => reverseDnsName('2001:db8::1'), /Invalid IPv6 address/);
});

test('rejects IPv6 with too few groups', () => {
  assert.throws(() => reverseDnsName('2001:db8:0:0:0:0:1'), /expected 8 groups/);
});

test('rejects IPv6 with a group that is too long', () => {
  assert.throws(() => reverseDnsName('2001:db8:0:0:0:0:0:00001'), /Invalid IPv6 group/);
});

test('rejects non-string input', () => {
  assert.throws(() => reverseDnsName(42), /Expected a string/);
});

test('trims surrounding whitespace before parsing', () => {
  assert.equal(reverseDnsName('  192.0.2.1  '), '1.2.0.192.in-addr.arpa');
});
