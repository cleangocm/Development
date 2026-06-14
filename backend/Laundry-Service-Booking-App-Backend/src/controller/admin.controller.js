import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import multer from "multer";

import User from "../model/user.model.js";
import Order from "../model/order.model.js";
import Settings from "../model/settings.model.js";
import { escapeRegex } from "../utils/escapeRegex.js";

// ========== USER MANAGEMENT ==========

// GET /admin/users - Get all users with pagination, search, role filter
export const AdminGetAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }
    if (status === 'blocked') {
      query.isBlocked = true;
    } else if (status === 'active') {
      query.isBlocked = { $ne: true };
    }
    if (search) {
      const safe = escapeRegex(search);
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
        { phone: { $regex: safe, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get order stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orderStats = await Order.aggregate([
          { $match: { user: user._id } },
          { $group: { _id: null, totalOrders: { $sum: 1 }, totalSpent: { $sum: "$totalPayment" } } },
        ]);
        const stats = orderStats[0] || { totalOrders: 0, totalSpent: 0 };
        return {
          ...user.toObject(),
          orders: stats.totalOrders,
          totalSpent: stats.totalSpent,
        };
      })
    );

    res.status(200).json({
      status: "success",
      data: usersWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// PUT /admin/users/:id - Update user (role, block/unblock)
export const AdminUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isBlocked } = req.body;
    const update = {};
    if (role !== undefined) update.role = role;
    if (isBlocked !== undefined) update.isBlocked = isBlocked;

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ status: "fail", message: "User not found" });

    res.status(200).json({ status: "success", data: user });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// ========== PAYMENT / TRANSACTION OVERVIEW ==========

// GET /admin/payments - Get payment overview from orders
export const AdminGetPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method } = req.query;
    const query = {};
    if (status && status !== 'all') query.paymentStatus = status;
    if (method && method !== 'all') query.paymentMethod = method;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const payments = orders.map((o) => ({
      _id: o._id,
      orderId: o.orderId,
      user: o.user,
      amount: o.totalPayment,
      method: o.paymentMethod,
      status: o.paymentStatus,
      date: o.createdAt,
    }));

    // Stats
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPayment" },
          totalOrders: { $sum: 1 },
          completedPayments: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: payments,
      stats: stats[0] || { totalRevenue: 0, totalOrders: 0, completedPayments: 0, pendingPayments: 0 },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// ========== REPORTS ==========

// GET /admin/reports - Get report data
export const AdminGetReports = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Determine date range
    const now = new Date();
    let startDate;
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(0); // All time
    }

    // Revenue stats
    const revenueStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPayment" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$totalPayment" },
        },
      },
    ]);

    // Revenue by service (from items)
    const serviceRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.serviceName",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // Top customers
    const topCustomers = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$totalPayment" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          name: "$userInfo.name",
          email: "$userInfo.email",
          totalSpent: 1,
          orderCount: 1,
          avgOrder: { $divide: ["$totalSpent", "$orderCount"] },
        },
      },
    ]);

    // New customers in period
    const newCustomers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startDate },
    });

    // Order status breakdown
    const statusBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats = revenueStats[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

    res.status(200).json({
      status: "success",
      data: {
        revenue: {
          total: stats.totalRevenue,
          totalOrders: stats.totalOrders,
          avgOrderValue: stats.avgOrderValue,
        },
        serviceRevenue,
        topCustomers,
        newCustomers,
        statusBreakdown,
        period,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// ========== SETTINGS ==========

// GET /admin/settings - Get all settings
export const AdminGetSettings = async (req, res) => {
  try {
    const settings = await Settings.find({});
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    // Return with defaults if empty
    const defaults = {
      siteName: 'UltraWash',
      tagline: 'Professional Laundry Service',
      email: 'support@ultrawash.com',
      phone: '+1 234 567 8900',
      address: '123 Main Street, New York, NY 10001',
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'America/New_York',
      workingHoursStart: '08:00',
      workingHoursEnd: '20:00',
      minOrderAmount: 15,
      taxRate: 8.5,
      freeDeliveryThreshold: 50,
      deliveryFee: 5.99,
      deliveryRadius: 15,
      enableSMS: true,
      enableEmail: true,
      enablePush: true,
      enableStripe: true,
      enableCashOnDelivery: true,
      enableWallet: false,
      maintenanceMode: false,
    };

    res.status(200).json({
      status: "success",
      data: { ...defaults, ...settingsObj },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// PUT /admin/settings - Update settings
export const AdminUpdateSettings = async (req, res) => {
  try {
    const settingsToUpdate = req.body;
    const operations = Object.entries(settingsToUpdate).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { key, value } },
        upsert: true,
      },
    }));

    await Settings.bulkWrite(operations);

    // Return updated settings
    const settings = await Settings.find({});
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    res.status(200).json({
      status: "success",
      data: settingsObj,
      message: "Settings updated successfully",
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// ========== CONTACT PAGE SETTINGS (Public) ==========

// GET /public/contact-settings - Get contact page settings (no auth needed)
export const GetContactSettings = async (req, res) => {
  try {
    const Settings = (await import("../model/settings.model.js")).default;
    const setting = await Settings.findOne({ key: "contactPageData" });
    
    // Default contact page data
    const defaults = {
      heroTitle: "Get in Touch",
      heroSubtitle: "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
      contactInfo: [
        {
          type: "phone",
          title: "Phone",
          details: ["Main: (239) 555-0108", "Support: (239) 555-0109"],
          link: "tel:+12395550108",
        },
        {
          type: "email",
          title: "Email",
          details: ["info@ultrawash.com", "support@ultrawash.com"],
          link: "mailto:info@ultrawash.com",
        },
        {
          type: "address",
          title: "Address",
          details: ["2118 Thornridge Cir, Syracuse", "New York, NY 13210"],
          link: "https://maps.google.com",
        },
        {
          type: "hours",
          title: "Business Hours",
          details: ["Mon - Sat: 8:00 AM - 8:00 PM", "Sunday: 10:00 AM - 6:00 PM"],
          link: null,
        },
      ],
      locations: [
        {
          name: "Downtown Location",
          address: "2118 Thornridge Cir, Syracuse, NY",
          phone: "(239) 555-0108",
          hours: "Mon-Sat: 8AM-8PM",
        },
        {
          name: "Westside Location",
          address: "3461 Whittier Ave, Syracuse, NY",
          phone: "(239) 555-0109",
          hours: "Mon-Sat: 8AM-8PM",
        },
        {
          name: "Eastside Location",
          address: "4234 Lighthouse Ln, Syracuse, NY",
          phone: "(239) 555-0110",
          hours: "Mon-Sat: 8AM-8PM",
        },
      ],
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2915.5474545454545!2d-76.147!3d43.0481!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDPCsDAyJzUzLjIiTiA3NsKwMDgnNDkuMiJX!5e0!3m2!1sen!2sus!4v1234567890",
      faqTitle: "Need Quick Answers?",
      faqSubtitle: "Check out our FAQ page for instant answers to common questions about our services, pricing, and more.",
      faqButtonText: "Visit FAQ Section",
    };

    res.status(200).json({
      status: "success",
      data: setting ? setting.value : defaults,
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// POST /public/contact-message - Submit contact form message
export const SubmitContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ status: "fail", message: "Name, email, and message are required" });
    }

    // Store in a ContactMessage collection (create if not exists)
    const mongoose = (await import("mongoose")).default;
    
    // Define schema inline if model doesn't exist
    let ContactMessage;
    try {
      ContactMessage = mongoose.model("ContactMessage");
    } catch {
      const schema = new mongoose.Schema({
        name: String,
        email: String,
        phone: String,
        subject: String,
        message: String,
        status: { type: String, default: "unread", enum: ["unread", "read", "replied"] },
      }, { timestamps: true });
      ContactMessage = mongoose.model("ContactMessage", schema);
    }

    const msg = await ContactMessage.create({ name, email, phone, subject, message });
    
    res.status(201).json({
      status: "success",
      message: "Message sent successfully! We'll get back to you soon.",
      data: msg,
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// ========== PUBLIC SITE SETTINGS (Footer, Logo, etc.) ==========

// GET /public/site-settings - Get site settings for footer/header (no auth)
export const GetPublicSiteSettings = async (req, res) => {
  try {
    const settings = await Settings.find({});
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    // Return only public-safe fields with defaults
    const result = {
      siteName: settingsObj.siteName || 'Ultra Wash',
      tagline: settingsObj.tagline || 'Premium Laundry & Dry Cleaning',
      email: settingsObj.email || 'support@ultrawash.com',
      phone: settingsObj.phone || '+1 234 567 8900',
      address: settingsObj.address || '123 Main Street, New York, NY 10001',
      currency: settingsObj.currency || 'USD',
      currencySymbol: settingsObj.currencySymbol || '$',
      // Footer specific
      footerLogo: settingsObj.footerLogo || '',
      footerDescription: settingsObj.footerDescription || 'Your clothes deserve the best—trust Ultra Wash for professional care, eco-friendly solutions, and a spotless finish.',
      copyrightText: settingsObj.copyrightText || '© {year} Ultra Wash. All Rights Reserved.',
      facebookUrl: settingsObj.facebookUrl || '',
      twitterUrl: settingsObj.twitterUrl || '',
      instagramUrl: settingsObj.instagramUrl || '',
      linkedinUrl: settingsObj.linkedinUrl || '',
      youtubeUrl: settingsObj.youtubeUrl || '',
      playStoreUrl: settingsObj.playStoreUrl || '',
      appStoreUrl: settingsObj.appStoreUrl || '',
      // Header specific
      headerLogo: settingsObj.headerLogo || '',
      // Delivery fees (public — Flutter reads these to show user)
      deliveryFee: settingsObj.deliveryFee !== undefined ? Number(settingsObj.deliveryFee) : 5.99,
      expressDeliveryFee: settingsObj.expressDeliveryFee !== undefined ? Number(settingsObj.expressDeliveryFee) : 9.99,
      freeDeliveryThreshold: settingsObj.freeDeliveryThreshold !== undefined ? Number(settingsObj.freeDeliveryThreshold) : 50,
      // Payment settings (public)
      codEnabled: settingsObj.codEnabled !== undefined ? settingsObj.codEnabled : true,
      stripeEnabled: settingsObj.stripeEnabled !== undefined ? settingsObj.stripeEnabled : true,
      paypalEnabled: settingsObj.paypalEnabled !== undefined ? settingsObj.paypalEnabled : true,
      walletEnabled: settingsObj.walletEnabled !== undefined ? settingsObj.walletEnabled : true,
      paystackEnabled: settingsObj.paystackEnabled !== undefined ? settingsObj.paystackEnabled : true,
      // Footer quick links (dynamic)
      footerQuickLinks: settingsObj.footerQuickLinks || [],
      // Social media & app download links (dynamic)
      socialMediaLinks: settingsObj.socialMediaLinks || [],
      appDownloadLinks: settingsObj.appDownloadLinks || [],
    };

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// ========== ADMIN CREATE USER (Staff/Delivery) ==========

// POST /admin/users - Create new user (delivery boy, staff, etc.)
export const AdminCreateUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ status: "fail", message: "Name, email, and password are required" });
    }

    const validRoles = ["user", "delivery", "staff", "admin"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ status: "fail", message: "Invalid role" });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ status: "fail", message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || undefined,
      password: hashedPassword,
      role: role || "user",
      isVerified: true,
    });

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// ========== NOTIFICATIONS ==========

// Notification schema (inline)
let Notification;
try {
  Notification = mongoose.model("Notification");
} catch {
  const notifSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    role: { type: String, enum: ["admin", "user", "delivery", "staff", "all"], default: "admin" },
    type: { type: String, enum: ["order", "payment", "delivery", "system", "review", "ticket"], default: "system" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    orderId: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  }, { timestamps: true });
  notifSchema.index({ role: 1, isRead: 1, createdAt: -1 });
  notifSchema.index({ user: 1, isRead: 1, createdAt: -1 });
  Notification = mongoose.model("Notification", notifSchema);
}

// Helper to create notification
export const createNotification = async ({ user, role, type, title, message, orderId, metadata }) => {
  try {
    await Notification.create({ user, role: role || "admin", type: type || "system", title, message, orderId, metadata });
  } catch (e) {
    console.error("Failed to create notification:", e.message);
  }
};

// GET /admin/notifications - Get admin notifications
export const AdminGetNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 30, unreadOnly } = req.query;
    const query = { role: { $in: ["admin", "all"] } };
    if (unreadOnly === "true") query.isRead = false;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({ role: { $in: ["admin", "all"] }, isRead: false });

    res.status(200).json({
      status: "success",
      data: { notifications, unreadCount, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// PUT /admin/notifications/:id/read - Mark notification as read
export const AdminMarkNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "all") {
      await Notification.updateMany({ role: { $in: ["admin", "all"] }, isRead: false }, { isRead: true });
    } else {
      await Notification.findByIdAndUpdate(id, { isRead: true });
    }
    res.status(200).json({ status: "success", message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// GET /notifications - Get user notifications
export const GetUserNotifications = async (req, res) => {
  try {
    const userId = req.headers.user_id;
    const { page = 1, limit = 30 } = req.query;
    const query = { $or: [{ user: userId }, { role: "all" }] };

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

    res.status(200).json({
      status: "success",
      data: { notifications, unreadCount, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// PUT /notifications/:id/read - Mark user notification as read
export const MarkUserNotificationRead = async (req, res) => {
  try {
    const userId = req.headers.user_id;
    const { id } = req.params;
    if (id === "all") {
      await Notification.updateMany({ $or: [{ user: userId }, { role: "all" }], isRead: false }, { isRead: true });
    } else {
      await Notification.findByIdAndUpdate(id, { isRead: true });
    }
    res.status(200).json({ status: "success", message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// ========== IMGBB UPLOAD ==========


const memoryStorage = multer.memoryStorage();
const imgbbFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  cb(null, allowed.includes(file.mimetype));
};
export const imgbbUpload = multer({ storage: memoryStorage, fileFilter: imgbbFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
// POST /upload/imgbb - Upload image to ImgBB
export const UploadToImgBB = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: "fail", message: "No file uploaded" });

    // Get ImgBB API key: env var takes priority, then DB setting
    const settingsDoc = await Settings.findOne({ key: "imgbbApiKey" });
    const apiKey = process.env.IMGBB_API_KEY || settingsDoc?.value;

    if (!apiKey) {
      return res.status(500).json({ status: "fail", message: "ImgBB API key not configured" });
    }

    const base64Image = req.file.buffer.toString("base64");

    const formData = new URLSearchParams();
    formData.append("key", apiKey);
    formData.append("image", base64Image);
    formData.append("name", req.file.originalname || "upload");

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      res.status(200).json({
        status: "success",
        data: {
          url: data.data.display_url,
          deleteUrl: data.data.delete_url,
          thumbnail: data.data.thumb?.url || data.data.display_url,
        },
      });
    } else {
      res.status(400).json({ status: "fail", message: "Failed to upload to ImgBB" });
    }
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// ========== PAYMENT GATEWAY MANAGEMENT ==========

// Default gateway configurations (no secret keys stored here)
const DEFAULT_PAYMENT_GATEWAYS = {
  stripe: {
    enabled: false,
    displayName: "Credit / Debit Card",
    description: "Secure card payment via Stripe",
    publishableKey: "",
    secretKey: "",
  },
  cashOnDelivery: {
    enabled: true,
    displayName: "Cash on Delivery",
    description: "Pay when your order arrives",
  },
  paypal: {
    enabled: false,
    displayName: "PayPal",
    description: "Pay securely with PayPal",
    publishableKey: "",
    secretKey: "",
  },
  paystack: {
    enabled: false,
    displayName: "Paystack",
    description: "Cards, bank transfer, mobile money",
    publishableKey: "",
    secretKey: "",
  },
};

// Mask a secret key so only the last 4 chars are visible
const maskKey = (key) => {
  if (!key || key.length < 8) return key ? "****" : "";
  return "*".repeat(key.length - 4) + key.slice(-4);
};

// GET /admin/payment-gateways — Returns all gateway configs (secret key masked)
export const AdminGetPaymentGateways = async (req, res) => {
  try {
    const settingsDoc = await Settings.findOne({ key: "paymentGateways" });
    const stored = settingsDoc?.value || {};

    // Merge stored values with defaults
    const gateways = {};
    for (const [name, defaults] of Object.entries(DEFAULT_PAYMENT_GATEWAYS)) {
      const gw = { ...defaults, ...(stored[name] || {}) };
      // Mask secret key before sending to frontend
      if (gw.secretKey) gw.secretKey = maskKey(gw.secretKey);
      gateways[name] = gw;
    }

    res.status(200).json({ status: "success", data: gateways });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// PUT /admin/payment-gateways/:gateway — Update a specific gateway config
export const AdminUpdatePaymentGateway = async (req, res) => {
  try {
    const { gateway } = req.params;

    if (!DEFAULT_PAYMENT_GATEWAYS[gateway]) {
      return res.status(400).json({ status: "fail", message: `Unknown gateway: ${gateway}` });
    }

    // Load current stored gateways
    const settingsDoc = await Settings.findOne({ key: "paymentGateways" });
    const current = settingsDoc?.value || {};

    const existing = { ...DEFAULT_PAYMENT_GATEWAYS[gateway], ...(current[gateway] || {}) };
    const { enabled, displayName, description, publishableKey, secretKey } = req.body;

    const updated = { ...existing };
    if (enabled !== undefined) updated.enabled = !!enabled;
    if (displayName !== undefined) updated.displayName = displayName;
    if (description !== undefined) updated.description = description;
    if (publishableKey !== undefined) updated.publishableKey = publishableKey;

    // Only replace secret key if a non-masked value was sent
    if (secretKey !== undefined && !secretKey.startsWith("****") && secretKey.trim() !== "") {
      updated.secretKey = secretKey;
    }

    const newGateways = { ...current, [gateway]: updated };

    await Settings.findOneAndUpdate(
      { key: "paymentGateways" },
      { $set: { key: "paymentGateways", value: newGateways } },
      { upsert: true, new: true }
    );

    // Return masked version
    const response = { ...updated };
    if (response.secretKey) response.secretKey = maskKey(response.secretKey);

    res.status(200).json({
      status: "success",
      message: `${gateway} gateway updated successfully`,
      data: response,
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// GET /admin/payment-gateways/:gateway/secret — Reveal unmasked secret key (admin only)
export const AdminRevealGatewaySecret = async (req, res) => {
  try {
    const { gateway } = req.params;
    if (!DEFAULT_PAYMENT_GATEWAYS[gateway]) {
      return res.status(400).json({ status: "fail", message: `Unknown gateway: ${gateway}` });
    }
    const settingsDoc = await Settings.findOne({ key: "paymentGateways" });
    const stored = settingsDoc?.value || {};
    const secretKey = stored[gateway]?.secretKey || null;
    if (!secretKey) {
      return res.status(404).json({ status: "fail", message: "No secret key configured for this gateway" });
    }
    res.status(200).json({ status: "success", data: { gateway, secretKey } });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// ========== INTEGRATIONS (SMTP / TWILIO) ==========

// GET /admin/integrations — Returns SMTP and Twilio configs with secrets masked
export const AdminGetIntegrations = async (req, res) => {
  try {
    const [smtpDoc, twilioDoc] = await Promise.all([
      Settings.findOne({ key: "smtpConfig" }),
      Settings.findOne({ key: "twilioConfig" }),
    ]);

    const smtp = smtpDoc?.value || {};
    const twilio = twilioDoc?.value || {};

    const smtpPass = smtp.password || process.env.BREVO_SMTP_KEY || '';
    const twilioToken = twilio.authToken || process.env.TWILIO_AUTH_TOKEN || '';

    res.status(200).json({
      status: "success",
      data: {
        smtp: {
          host: smtp.host || process.env.SMTP_HOST || '',
          port: smtp.port || process.env.SMTP_PORT || '587',
          user: smtp.user || process.env.BREVO_SMTP_USER || '',
          password: smtpPass ? '****' + smtpPass.slice(-4) : '',
          from: smtp.from || process.env.EMAIL_FROM || '',
          hasPassword: !!smtpPass,
        },
        twilio: {
          accountSid: twilio.accountSid || process.env.TWILIO_ACCOUNT_SID || '',
          authToken: twilioToken ? '****' + twilioToken.slice(-4) : '',
          phoneNumber: twilio.phoneNumber || process.env.TWILIO_PHONE_NUMBER || '',
          hasAuthToken: !!twilioToken,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// PUT /admin/integrations/smtp — Update SMTP config
export const AdminUpdateSmtpConfig = async (req, res) => {
  try {
    const { host, port, user, password, from } = req.body;
    const existing = await Settings.findOne({ key: "smtpConfig" });
    const current = existing?.value || {};

    const newConfig = {
      host: host !== undefined ? host : current.host,
      port: port !== undefined ? port : current.port,
      user: user !== undefined ? user : current.user,
      from: from !== undefined ? from : current.from,
      // Only update password if a real (non-masked) value is sent
      password: (password && !password.startsWith('****')) ? password : current.password,
    };

    await Settings.findOneAndUpdate(
      { key: "smtpConfig" },
      { $set: { key: "smtpConfig", value: newConfig } },
      { upsert: true }
    );

    res.status(200).json({ status: "success", message: "SMTP config updated successfully" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};

// PUT /admin/integrations/twilio — Update Twilio config
export const AdminUpdateTwilioConfig = async (req, res) => {
  try {
    const { accountSid, authToken, phoneNumber } = req.body;
    const existing = await Settings.findOne({ key: "twilioConfig" });
    const current = existing?.value || {};

    const newConfig = {
      accountSid: accountSid !== undefined ? accountSid : current.accountSid,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : current.phoneNumber,
      // Only update authToken if a real (non-masked) value is sent
      authToken: (authToken && !authToken.startsWith('****')) ? authToken : current.authToken,
    };

    await Settings.findOneAndUpdate(
      { key: "twilioConfig" },
      { $set: { key: "twilioConfig", value: newConfig } },
      { upsert: true }
    );

    res.status(200).json({ status: "success", message: "Twilio config updated successfully" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: "An internal error occurred" });
  }
};
