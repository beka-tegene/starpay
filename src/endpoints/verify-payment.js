"use strict";

function validateVerifyPaymentInput(input) {
  const errors = [];
  if (!input.orderId) {
    errors.push("Order Id is required");
  }

  return errors;
}

async function verifyPayment(httpClient, input) {
  const errors = validateVerifyPaymentInput(input);
  if (errors.length) {
    throw new Error(`Invalid verify payment input: ${errors.join(", ")}`);
  }

  const body = {
    orderId: input.orderId,
  };

  const response = await httpClient.post("/trdp/verify", body);

  return {
    data: response,
  };
}

module.exports = { verifyPayment, validateVerifyPaymentInput };
