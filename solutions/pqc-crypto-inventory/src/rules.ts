// Detection rules for cryptography in source code, configs, scripts and key/certificate material.
// Each rule names the algorithm family; classification and migration advice live in classify.ts.

export type Family =
  | "RSA" | "DSA" | "DH" | "ECDSA" | "ECDH" | "EC" | "EdDSA" | "X25519"
  | "MD5" | "SHA1" | "DES" | "3DES" | "RC4" | "RC2" | "Blowfish" | "ECB"
  | "TLS_OLD" | "SSL" | "NULL_CIPHER" | "JWT_NONE"
  | "AES128" | "AES256" | "AES" | "SHA2" | "SHA3" | "ChaCha20" | "HMAC"
  | "ML-KEM" | "ML-DSA" | "SLH-DSA" | "FN-DSA" | "HYBRID_PQ"
  | "PRIVATE_KEY";

export interface Rule {
  id: string;
  family: Family | ((m: RegExpMatchArray) => Family | undefined);
  re: RegExp;
  /** extract key size / curve / parameter from the match or the line */
  param?: (m: RegExpMatchArray, line: string) => string | undefined;
  context: "code" | "config" | "cli" | "material" | "jose" | "any";
}

const bits = (line: string): string | undefined =>
  line.match(/(?:^|\s)-b\s+(\d{3,5})\b/)?.[1] ??
  line.match(/\bgenrsa\b.*?\b(\d{3,5})\s*$/)?.[1] ??
  line.match(/\b(?:key_?size|keysize|modulus_?length|modulusLength|bits|-b|rsa:|genrsa(?:\s+-\S+)*)\s*[=:]?\s*(\d{3,5})\b/i)?.[1] ??
  line.match(/\binitialize\(\s*(\d{3,5})/)?.[1] ??
  line.match(/\bGenerateKey\([^,]+,\s*(\d{3,5})\)/)?.[1] ??
  line.match(/\bRSA(?:CryptoServiceProvider)?\s*\(\s*(\d{3,5})\s*\)/)?.[1] ??
  line.match(/\bRSA\.Create\(\s*(\d{3,5})\s*\)/)?.[1];

const curve = (line: string): string | undefined =>
  line.match(/\b(secp256r1|prime256v1|p-?256|secp384r1|p-?384|secp521r1|p-?521|secp256k1|brainpoolP\d+r1|curve25519|ed25519|ed448|x25519|x448)\b/i)?.[1];

function asymFamily(name: string): Family {
  const n = name.toLowerCase().replace(/["'`]/g, "");
  if (/^(rsa|rsassa-pss|rsa-pss)$/.test(n)) return "RSA";
  if (n === "dsa" || n === "ssh-dss" || n === "dss") return "DSA";
  if (/^(dh|diffiehellman|dhe|ffdhe)/.test(n)) return "DH";
  if (/ecdsa/.test(n)) return "ECDSA";
  if (/ecdh/.test(n)) return "ECDH";
  if (/^(ed25519|ed448|eddsa)$/.test(n)) return "EdDSA";
  if (/^(x25519|x448)$/.test(n)) return "X25519";
  return "EC";
}

function hashFamily(name: string): Family {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (n === "md5" || n === "md4" || n === "md2") return "MD5";
  if (n === "sha1" || n === "sha") return "SHA1";
  if (n.startsWith("sha3")) return "SHA3";
  return "SHA2";
}

function cipherFamily(spec: string): Family {
  const s = spec.toLowerCase();
  if (/\b(a?rc4|arcfour)\b/.test(s)) return "RC4";
  if (/\brc2\b/.test(s)) return "RC2";
  if (/(desede|des-ede3?|des3|3des|tripledes|des_ede|tdea)/.test(s)) return "3DES";
  if (/(^|[^a-z])des([^a-z]|$)|des-cbc|des-ecb/.test(s)) return "DES";
  if (/blowfish|\bbf-/.test(s)) return "Blowfish";
  if (/\becb\b|-ecb|\/ecb\//.test(s) && /aes/.test(s)) return "ECB";
  if (/chacha20/.test(s)) return "ChaCha20";
  if (/aes[-_/]?256|aes256/.test(s)) return "AES256";
  if (/aes[-_/]?128|aes128/.test(s)) return "AES128";
  if (/^rsa|\/rsa|rsa\//.test(s)) return "RSA";
  return "AES";
}

export const RULES: Rule[] = [
  // ---------- Java / Kotlin / Scala ----------
  { id: "java.keypairgen", context: "code", re: /KeyPairGenerator\.getInstance\(\s*"(RSA|RSASSA-PSS|EC|DSA|DH|DiffieHellman|Ed25519|Ed448|EdDSA|X25519|X448|XDH|ML-KEM[^"]*|ML-DSA[^"]*)"/, family: (m) => /ml-kem/i.test(m[1]) ? "ML-KEM" : /ml-dsa/i.test(m[1]) ? "ML-DSA" : m[1] === "XDH" ? "X25519" : asymFamily(m[1]), param: (_m, l) => bits(l) ?? curve(l) },
  { id: "java.keyagreement", context: "code", re: /KeyAgreement\.getInstance\(\s*"(ECDH|DH|DiffieHellman|X25519|XDH)"/, family: (m) => (m[1] === "ECDH" ? "ECDH" : m[1] === "X25519" || m[1] === "XDH" ? "X25519" : "DH") },
  { id: "java.signature", context: "code", re: /Signature\.getInstance\(\s*"(\w+?)with(RSA|ECDSA|DSA|RSA\/PSS|RSAandMGF1)"/i, family: (m) => (/ecdsa/i.test(m[2]) ? "ECDSA" : /dsa/i.test(m[2]) && !/rsa/i.test(m[2]) ? "DSA" : "RSA"), param: (m) => m[1] },
  { id: "java.signature.hash", context: "code", re: /Signature\.getInstance\(\s*"((MD5|SHA1|SHA-1)with\w+)"/i, family: (m) => hashFamily(m[2]), param: (m) => m[1] },
  { id: "java.signature.ed", context: "code", re: /Signature\.getInstance\(\s*"(Ed25519|Ed448|EdDSA|ML-DSA[^"]*)"/, family: (m) => (/ml-dsa/i.test(m[1]) ? "ML-DSA" : "EdDSA") },
  { id: "java.messagedigest", context: "code", re: /MessageDigest\.getInstance\(\s*"(MD5|MD2|SHA-?1|SHA|SHA-?256|SHA-?384|SHA-?512|SHA3-\d+)"/i, family: (m) => hashFamily(m[1]) },
  { id: "java.cipher", context: "code", re: /Cipher\.getInstance\(\s*"([^"]+)"/, family: (m) => cipherFamily(m[1]), param: (m) => m[1] },
  { id: "java.mac", context: "code", re: /Mac\.getInstance\(\s*"Hmac(MD5|SHA1|SHA256|SHA384|SHA512)"/i, family: (m) => (/md5|sha1/i.test(m[1]) ? hashFamily(m[1]) : "HMAC"), param: (m) => "Hmac" + m[1] },
  { id: "java.ecgenspec", context: "code", re: /ECGenParameterSpec\(\s*"([^"]+)"/, family: "EC", param: (m) => m[1] },

  // ---------- Python ----------
  { id: "py.asym.import", context: "code", re: /from\s+cryptography\.hazmat\.primitives\.asymmetric\s+import\s+([\w, ]+)/, family: (m) => {
      const names = m[1].split(",").map((s) => s.trim());
      return names.includes("rsa") ? "RSA" : names.includes("ec") ? "EC" : names.includes("dsa") ? "DSA" : names.includes("dh") ? "DH" : names.some((n) => n.startsWith("ed")) ? "EdDSA" : names.some((n) => n.startsWith("x")) ? "X25519" : "EC";
    } },
  { id: "py.rsa.generate", context: "code", re: /\brsa\.generate_private_key\(|\bRSA\.generate\(|\brsa\.newkeys\(/, family: "RSA", param: (_m, l) => bits(l) ?? l.match(/(?:generate|newkeys)\(\s*(\d{3,5})/)?.[1] },
  { id: "py.ec.curve", context: "code", re: /\bec\.(SECP\w+|BrainpoolP\w+)\(\)/, family: "EC", param: (m) => m[1] },
  { id: "py.ec.generate", context: "code", re: /\bec\.generate_private_key\(|\bECC\.generate\(|\bECDSA\.generate\(/, family: "EC", param: (_m, l) => curve(l) },
  { id: "py.dsa", context: "code", re: /\bdsa\.generate_private_key\(|\bDSA\.generate\(/, family: "DSA", param: (_m, l) => bits(l) },
  { id: "py.ed", context: "code", re: /\b(Ed25519|Ed448)PrivateKey\.generate\(|\bX25519PrivateKey\.generate\(/, family: (m) => (m[0].startsWith("X") ? "X25519" : "EdDSA") },
  { id: "py.hashlib", context: "code", re: /\bhashlib\.(md5|sha1|sha224|sha256|sha384|sha512|sha3_\d+)\b|hashlib\.new\(\s*["'](md5|sha1)["']/, family: (m) => hashFamily(m[1] ?? m[2]) },
  { id: "py.pycrypto.cipher", context: "code", re: /from\s+Crypto(?:dome)?\.Cipher\s+import\s+([\w, ]+)|\b(DES3|DES|ARC4|ARC2|Blowfish)\.new\(/, family: (m) => cipherFamily(m[1] ?? m[2]) },
  { id: "py.pycrypto.hash", context: "code", re: /from\s+Crypto(?:dome)?\.Hash\s+import\s+(MD5|SHA1|SHA|MD4)\b/, family: (m) => hashFamily(m[1]) },
  { id: "py.hazmat.cipher", context: "code", re: /algorithms\.(TripleDES|ARC4|Blowfish|IDEA|CAST5)\(|modes\.ECB\(/, family: (m) => (/ecb/i.test(m[0]) ? "ECB" : cipherFamily(m[1] ?? "")) },

  // ---------- Node.js / JavaScript / TypeScript ----------
  { id: "node.keypair", context: "code", re: /generateKeyPair(?:Sync)?\(\s*['"`](rsa|rsa-pss|dsa|ec|ed25519|ed448|x25519|x448|dh|ml-kem-\d+|ml-dsa-\d+)['"`]/i, family: (m) => (/ml-kem/i.test(m[1]) ? "ML-KEM" : /ml-dsa/i.test(m[1]) ? "ML-DSA" : asymFamily(m[1].replace("-pss", ""))), param: (_m, l) => bits(l) ?? curve(l) },
  { id: "node.hash", context: "code", re: /create(?:Hash|Hmac)\(\s*['"`](md5|md4|sha1|sha-1|sha256|sha384|sha512|sha3-\d+)['"`]/i, family: (m) => hashFamily(m[1]) },
  { id: "node.cipher", context: "code", re: /create(?:Cipher|Decipher)(?:iv)?\(\s*['"`]([\w-]+)['"`]/i, family: (m) => cipherFamily(m[1]), param: (m) => m[1] },
  { id: "node.ecdh", context: "code", re: /createECDH\(\s*['"`]([\w-]+)['"`]|createDiffieHellman(?:Group)?\(/, family: (m) => (m[1] ? "ECDH" : "DH"), param: (m) => m[1] },
  { id: "node.webcrypto", context: "code", re: /name:\s*['"`](RSA-OAEP|RSASSA-PKCS1-v1_5|RSA-PSS|ECDSA|ECDH|Ed25519|X25519|AES-CBC|AES-GCM|AES-CTR)['"`]/, family: (m) => (/^RSA/.test(m[1]) ? "RSA" : m[1] === "ECDSA" ? "ECDSA" : m[1] === "ECDH" ? "ECDH" : m[1] === "Ed25519" ? "EdDSA" : m[1] === "X25519" ? "X25519" : "AES"), param: (_m, l) => bits(l) ?? curve(l) },
  { id: "js.forge", context: "code", re: /forge\.pki\.rsa\.generateKeyPair\(|forge\.md\.(md5|sha1)\.create\(/, family: (m) => (m[1] ? hashFamily(m[1]) : "RSA"), param: (_m, l) => bits(l) ?? l.match(/generateKeyPair\(\s*\{?\s*(?:bits:\s*)?(\d{3,5})/)?.[1] },

  // ---------- Go ----------
  { id: "go.rsa", context: "code", re: /\brsa\.GenerateKey\(|\brsa\.(SignPKCS1v15|SignPSS|EncryptPKCS1v15|EncryptOAEP)\(/, family: "RSA", param: (_m, l) => bits(l) },
  { id: "go.ecdsa", context: "code", re: /\becdsa\.(GenerateKey|Sign|SignASN1)\(|\belliptic\.(P224|P256|P384|P521)\(\)|\becdh\.(P256|P384|P521|X25519)\(\)/, family: (m) => (/ecdh\.X25519/.test(m[0]) ? "X25519" : /ecdh\./.test(m[0]) ? "ECDH" : "ECDSA"), param: (m) => m[0].match(/P\d{3}|X25519/)?.[0] },
  { id: "go.ed25519", context: "code", re: /\bed25519\.(GenerateKey|Sign)\(/, family: "EdDSA" },
  { id: "go.hash", context: "code", re: /\b(md5|sha1)\.(New|Sum)\(/, family: (m) => hashFamily(m[1]) },
  { id: "go.des", context: "code", re: /\bdes\.(NewCipher|NewTripleDESCipher)\(|\brc4\.NewCipher\(/, family: (m) => (/rc4/.test(m[0]) ? "RC4" : /Triple/.test(m[0]) ? "3DES" : "DES") },
  { id: "go.tls", context: "code", re: /tls\.Version(SSL30|TLS10|TLS11)\b/, family: (m) => (m[1] === "SSL30" ? "SSL" : "TLS_OLD"), param: (m) => m[1] },
  { id: "go.mlkem", context: "code", re: /\bmlkem\.(GenerateKey768|GenerateKey1024|NewDecapsulationKey\w*)\(|tls\.X25519MLKEM768/, family: (m) => (/X25519MLKEM/.test(m[0]) ? "HYBRID_PQ" : "ML-KEM") },

  // ---------- .NET ----------
  { id: "dotnet.asym", context: "code", re: /\b(RSA|DSA|ECDsa|ECDiffieHellman)(CryptoServiceProvider|Cng|OpenSsl)?\.Create\(|new\s+(RSA|DSA)CryptoServiceProvider\(/, family: (m) => asymFamily((m[1] ?? m[3]) === "ECDsa" ? "ecdsa" : (m[1] ?? m[3]) === "ECDiffieHellman" ? "ecdh" : (m[1] ?? m[3])), param: (_m, l) => bits(l) },
  { id: "dotnet.hash", context: "code", re: /\b(MD5|SHA1)(CryptoServiceProvider|Managed|Cng)?\.Create\(|new\s+(MD5|SHA1)(CryptoServiceProvider|Managed)\(/, family: (m) => hashFamily(m[1] ?? m[3]) },
  { id: "dotnet.sym", context: "code", re: /\b(TripleDES|DES|RC2)(CryptoServiceProvider)?\.Create\(|new\s+(TripleDES|DES|RC2)CryptoServiceProvider\(|CipherMode\.ECB/, family: (m) => (/ECB/.test(m[0]) ? "ECB" : cipherFamily(m[1] ?? m[3])) },
  { id: "dotnet.tls", context: "code", re: /SslProtocols\.(Ssl2|Ssl3|Tls|Tls11)\b(?!\d)|SecurityProtocolType\.(Ssl3|Tls|Tls11)\b(?!\d)/, family: (m) => (/Ssl/.test(m[1] ?? m[2]) ? "SSL" : "TLS_OLD"), param: (m) => m[1] ?? m[2] },

  // ---------- CLI / shell ----------
  { id: "cli.openssl.rsa", context: "cli", re: /\bopenssl\s+(genrsa|req\b.*-newkey\s+rsa|genpkey\b.*-algorithm\s+rsa)/i, family: "RSA", param: (_m, l) => bits(l) ?? l.match(/rsa:(\d+)/i)?.[1] ?? l.match(/rsa_keygen_bits:(\d+)/i)?.[1] },
  { id: "cli.openssl.ec", context: "cli", re: /\bopenssl\s+(ecparam|genpkey\b.*-algorithm\s+(ec|ed25519|x25519))/i, family: (m) => (/ed25519/i.test(m[0]) ? "EdDSA" : /x25519/i.test(m[0]) ? "X25519" : "EC"), param: (_m, l) => curve(l) ?? l.match(/-name\s+(\S+)/)?.[1] },
  { id: "cli.openssl.dsa", context: "cli", re: /\bopenssl\s+(dsaparam|gendsa|dhparam)/i, family: (m) => (/dh/i.test(m[1]) ? "DH" : "DSA"), param: (_m, l) => l.match(/\b(\d{3,5})\b/)?.[1] },
  { id: "cli.openssl.weak", context: "cli", re: /\bopenssl\s+(?:dgst\s+-(md5|sha1)|enc\s+-(des\S*|rc4\S*|bf\S*))/i, family: (m) => (m[1] ? hashFamily(m[1]) : cipherFamily(m[2])) },
  { id: "cli.sshkeygen", context: "cli", re: /\bssh-keygen\b.*-t\s+(rsa|dsa|ecdsa|ed25519)/i, family: (m) => asymFamily(m[1]), param: (_m, l) => bits(l) },
  { id: "cli.keytool", context: "cli", re: /\bkeytool\b.*-keyalg\s+(RSA|EC|DSA)/i, family: (m) => asymFamily(m[1]), param: (_m, l) => l.match(/-keysize\s+(\d+)/)?.[1] },
  { id: "cli.md5sum", context: "cli", re: /\b(md5sum|sha1sum)\b/, family: (m) => hashFamily(m[1].replace("sum", "")) },

  // ---------- Config ----------
  { id: "cfg.tls.protocols", context: "config", re: /\b(ssl_protocols|SSLProtocol|enabled-protocols|enabledProtocols|sslEnabledProtocols|MinProtocol|tls_min_version|min_version|minimum_protocol_version|ssl-min-ver|TLSMinVersion)\b\s*[=:]?\s*(.+)/i, family: (m) => {
      // ignore protocols that are switched off: Apache "-SSLv3", OpenSSL "!TLSv1"
      const on = m[2].split(/[\s,;:"']+/).filter((t) => t && !t.startsWith("-") && !t.startsWith("!"));
      const joined = on.join(" ");
      if (/\b(SSLv2|SSLv3)\b/i.test(joined)) return "SSL";
      if (/\b(TLSv1(\.0)?|TLSv1\.1|TLS1_0|TLS1_1|TLS10|TLS11|tls1\.0|tls1\.1)\b(?!\.[23])/i.test(joined) || /^(1\.0|1\.1)$/.test(on[0] ?? "")) return "TLS_OLD";
      if (/^all$/i.test(on[0] ?? "")) return m[2].includes("-TLSv1.1") && m[2].includes("-TLSv1 ") ? undefined : "TLS_OLD";
      return undefined;
    }, param: (m) => m[2].trim().slice(0, 60) },
  { id: "cfg.ciphers", context: "config", re: /\b(ssl_ciphers|SSLCipherSuite|ciphers|cipherSuites|CipherString|tls_cipher_suites)\b\s*[=:]?\s*["']?([^"'\n;]+)/i, family: (m) => {
      const c = m[2];
      if (/(^|[:,\s])(?!!)(\w+-)*(RC4)\b/i.test(c) && !/!RC4/i.test(c)) return "RC4";
      if (/\b(DES-CBC3|3DES|DES-CBC)\b/i.test(c) && !/!3DES|!DES/i.test(c)) return "3DES";
      if (/\b(NULL|eNULL|aNULL|EXPORT|EXP)\b/.test(c) && !/!(e|a)?NULL|!EXP/.test(c)) return "NULL_CIPHER";
      if (/\bMD5\b/.test(c) && !/!MD5/.test(c)) return "MD5";
      if (/(ECDHE|DHE|RSA)/i.test(c)) return /ECDHE/i.test(c) ? "ECDH" : /DHE/i.test(c) ? "DH" : "RSA";
      return "AES";
    }, param: (m) => m[2].slice(0, 80) },
  { id: "cfg.ssh.hostkey", context: "config", re: /\b(HostKeyAlgorithms|PubkeyAcceptedKeyTypes|PubkeyAcceptedAlgorithms|KexAlgorithms)\b\s+(.+)/i, family: (m) => (/mlkem|sntrup/i.test(m[2]) ? "HYBRID_PQ" : /ssh-dss/i.test(m[2]) ? "DSA" : /ssh-rsa|rsa-sha2/i.test(m[2]) ? "RSA" : /ecdsa|ecdh/i.test(m[2]) ? "ECDSA" : /curve25519|ed25519/i.test(m[2]) ? "X25519" : "DH"), param: (m) => m[2].slice(0, 80) },
  { id: "cfg.groups", context: "config", re: /\b(ssl_ecdh_curve|Groups|Curves|ecdhCurves|named_groups|supported_groups)\b\s*[=:]?\s*["']?([\w:,-]+)/i, family: (m) => (/mlkem|kyber/i.test(m[2]) ? "HYBRID_PQ" : /x25519/i.test(m[2]) ? "X25519" : "ECDH"), param: (m) => m[2] },
  { id: "cfg.keyalg", context: "config", re: /\b(key[_-]?(algorithm|alg|type))\s*[=:]\s*["']?(RSA|EC|ECDSA|DSA|Ed25519|ML-DSA\S*|ML-KEM\S*)\b/i, family: (m) => (/ml-dsa/i.test(m[3]) ? "ML-DSA" : /ml-kem/i.test(m[3]) ? "ML-KEM" : asymFamily(m[3])), param: (_m, l) => bits(l) ?? curve(l) },

  // ---------- JOSE / JWT ----------
  { id: "jose.alg", context: "jose", re: /["']?(?:alg|algorithm|algorithms)["']?\s*[:=]\s*\[?\s*["'](RS256|RS384|RS512|PS256|PS384|PS512|ES256|ES384|ES512|EdDSA|HS256|HS384|HS512|none)["']/i, family: (m) => {
      const a = m[1].toUpperCase();
      return a === "NONE" ? "JWT_NONE" : a.startsWith("RS") || a.startsWith("PS") ? "RSA" : a.startsWith("ES") ? "ECDSA" : a === "EDDSA" ? "EdDSA" : "HMAC";
    }, param: (m) => m[1] },

  // ---------- Key & certificate material ----------
  { id: "pem.private", context: "material", re: /-----BEGIN (RSA |EC |DSA |OPENSSH |ENCRYPTED |)PRIVATE KEY-----/, family: "PRIVATE_KEY", param: (m) => (m[1].trim() || "PKCS#8") },
  { id: "ssh.pubkey", context: "material", re: /\b(ssh-rsa|ssh-dss|ecdsa-sha2-nistp(?:256|384|521)|ssh-ed25519) AAAA[0-9A-Za-z+/]/, family: (m) => (m[1] === "ssh-rsa" ? "RSA" : m[1] === "ssh-dss" ? "DSA" : m[1].startsWith("ecdsa") ? "ECDSA" : "EdDSA"), param: (m) => m[1] },

  // ---------- Post-quantum (good news) ----------
  { id: "pqc.names", context: "any", re: /\b(ML-?KEM-?(512|768|1024)|Kyber-?(512|768|1024)?|ML-?DSA-?(44|65|87)|Dilithium[235]?|SLH-?DSA[\w-]*|SPHINCS\+?[\w-]*|FN-?DSA|Falcon-?(512|1024)|X25519MLKEM768|X25519Kyber768\w*|SecP256r1MLKEM768|mlkem768x25519|sntrup761x25519)\b/i, family: (m) => {
      const s = m[0].toLowerCase();
      if (/x25519|secp256r1mlkem|sntrup/.test(s)) return "HYBRID_PQ";
      if (/kem|kyber/.test(s)) return "ML-KEM";
      if (/slh|sphincs/.test(s)) return "SLH-DSA";
      if (/falcon|fn-?dsa/.test(s)) return "FN-DSA";
      return "ML-DSA";
    }, param: (m) => m[0] },
];

/** Decode a PEM certificate body and read its public-key and signature algorithm from known OIDs. */
export function certAlgorithms(base64: string): { key?: Family; keyParam?: string; sig?: string } {
  let bytes: Uint8Array;
  try {
    const bin = atob(base64.replace(/\s+/g, ""));
    bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return {};
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const has = (oidHex: string) => hex.includes(oidHex);
  const out: { key?: Family; keyParam?: string; sig?: string } = {};
  if (has("06092a864886f70d010101")) out.key = "RSA";
  else if (has("06072a8648ce3d0201")) {
    out.key = "ECDSA";
    out.keyParam = has("06082a8648ce3d030107") ? "P-256" : has("06052b81040022") ? "P-384" : has("06052b81040023") ? "P-521" : undefined;
  } else if (has("06032b6570")) out.key = "EdDSA";
  else if (has("06072a8648ce380401")) out.key = "DSA";
  else if (/0609608648016503040311|0609608648016503040312|0609608648016503040313/.test(hex)) out.key = "ML-DSA";
  if (has("06092a864886f70d010104")) out.sig = "md5WithRSA";
  else if (has("06092a864886f70d010105")) out.sig = "sha1WithRSA";
  else if (has("06092a864886f70d01010b")) out.sig = "sha256WithRSA";
  else if (has("06092a864886f70d01010c")) out.sig = "sha384WithRSA";
  else if (has("06092a864886f70d01010d")) out.sig = "sha512WithRSA";
  else if (has("06082a8648ce3d040302")) out.sig = "ecdsa-with-SHA256";
  else if (has("06082a8648ce3d040303")) out.sig = "ecdsa-with-SHA384";
  if (out.key === "RSA") {
    // modulus length: find the BIT STRING / INTEGER of the modulus (approximate from the first large INTEGER after the OID)
    const idx = hex.indexOf("06092a864886f70d0101010500");
    const tail = idx >= 0 ? hex.slice(idx) : "";
    const m = tail.match(/02820(1|2|4)([0-9a-f]{2})/);
    if (m) {
      const len = parseInt("0" + m[1] + m[2], 16);
      const n = len - 1; // leading 00
      out.keyParam = String(Math.round((n * 8) / 1024) * 1024 || n * 8);
    } else if (/028181/.test(tail)) out.keyParam = "1024";
  }
  return out;
}
