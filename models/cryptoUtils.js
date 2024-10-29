const crypto = require("crypto");

// Set your algorithm and key (consider storing the key securely)
const algorithm = "aes-256-cbc";
const secretKey = crypto.randomBytes(32); // Generate a secure random key
// For production, you should use a consistent key stored in environment variables.
// const secretKey = process.env.SECRET_KEY;

const iv = crypto.randomBytes(16); // Generate a secure random IV

// Function to encrypt text
function encrypt(text) {
  const iv = crypto.randomBytes(16); // Generate a new IV for each encryption
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted; // Combine IV and encrypted text
}

// Function to decrypt text
function decrypt(text) {
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey),
    iv
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encrypt, decrypt };
