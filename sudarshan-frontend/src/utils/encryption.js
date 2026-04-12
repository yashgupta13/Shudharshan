/**
 * SUDARSHAN Encryption Utilities
 * - SHA-256 for passkey hashing
 * - Diffie-Hellman key exchange simulation (using Web Crypto API)
 * - AES-256-GCM for message encryption/decryption
 */

// ─────────────────────────────────────────────
// SHA-256 Hashing
// ─────────────────────────────────────────────

export async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─────────────────────────────────────────────
// Diffie-Hellman Key Exchange (ECDH via Web Crypto)
// Using P-384 curve for strong security
// ─────────────────────────────────────────────

export async function generateDHKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-384' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyHex = bufferToHex(publicKeyRaw);

  return {
    keyPair,          // Keep private key in memory only
    publicKeyHex,     // Share this with the other party
  };
}

export async function deriveSharedSecret(privateKey, otherPublicKeyHex) {
  const otherPublicKeyBuffer = hexToBuffer(otherPublicKeyHex);
  const otherPublicKey = await crypto.subtle.importKey(
    'raw',
    otherPublicKeyBuffer,
    { name: 'ECDH', namedCurve: 'P-384' },
    false,
    []
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: otherPublicKey },
    privateKey,
    384
  );

  // Derive AES key from shared secret using HKDF
  const sharedKeyMaterial = await crypto.subtle.importKey(
    'raw',
    sharedBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('SUDARSHAN-AES-256'),
      info: new TextEncoder().encode('chat-encryption'),
    },
    sharedKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const aesKeyRaw = await crypto.subtle.exportKey('raw', aesKey);
  return bufferToHex(aesKeyRaw);
}

// ─────────────────────────────────────────────
// AES-256-GCM Encryption / Decryption
// ─────────────────────────────────────────────

export async function encryptMessage(plaintext, aesKeyHex) {
  const key = await importAESKey(aesKeyHex);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    ciphertext: bufferToHex(ciphertext),
    iv: bufferToHex(iv),
  };
}

export async function decryptMessage(ciphertextHex, ivHex, aesKeyHex) {
  const key = await importAESKey(aesKeyHex);
  const iv = hexToBuffer(ivHex);
  const ciphertext = hexToBuffer(ciphertextHex);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// Encrypt with a room passkey hash as symmetric key (fallback when DH not complete)
export async function encryptWithPasskey(plaintext, passkeyHash) {
  // Use first 32 bytes of SHA-256 hash as AES key
  const keyBuffer = hexToBuffer(passkeyHash.slice(0, 64));
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    ciphertext: bufferToHex(ciphertext),
    iv: bufferToHex(iv),
  };
}

export async function decryptWithPasskey(ciphertextHex, ivHex, passkeyHash) {
  const keyBuffer = hexToBuffer(passkeyHash.slice(0, 64));
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const iv = hexToBuffer(ivHex);
  const ciphertext = hexToBuffer(ciphertextHex);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function importAESKey(aesKeyHex) {
  const keyBuffer = hexToBuffer(aesKeyHex);
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex) {
  const matches = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

// Generate a random room ID
export function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const random = crypto.getRandomValues(new Uint8Array(8));
  for (const byte of random) {
    result += chars[byte % chars.length];
  }
  return result.slice(0, 4) + '-' + result.slice(4);
}

// Verify passkey strength
export function validatePasskey(passkey) {
  if (passkey.length < 8) return { valid: false, msg: 'Minimum 8 characters required' };
  return { valid: true, msg: 'Passkey strength: OK' };
}
