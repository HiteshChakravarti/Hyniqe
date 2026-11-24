# PQC Crypto Inventory

**Find every place your code and configs use cryptography, and see what quantum computers will break.**

A large enough quantum computer will break RSA, Diffie-Hellman and elliptic-curve cryptography, which together protect
most banking traffic, signatures and certificates. Attackers can record encrypted data today and decrypt it later
("harvest now, decrypt later"). NIST has published the replacement standards (ML-KEM / FIPS 203, ML-DSA / FIPS 204,
SLH-DSA / FIPS 205), and regulators and NIST guidance point firms towards inventorying and migrating their crypto
over the coming years.

The first step is always the same, and slow: **find all the crypto.** This tool scans a folder and produces:

- a readable report: what's **broken today**, what's **quantum-vulnerable**, what's already **post-quantum ready**,
  and what to move to;
- a **CBOM** (Cryptographic Bill of Materials) in CycloneDX 1.6 style, which you can feed into existing tooling;
- a CSV of every finding with file, line, algorithm, parameter, category and fix.

Runs locally. Your code never leaves your machine.

## What it detects

| Where | Examples |
| --- | --- |
| Java / Kotlin | `KeyPairGenerator`, `Signature`, `Cipher`, `MessageDigest`, `Mac`, `KeyAgreement` (incl. key size set on a later line) |
| Python | `cryptography` hazmat, `hashlib`, PyCryptodome (`DES3`, `ARC4`…), `rsa` |
| Node.js / TS | `generateKeyPair`, `createHash`, `createCipheriv`, `createECDH`, WebCrypto, node-forge |
| Go | `crypto/rsa`, `ecdsa`, `elliptic`, `md5`, `des`, `rc4`, `tls.Version*`, `mlkem`, `X25519MLKEM768` |
| .NET | `RSA.Create`, `ECDsa`, `MD5`, `SHA1`, `TripleDES`, `SslProtocols` |
| Shell | `openssl genrsa/req/ecparam/dgst/enc`, `ssh-keygen`, `keytool`, `md5sum` |
| Config | nginx/Apache/Spring TLS protocols and cipher suites (understands `-SSLv3`/`!RC4` as *disabled*), SSH `KexAlgorithms`/`HostKeyAlgorithms`, curve/group lists |
| Tokens | JWT/JOSE `alg` (RS256, ES256, `none`…) |
| Key material | PEM private keys (flagged as exposed secrets), SSH public keys, **X.509 certificates decoded** for key type, RSA size, curve and signature hash |
| Post-quantum | ML-KEM / Kyber, ML-DSA / Dilithium, SLH-DSA / SPHINCS+, Falcon, hybrid groups |

Mentions inside comments are listed separately and not counted.

## Run it

**In your browser (no install):** open [`web/index.html`](web/index.html) and click *Load sample* to try it. Everything runs locally in the page.

**From the command line** (Node 22+):

```bash
node cli.ts path/to/repo --out out/        # writes pqc-inventory.md, pqc-inventory.csv, cbom.json
node cli.ts samples/demo-repo              # try the demo
```

Exit code `1` if anything is broken today or a private key is exposed, so it can run in CI.

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

`bench/corpus.txt` has 91 lines across 8 languages and formats, including 15 look-alike negatives ("description",
"desktop", "ecosystem", `rsaKeyId`, `md5Url`). It was written before the first run.

| Run | Precision | Recall | False alarms on look-alikes |
| --- | --- | --- | --- |
| First run | 97.4% | 97.4% | 0 / 15 |
| After fixing the 2 bugs it found (`ARC4` naming; Apache `-SSLv3` read as enabled) | 100% | 100% | 0 / 15 |

The second row is no longer a blind test. Expect some misses on unusual libraries and wrapper functions in your own code.

## Limits

- Pattern scanning finds crypto in **source and config**. It won't see crypto inside compiled binaries, third-party
  libraries, HSMs, network appliances or SaaS. Ask those vendors for their post-quantum roadmaps.
- It can't tell how long the protected data must stay secret; prioritise systems protecting long-lived data.
- Not a substitute for a full cryptographic risk assessment.

Part of [Hyniqe Hub](../../README.md).
