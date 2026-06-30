/**
 * Helper to derive a 256-bit AES-GCM key from a conversation ID.
 * 
 * @param {string} conversationId - The unique ID of the conversation.
 * @returns {Promise<CryptoKey>} The derived cryptographic key.
 */
async function getEncryptionKey(conversationId) {
  const enc = new TextEncoder();
  const rawKey = enc.encode(conversationId);
  // Hash the conversation ID to ensure a uniform 256-bit key length
  const hash = await crypto.subtle.digest("SHA-256", rawKey);
  return crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts plaintext using AES-GCM with a key derived from the conversation ID.
 * Returns a formatted string: "e2ee:<iv_hex>:<ciphertext_hex>"
 * 
 * @param {string} plainText - The message content to encrypt.
 * @param {string} conversationId - The conversation ID to derive the key from.
 * @returns {Promise<string>} The encrypted ciphertext string.
 */
export async function encryptText(plainText, conversationId) {
  try {
    if (!plainText || !conversationId) return plainText;
    
    const key = await getEncryptionKey(conversationId);
    const enc = new TextEncoder();
    const encodedText = enc.encode(plainText);
    
    // Generate a random 12-byte IV for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedText
    );
    
    // Convert IV and ciphertext to hex strings
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
    const cipherBytes = new Uint8Array(ciphertext);
    const cipherHex = Array.from(cipherBytes).map(b => b.toString(16).padStart(2, "0")).join("");
    
    return `e2ee:${ivHex}:${cipherHex}`;
  } catch (err) {
    console.error("Client-side encryption failed:", err);
    return plainText; // Fallback to plaintext on error
  }
}

/**
 * Decrypts an encrypted ciphertext string back to plaintext.
 * Handles non-encrypted or legacy messages by returning them as-is.
 * 
 * @param {string} encryptedText - The formatted ciphertext string.
 * @param {string} conversationId - The conversation ID to derive the key from.
 * @returns {Promise<string>} The decrypted plaintext.
 */
export async function decryptText(encryptedText, conversationId) {
  try {
    if (!encryptedText || !conversationId) return encryptedText;
    if (!encryptedText.startsWith("e2ee:")) return encryptedText; // Not encrypted
    
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText;
    
    const [, ivHex, cipherHex] = parts;
    
    // Convert hex strings back to Uint8Arrays
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const cipherBytes = new Uint8Array(cipherHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const key = await getEncryptionKey(conversationId);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherBytes
    );
    
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.warn("Client-side decryption failed (legacy message or key mismatch):", err);
    return "🔒 [Encrypted Message]";
  }
}

/**
 * Encrypts a backup JSON object using a user-provided password.
 * Uses PBKDF2 for key derivation and AES-GCM for encryption.
 * 
 * @param {Object} backupObj - The backup data object.
 * @param {string} password - The password to encrypt the backup with.
 * @returns {Promise<string>} The encrypted ciphertext string.
 */
export async function encryptBackup(backupObj, password) {
  try {
    const jsonString = JSON.stringify(backupObj);
    const enc = new TextEncoder();
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    
    const aesKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      enc.encode(jsonString)
    );
    
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
    const cipherHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, "0")).join("");
    
    return `e2ee-backup:${saltHex}:${ivHex}:${cipherHex}`;
  } catch (err) {
    console.error("Backup encryption failed:", err);
    throw new Error("Failed to encrypt backup: " + err.message);
  }
}

/**
 * Decrypts an encrypted backup string using the user-provided password.
 * 
 * @param {string} encryptedString - The formatted ciphertext string.
 * @param {string} password - The password to decrypt the backup with.
 * @returns {Promise<Object>} The decrypted backup data object.
 */
export async function decryptBackup(encryptedString, password) {
  try {
    if (!encryptedString.startsWith("e2ee-backup:")) {
      throw new Error("Not a valid encrypted backup file");
    }
    
    const parts = encryptedString.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted backup format");
    }
    
    const [, saltHex, ivHex, cipherHex] = parts;
    
    const enc = new TextEncoder();
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(cipherHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    
    const aesKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      ciphertext
    );
    
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  } catch (err) {
    console.error("Backup decryption failed:", err);
    throw new Error("Decryption failed. Please check your password.");
  }
}
