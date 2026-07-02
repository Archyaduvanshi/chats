const crypto = require('crypto');
const env = require('../config/env');

const algorithm = 'aes-256-gcm';
const key = crypto.createHash('sha256').update(env.messageSecret).digest();

const encryptText = (plainText) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    cipherText: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
};

const decryptText = ({ cipherText, iv, tag }) => {
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherText, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

module.exports = { encryptText, decryptText };
