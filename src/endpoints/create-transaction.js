"use strict";

function validateCreateTransactionInput(input) {
  const errors = [];
  if (!input.amount || input.amount <= 0) {
    errors.push("amount must be a positive number");
  }
  if (typeof input.amount !== "number") {
     errors.push("amount must be a Number");
  }
  if (!(input.currency === "ETB" || input.currency === "USD")) {
    errors.push('currency must be "ETB" or "USD"');
  }
  if (!input.customerName) errors.push("Customer Name is required");
  if (!input.customerPhoneNumber) {
    errors.push("Customer Phone Number is required");
  } else if (!input.customerPhoneNumber.startsWith("+251")) {
    errors.push("Customer Phone Number must start with +251");
  }

  return errors;
}

async function createTransaction(httpClient, input) {
  const errors = validateCreateTransactionInput(input);
  if (errors.length) {
    throw new Error(`Invalid Create Transaction input: ${errors.join(", ")}`);
  }

  const body = {
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    customerName: input.customerName,
    customerPhoneNumber: input.customerPhoneNumber,
    customerEmail: input.customerEmail,
    items: input.items,
    callbackURL: input.callbackURL,
    redirectUrl: input.redirectUrl,
    expiredAt: input.expiredAt,
    metadata: input.metadata,
  };

  const response = await httpClient.post("/trdp/order", body);

  return {
    data: response,
  };
}

module.exports = { createTransaction, validateCreateTransactionInput };
