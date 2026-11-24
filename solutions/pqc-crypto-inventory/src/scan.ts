// Scanner + classifier: finds cryptography, rates it for quantum and classical risk, and tells you what to move to.

import { certAlgorithms, RULES, type Family } from "./rules.ts";

export type Category = "BROKEN_NOW" | "QUANTUM_VULNERABLE" | "REVIEW" | "QUANTUM_SAFE" | "PQC_READY" | "SECRET_EXPOSED";
export type Primitive = "pke" | "signature" | "key-agree" | "kem" | "hash" | "mac" | "block-cipher" | "stream-cipher" | "protocol" | "key-material";

export interface Finding {
  file: string;
  line: number;
  rule: string;
  family: Family;
  param?: string;
  category: Category;
  primitive: Primitive;
  in_comment: boolean;
  snippet: string;
  why: string;
  fix: string;
  priority: 1 | 2 | 3 | 4; // 1 = act now
}

interface FamilyInfo { primitive: Primitive; category: Category; why: string; fix: string; nistLevel: number }

const SHOR = "Breakable by a large quantum computer (Shor's algorithm). Data protected today can be recorded now and decrypted later.";
export const FAMILY: Record<Family, FamilyInfo> = {
  RSA: { primitive: "pke", category: "QUANTUM_VULNERABLE", why: SHOR, fix: "Key exchange/encryption → ML-KEM (FIPS 203), ideally hybrid X25519MLKEM768. Signatures → ML-DSA (FIPS 204) or SLH-DSA (FIPS 205).", nistLevel: 0 },
  DSA: { primitive: "signature", category: "BROKEN_NOW", why: "DSA is deprecated for new signatures and is also quantum-vulnerable.", fix: "Replace with ML-DSA (FIPS 204); use Ed25519/ECDSA only as a short-term hybrid partner.", nistLevel: 0 },
  DH: { primitive: "key-agree", category: "QUANTUM_VULNERABLE", why: SHOR, fix: "Move key exchange to hybrid X25519MLKEM768 (TLS 1.3) or ML-KEM.", nistLevel: 0 },
  ECDSA: { primitive: "signature", category: "QUANTUM_VULNERABLE", why: SHOR, fix: "Plan migration to ML-DSA (FIPS 204); consider composite/hybrid certificates during transition.", nistLevel: 0 },
  ECDH: { primitive: "key-agree", category: "QUANTUM_VULNERABLE", why: SHOR, fix: "Use hybrid X25519MLKEM768 key exchange (TLS 1.3) or ML-KEM.", nistLevel: 0 },
  EC: { primitive: "pke", category: "QUANTUM_VULNERABLE", why: SHOR, fix: "Elliptic-curve keys: signatures → ML-DSA; key exchange → ML-KEM / hybrid X25519MLKEM768.", nistLevel: 0 },
  EdDSA: { primitive: "signature", category: "QUANTUM_VULNERABLE", why: SHOR + " (Modern and fine classically; still needs a PQ plan.)", fix: "Keep for now; plan ML-DSA or a hybrid Ed25519+ML-DSA scheme.", nistLevel: 0 },
  X25519: { primitive: "key-agree", category: "QUANTUM_VULNERABLE", why: SHOR + " (Modern and fine classically.)", fix: "Upgrade to hybrid X25519MLKEM768 so it stays safe against record-now-decrypt-later.", nistLevel: 0 },
  MD5: { primitive: "hash", category: "BROKEN_NOW", why: "MD5 collisions are practical today.", fix: "Use SHA-256 or better (SHA-384/SHA-512/SHA3). For passwords use Argon2id, scrypt or bcrypt.", nistLevel: 0 },
  SHA1: { primitive: "hash", category: "BROKEN_NOW", why: "SHA-1 collisions have been demonstrated; it's being withdrawn.", fix: "Use SHA-256 or better. (HMAC-SHA1 is less urgent but still worth retiring.)", nistLevel: 0 },
  DES: { primitive: "block-cipher", category: "BROKEN_NOW", why: "56-bit DES can be brute-forced.", fix: "Use AES-256-GCM.", nistLevel: 0 },
  "3DES": { primitive: "block-cipher", category: "BROKEN_NOW", why: "Triple DES is withdrawn for encryption and has a 64-bit block (Sweet32).", fix: "Use AES-256-GCM. (Check card/HSM key blocks too: banking still uses TDES in places.)", nistLevel: 0 },
  RC4: { primitive: "stream-cipher", category: "BROKEN_NOW", why: "RC4 has known practical biases; banned in TLS.", fix: "Use AES-256-GCM or ChaCha20-Poly1305.", nistLevel: 0 },
  RC2: { primitive: "block-cipher", category: "BROKEN_NOW", why: "RC2 is obsolete and weak.", fix: "Use AES-256-GCM.", nistLevel: 0 },
  Blowfish: { primitive: "block-cipher", category: "BROKEN_NOW", why: "64-bit block cipher; vulnerable to birthday attacks on large data.", fix: "Use AES-256-GCM (or bcrypt only for password hashing).", nistLevel: 0 },
  ECB: { primitive: "block-cipher", category: "BROKEN_NOW", why: "ECB mode leaks patterns in the data.", fix: "Use an authenticated mode: AES-256-GCM.", nistLevel: 0 },
  TLS_OLD: { primitive: "protocol", category: "BROKEN_NOW", why: "TLS 1.0/1.1 are deprecated.", fix: "Allow TLS 1.2+ only; prefer TLS 1.3 with hybrid X25519MLKEM768 key exchange.", nistLevel: 0 },
  SSL: { primitive: "protocol", category: "BROKEN_NOW", why: "SSLv2/v3 are broken.", fix: "Disable; allow TLS 1.2+ only, prefer TLS 1.3.", nistLevel: 0 },
  NULL_CIPHER: { primitive: "protocol", category: "BROKEN_NOW", why: "NULL / EXPORT cipher suites give no or trivially breakable encryption.", fix: "Remove; use TLS 1.3 suites.", nistLevel: 0 },
  JWT_NONE: { primitive: "signature", category: "BROKEN_NOW", why: "alg 'none' means tokens are not signed at all.", fix: "Reject 'none'; pin the expected algorithm server-side.", nistLevel: 0 },
  AES128: { primitive: "block-cipher", category: "REVIEW", why: "Grover's algorithm halves effective strength; AES-128 is acceptable today but weaker for decades-long secrets.", fix: "For long-lived data prefer AES-256.", nistLevel: 1 },
  AES256: { primitive: "block-cipher", category: "QUANTUM_SAFE", why: "AES-256 keeps ample margin against quantum attacks.", fix: "No change needed (check mode: prefer GCM).", nistLevel: 5 },
  AES: { primitive: "block-cipher", category: "REVIEW", why: "AES key size not visible from this line.", fix: "Confirm 256-bit keys and an authenticated mode (GCM).", nistLevel: 1 },
  SHA2: { primitive: "hash", category: "QUANTUM_SAFE", why: "SHA-2 remains secure; SHA-384/512 give extra quantum margin.", fix: "No change needed.", nistLevel: 2 },
  SHA3: { primitive: "hash", category: "QUANTUM_SAFE", why: "SHA-3 remains secure.", fix: "No change needed.", nistLevel: 2 },
  ChaCha20: { primitive: "stream-cipher", category: "QUANTUM_SAFE", why: "256-bit key; fine against quantum attacks.", fix: "No change needed.", nistLevel: 5 },
  HMAC: { primitive: "mac", category: "QUANTUM_SAFE", why: "HMAC with SHA-2 remains secure (symmetric).", fix: "No change needed; keep keys ≥ 256 bits for long-term use.", nistLevel: 2 },
  "ML-KEM": { primitive: "kem", category: "PQC_READY", why: "NIST post-quantum key encapsulation (FIPS 203).", fix: "Already post-quantum. Prefer hybrid with X25519 during transition.", nistLevel: 3 },
  "ML-DSA": { primitive: "signature", category: "PQC_READY", why: "NIST post-quantum signature (FIPS 204).", fix: "Already post-quantum.", nistLevel: 3 },
  "SLH-DSA": { primitive: "signature", category: "PQC_READY", why: "NIST hash-based post-quantum signature (FIPS 205).", fix: "Already post-quantum.", nistLevel: 3 },
  "FN-DSA": { primitive: "signature", category: "PQC_READY", why: "Falcon / FN-DSA post-quantum signature.", fix: "Already post-quantum.", nistLevel: 1 },
  HYBRID_PQ: { primitive: "kem", category: "PQC_READY", why: "Hybrid classical + post-quantum key exchange.", fix: "Already quantum-resistant.", nistLevel: 3 },
  PRIVATE_KEY: { primitive: "key-material", category: "SECRET_EXPOSED", why: "A private key is stored in the code base or config files.", fix: "Remove it, rotate the key, and keep keys in an HSM, KMS or secrets vault.", nistLevel: 0 },
};

const COMMENT = /^\s*(\/\/|#|\*|\/\*|--(?!-)|;|<!--|REM\b)/i;
const TEXT_EXT = /\.(java|kt|kts|scala|groovy|py|js|mjs|cjs|ts|tsx|jsx|go|cs|vb|c|cc|cpp|h|hpp|rs|rb|php|swift|m|sh|bash|zsh|ps1|bat|cmd|conf|cfg|cnf|ini|properties|yaml|yml|json|toml|xml|env|tf|hcl|pem|crt|cer|key|pub|txt|md|sql|cob|cbl|jcl|dockerfile|gradle|pom|config)$/i;

export function isScannable(path: string): boolean {
  const base = path.split(/[\\/]/).pop() ?? path;
  return TEXT_EXT.test(base) || /^(dockerfile|makefile|sshd_config|ssh_config|nginx\.conf|httpd\.conf|openssl\.cnf|authorized_keys|known_hosts|id_\w+)$/i.test(base);
}

export function scanText(file: string, text: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 4000) continue; // minified / binary-ish
    const inComment = COMMENT.test(line);
    for (const r of RULES) {
      const m = line.match(r.re);
      if (!m) continue;
      const family = typeof r.family === "function" ? r.family(m) : r.family;
      if (!family) continue;
      let param = r.param?.(m, line);
      // key size often set a few lines later, e.g. kpg.initialize(1024)
      if (!param && ["RSA", "DSA", "DH"].includes(family)) {
        for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1) && !param; j++) {
          param = lines[j].match(/\b(?:initialize|key_?size|modulusLength|bits)\s*[(=:]\s*(\d{3,5})\b/i)?.[1];
        }
      }
      const key = `${i}|${family}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push(make(file, i + 1, r.id, family, param, inComment, line));
    }
  }
  // certificates: decode PEM blocks
  const certRe = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g;
  for (const m of text.matchAll(certRe)) {
    const lineNo = text.slice(0, m.index).split("\n").length;
    const info = certAlgorithms(m[1]);
    if (info.key) findings.push(make(file, lineNo, "pem.certificate", info.key, info.keyParam ? `${info.keyParam}${info.sig ? ", " + info.sig : ""}` : info.sig, false, "-----BEGIN CERTIFICATE-----"));
    if (info.sig && /md5|sha1/i.test(info.sig)) findings.push(make(file, lineNo, "pem.certificate.sig", /md5/i.test(info.sig) ? "MD5" : "SHA1", info.sig, false, "-----BEGIN CERTIFICATE-----"));
  }
  return findings;
}

function make(file: string, line: number, rule: string, family: Family, param: string | undefined, inComment: boolean, text: string): Finding {
  const info = FAMILY[family];
  let category = info.category;
  let why = info.why;
  // small key sizes are broken today, not just quantum-vulnerable
  const n = param && /^\d+$/.test(param) ? Number(param) : param?.match(/^(\d{3,5})\b/) ? Number(param.match(/^(\d{3,5})/)?.[1]) : NaN;
  if ((family === "RSA" || family === "DH" || family === "DSA") && n && n < 2048) {
    category = "BROKEN_NOW";
    why = `${n}-bit ${family} is below today's 2048-bit minimum, and quantum-vulnerable too.`;
  }
  if (family === "EC" && param && /secp256k1/i.test(param)) why += " (secp256k1 is a blockchain curve; unusual in banking systems.)";
  const priority: Finding["priority"] =
    category === "SECRET_EXPOSED" || category === "BROKEN_NOW" ? 1
      : category === "QUANTUM_VULNERABLE" ? (info.primitive === "key-agree" || info.primitive === "pke" || info.primitive === "kem" ? 2 : 3)
        : category === "REVIEW" ? 3 : 4;
  return {
    file, line, rule, family, param, category, primitive: info.primitive, in_comment: inComment,
    snippet: text.trim().slice(0, 160), why, fix: info.fix, priority: inComment ? 4 : priority,
  };
}

export interface Summary {
  files_scanned: number;
  findings: number;
  active_findings: number;
  by_category: Record<Category, number>;
  by_family: Record<string, number>;
  files_with_quantum_vulnerable: number;
  pqc_readiness: number; // share of asymmetric findings already PQC/hybrid
}

export function summarise(findings: Finding[], filesScanned: number): Summary {
  const active = findings.filter((f) => !f.in_comment);
  const by_category = { BROKEN_NOW: 0, QUANTUM_VULNERABLE: 0, REVIEW: 0, QUANTUM_SAFE: 0, PQC_READY: 0, SECRET_EXPOSED: 0 } as Record<Category, number>;
  const by_family: Record<string, number> = {};
  for (const f of active) {
    by_category[f.category]++;
    by_family[f.family] = (by_family[f.family] ?? 0) + 1;
  }
  const asym = active.filter((f) => ["pke", "signature", "key-agree", "kem"].includes(f.primitive) && f.family !== "JWT_NONE" && f.family !== "HMAC");
  const pq = asym.filter((f) => f.category === "PQC_READY").length;
  return {
    files_scanned: filesScanned,
    findings: findings.length,
    active_findings: active.length,
    by_category,
    by_family,
    files_with_quantum_vulnerable: new Set(active.filter((f) => f.category === "QUANTUM_VULNERABLE" || (f.category === "BROKEN_NOW" && ["pke", "signature", "key-agree"].includes(f.primitive))).map((f) => f.file)).size,
    pqc_readiness: asym.length ? pq / asym.length : 1,
  };
}

/** CycloneDX 1.6-style Cryptographic Bill of Materials (CBOM). */
export function toCbom(findings: Finding[], name = "scanned-codebase"): object {
  const groups = new Map<string, Finding[]>();
  for (const f of findings.filter((x) => !x.in_comment)) {
    const k = `${f.family}${f.param && f.family !== "PRIVATE_KEY" ? "-" + f.param : ""}`;
    groups.set(k, [...(groups.get(k) ?? []), f]);
  }
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    version: 1,
    metadata: { timestamp: new Date().toISOString(), tools: { components: [{ type: "application", name: "Hyniqe Hub PQC Crypto Inventory" }] }, component: { type: "application", name } },
    components: [...groups.entries()].map(([k, list], i) => {
      const f = list[0];
      const isMaterial = f.family === "PRIVATE_KEY";
      return {
        type: "cryptographic-asset",
        "bom-ref": `crypto-${i + 1}`,
        name: k,
        cryptoProperties: isMaterial
          ? { assetType: "related-crypto-material", relatedCryptoMaterialProperties: { type: "private-key" } }
          : f.primitive === "protocol"
            ? { assetType: "protocol", protocolProperties: { type: "tls", version: f.param } }
            : { assetType: "algorithm", algorithmProperties: { primitive: f.primitive, parameterSetIdentifier: f.param, nistQuantumSecurityLevel: FAMILY[f.family].nistLevel } },
        properties: [
          { name: "hyniqe:category", value: list.some((x) => x.category === "BROKEN_NOW") ? "BROKEN_NOW" : f.category },
          { name: "hyniqe:fix", value: f.fix },
        ],
        evidence: { occurrences: list.map((x) => ({ location: x.file, line: x.line })) },
      };
    }),
  };
}
