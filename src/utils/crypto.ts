export const ITERATIONS = 100000;
export const HASH_ALGO = "SHA-256";
export const AES_ALGO = "AES-GCM";

export function hexToBytes(hex: string): Uint8Array {
  if (!hex) return new Uint8Array(0);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return bytesToHex(salt);
}

export async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const saltBytes = hexToBytes(saltHex);

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: ITERATIONS,
      hash: HASH_ALGO
    },
    passwordKey,
    { name: AES_ALGO, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(key: CryptoKey, plaintext: string): Promise<{ ciphertext: string, iv: string }> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBytes = await window.crypto.subtle.encrypt(
    {
      name: AES_ALGO,
      iv: iv
    },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bytesToHex(new Uint8Array(encryptedBytes)),
    iv: bytesToHex(iv)
  };
}

export async function decryptData(key: CryptoKey, ciphertextHex: string, ivHex: string): Promise<string> {
  try {
    const ciphertextBytes = hexToBytes(ciphertextHex);
    const ivBytes = hexToBytes(ivHex);

    const decryptedBytes = await window.crypto.subtle.decrypt(
      {
        name: AES_ALGO,
        iv: ivBytes
      },
      key,
      ciphertextBytes
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBytes);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Decryption failed. Incorrect password or corrupted data.");
  }
}
