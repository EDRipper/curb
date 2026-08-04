import dns from "node:dns/promises";

const PRIVATE_IPV4_RANGES: [number, number][] = [
  [ipToInt("0.0.0.0"), ipToInt("0.255.255.255")],
  [ipToInt("10.0.0.0"), ipToInt("10.255.255.255")],
  [ipToInt("100.64.0.0"), ipToInt("100.127.255.255")], // carrier-grade NAT
  [ipToInt("127.0.0.0"), ipToInt("127.255.255.255")],
  [ipToInt("169.254.0.0"), ipToInt("169.254.255.255")], // link-local / cloud metadata
  [ipToInt("172.16.0.0"), ipToInt("172.31.255.255")],
  [ipToInt("192.0.0.0"), ipToInt("192.0.0.255")],
  [ipToInt("192.168.0.0"), ipToInt("192.168.255.255")],
  [ipToInt("198.18.0.0"), ipToInt("198.19.255.255")],
];

function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIpv4Literal(host: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

function isPrivateIpv4(host: string): boolean {
  const n = ipToInt(host);
  return PRIVATE_IPV4_RANGES.some(([lo, hi]) => n >= lo && n <= hi);
}

// an ipv4-mapped ipv6 address (rfc 4291 2.5.5.2) like "::ffff:169.254.169.254"
// gets connected to over ipv4 by the os's dual-stack socket layer, so it has
// to be checked against the same private-range table as a plain ipv4 host.
// the WHATWG URL parser always normalizes these to the canonical
// "::ffff:HHHH:HHHH" form (verified: ::ffff:169.254.169.254,
// ::ffff:a9fe:a9fe, and 0:0:0:0:0:ffff:169.254.169.254 all normalize to the
// same "::ffff:a9fe:a9fe"), so matching that exact prefix is sufficient.
function mappedIpv4(host: string): string | null {
  if (!host.startsWith("::ffff:")) return null;
  const groups = host.slice("::ffff:".length).split(":");
  if (groups.length !== 2 || !groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) {
    return null;
  }
  const [g1, g2] = groups.map((g) => parseInt(g, 16));
  return [(g1 >> 8) & 0xff, g1 & 0xff, (g2 >> 8) & 0xff, g2 & 0xff].join(".");
}

function isPrivateIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();

  const mapped = mappedIpv4(h);
  if (mapped && isPrivateIpv4(mapped)) return true;

  return (
    h === "::1" ||
    h === "::" ||
    h.startsWith("fe80:") || // link-local
    h.startsWith("fc") ||
    h.startsWith("fd") // unique local
  );
}

function isLocalHostname(host: string): boolean {
  return host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local");
}

export function isPrivateIpLiteral(raw: string): boolean {
  const host = raw.replace(/^\[|\]$/g, "").toLowerCase();
  if (isIpv4Literal(host)) return isPrivateIpv4(host);
  if (host.includes(":")) return isPrivateIpv6(host);
  return false;
}

/**
 * Rejects schemes/hosts that would let a submitted url reach internal
 * infra or the local filesystem when crawled server-side by puppeteer.
 * This is a synchronous, hostname-only check (no DNS lookup) meant as an
 * immediate, friendly gate at submission time - it doesn't catch a
 * hostname that only resolves to a private address, or a redirect chain
 * that lands on one. lib/accessibilityAudit.ts is the layer that actually
 * enforces safety at crawl time, since that's the only place a check can
 * see the real resolved address for every hop.
 */
export function assertSafeCrawlUrl(raw: string, field: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${field} must be a valid url`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${field} must be an http or https url`);
  }

  const host = url.hostname.toLowerCase();

  if (isLocalHostname(host) || isPrivateIpLiteral(host)) {
    throw new Error(`${field} can't point at a local/internal address`);
  }
}

/**
 * Async, DNS-resolving check for use right before a request actually goes
 * out (puppeteer request interception). Resolves the hostname and checks
 * every returned address, so unlike assertSafeCrawlUrl above this catches
 * a hostname that merely resolves to a private address - including on a
 * redirect hop, since this gets called per-navigation-request, not just
 * once on the originally submitted url. Still has a TOCTOU window between
 * this lookup and chrome's own connect (full DNS-rebinding-proofing needs
 * pinning the resolved ip for the actual connection), but closes off the
 * practical case: an attacker-controlled server 302-redirecting somewhere
 * internal, which doesn't need any DNS trickery at all.
 */
export async function isUrlTargetPrivate(raw: string): Promise<boolean> {
  let host: string;
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    return true;
  }

  if (isLocalHostname(host)) return true;
  if (isPrivateIpLiteral(host)) return true;

  try {
    const records = await dns.lookup(host, { all: true, verbatim: true });
    return records.some((r) => isPrivateIpLiteral(r.address));
  } catch {
    return true;
  }
}
