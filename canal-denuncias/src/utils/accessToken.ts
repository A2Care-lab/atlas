export function deriveAccessTokenFromLinkToken(linkToken: string, length = 8): string {
  const base = linkToken.replace(/[^a-zA-Z0-9]/g, '');
  if (!base) return '';

  let seed = 0;
  for (let i = 0; i < base.length; i++) {
    seed = (seed * 31 + base.charCodeAt(i)) >>> 0;
  }

  const rand = (function mulberry32(a: number) {
    return function () {
      a += 0x6D2B79F5;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })(seed);

  let out = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(rand() * base.length);
    out += base[idx];
  }

  return out.toLowerCase();
}
