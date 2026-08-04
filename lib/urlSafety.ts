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

/**
 * Rejects schemes/hosts that would let a submitted url reach internal
 * infra or the local filesystem when crawled server-side by puppeteer.
 * Not DNS-rebinding-proof (that needs a resolve-then-check at connect
 * time), but closes the obvious direct-IP/localhost/non-http attack
 * surface a submitter can hit by just typing a url into the form.
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

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error(`${field} can't point at a local/internal address`);
  }

  if (isIpv4Literal(host) && isPrivateIpv4(host)) {
    throw new Error(`${field} can't point at a local/internal address`);
  }

  if (host.includes(":") && isPrivateIpv6(host)) {
    throw new Error(`${field} can't point at a local/internal address`);
  }
}
