# Day 9 - MTN and Orange Money

Day 9 is implemented locally for the trusted payment workflow.

## Implemented

- Added provider-neutral payment functions for `mtn_momo`, `orange_money`, `cash`, and `manual`.
- Added `initiatePayment` callable so customers/admins can record a provider payment attempt without marking it paid.
- Added `verifyPaymentManually` callable as the launch fallback for cash/manual or provider approval delays.
- Added `paymentProviderCallback` HTTPS endpoint for provider callbacks.
- Callback handling is idempotent: a payment already marked `paid` is not paid twice.
- Callback handling checks provider reference and amount before updating payment status.
- All trusted payment status changes write audit logs.

## Callback Security

Set `PAYMENT_CALLBACK_SECRET` before enabling live callbacks. Providers or middleware must send it in the `x-cleango-payment-secret` header. Without this secret, callbacks return `503` and do not mutate payments.

## Provider Credentials

Real MTN/Orange merchant credentials are not committed. Store them as Firebase secrets or runtime environment variables once the merchant accounts are approved.

## Launch Fallback

Until MTN/Orange approval is complete, use `manual` or `cash` payments and verify them from an admin-only path using `verifyPaymentManually`.
