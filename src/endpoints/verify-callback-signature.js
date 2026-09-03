'use strict';

const crypto = require('crypto');

/**
 * Create an HMAC-SHA256 signature for a payload.
 * Matches the signature StarPay computes when sending a callback.
 *
 * @param {unknown} payload - The JSON payload (object, not a string).
 * @param {string} secret - Your callback/webhook secret.
 * @param {string} timestamp - Value matching the X-Timestamp header.
 * @returns {string} Hex-encoded HMAC-SHA256 signature.
 */
function createSignature(payload, secret, timestamp) {
  const body = JSON.stringify(payload);
  const message = `${timestamp}.${body}`; // timestamp included to prevent replay
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Verify an incoming callback's signature.
 *
 * @param {Object} params
 * @param {unknown} params.payload - JSON payload received (parsed object).
 * @param {string} params.timestamp - X-Timestamp header from the request.
 * @param {string} params.signature - X-Signature header from the request.
 * @param {string} params.secret - Your merchant callback secret.
 * @returns {boolean} True if the signature is valid.
 */
function verifySignature({ payload, timestamp, signature, secret }) {
  if (!payload || !timestamp || !signature || !secret) {
    throw new Error('payload, timestamp, signature, and secret are all required.');
  }

  const expectedSignature = createSignature(payload, secret, timestamp);
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length) return false;

  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

module.exports = { createSignature, verifySignature };
