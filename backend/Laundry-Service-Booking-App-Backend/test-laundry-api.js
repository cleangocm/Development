// using native fetch

const BASE = "https://laundry-service-booking-app-backend.onrender.com/api/v1";

// ── colour helpers
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

const results = { pass: 0, fail: 0, skip: 0, errors: [] };

let authToken = null;
let adminToken = null;
let deliveryToken = null;
let staffToken = null;

let adminId = null;
let serviceId = null;
let storeId = null;
let orderId = null;
let couponId = null;
let reviewId = null;
let ticketId = null;

async function req(method, path, opts = {}) {
  const { body, token, expectedStatus = 200, label, skip } = opts;

  if (skip) {
    console.log(`  ${YELLOW}SKIP${RESET} ${label || path}`);
    results.skip++;
    return null;
  }

  const url = `${BASE}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let json;
    try { json = await res.json(); } catch { json = {}; }

    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const ok = expected.includes(res.status);

    const tag = ok ? `${GREEN}✓ PASS${RESET}` : `${RED}✗ FAIL${RESET}`;
    console.log(`  ${tag}  [${res.status}] ${method.padEnd(6)} ${path}${label ? `  ← ${label}` : ""}`);

    if (!ok) {
      results.fail++;
      results.errors.push({
        method, path, status: res.status, expected: expectedStatus,
        msg: JSON.stringify(json).slice(0, 400),
      });
    } else {
      results.pass++;
    }
    return json;
  } catch (err) {
    console.log(`  ${RED}✗ FAIL${RESET}  [NET] ${method} ${path} – ${err.message}`);
    results.fail++;
    results.errors.push({ method, path, status: "NET_ERR", expected: expectedStatus, msg: err.message });
    return null;
  }
}

function section(title) {
  console.log(`\n${BOLD}${CYAN}━━ ${title} ━━${RESET}`);
}

function pickId(json) {
  return (
    json?.data?._id ||
    json?.data?.id  ||
    json?._id       ||
    json?.id        ||
    (Array.isArray(json?.data) ? json.data[0]?._id : null) ||
    (Array.isArray(json)       ? json[0]?._id        : null) ||
    json?.createdData?._id ||
    null
  );
}

// Just sleep a bit to avoid rate limits
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log(`\n${BOLD}${CYAN}╔═════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║   LAUNDRY APP BACKEND – FULL API TEST SUITE   ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚═════════════════════════════════════════════╝${RESET}`);
  console.log(`  Base URL : ${BASE}`);
  console.log(`  Time     : ${new Date().toISOString()}\n`);

  // We should seed first to ensure data exists, preventing 403s on missing entities
  section("SEEDING DATABASE");
  await req("POST", "/seed/all", { label: "Run main seed", expectedStatus: [200, 201, 500] }); 
  await sleep(1000); // give it a sec

  // ── AUTH ────────────────────────────────────────────────────────────────
  section("AUTH");

  // Login as admin
  const adminLogin = await req("POST", "/auth/login", {
    body: { emailOrPhone: "admin@demo.com", password: "admin123" },
    label: "Admin Login",
    expectedStatus: [200, 201]
  });
  adminToken = adminLogin?.token || adminLogin?.data?.token || adminLogin?.accessToken || adminLogin?.data?.accessToken;
  adminId = adminLogin?.user?._id || adminLogin?.data?.user?._id || adminLogin?.data?._id;

  if (adminToken) {
    console.log(`  ${GREEN}→ Admin token obtained${RESET}`);
  } else {
    console.log(`  ${RED}→ Could not get admin token, many tests will fail or 403!${RESET}`);
  }

  // Create a normal user
  const email = `user_${Date.now()}@example.com`;
  const pass  = "Test@12345";
  await req("POST", "/auth/register", {
    body: { name: "Test User", email, phone: `+88019${Math.floor(Math.random() * 10000000)}`, password: pass, confirmPassword: pass },
    label: "Register new user",
    expectedStatus: [200, 201],
  });
  
  const userLogin = await req("POST", "/auth/login", {
    body: { emailOrPhone: email, password: pass },
    label: "User Login",
    expectedStatus: [200, 201],
  });
  authToken = userLogin?.token || userLogin?.data?.token || userLogin?.accessToken || userLogin?.data?.accessToken;

  // Let's create a staff and delivery to test their routes! (Assuming admin can create users)
  if (adminToken) {
     const staffReq = await req("POST", "/admin/users", {
        token: adminToken,
        body: { name: "Test Staff", email: `staff_${Date.now()}@example.com`, phone: `+88018${Math.floor(Math.random() * 10000000)}`, password: "password", role: "staff" },
        label: "Create Staff User",
        expectedStatus: [200, 201]
     });
     
     const delReq = await req("POST", "/admin/users", {
        token: adminToken,
        body: { name: "Test Delivery", email: `delivery_${Date.now()}@example.com`, phone: `+88017${Math.floor(Math.random() * 10000000)}`, password: "password", role: "delivery" },
        label: "Create Delivery User",
        expectedStatus: [200, 201]
     });

     // Login them
     const stLog = await req("POST", "/auth/login", { body: { emailOrPhone: staffReq?.data?.email || staffReq?.email || `staff_${Date.now()}@example.com`, password: "password" }, expectedStatus: [200, 201], label: "Staff Login" });
     const deLog = await req("POST", "/auth/login", { body: { emailOrPhone: delReq?.data?.email || delReq?.email || `delivery_${Date.now()}@example.com`, password: "password" }, expectedStatus: [200, 201], label: "Delivery Login" });
     staffToken = stLog?.token || stLog?.data?.token || stLog?.accessToken || stLog?.data?.accessToken;
     deliveryToken = deLog?.token || deLog?.data?.token || deLog?.accessToken || deLog?.data?.accessToken;
  }

  await req("GET", "/auth/profile", { token: authToken, label: "Get Profile" });
  await sleep(250);

  // ── PUBLIC ─────────────────────────────────────────────────────────────
  section("PUBLIC SETTINGS");
  await req("GET", "/public/site-settings", { label: "Public Site Settings" });
  await sleep(250);
  await req("GET", "/public/contact-settings", { label: "Contact Settings" });
  await sleep(250);

  // ── SERVICES ────────────────────────────────────────────────────────
  section("SERVICES");
  const srvList = await req("GET", "/services", { label: "Get all services" });
  serviceId = pickId(srvList);
  await sleep(250);

  if (serviceId) {
    const srvItem = srvList?.data?.find(s => s._id === serviceId) || srvList?.find(s => s._id === serviceId);
    if(srvItem?.slug) {
        await req("GET", `/services/${srvItem.slug}`, { label: "Get service by slug" });
    }
  }

  await req("GET", "/admin/services", { token: adminToken, label: "Admin Get All Services", expectedStatus: [200] });
  await sleep(250);

  // ── STORES ────────────────────────────────────────────────────────
  section("STORES");
  const storeList = await req("GET", "/stores", { label: "Get all stores" });
  storeId = pickId(storeList);
  await sleep(250);

  await req("GET", "/admin/stores", { token: adminToken, label: "Admin Get All Stores", expectedStatus: [200] });
  await sleep(250);

  // ── COUPONS ────────────────────────────────────────────────────────
  section("COUPONS");
  const coupList = await req("GET", "/admin/coupons", { token: adminToken, label: "Admin Get Coupons", expectedStatus: [200] });
  couponId = pickId(coupList);
  await sleep(250);

  // ── ORDERS ────────────────────────────────────────────────────────
  section("ORDERS");
  // Let's create an order first
  const createOrder = await req("POST", "/orders", {
    token: authToken,
    body: {
      items: serviceId ? [{ service: serviceId, quantity: 2 }] : [],
      storeId: storeId || undefined,
      pickupDate: new Date(Date.now() + 86400000).toISOString(),
      pickupTime: "Morning",
      deliveryDate: new Date(Date.now() + 172800000).toISOString(),
      deliveryTime: "Evening",
      paymentMethod: "cod",
      address: { street: "123 main", city: "NY", state: "NY", zip: "10001", isDefault: true }
    },
    label: "Create Order",
    expectedStatus: [200, 201]
  });
  orderId = pickId(createOrder);
  await sleep(250);

  await req("GET", "/orders/my-orders", { token: authToken, label: "My Orders" });
  await sleep(250);
  await req("GET", "/orders/dashboard-stats", { token: authToken, label: "My Order Stats" });
  await sleep(250);

  if (orderId) {
    await req("GET", `/orders/${orderId}`, { token: authToken, label: "Get Order By ID" });
    await sleep(250);
  }

  await req("GET", "/admin/orders", { token: adminToken, label: "Admin Orders" });
  await sleep(250);
  await req("GET", "/admin/dashboard-stats", { token: adminToken, label: "Admin Dashboard Stats" });
  await sleep(250);

  // ── REVIEWS ────────────────────────────────────────────────────────
  section("REVIEWS");
  await req("GET", "/reviews/approved", { label: "Approved Reviews" });
  await sleep(250);

  const reviewRes = await req("POST", "/reviews", {
    token: authToken,
    body: { orderId: orderId, rating: 5, comment: "Great service!" },
    label: "Create Review",
    expectedStatus: [200, 201, 400] // might fail nicely if order not completed
  });
  reviewId = pickId(reviewRes);
  await sleep(250);

  await req("GET", "/admin/reviews", { token: adminToken, label: "Admin GetAllReviews" });
  await sleep(250);

  // ── TICKETS ────────────────────────────────────────────────────────
  section("TICKETS");
  const tktRes = await req("POST", "/tickets", {
    token: authToken,
    body: { subject: "Issue with order", description: "Details here", orderId: orderId },
    label: "Create Ticket",
    expectedStatus: [200, 201]
  });
  ticketId = pickId(tktRes);
  await sleep(250);

  await req("GET", "/tickets/my-tickets", { token: authToken, label: "My Tickets" });
  await sleep(250);

  await req("GET", "/admin/tickets", { token: adminToken, label: "Admin Get Tickets" });
  await sleep(250);

  // ── ADMIN EXTRAS ────────────────────────────────────────────────────────
  section("ADMIN EXTRA READS");
  const adminEndpoints = [
    "/admin/users",
    "/admin/payments",
    "/admin/payment-gateways",
    "/admin/reports",
    "/admin/integrations",
    "/admin/settings",
    "/admin/delivery-boys",
    "/admin/staff-list"
  ];

  for (const endpoint of adminEndpoints) {
    await req("GET", endpoint, { token: adminToken, expectedStatus: [200] });
    await sleep(250);
  }

  // ── STAFF/DELIVERY ────────────────────────────────────────────────────────
  section("STAFF & DELIVERY DASHBOARDS");
  await req("GET", "/staff/dashboard-stats", { token: staffToken, label: "Staff Dashboard", expectedStatus: [200, 403] });
  await req("GET", "/delivery/dashboard-stats", { token: deliveryToken, label: "Delivery Dashboard", expectedStatus: [200, 403] });
  await sleep(250);

  // ── SUMMARY ──────────────────────────────────────────────────────────
  const total = results.pass + results.fail + results.skip;
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║           FINAL TEST RESULTS             ║${RESET}`);
  console.log(`${BOLD}${CYAN}╠══════════════════════════════════════════╣${RESET}`);
  console.log(`${BOLD}${CYAN}║${RESET}  ${GREEN}✓ PASS${RESET} : ${String(results.pass).padEnd(3)}  of ${total} checks          ${BOLD}${CYAN}║${RESET}`);
  console.log(`${BOLD}${CYAN}║${RESET}  ${RED}✗ FAIL${RESET} : ${String(results.fail).padEnd(3)}  of ${total} checks          ${BOLD}${CYAN}║${RESET}`);
  console.log(`${BOLD}${CYAN}║${RESET}  ${YELLOW}⊘ SKIP${RESET} : ${String(results.skip).padEnd(3)}  of ${total} checks          ${BOLD}${CYAN}║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════╝${RESET}`);

  if (results.errors.length) {
    console.log(`\n${BOLD}${RED}❌ FAILED REQUESTS DETAIL:${RESET}`);
    results.errors.forEach((e, i) => {
      console.log(`\n  ${i + 1}) ${e.method} ${e.path}`);
      console.log(`     Status   : ${e.status}  (expected: ${JSON.stringify(e.expected)})`);
      console.log(`     Response : ${e.msg}`);
    });
  } else {
    console.log(`\n${GREEN}${BOLD}🎉 All tests passed!${RESET}`);
  }
}

run().catch(console.error);
