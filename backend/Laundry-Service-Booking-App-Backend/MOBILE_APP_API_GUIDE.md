# Ultra Wash — Mobile App API Integration Guide

> **Base URL:** `https://laundry-service-booking-app-backend.onrender.com/api/v1`  
> **Format:** All requests and responses are JSON (`Content-Type: application/json`).  
> **Auth:** Protected routes require `Authorization: Bearer <token>` header.

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [User Profile](#2-user-profile)
3. [Services](#3-services)
4. [Cart & Checkout](#4-cart--checkout)
5. [Payment Flow (Full)](#5-payment-flow-full)
6. [Orders](#6-orders)
7. [Coupons](#7-coupons)
8. [Stores](#8-stores)
9. [Reviews](#9-reviews)
10. [Support Tickets](#10-support-tickets)
11. [Notifications](#11-notifications)
12. [Response Format](#12-response-format)

---

## 1. Authentication Flow

### 1.1 Register

```
POST /auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+8801700000000",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

**Success Response `201`:**
```json
{
  "status": "success",
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "<long-lived-opaque-token>",
  "user": {
    "id": "64abc...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+8801700000000"
  }
}
```

---

### 1.2 Login

```
POST /auth/login
```

**Body (email or phone — either works, always use `emailOrPhone` key):**
```json
{
  "emailOrPhone": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response `200`:**
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "<long-lived-opaque-token>",
  "user": {
    "id": "64abc...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+8801700000000",
    "role": "user",
    "profileImage": null
  }
}
```

> **Store both `token` and `refreshToken` securely** (e.g., Flutter `flutter_secure_storage`). Send it as `Authorization: Bearer <token>` on every protected request.

---

### 1.3 Google Sign-In

```
POST /auth/google
```

**Body:**
```json
{
  "idToken": "<Firebase Google ID Token>"
}
```

**Success Response `200`** — same shape as Login.

---

### 1.4 OTP Login (Passwordless)

```
POST /auth/send-login-otp
```
**Body:** `{ "phone": "+8801700000000" }`

```
POST /auth/verify-login-otp
```
**Body:** `{ "phone": "+8801700000000", "otp": "123456" }`  
**Response** — same as Login (returns `token`).

---

### 1.5 Forgot Password Flow

```
POST /auth/forgot-password       { "email": "john@example.com" }
POST /auth/verify-forgot-otp     { "email": "john@example.com", "otp": "123456" }
POST /auth/reset-password        { "email": "john@example.com", "otp": "123456", "newPassword": "newPass123" }
```

---

### 1.6 Refresh Token

```
POST /auth/refresh-token
Content-Type: application/json
```

**Body:**
```json
{ "refreshToken": "<refresh-token-from-login>" }
```

**Response:**
```json
{
  "status": "success",
  "message": "Token refreshed",
  "token": "<new-access-token>",
  "refreshToken": "<new-refresh-token>"
}
```

> The old refresh token is immediately invalidated (rotation). Store the new `refreshToken` and use the new `token` for subsequent requests. No `Authorization` header needed for this endpoint.

---

### 1.7 Logout

```
POST /auth/logout
Authorization: Bearer <token>
```

---

## 2. User Profile

### Get Profile
```
GET /auth/profile
Authorization: Bearer <token>
```

### Update Profile
```
PUT /auth/profile
Authorization: Bearer <token>
```
**Body (all fields optional):**
```json
{
  "name": "John Updated",
  "phone": "+8801700000001",
  "address": "123 Main St"
}
```

### Change Password
```
PUT /auth/change-password
Authorization: Bearer <token>
```
**Body:**
```json
{
  "currentPassword": "oldPass",
  "newPassword": "newPass123"
}
```

---

## 3. Services

### Get All Services (Public)
```
GET /services
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "64abc...",
      "name": "Wash & Fold",
      "slug": "wash-and-fold",
      "description": "...",
      "pricingType": "per_kg",
      "pricePerKg": 5.00,
      "isActive": true,
      "items": [
        { "name": "Shirt", "price": 2.50 },
        { "name": "Trousers", "price": 3.00 }
      ]
    }
  ]
}
```

### Get Service by Slug (Public)
```
GET /services/:slug
```

---

## 4. Cart & Checkout

Cart and checkout data are managed **client-side**. The app maintains a cart in memory / local storage and passes it to the payment and order APIs.

**Cart Item Structure (per service group):**
```json
{
  "serviceId": "64abc...",
  "serviceType": "Wash & Fold",
  "items": [
    { "name": "Shirt", "quantity": 2, "price": 2.50 },
    { "name": "Trousers", "quantity": 1, "price": 3.00 }
  ]
}
```

> The backend **always re-validates prices** from the database — never trust client-side prices for billing.

---

## 5. Payment Flow (Full)

### Step 1 — Get Enabled Payment Gateways

```
GET /payment/gateways
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "currency": "BDT",
  "currencySymbol": "\u09f3",
  "data": [
    {
      "key": "cashOnDelivery",
      "displayName": "Cash on Delivery",
      "description": "Pay when your order arrives"
    },
    {
      "key": "stripe",
      "displayName": "Credit / Debit Card",
      "description": "Secure card payment via Stripe",
      "publishableKey": "pk_live_xxxxxxxxxxxx"
    }
  ]
}
```

> `currency` and `currencySymbol` come from admin settings — always use these for display instead of hardcoding.  
> Show only the gateways in `data`. The backend controls which are active.  
> For Stripe, use `publishableKey` to initialise the Stripe SDK — **never expose or store the secret key**.

---

### Step 2 — Stripe Payment (if stripe is enabled)

#### 2a. Create Payment Intent
```
POST /payment/create-intent
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "serviceId": "64abc...",
      "itemName": "Shirt",
      "quantity": 2
    },
    {
      "serviceId": "64abc...",
      "itemName": "Trousers",
      "quantity": 1
    }
  ],
  "couponCode": "SAVE10",
  "deliveryType": "standard"
}
```

> `couponCode` is optional. `deliveryType` is `"standard"` or `"express"`.

**Success Response `200`:**
```json
{
  "status": "success",
  "data": {
    "clientSecret": "pi_3Xxx_secret_Yyy",
    "publishableKey": "pk_live_xxxxxxxxxxxx",
    "paymentIntentId": "pi_3Xxx",
    "amount": 13.50,
    "currency": "BDT",
    "currencySymbol": "\u09f3",
    "breakdown": {
      "subtotal": 11.00,
      "discount": 1.10,
      "deliveryCharge": 3.60,
      "total": 13.50,
      "coupon": "SAVE10"
    },
    "validatedItems": [
      { "serviceId": "64abc...", "serviceName": "Wash & Fold", "itemName": "Shirt", "quantity": 2, "unitPrice": 2.50, "subtotal": 5.00 }
    ]
  }
}
```

#### 2b. Confirm Payment with Stripe SDK (Flutter example)

```dart
// Add to pubspec.yaml: flutter_stripe: ^10.x.x

import 'package:flutter_stripe/flutter_stripe.dart';

// Initialise once (after fetching gateways)
Stripe.publishableKey = publishableKey;
await Stripe.instance.applySettings();

// Confirm payment
await Stripe.instance.initPaymentSheet(
  paymentSheetParameters: SetupPaymentSheetParameters(
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'Ultra Wash',
  ),
);
await Stripe.instance.presentPaymentSheet();
// If no exception → payment succeeded
```

#### 2c. Verify Payment on Backend
```
POST /payment/verify
Authorization: Bearer <token>
```

**Body:**
```json
{
  "paymentIntentId": "pi_3Xxx"
}
```

**Success Response `200`:**
```json
{
  "status": "success",
  "data": {
    "paymentIntentId": "pi_3Xxx",
    "amount": 13.50,
    "currency": "usd",
    "paymentStatus": "succeeded",
    "paymentMethodType": "card",
    "paid": true
  }
}
```

---

### Step 3 — Create Order (after payment)

```
POST /orders
Authorization: Bearer <token>
```

**Body:**
```json
{
  "items": [
    {
      "service": "64abc...",
      "serviceName": "Wash & Fold - Shirt",
      "quantity": 2,
      "price": 2.50,
      "subtotal": 5.00
    }
  ],
  "billingInfo": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+8801700000000",
    "alternativePhone": "",
    "address": "123 Main St, Dhaka",
    "additionalInstruction": "Ring doorbell"
  },
  "shippingInfo": {
    "fullName": "John Doe",
    "phone": "+8801700000000",
    "alternativePhone": "",
    "address": "123 Main St, Dhaka",
    "additionalInstruction": ""
  },
  "schedule": {
    "pickupDate": "2025-08-15",
    "pickupSlot": "10:00 AM - 12:00 PM",
    "deliveryDate": "2025-08-17",
    "deliverySlot": "02:00 PM - 04:00 PM"
  },
  "deliveryType": "standard",
  "deliverySpeedCharge": 0,
  "deliveryCharge": 3.60,
  "subtotal": 11.00,
  "discount": 1.10,
  "totalPayment": 13.50,
  "address": "123 Main St, Dhaka",
  "notes": "Ring doorbell",
  "couponCode": "SAVE10",
  "couponDiscount": 1.10,
  "paymentMethod": "stripe"
}
```

> **`paymentMethod`** values accepted by backend: `"stripe"`, `"cash"`, `"card"`, `"paypal"`, `"paystack"`  
> Use `"cash"` for Cash on Delivery.

**Success Response `201`:**
```json
{
  "status": "success",
  "message": "Order created successfully",
  "data": {
    "orderId": "ORD-20250815-XXXX",
    "_id": "64abc..."
  }
}
```

---

### Full Payment Flow Summary

```
1. GET  /payment/gateways          → show user available methods
2. If Stripe selected:
   a. POST /payment/create-intent  → get clientSecret
   b. Stripe SDK confirms payment  (client-side)
   c. POST /payment/verify         → verify on backend
3. POST /orders                    → create order with paymentMethod
```

---

## 6. Orders

### Get My Orders
```
GET /orders/my-orders
Authorization: Bearer <token>
```

**Query Params (optional):**
- `page=1&limit=10`
- `status=pending`

**Response:**
```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "_id": "64abc...",
        "orderId": "ORD-20250815-XXXX",
        "status": "confirmed",
        "totalPayment": 13.50,
        "paymentMethod": "stripe",
        "paymentStatus": "paid",
        "orderDate": "2025-08-15T10:00:00.000Z",
        "items": [],
        "trackingSteps": []
      }
    ],
    "total": 5,
    "page": 1,
    "pages": 1
  }
}
```

### Get Order by ID
```
GET /orders/:id
Authorization: Bearer <token>
```

### Cancel Order
```
PUT /orders/:id/cancel
Authorization: Bearer <token>
```

### Dashboard Stats
```
GET /orders/dashboard-stats
Authorization: Bearer <token>
```

---

## 7. Coupons

### Get Active Coupons
```
GET /coupons/active
Authorization: Bearer <token>
```

### Validate a Coupon
```
POST /coupons/validate
Authorization: Bearer <token>
```

**Body:**
```json
{
  "code": "SAVE10",
  "orderTotal": 50.00
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "code": "SAVE10",
    "discountType": "percentage",
    "discountValue": 10,
    "maxDiscount": 20,
    "minOrderValue": 20,
    "discountAmount": 5.00
  }
}
```

---

## 8. Stores

### Get All Stores (Public)
```
GET /stores
```

### Get Nearby Stores (Public)
```
GET /stores/nearby?lat=23.8103&lng=90.4125&radius=10
```

### Get Store by Slug (Public)
```
GET /stores/:slug
```

---

## 9. Reviews

### Get All Approved Reviews (Public)
```
GET /reviews/approved
```

### Get Reviews for a Store (Public)
```
GET /reviews/store/:storeId
```

### Create a Review
```
POST /reviews
Authorization: Bearer <token>
```

**Body:**
```json
{
  "orderId": "64abc...",
  "rating": 5,
  "comment": "Excellent service!"
}
```

### Get My Reviews
```
GET /reviews/my-reviews
Authorization: Bearer <token>
```

### Update My Review
```
PUT /reviews/:id
Authorization: Bearer <token>
```

### Delete My Review
```
DELETE /reviews/:id
Authorization: Bearer <token>
```

---

## 10. Support Tickets

### Create Ticket
```
POST /tickets
Authorization: Bearer <token>
```

**Body:**
```json
{
  "subject": "Order not received",
  "message": "My order ORD-20250815-XXXX hasn't arrived yet.",
  "orderId": "64abc..."
}
```

### Get My Tickets
```
GET /tickets/my-tickets
Authorization: Bearer <token>
```

### Get Ticket Detail
```
GET /tickets/:id
Authorization: Bearer <token>
```

### Add Note to Ticket
```
POST /tickets/:id/notes
Authorization: Bearer <token>
```

**Body:** `{ "message": "Still waiting for an update." }`

---

## 11. Notifications

### Get My Notifications
```
GET /notifications
Authorization: Bearer <token>
```

### Mark Notification as Read
```
PUT /notifications/:id/read
Authorization: Bearer <token>
```

---

## 12. Response Format

All responses follow this structure:

**Success:**
```json
{
  "status": "success",
  "message": "...",       // optional
  "data": { ... }         // or array
}
```

**Error:**
```json
{
  "status": "failed",
  "message": "Error description"
}
```

**HTTP Status Codes:**

| Code | Meaning               |
|------|-----------------------|
| 200  | OK                    |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 500  | Internal Server Error |

---

## Flutter Quick Reference

### HTTP Client Setup (using `dio`)

```dart
final dio = Dio(BaseOptions(
  baseUrl: 'https://laundry-service-booking-app-backend.onrender.com/api/v1',
  headers: {'Content-Type': 'application/json'},
));

// Add auth interceptor
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) {
    final token = SecureStorage.read('auth_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return handler.next(options);
  },
));
```

### Complete Stripe Payment Flow (Flutter)

```dart
// 1. Fetch enabled gateways + currency
final gwRes = await dio.get('/payment/gateways');
final gateways = gwRes.data['data'] as List;
final currency = gwRes.data['currency'] as String;       // e.g. "BDT"
final currencySymbol = gwRes.data['currencySymbol'] as String; // e.g. "৳"
final stripeGw = gateways.firstWhere((g) => g['key'] == 'stripe', orElse: () => null);

if (stripeGw != null) {
  // 2. Create payment intent
  final intentRes = await dio.post('/payment/create-intent', data: {
    'items': [
      {'serviceId': '64abc...', 'itemName': 'Shirt', 'quantity': 2},
    ],
    'couponCode': 'SAVE10',
    'deliveryType': 'standard',
  });
  final clientSecret = intentRes.data['data']['clientSecret'];
  final paymentIntentId = intentRes.data['data']['paymentIntentId'];
  // currency and symbol are also in intentRes.data['data']['currency'] / ['currencySymbol']

  // 3. Init Stripe
  Stripe.publishableKey = stripeGw['publishableKey'];
  await Stripe.instance.applySettings();

  // 4. Present payment sheet
  await Stripe.instance.initPaymentSheet(
    paymentSheetParameters: SetupPaymentSheetParameters(
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Ultra Wash',
    ),
  );
  await Stripe.instance.presentPaymentSheet();

  // 5. Verify on backend
  await dio.post('/payment/verify', data: {'paymentIntentId': paymentIntentId});

  // 6. Create order
  await dio.post('/orders', data: {
    'items': [...],
    'paymentMethod': 'stripe',
    'totalPayment': 13.50,
    // ... rest of order payload
  });
}
```

### Cash on Delivery Flow (Flutter)

```dart
// No payment intent needed — just create the order directly
await dio.post('/orders', data: {
  'items': [...],
  'paymentMethod': 'cash',
  'totalPayment': 11.00,
  // ... rest of order payload
});
```

---

## React Native Quick Reference

```js
// api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://laundry-service-booking-app-backend.onrender.com/api/v1',
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

```js
// Stripe payment (React Native)
import { initStripe, useStripe } from '@stripe/stripe-react-native';

// After fetching gateways:
await initStripe({ publishableKey: stripeGw.publishableKey });

// Create intent:
const { data } = await api.post('/payment/create-intent', { items, deliveryType });
const { clientSecret, paymentIntentId } = data.data;

// Confirm payment:
const { paymentIntent, error } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',
});

if (!error) {
  // Verify:
  await api.post('/payment/verify', { paymentIntentId });
  // Create order:
  await api.post('/orders', { ...orderPayload, paymentMethod: 'stripe' });
}
```

---

*Generated for Ultra Wash — Backend v1*
