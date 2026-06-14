import { CreatePaymentIntentService, VerifyPaymentService, GetPaymentGatewaysService, CreatePaypalOrderService, CapturePaypalOrderService } from "../service/payment.service.js";

/**
 * @route   GET /api/v1/payment/gateways
 * @desc    Returns the list of enabled payment gateways.
 *          For Stripe the publishableKey is included (never the secret key).
 * @access  Private
 */
export const GetPaymentGateways = async (req, res) => {
  try {
    const result = await GetPaymentGatewaysService();
    const statusCode = result.status === "success" ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "An internal error occurred" });
  }
};

/**
 * @route   POST /api/v1/payment/create-intent
 * @desc    Create a Stripe PaymentIntent with server-validated order amounts.
 *          Returns only the client_secret — the Stripe secret key never leaves the server.
 * @access  Private
 */
export const CreatePaymentIntent = async (req, res) => {
  try {
    const result = await CreatePaymentIntentService(req);
    const statusCode = result.status === "success" ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "An internal error occurred" });
  }
};

/**
 * @route   POST /api/v1/payment/verify
 * @desc    Verify that a Stripe PaymentIntent was successfully paid.
 *          Call this after the Flutter app confirms payment on the client side.
 * @access  Private
 */
export const VerifyPayment = async (req, res) => {
  try {
    const result = await VerifyPaymentService(req);
    const statusCode = result.status === "success" ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "An internal error occurred" });
  }
};

/**
 * @route   POST /api/v1/payment/paypal/create-order
 * @desc    Create a PayPal order with server-validated amounts. Returns the PayPal orderId.
 * @access  Private
 */
export const CreatePaypalOrder = async (req, res) => {
  try {
    const result = await CreatePaypalOrderService(req);
    const statusCode = result.status === "success" ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "An internal error occurred" });
  }
};

/**
 * @route   POST /api/v1/payment/paypal/capture-order
 * @desc    Capture an approved PayPal order. Returns capture details when payment is COMPLETED.
 * @access  Private
 */
export const CapturePaypalOrder = async (req, res) => {
  try {
    const result = await CapturePaypalOrderService(req);
    const statusCode = result.status === "success" ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "An internal error occurred" });
  }
};
