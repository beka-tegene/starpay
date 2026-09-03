'use strict';

/**
 * Base error for all SDK-related failures.
 */
class PaymentGatewayError extends Error {
  constructor(message, { statusCode, code, details } = {}) {
    super(message);
    this.name = 'PaymentGatewayError';
    this.statusCode = statusCode || null;
    this.code = code || null;
    this.details = details || null;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** Thrown when the gateway rejects the request due to bad input (4xx, excluding auth). */
class PaymentGatewayRequestError extends PaymentGatewayError {
  constructor(message, opts) {
    super(message, opts);
    this.name = 'PaymentGatewayRequestError';
  }
}

/** Thrown on authentication/authorization failures (401/403). */
class PaymentGatewayAuthError extends PaymentGatewayError {
  constructor(message, opts) {
    super(message, opts);
    this.name = 'PaymentGatewayAuthError';
  }
}

/** Thrown on server-side failures (5xx) or after retries are exhausted. */
class PaymentGatewayServerError extends PaymentGatewayError {
  constructor(message, opts) {
    super(message, opts);
    this.name = 'PaymentGatewayServerError';
  }
}

/** Thrown when a request times out. */
class PaymentGatewayTimeoutError extends PaymentGatewayError {
  constructor(message, opts) {
    super(message, opts);
    this.name = 'PaymentGatewayTimeoutError';
  }
}

module.exports = {
  PaymentGatewayError,
  PaymentGatewayRequestError,
  PaymentGatewayAuthError,
  PaymentGatewayServerError,
  PaymentGatewayTimeoutError,
};
