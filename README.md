# reverse-dns-name

Converts an IPv4 or IPv6 address into its PTR record domain name per RFC 3596.

```js
import { reverseDnsName } from 'reverse-dns-name';

reverseDnsName('192.0.2.1');
// '1.2.0.192.in-addr.arpa'

reverseDnsName('2001:db8:0:0:0:0:0:1');
// '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa'
```

## Why this exists

Generating a PTR name is a tiny but fiddly operation — reverse the octets, or
reverse the nibbles — and inlining it every time leads to off-by-one errors in
the IPv6 case. This library does that one job and nothing else.

The trade-off is that it only accepts the **canonical** textual form. For IPv4
that is four decimal octets with no leading zeros. For IPv6 that is the fully
expanded eight-group form; `::` compression is rejected, not expanded.
Expanding `::` correctly is a parser's job, and shipping a half-correct one
would be worse than refusing the input. If you have compressed IPv6 text,
normalise it first (for example by formatting a parsed address from
`node:net`) before passing it in.

## Edge cases you will hit

- Leading zeros in IPv4 octets (`192.0.2.01`) throw, because some systems
  read them as octal and we refuse to guess.
- `::` in IPv6 throws. Pass the expanded form.
- Mixed IPv4/IPv6 notation (a trailing dotted-quad in an IPv6 address) is not
  supported.
- Surrounding whitespace is trimmed; internal whitespace is an error.

## Exports

- `reverseDnsName(ip: string): string` — returns the PTR domain name. Throws
  `TypeError` for non-string input, `Error` for malformed addresses.
