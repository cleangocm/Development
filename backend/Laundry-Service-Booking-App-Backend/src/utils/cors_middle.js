export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  // Whitelist specific origins in production, allow all in development
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(u => u.trim().replace(/\/+$/, ''))
    : [];
  const restrictCors = ['production', 'staging'].includes(process.env.NODE_ENV);

  const isAllowed = !restrictCors
    || !origin
    || allowedOrigins.includes(origin);

  if (isAllowed) {
    res.header("Access-Control-Allow-Origin", origin || (!restrictCors ? "*" : ""));
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
};
