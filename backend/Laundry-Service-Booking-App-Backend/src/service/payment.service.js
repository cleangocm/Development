import Stripe from "stripe";
import Service from "../model/service.model.js";
import Coupon from "../model/coupon.model.js";
import Settings from "../model/settings.model.js";

// Load Stripe gateway config from DB, fall back to env vars
const getStripeConfig = async () => {
  try {
    const settingsDoc = await Settings.findOne({ key: "paymentGateways" });
    const stripeConfig = settingsDoc?.value?.stripe;
    if (stripeConfig?.secretKey && stripeConfig.secretKey.trim() !== "") {
      return {
        secretKey: stripeConfig.secretKey,
        publishableKey: stripeConfig.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || "",
        enabled: stripeConfig.enabled !== false,
      };
    }
  } catch {
    // fall through to env vars
  }
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    enabled: true,
  };
};

const getStripe = async () => {
  const config = await getStripeConfig();
  if (!config.secretKey) throw new Error("Stripe secret key is not configured");
  return { stripe: new Stripe(config.secretKey, { apiVersion: "2023-10-16" }), config };
};

// ── Get enabled payment gateways (safe for user-facing API) ───────────────
export const GetPaymentGatewaysService = async () => {
  try {
    const settingsDoc = await Settings.findOne({ key: "paymentGateways" });
    const stored = settingsDoc?.value || {};

    const DEFAULTS = {
      stripe:         { enabled: false, displayName: "Credit / Debit Card", description: "Secure card payment via Stripe" },
      cashOnDelivery: { enabled: true,  displayName: "Cash on Delivery",   description: "Pay when your order arrives" },
      paypal:         { enabled: false, displayName: "PayPal",             description: "Pay securely with PayPal" },
      paystack:       { enabled: false, displayName: "Paystack",           description: "Cards, bank transfer, mobile money" },
    };

    const { code: currencyCode, symbol: currencySymbol } = await getCurrencySettings();

    const result = [];
    for (const [key, defaults] of Object.entries(DEFAULTS)) {
      const gw = { ...defaults, ...(stored[key] || {}) };
      if (gw.enabled) {
        const safe = { key, displayName: gw.displayName, description: gw.description };
        // Return publishableKey for gateways that need client-side initialisation
        if (key === "stripe") {
          const config = await getStripeConfig();
          safe.publishableKey = config.publishableKey;
        }
        if ((key === "paypal" || key === "paystack") && stored[key]?.publishableKey) {
          safe.publishableKey = stored[key].publishableKey;
        }
        // Signal to frontend that secretKey is also configured (without exposing it)
        if (key === "paypal" && stored[key]?.secretKey) {
          safe.hasSecretKey = true;
        }
        result.push(safe);
      }
    }

    return {
      status: "success",
      data: result,
      currency: currencyCode.toUpperCase(),
      currencySymbol,
    };
  } catch (e) {
    return { status: "failed", message: "An internal error occurred" };
  }
};

/**
 * Read the admin-configured currency from Settings.
 * Returns lowercase code for Stripe (e.g. "usd", "eur", "bdt") and the symbol.
 */
const getCurrencySettings = async () => {
  try {
    const [codeDoc, symbolDoc] = await Promise.all([
      Settings.findOne({ key: "currency" }),
      Settings.findOne({ key: "currencySymbol" }),
    ]);
    const code = (codeDoc?.value || "USD").toString().toLowerCase();
    const symbol = symbolDoc?.value || "$";
    return { code, symbol };
  } catch {
    return { code: "usd", symbol: "$" };
  }
};

/**
 * Calculate delivery charge from settings.
 * Reads deliveryFee (standard) and expressDeliveryFee (express) from Settings.
 */
const getDeliveryCharge = async (deliveryType) => {
  try {
    const key = (deliveryType === "express" || deliveryType === "fast") ? "expressDeliveryFee" : "deliveryFee";
    const settingsDoc = await Settings.findOne({ key });
    return Number(settingsDoc?.value) || 0;
  } catch {
    return 0;
  }
};

// Export so order.service.js can reuse the same server-side calculation
export { getDeliveryCharge };


export const CreatePaymentIntentService = async (req) => {
  try {
    const userId = req.headers.user_id;
    const { items, couponCode, deliveryType = "standard" } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { status: "failed", message: "Items are required" };
    }

    // ── 1. Validate every item price against the database ──────────────────
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const { serviceId, itemName, quantity } = item;

      if (!serviceId || !itemName || !quantity || quantity < 1) {
        return { status: "failed", message: "Each item must have serviceId, itemName, and quantity >= 1" };
      }

      const service = await Service.findById(serviceId);
      if (!service || !service.isActive) {
        return { status: "failed", message: `Service not found: ${serviceId}` };
      }

      // Look up the sub-item price from the database — never trust the client price
      const dbItem = service.items.find(
        (i) => i.name.toLowerCase() === itemName.toLowerCase()
      );

      let unitPrice;
      if (dbItem) {
        unitPrice = dbItem.price;
      } else if (service.pricingType === "per_kg") {
        unitPrice = service.pricePerKg;
      } else {
        unitPrice = service.pricePerItem;
      }

      const itemSubtotal = unitPrice * quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        serviceId,
        serviceName: service.name,
        itemName: dbItem ? dbItem.name : itemName,
        quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    // ── 2. Apply coupon (server-side only) ─────────────────────────────────
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gt: new Date() },
      });

      if (coupon && subtotal >= coupon.minOrderValue) {
        const withinUsageLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        let withinPerUserLimit = true;

        if (coupon.perUserLimit && userId) {
          const userUsage = coupon.usedBy?.find((u) => u.userId?.toString() === userId);
          if (userUsage && userUsage.count >= coupon.perUserLimit) {
            withinPerUserLimit = false;
          }
        }

        if (withinUsageLimit && withinPerUserLimit) {
          discount =
            coupon.discountType === "percentage"
              ? Math.min(subtotal * (coupon.discountValue / 100), coupon.maxDiscount || Infinity)
              : coupon.discountValue;
          appliedCoupon = coupon.code;
        }
      }
    }

    // ── 3. Delivery charge from server settings ────────────────────────────
    const deliveryCharge = await getDeliveryCharge(deliveryType);

    // ── 4. Final amount (always >= 1 unit for Stripe) ─────────────────────
    const totalPayment = Math.max(subtotal - discount + deliveryCharge, 0.5);

    // Stripe requires integer cents
    const amountInCents = Math.round(totalPayment * 100);

    // ── 5. Create PaymentIntent ────────────────────────────────────────────
    const { stripe, config } = await getStripe();
    const { code: currencyCode, symbol: currencySymbol } = await getCurrencySettings();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currencyCode,
      metadata: {
        userId: userId || "",
        couponCode: appliedCoupon || "",
        deliveryType,
        itemCount: validatedItems.length,
      },
      automatic_payment_methods: { enabled: true },
    });

    return {
      status: "success",
      data: {
        clientSecret: paymentIntent.client_secret,
        publishableKey: config.publishableKey,
        paymentIntentId: paymentIntent.id,
        amount: totalPayment,
        currency: currencyCode.toUpperCase(),
        currencySymbol,
        breakdown: {
          subtotal,
          discount,
          deliveryCharge,
          total: totalPayment,
          coupon: appliedCoupon || null,
        },
        validatedItems,
      },
    };
  } catch (e) {
    return { status: "failed", message: "An internal error occurred" };
  }
};

/**
 * POST /api/v1/payment/verify
 *
 * Verifies that a PaymentIntent was actually paid before an order is created.
 * Call this after Stripe confirms payment on the client side.
 */
export const VerifyPaymentService = async (req) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return { status: "failed", message: "paymentIntentId is required" };
    }

    const { stripe } = await getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return {
        status: "failed",
        message: `Payment not completed. Status: ${paymentIntent.status}`,
      };
    }

    return {
      status: "success",
      data: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentStatus: paymentIntent.status,
        paymentMethodType: paymentIntent.payment_method_types?.[0] || "card",
        paid: true,
      },
    };
  } catch (e) {
    return { status: "failed", message: "An internal error occurred" };
  }
};

// ── PayPal helpers ─────────────────────────────────────────────────────────

const getPaypalConfig = async () => {
  const settingsDoc = await Settings.findOne({ key: "paymentGateways" });
  const paypalConfig = settingsDoc?.value?.paypal;
  if (!paypalConfig?.secretKey || !paypalConfig?.publishableKey) {
    throw new Error("PayPal is not configured. Please add Client ID and Secret Key in admin → Payment settings.");
  }
  // PayPal sandbox client IDs start with "AY" typically; live start with "AZ".
  // More reliably: admin puts sandbox keys when testing.
  const isSandbox = !paypalConfig.publishableKey.startsWith("AZ");
  return {
    clientId: paypalConfig.publishableKey,   // publishableKey = PayPal Client ID
    secretKey: paypalConfig.secretKey,
    baseUrl: isSandbox
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com",
  };
};

const getPaypalAccessToken = async (config) => {
  const credentials = Buffer.from(`${config.clientId}:${config.secretKey}`).toString("base64");
  const res = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }
  const data = await res.json();
  return data.access_token;
};

export const CreatePaypalOrderService = async (req) => {
  try {
    const userId = req.headers.user_id;
    const { items, couponCode, deliveryType = "standard" } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { status: "failed", message: "Items are required" };
    }

    // ── Server-side price validation (same logic as Stripe) ─────────────
    let subtotal = 0;
    for (const item of items) {
      const { serviceId, itemName, quantity } = item;
      if (!serviceId || !itemName || !quantity || quantity < 1) {
        return { status: "failed", message: "Each item must have serviceId, itemName, and quantity >= 1" };
      }
      const service = await Service.findById(serviceId);
      if (!service || !service.isActive) {
        return { status: "failed", message: `Service not found: ${serviceId}` };
      }
      const dbItem = service.items.find((i) => i.name.toLowerCase() === itemName.toLowerCase());
      let unitPrice;
      if (dbItem) unitPrice = dbItem.price;
      else if (service.pricingType === "per_kg") unitPrice = service.pricePerKg;
      else unitPrice = service.pricePerItem;
      subtotal += unitPrice * quantity;
    }

    // ── Coupon ────────────────────────────────────────────────────────────
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gt: new Date() },
      });
      if (coupon && subtotal >= coupon.minOrderValue) {
        const withinUsageLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        let withinPerUserLimit = true;
        if (coupon.perUserLimit && userId) {
          const userUsage = coupon.usedBy?.find((u) => u.userId?.toString() === userId);
          if (userUsage && userUsage.count >= coupon.perUserLimit) withinPerUserLimit = false;
        }
        if (withinUsageLimit && withinPerUserLimit) {
          discount =
            coupon.discountType === "percentage"
              ? Math.min(subtotal * (coupon.discountValue / 100), coupon.maxDiscount || Infinity)
              : coupon.discountValue;
        }
      }
    }

    const deliveryCharge = await getDeliveryCharge(deliveryType);
    const total = Math.max(subtotal - discount + deliveryCharge, 0.01);
    const { code: currencyCode } = await getCurrencySettings();

    // ── Create PayPal order via REST API v2 ───────────────────────────────
    const config = await getPaypalConfig();
    const accessToken = await getPaypalAccessToken(config);

    const orderRes = await fetch(`${config.baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currencyCode.toUpperCase(),
              value: total.toFixed(2),
            },
            description: "UltraWash Laundry Service",
          },
        ],
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      throw new Error(`PayPal create order failed: ${err}`);
    }

    const order = await orderRes.json();

    return {
      status: "success",
      data: {
        orderId: order.id,
        amount: total,
        currency: currencyCode.toUpperCase(),
      },
    };
  } catch (e) {
    return { status: "failed", message: "An internal error occurred" };
  }
};

export const CapturePaypalOrderService = async (req) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return { status: "failed", message: "orderId is required" };
    }

    const config = await getPaypalConfig();
    const accessToken = await getPaypalAccessToken(config);

    const captureRes = await fetch(`${config.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureRes.ok) {
      const err = await captureRes.text();
      throw new Error(`PayPal capture failed: ${err}`);
    }

    const captureData = await captureRes.json();
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

    if (!capture || capture.status !== "COMPLETED") {
      return {
        status: "failed",
        message: `PayPal payment not completed. Status: ${capture?.status || "unknown"}`,
      };
    }

    return {
      status: "success",
      data: {
        paypalOrderId: orderId,
        captureId: capture.id,
        amount: parseFloat(capture.amount?.value || "0"),
        currency: capture.amount?.currency_code || "",
        paymentStatus: capture.status,
        paid: true,
      },
    };
  } catch (e) {
    return { status: "failed", message: "An internal error occurred" };
  }
};
