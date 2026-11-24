// Minimal ZIP reader (stored + deflate). The inflate function is injected so the same code runs in Node
// (zlib.inflateRawSync) and in the browser (DecompressionStream("deflate-raw")). No ZIP64, no encryption.

export type Inflate = (data: Uint8Array) => Promise<Uint8Array>;
export interface ZipEntry { name: string; size: number; compressed: number; method: number; read: () => Promise<Uint8Array> }

export function isZip(b: Uint8Array): boolean {
  return b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
}
export function isOle2(b: Uint8Array): boolean {
  return b.length > 8 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;
}

export function readZip(buf: Uint8Array, inflate: Inflate): ZipEntry[] {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("Not a ZIP file (no end-of-central-directory record).");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  if (p === 0xffffffff) throw new Error("ZIP64 archives are not supported.");
  const entries: ZipEntry[] = [];
  const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("Corrupt ZIP central directory.");
    const method = dv.getUint16(p + 10, true), compressed = dv.getUint32(p + 20, true), size = dv.getUint32(p + 24, true);
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), local = dv.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nl));
    entries.push({
      name, size, compressed, method,
      read: async () => {
        const lnl = dv.getUint16(local + 26, true), lxl = dv.getUint16(local + 28, true);
        const start = local + 30 + lnl + lxl;
        const data = buf.subarray(start, start + compressed);
        if (method === 0) return data;
        if (method === 8) return inflate(data);
        throw new Error(`Unsupported compression method ${method} for ${name}`);
      },
    });
    p += 46 + nl + xl + cl;
  }
  return entries;
}

/** Browser inflate using DecompressionStream. */
export async function browserInflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
