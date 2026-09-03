'use strict';

const PaymentGatewayClient = require('./payment-gateway-client');
const errors = require('./errors');

module.exports = PaymentGatewayClient;
module.exports.PaymentGatewayClient = PaymentGatewayClient;
module.exports.errors = errors;