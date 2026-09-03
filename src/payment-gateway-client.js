"use strict";

const {
  PaymentGatewayError,
  PaymentGatewayRequestError,
  PaymentGatewayAuthError,
  PaymentGatewayServerError,
  PaymentGatewayTimeoutError,
} = require("./errors");
const crypto = require("crypto");
const { createTransaction } = require("./endpoints/create-transaction");
const { verifyPayment } = require("./endpoints/verify-payment");
const { resolveConfig } = require("./config");

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

class PaymentGatewayClient {
  /**
   * @param {Object} options
   * @param {string} options.apiKey - Secret API key used for authentication.
   * @param {string} options.environment
   * @param {number} [options.timeout] - Request timeout in ms. Default 15000.
   * @param {number} [options.maxRetries] - Max retries on retryable failures. Default 2.
   * @param {Object} [options.headers] - Extra headers to send with every request.
   */
  constructor(options = {}) {
    if (!options.apiKey) {
      throw new Error("PaymentGatewayClient requires an `apiKey`.");
    }
    if (!options.environment) {
      throw new Error(
        "PaymentGatewayClient requires an `environment` sandbox | production.",
      );
    }
    const config = resolveConfig(options.environment);

    this.apiKey = options.apiKey;
    this.baseUrl = config.backendBaseUrl.replace(/\/+$/, "");
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.defaultHeaders = options.headers || {};
  }
  /**
   * Create a StarPay transaction (POST /trdp/order).
   * @param {Object} input - { amount, currency, description, customerName,
   *   customerPhoneNumber, customerEmail, items, callbackURL, redirectUrl, expiredAt, metadata }
   * @returns {Promise<Object>} { transactionId, paymentUrl, raw }
   */
  createTransaction(input) {
    const httpClient = {
      post: (path, body) => this._request("POST", path, { body }),
    };
    return createTransaction(httpClient, input);
  }

  /**
   * Create a StarPay transaction (POST /trdp/order).
   * @param {Object} input - { amount, currency, description, customerName,
   *   customerPhoneNumber, customerEmail, items, callbackURL, redirectUrl, expiredAt, metadata }
   * @returns {Promise<Object>} { transactionId, paymentUrl, raw }
   */
  verifyPayment(input) {
    const httpClient = {
      post: (path, body) => this._request("POST", path, { body }),
    };
    return verifyPayment(httpClient, input);
  }

  // ---------------------------------------------------------------------
  // Internal request handling
  // ---------------------------------------------------------------------

  async _request(method, path, { body, query, headers } = {}) {
    const url = this._buildUrl(path, query);
    const requestHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-secret": this.apiKey,
      ...this.defaultHeaders,
      ...headers,
    };

    let attempt = 0;
    let lastError;

    while (attempt <= this.maxRetries) {
      try {
        return await this._doFetch(method, url, requestHeaders, body);
      } catch (err) {
        lastError = err;
        const isRetryable =
          err instanceof PaymentGatewayTimeoutError ||
          (err.statusCode && RETRYABLE_STATUS_CODES.has(err.statusCode));

        if (!isRetryable || attempt === this.maxRetries) {
          throw err;
        }

        const backoffMs = 2 ** attempt * 250 + Math.random() * 100;
        await this._sleep(backoffMs);
        attempt += 1;
      }
    }

    throw lastError;
  }

  async _doFetch(method, url, headers, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        throw new PaymentGatewayTimeoutError(
          `Request timed out after ${this.timeout}ms`,
        );
      }
      throw new PaymentGatewayError(`Network error: ${err.message}`, {
        details: err,
      });
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      this._throwForStatus(response.status, data);
    }

    return data;
  }

  _throwForStatus(statusCode, data) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${statusCode}`;
    const opts = { statusCode, code: data?.code, details: data };

    if (statusCode === 401 || statusCode === 403) {
      throw new PaymentGatewayAuthError(message, opts);
    }
    if (statusCode >= 400 && statusCode < 500) {
      throw new PaymentGatewayRequestError(message, opts);
    }
    throw new PaymentGatewayServerError(message, opts);
  }

  _buildUrl(path, query) {
    const url = new URL(this.baseUrl + path);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  _requireId(value, name) {
    if (!value || typeof value !== "string") {
      throw new TypeError(`${name} must be a non-empty string.`);
    }
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = PaymentGatewayClient;
