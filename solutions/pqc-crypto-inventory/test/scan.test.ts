import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scanText, summarise, toCbom } from "../src/scan.ts";
import { toMarkdown, toResultCsv } from "../src/report.ts";

const fam = (t: string) => scanText("f", t).filter((f) => !f.in_comment).map((f) => f.family);
const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");

test("RSA key size on a later line is picked up and <2048 is broken today", () => {
  const f = scanText("A.java", 'KeyPairGenerator k = KeyPairGenerator.getInstance("RSA");\nk.initialize(1024);');
  assert.equal(f[0].param, "1024");
  assert.equal(f[0].category, "BROKEN_NOW");
  assert.equal(f[0].priority, 1);
});

test("RSA 2048+ is quantum-vulnerable, not broken", () => {
  const f = scanText("x.sh", "openssl genrsa -out k.pem 3072");
  assert.equal(f[0].param, "3072");
  assert.equal(f[0].category, "QUANTUM_VULNERABLE");
});

test("certificates are decoded: key type, size and signature hash", () => {
  const rsa = scanText("gw.crt", read("../samples/demo-repo/certs/legacy-gateway.crt"));
  assert.ok(rsa.some((f) => f.family === "RSA" && f.param?.startsWith("2048")));
  assert.ok(rsa.some((f) => f.family === "SHA1" && f.category === "BROKEN_NOW"));
  const ec = scanText("api.crt", read("../samples/demo-repo/certs/api.crt"));
  assert.ok(ec.some((f) => f.family === "ECDSA" && f.param?.includes("P-256")));
});

test("comments are recorded but not counted; PEM headers are not comments", () => {
  const f = scanText("a.py", "# old code used hashlib.md5(x)\nh = hashlib.sha256(x)");
  assert.equal(f.find((x) => x.family === "MD5")?.in_comment, true);
  assert.deepEqual(fam("-----BEGIN EC PRIVATE KEY-----"), ["PRIVATE_KEY"]);
});

test("disabled protocols are ignored", () => {
  assert.deepEqual(fam("SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1"), []);
  assert.deepEqual(fam("ssl_protocols TLSv1.2 TLSv1.3;"), []);
  assert.deepEqual(fam("ssl_protocols TLSv1 TLSv1.2;"), ["TLS_OLD"]);
});

test("post-quantum and hybrid are recognised", () => {
  assert.deepEqual(fam("CurvePreferences: []tls.CurveID{tls.X25519MLKEM768}"), ["HYBRID_PQ"]);
  assert.ok(fam("crypto.generateKeyPairSync('ml-kem-768')").includes("ML-KEM"));
});

test("look-alike words don't trigger", () => {
  for (const l of ["const description = 'desktop'", "ecosystem.init()", "const rsaKeyId = 1", "let md5Url = '/x'"]) assert.deepEqual(fam(l), [], l);
});

test("summary, CBOM and reports", () => {
  const f = [
    ...scanText("a.js", "crypto.createHash('md5')\ncrypto.generateKeyPairSync('rsa', { modulusLength: 2048 })\ncrypto.generateKeyPairSync('ml-kem-768')"),
  ];
  const s = summarise(f, 1);
  assert.equal(s.by_category.BROKEN_NOW, 1);
  assert.equal(s.by_category.QUANTUM_VULNERABLE, 1);
  assert.equal(s.pqc_readiness, 0.5);
  const cbom = toCbom(f) as { bomFormat: string; components: { type: string; cryptoProperties: { assetType: string } }[] };
  assert.equal(cbom.bomFormat, "CycloneDX");
  assert.ok(cbom.components.every((c) => c.type === "cryptographic-asset"));
  assert.match(toMarkdown(f, s), /Broken today/);
  assert.match(toResultCsv(f), /^file,line,category/);
});
