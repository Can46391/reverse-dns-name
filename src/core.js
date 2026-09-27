/**
 * Converts an IPv4 or IPv6 address into its PTR record domain name per RFC 3596.
 *
 * The function accepts the canonical textual forms produced by the standard
 * parsers. For IPv4 this means four decimal octets separated by dots. For
 * IPv6 it means the fully-expanded form (eight groups of four hex digits),
 * which is what Node's `node:net` and most DNS tooling produce. The function
 * deliberately does not expand `::` shorthand itself: doing so correctly
 * requires a full IPv6 parser, and accepting only the canonical form keeps
 * the surface area small and the behaviour predictable. Callers who need to
 * accept compressed input should normalise it first (e.g. by formatting a
 * parsed `net.BlockList` address) before calling here.
 *
 * @param {string} ip - The IP address in canonical textual form.
 * @returns {string} The PTR record domain name under in-addr.arpa or ip6.arpa.
 * @throws {TypeError} If the input is not a string.
 * @throws {Error} If the input is not a valid canonical IPv4 or IPv6 address.
 */
export function reverseDnsName(ip) {
  if (typeof ip !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof ip}`);
  }

  // Trim surrounding whitespace; leading/trailing spaces are a common
  // copy-paste artefact and rejecting them would be unhelpful. Internal
  // whitespace is still invalid and is caught by the octet/group checks.
  const trimmed = ip.trim();

  if (trimmed.includes('.')) {
    return reverseV4(trimmed);
  }
  return reverseV6(trimmed);
}

/**
 * Builds the in-addr.arpa name for an IPv4 address.
 *
 * The name is formed by reversing the four octets and appending
 * `.in-addr.arpa`. Each octet must be 0-255 with no leading zeros, because
 * leading zeros are ambiguous (some systems interpret them as octal) and
 * are not part of the canonical form.
 *
 * @param {string} ip
 * @returns {string}
 */
function reverseV4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }

  const octets = [];
  for (const part of parts) {
    if (!/^[0-9]+$/.test(part)) {
      throw new Error(`Invalid IPv4 octet: ${part}`);
    }
    // Reject leading zeros: "01" is not canonical and is treated as octal
    // by some parsers, so we refuse it rather than guessing.
    if (part.length > 1 && part[0] === '0') {
      throw new Error(`Invalid IPv4 octet (leading zero): ${part}`);
    }
    const value = Number(part);
    if (value > 255) {
      throw new Error(`IPv4 octet out of range: ${part}`);
    }
    octets.push(value);
  }

  return `${octets[3]}.${octets[2]}.${octets[1]}.${octets[0]}.in-addr.arpa`;
}

/**
 * Builds the ip6.arpa name for an IPv6 address.
 *
 * The name is formed by reversing the nibbles (single hex digits) of the
 * fully-expanded 128-bit address and appending `.ip6.arpa`. We require the
 * canonical eight-group form because expanding `::` correctly is the job of
 * a parser, not of a formatter; accepting compressed input here would mean
 * re-implementing that parser and getting it wrong in subtle ways.
 *
 * Each group must be 1-4 hex digits. We do not zero-pad on input — we pad
 * when building the nibble sequence — so both "1" and "0001" are accepted.
 * Mixed IPv4/IPv6 notation (a trailing dotted-quad) is not supported.
 *
 * @param {string} ip
 * @returns {string}
 */
function reverseV6(ip) {
  const parts = ip.split(':');
  if (parts.length !== 8) {
    throw new Error(`Invalid IPv6 address (expected 8 groups, got ${parts.length}): ${ip}`);
  }

  // Reject `::` compression: it produces empty parts, which a naive split
  // would silently accept. Catching it here gives a clear error.
  for (const part of parts) {
    if (part === '') {
      throw new Error(`Invalid IPv6 address (empty group or '::' compression): ${ip}`);
    }
    if (!/^[0-9a-fA-F]{1,4}$/.test(part)) {
      throw new Error(`Invalid IPv6 group: ${part}`);
    }
  }

  // Build the 32-nibble sequence, then reverse it. Padding each group to
  // four digits here means we don't have to care about padding at input
  // time.
  const nibbles = parts
    .map((g) => g.toLowerCase().padStart(4, '0'))
    .join('')
    .split('')
    .reverse();

  return `${nibbles.join('.')}.ip6.arpa`;
}
