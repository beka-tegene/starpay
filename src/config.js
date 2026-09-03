"use strict";

const SANDBOX_BACKEND_BASE_URL =
  "https://sandbox-api.starpayethiopia.com/v1/starpay-api/";
const PROD_BACKEND_BASE_URL = "https://api.starpayethiopia.com/v1/starpay-api/";

/**
 * Resolve which set of URLs to use.
 *
 * Priority:
 *   1. Explicit `environment` argument passed to the client constructor
 *   2. STARPAY_ENV environment variable
 *   3. Defaults to 'sandbox' (safer default — avoids accidentally hitting prod)
 *
 * @param {string} [environment] - 'sandbox' | 'production'
 * @returns {{ environment: string, backendBaseUrl: string, frontendBaseUrl: string }}
 */
function resolveConfig(environment) {
  const env = (environment).toLowerCase();

  if (env !== "sandbox" && env !== "production") {
    throw new Error(
      `Invalid environment "${env}". Expected "sandbox" or "production".`,
    );
  }

  const backendBaseUrl =
    env === "production" ? PROD_BACKEND_BASE_URL : SANDBOX_BACKEND_BASE_URL;
  return {
    environment: env,
    backendBaseUrl: backendBaseUrl.replace(/\/+$/, ""),
  };
}

module.exports = {
  SANDBOX_BACKEND_BASE_URL,
  PROD_BACKEND_BASE_URL,
  resolveConfig,
};
