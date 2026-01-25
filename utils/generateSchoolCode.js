const crypto = require('crypto');
const School = require('../models/School');

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const LENGTH = 8;

function generateRandomCode() {
  let code = '';
  const bytes = crypto.randomBytes(LENGTH);
  for (let i = 0; i < LENGTH; i++) {
    code += CHARS[bytes[i] % CHARS.length];
  }
  return code;
}

async function generateSchoolCode() {
  let code;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 20;

  while (exists && attempts < maxAttempts) {
    code = generateRandomCode();
    const found = await School.findOne({ schoolCode: code });
    exists = !!found;
    attempts++;
  }

  if (exists) {
    throw new Error('Unable to generate unique school code. Please try again.');
  }

  return code;
}

module.exports = generateSchoolCode;
