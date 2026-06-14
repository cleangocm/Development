import Service from "../model/service.model.js";
import Store from "../model/store.model.js";
import mongoose from "mongoose";

export const CheckConnection = async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting"
    };
    
    const mongoUrl = process.env.MONGODB_URI;
    const urlPreview = mongoUrl ? `${mongoUrl.substring(0, 30)}...` : "NOT_SET";
    
    // If not connected, try to reconnect
    if (state !== 1 && mongoUrl) {
      try {
        await mongoose.connect(mongoUrl, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 5000,
        });
      } catch (connectError) {
        return res.status(503).json({
          status: "failed",
          message: "Failed to connect to MongoDB",
          error: connectError.message,
          mongoUrlSet: !!mongoUrl,
          mongoUrlPreview: urlPreview,
          envCheck: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            MONGODB_URI: process.env.MONGODB_URI ? "SET" : "NOT_SET"
          }
        });
      }
    }
    
    return res.status(200).json({
      status: "success",
      data: {
        connectionState: states[state],
        dbName: mongoose.connection.db?.databaseName || "none",
        connected: state === 1,
        mongoUrlSet: !!mongoUrl,
        mongoUrlPreview: urlPreview,
        envCheck: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          MONGODB_URI: process.env.MONGODB_URI ? "SET" : "NOT_SET"
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: error.message
    });
  }
};

export const SeedServices = async (req, res) => {
  try {
    // First check connection status
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: "failed",
        message: "Database connection not established. Try /api/v1/seed/check-connection first",
        connectionState: mongoose.connection.readyState
      });
    }

    const existingCount = await Service.countDocuments();
    if (existingCount > 0) {
      return res.status(200).json({
        status: "success",
        message: `Database already has ${existingCount} services. Skipping seed.`,
        data: { count: existingCount }
      });
    }

    const servicesData = [
      { name: 'Wash & Fold', slug: 'wash-and-fold', description: 'Professional wash and fold service for everyday clothes', shortDescription: 'Everyday laundry made easy', category: 'washing', pricingType: 'per_kg', pricePerKg: 60, estimatedDays: 2, features: ['Sorted by color', 'Cold/warm wash', 'Folded neatly'], isActive: true, sortOrder: 1 },
      { name: 'Wash & Iron', slug: 'wash-and-iron', description: 'Complete wash with professional ironing and pressing', shortDescription: 'Crisp and clean clothes', category: 'washing', pricingType: 'per_kg', pricePerKg: 80, estimatedDays: 2, features: ['Machine wash', 'Steam iron', 'Hung on hangers'], isActive: true, sortOrder: 2 },
      { name: 'Dry Cleaning', slug: 'dry-cleaning', description: 'Premium dry cleaning for delicate and formal wear', shortDescription: 'For delicate fabrics', category: 'dry_cleaning', pricingType: 'per_item', pricePerItem: 250, estimatedDays: 3, features: ['Chemical-free solvents', 'Spot treatment', 'Protective packaging'], isActive: true, sortOrder: 3 },
      { name: 'Ironing Only', slug: 'ironing-only', description: 'Professional ironing and pressing service', shortDescription: 'Wrinkle-free guaranteed', category: 'ironing', pricingType: 'per_item', pricePerItem: 30, estimatedDays: 1, features: ['Steam pressing', 'Collar & cuff attention', 'Crease lines'], isActive: true, sortOrder: 4 },
      { name: 'Premium Laundry', slug: 'premium-laundry', description: 'Premium care for high-end garments with special treatment', shortDescription: 'Luxury fabric care', category: 'premium', pricingType: 'per_item', pricePerItem: 400, estimatedDays: 3, features: ['Hand wash option', 'Premium detergent', 'Individual packaging'], isActive: true, sortOrder: 5 },
      { name: 'Curtain Cleaning', slug: 'curtain-cleaning', description: 'Deep cleaning service for curtains and drapes', shortDescription: 'Freshen up your home', category: 'specialty', pricingType: 'per_item', pricePerItem: 300, estimatedDays: 4, features: ['Dust removal', 'Stain treatment', 'Re-hanging available'], isActive: true, sortOrder: 6 },
      { name: 'Shoe Cleaning', slug: 'shoe-cleaning', description: 'Professional shoe cleaning and restoration', shortDescription: 'Restore your footwear', category: 'specialty', pricingType: 'per_item', pricePerItem: 200, estimatedDays: 2, features: ['Deep clean', 'Deodorizing', 'Polish & shine'], isActive: true, sortOrder: 7 },
      { name: 'Bedding & Linen', slug: 'bedding-and-linen', description: 'Thorough cleaning for bedsheets, blankets, and comforters', shortDescription: 'Fresh bed every night', category: 'washing', pricingType: 'per_item', pricePerItem: 150, estimatedDays: 3, features: ['Sanitized wash', 'Fabric softener', 'Anti-allergen treatment'], isActive: true, sortOrder: 8 },
    ];

    const createdServices = await Service.insertMany(servicesData);
    
    return res.status(201).json({
      status: "success",
      message: `Successfully seeded ${createdServices.length} services`,
      data: { count: createdServices.length }
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: error.message
    });
  }
};

export const SeedStores = async (req, res) => {
  try {
    const existingCount = await Store.countDocuments();
    if (existingCount > 0) {
      return res.status(200).json({
        status: "success",
        message: `Database already has ${existingCount} stores. Skipping seed.`,
        data: { count: existingCount }
      });
    }

    const storesData = [
      {
        name: 'UltraWash Gulshan', slug: 'ultrawash-gulshan',
        description: 'Premium laundry service in the heart of Gulshan',
        address: 'House 45, Road 103, Gulshan 2', area: 'Gulshan', city: 'Dhaka',
        latitude: 23.7925, longitude: 90.4078, phone: '+8801700000001', email: 'gulshan@ultrawash.com',
        features: ['Free Pickup', 'Express Delivery', 'Dry Cleaning', '24/7 Support'],
        isFeatured: true, sortOrder: 1,
      },
      {
        name: 'UltraWash Dhanmondi', slug: 'ultrawash-dhanmondi',
        description: 'Your trusted laundry partner in Dhanmondi',
        address: 'House 12, Road 27, Dhanmondi', area: 'Dhanmondi', city: 'Dhaka',
        latitude: 23.7465, longitude: 90.3762, phone: '+8801700000002', email: 'dhanmondi@ultrawash.com',
        features: ['Free Pickup', 'Same Day Delivery', 'Eco-Friendly'],
        isFeatured: true, sortOrder: 2,
      },
      {
        name: 'UltraWash Banani', slug: 'ultrawash-banani',
        description: 'Quick and quality laundry in Banani area',
        address: 'House 78, Road 11, Banani', area: 'Banani', city: 'Dhaka',
        latitude: 23.7937, longitude: 90.4033, phone: '+8801700000003', email: 'banani@ultrawash.com',
        features: ['Free Pickup', 'Express Delivery', 'Premium Care'],
        isFeatured: false, sortOrder: 3,
      },
      {
        name: 'UltraWash Uttara', slug: 'ultrawash-uttara',
        description: 'Convenient laundry service in Uttara',
        address: 'House 5, Sector 7, Uttara', area: 'Uttara', city: 'Dhaka',
        latitude: 23.8759, longitude: 90.3795, phone: '+8801700000004', email: 'uttara@ultrawash.com',
        features: ['Free Pickup', 'Bulk Discount', 'Student Discount'],
        isFeatured: false, sortOrder: 4,
      },
      {
        name: 'UltraWash Mirpur', slug: 'ultrawash-mirpur',
        description: 'Affordable laundry solutions in Mirpur',
        address: 'Plot 10, Section 10, Mirpur', area: 'Mirpur', city: 'Dhaka',
        latitude: 23.8223, longitude: 90.3654, phone: '+8801700000005', email: 'mirpur@ultrawash.com',
        features: ['Free Pickup', 'Budget Friendly', 'Fast Turnaround'],
        isFeatured: false, sortOrder: 5,
      },
      {
        name: 'UltraWash Mohammadpur', slug: 'ultrawash-mohammadpur',
        description: 'Professional laundry in Mohammadpur',
        address: 'House 22, Tajmahal Road, Mohammadpur', area: 'Mohammadpur', city: 'Dhaka',
        latitude: 23.7662, longitude: 90.3588, phone: '+8801700000006', email: 'mohammadpur@ultrawash.com',
        features: ['Free Pickup', 'Family Package', 'Monthly Plans'],
        isFeatured: false, sortOrder: 6,
      },
    ];

    const createdStores = await Store.insertMany(storesData);
    
    return res.status(201).json({
      status: "success",
      message: `Successfully seeded ${createdStores.length} stores`,
      data: { count: createdStores.length }
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: error.message
    });
  }
};

export const SeedAll = async (req, res) => {
  try {
    const servicesCount = await Service.countDocuments();
    const storesCount = await Store.countDocuments();

    const results = {
      services: { existed: servicesCount > 0, count: servicesCount },
      stores: { existed: storesCount > 0, count: storesCount }
    };

    // Seed services if empty
    if (servicesCount === 0) {
      const servicesData = [
        { name: 'Wash & Fold', slug: 'wash-and-fold', description: 'Professional wash and fold service for everyday clothes', shortDescription: 'Everyday laundry made easy', category: 'washing', pricingType: 'per_kg', pricePerKg: 60, estimatedDays: 2, features: ['Sorted by color', 'Cold/warm wash', 'Folded neatly'], isActive: true, sortOrder: 1 },
        { name: 'Wash & Iron', slug: 'wash-and-iron', description: 'Complete wash with professional ironing and pressing', shortDescription: 'Crisp and clean clothes', category: 'washing', pricingType: 'per_kg', pricePerKg: 80, estimatedDays: 2, features: ['Machine wash', 'Steam iron', 'Hung on hangers'], isActive: true, sortOrder: 2 },
        { name: 'Dry Cleaning', slug: 'dry-cleaning', description: 'Premium dry cleaning for delicate and formal wear', shortDescription: 'For delicate fabrics', category: 'dry_cleaning', pricingType: 'per_item', pricePerItem: 250, estimatedDays: 3, features: ['Chemical-free solvents', 'Spot treatment', 'Protective packaging'], isActive: true, sortOrder: 3 },
        { name: 'Ironing Only', slug: 'ironing-only', description: 'Professional ironing and pressing service', shortDescription: 'Wrinkle-free guaranteed', category: 'ironing', pricingType: 'per_item', pricePerItem: 30, estimatedDays: 1, features: ['Steam pressing', 'Collar & cuff attention', 'Crease lines'], isActive: true, sortOrder: 4 },
        { name: 'Premium Laundry', slug: 'premium-laundry', description: 'Premium care for high-end garments with special treatment', shortDescription: 'Luxury fabric care', category: 'premium', pricingType: 'per_item', pricePerItem: 400, estimatedDays: 3, features: ['Hand wash option', 'Premium detergent', 'Individual packaging'], isActive: true, sortOrder: 5 },
        { name: 'Curtain Cleaning', slug: 'curtain-cleaning', description: 'Deep cleaning service for curtains and drapes', shortDescription: 'Freshen up your home', category: 'specialty', pricingType: 'per_item', pricePerItem: 300, estimatedDays: 4, features: ['Dust removal', 'Stain treatment', 'Re-hanging available'], isActive: true, sortOrder: 6 },
        { name: 'Shoe Cleaning', slug: 'shoe-cleaning', description: 'Professional shoe cleaning and restoration', shortDescription: 'Restore your footwear', category: 'specialty', pricingType: 'per_item', pricePerItem: 200, estimatedDays: 2, features: ['Deep clean', 'Deodorizing', 'Polish & shine'], isActive: true, sortOrder: 7 },
        { name: 'Bedding & Linen', slug: 'bedding-and-linen', description: 'Thorough cleaning for bedsheets, blankets, and comforters', shortDescription: 'Fresh bed every night', category: 'washing', pricingType: 'per_item', pricePerItem: 150, estimatedDays: 3, features: ['Sanitized wash', 'Fabric softener', 'Anti-allergen treatment'], isActive: true, sortOrder: 8 },
      ];
      const createdServices = await Service.insertMany(servicesData);
      results.services = { created: createdServices.length, count: createdServices.length };
    }

    // Seed stores if empty
    if (storesCount === 0) {
      const storesData = [
        {
          name: 'UltraWash Gulshan', slug: 'ultrawash-gulshan',
          description: 'Premium laundry service in the heart of Gulshan',
          address: 'House 45, Road 103, Gulshan 2', area: 'Gulshan', city: 'Dhaka',
          latitude: 23.7925, longitude: 90.4078, phone: '+8801700000001', email: 'gulshan@ultrawash.com',
          features: ['Free Pickup', 'Express Delivery', 'Dry Cleaning', '24/7 Support'],
          isFeatured: true, sortOrder: 1,
        },
        {
          name: 'UltraWash Dhanmondi', slug: 'ultrawash-dhanmondi',
          description: 'Your trusted laundry partner in Dhanmondi',
          address: 'House 12, Road 27, Dhanmondi', area: 'Dhanmondi', city: 'Dhaka',
          latitude: 23.7465, longitude: 90.3762, phone: '+8801700000002', email: 'dhanmondi@ultrawash.com',
          features: ['Free Pickup', 'Same Day Delivery', 'Eco-Friendly'],
          isFeatured: true, sortOrder: 2,
        },
        {
          name: 'UltraWash Banani', slug: 'ultrawash-banani',
          description: 'Quick and quality laundry in Banani area',
          address: 'House 78, Road 11, Banani', area: 'Banani', city: 'Dhaka',
          latitude: 23.7937, longitude: 90.4033, phone: '+8801700000003', email: 'banani@ultrawash.com',
          features: ['Free Pickup', 'Express Delivery', 'Premium Care'],
          isFeatured: false, sortOrder: 3,
        },
        {
          name: 'UltraWash Uttara', slug: 'ultrawash-uttara',
          description: 'Convenient laundry service in Uttara',
          address: 'House 5, Sector 7, Uttara', area: 'Uttara', city: 'Dhaka',
          latitude: 23.8759, longitude: 90.3795, phone: '+8801700000004', email: 'uttara@ultrawash.com',
          features: ['Free Pickup', 'Bulk Discount', 'Student Discount'],
          isFeatured: false, sortOrder: 4,
        },
        {
          name: 'UltraWash Mirpur', slug: 'ultrawash-mirpur',
          description: 'Affordable laundry solutions in Mirpur',
          address: 'Plot 10, Section 10, Mirpur', area: 'Mirpur', city: 'Dhaka',
          latitude: 23.8223, longitude: 90.3654, phone: '+8801700000005', email: 'mirpur@ultrawash.com',
          features: ['Free Pickup', 'Budget Friendly', 'Fast Turnaround'],
          isFeatured: false, sortOrder: 5,
        },
        {
          name: 'UltraWash Mohammadpur', slug: 'ultrawash-mohammadpur',
          description: 'Professional laundry in Mohammadpur',
          address: 'House 22, Tajmahal Road, Mohammadpur', area: 'Mohammadpur', city: 'Dhaka',
          latitude: 23.7662, longitude: 90.3588, phone: '+8801700000006', email: 'mohammadpur@ultrawash.com',
          features: ['Free Pickup', 'Family Package', 'Monthly Plans'],
          isFeatured: false, sortOrder: 6,
        },
      ];
      const createdStores = await Store.insertMany(storesData);
      results.stores = { created: createdStores.length, count: createdStores.length };
    }

    return res.status(200).json({
      status: "success",
      message: "Database seeding completed",
      data: results
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: error.message
    });
  }
};
