import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/model/user.model.js';
import Store from './src/model/store.model.js';
import Service from './src/model/service.model.js';

const MONGO_URL = process.env.MONGODB_URI;

const seedAll = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('123456', 10);

    // ==================== SERVICES ====================
    console.log('\n📦 Seeding Services...');
    const servicesData = [
      {
        name: 'Wash & Fold',
        slug: 'wash-and-fold',
        description: 'Our professional wash and fold service handles your everyday laundry from start to finish. We sort by color, use temperature-appropriate wash cycles, and return your clothes neatly folded and ready to put away.',
        shortDescription: 'Everyday laundry made easy',
        image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&h=400&fit=crop',
        category: 'washing',
        pricingType: 'per_kg',
        pricePerKg: 4.5,
        estimatedDays: 2,
        features: ['Sorted by color', 'Cold/warm wash options', 'Folded neatly', 'Eco-friendly detergent', 'Minimum 3 kg'],
        items: [
          { name: 'Regular Load (up to 5kg)', description: 'Everyday clothes washed and folded', price: 22.50, image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=300&h=300&fit=crop' },
          { name: 'Large Load (5–10kg)', description: 'Larger family laundry load', price: 40.00, image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=300&h=300&fit=crop' },
          { name: 'Extra Large (10kg+)', description: 'Bulk washing for large households', price: 65.00, image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Wash & Iron',
        slug: 'wash-and-iron',
        description: 'Complete laundry service combining a thorough machine wash with professional steam ironing. Every garment is returned on a hanger, crisp and presentation-ready.',
        shortDescription: 'Crisp and clean clothes',
        image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=600&h=400&fit=crop',
        category: 'washing',
        pricingType: 'per_item',
        pricePerItem: 5.50,
        estimatedDays: 2,
        features: ['Machine wash', 'Professional steam iron', 'Hung on hangers', 'Collar & cuff care', 'Fragrance-free option'],
        items: [
          { name: 'Shirt / Blouse', description: 'Full wash and steam press', price: 5.50, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=300&fit=crop' },
          { name: 'Trousers / Jeans', description: 'Wash and crease press', price: 6.00, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop' },
          { name: 'T-Shirt', description: 'Wash and light press', price: 4.50, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=300&fit=crop' },
          { name: 'Dress / Skirt', description: 'Delicate wash and careful press', price: 7.00, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'Dry Cleaning',
        slug: 'dry-cleaning',
        description: 'Premium dry cleaning for delicate fabrics, formal wear, and garments that cannot be machine washed. We use gentle chemical-free solvents, apply spot treatment where needed, and return items in protective garment bags.',
        shortDescription: 'For delicate & formal garments',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
        category: 'dry_cleaning',
        pricingType: 'per_item',
        pricePerItem: 12.00,
        estimatedDays: 3,
        features: ['Chemical-free solvents', 'Spot & stain treatment', 'Protective garment bag', 'Safe for wool & silk', 'Fragrance-free'],
        items: [
          { name: 'Suit (2-piece)', description: 'Full dry clean of jacket & trousers', price: 22.00, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop' },
          { name: 'Blazer / Jacket', description: 'Dry clean and press', price: 14.00, image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&h=300&fit=crop' },
          { name: 'Dress / Gown', description: 'Delicate dry clean for evening wear', price: 18.00, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=300&fit=crop' },
          { name: 'Saree / Silk Garment', description: 'Specialist silk dry cleaning', price: 16.00, image: 'https://images.unsplash.com/photo-1551188831-00ddcb6c6bd3?w=300&h=300&fit=crop' },
          { name: 'Coat / Overcoat', description: 'Full-length coat dry clean', price: 20.00, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 3,
      },
      {
        name: 'Ironing Only',
        slug: 'ironing-only',
        description: 'Professional ironing and pressing service for your already clean clothes. Our experts use professional-grade steam equipment to ensure crisp, wrinkle-free results. Perfect for shirts, trousers, sarees, panjabis, and formal wear that just needs pressing.',
        shortDescription: 'Wrinkle-free guaranteed',
        image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=600&h=400&fit=crop',
        category: 'ironing',
        pricingType: 'per_item',
        pricePerItem: 2.50,
        estimatedDays: 1,
        features: ['Professional steam equipment', 'Temperature control', 'Crisp finish', 'Same-day available', 'Starch on request'],
        items: [
          { name: 'Shirt', description: 'Crisp shirt pressing', price: 2.50, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=300&fit=crop' },
          { name: 'Pant / Trouser', description: 'Trouser crease pressing', price: 3.00, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop' },
          { name: 'T-Shirt', description: 'T-shirt pressing', price: 2.00, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=300&fit=crop' },
          { name: 'Saree', description: 'Saree pressing', price: 5.00, image: 'https://images.unsplash.com/photo-1551188831-00ddcb6c6bd3?w=300&h=300&fit=crop' },
          { name: 'Panjabi / Kurta', description: 'Panjabi pressing', price: 3.50, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=300&fit=crop' },
          { name: 'Suit (2pc)', description: 'Suit pressing', price: 8.00, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop' },
          { name: 'Salwar Kameez', description: 'Salwar kameez pressing', price: 4.00, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 4,
      },
      {
        name: 'Premium / Delicate Wash',
        slug: 'premium-delicate-wash',
        description: 'Specialist hand-wash and gentle-cycle service for your most delicate garments. Cashmere, silk, lace, and fine knitwear receive individual attention with pH-neutral detergents and air-drying to preserve shape and colour.',
        shortDescription: 'Luxury care for your finest garments',
        image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&h=400&fit=crop',
        category: 'premium',
        pricingType: 'per_item',
        pricePerItem: 13.80,
        estimatedDays: 2,
        features: ['Hand-wash available', 'pH-neutral detergents', 'Air-dry finishing', 'Individual garment care', 'Silk & cashmere safe'],
        items: [
          { name: 'Silk Blouse / Top', description: 'Gentle hand wash for silk', price: 12.00, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=300&fit=crop' },
          { name: 'Cashmere Sweater', description: 'Specialist cashmere wash & reshape', price: 18.00, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=300&fit=crop' },
          { name: 'Lace / Embroidered Dress', description: 'Delicate lace care', price: 16.00, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop' },
          { name: 'Wool Knitwear', description: 'Gentle wool care, block-dry', price: 14.00, image: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 5,
      },
      {
        name: 'Premium Laundry',
        slug: 'premium-laundry',
        description: 'Our highest-tier laundry service for luxury and high-end garments. Each item receives a bespoke treatment plan, premium detergents, individual packaging, and a quality inspection before return.',
        shortDescription: 'Luxury fabric care',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop',
        category: 'premium',
        pricingType: 'per_item',
        pricePerItem: 25.00,
        estimatedDays: 3,
        features: ['Bespoke treatment plan', 'Premium detergents', 'Individual packaging', 'Quality inspection', 'Designer garment safe'],
        items: [
          { name: 'Designer Shirt / Blouse', description: 'Premium wash and press for designer wear', price: 22.00, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=300&fit=crop' },
          { name: 'Designer Suit / Blazer', description: 'Full premium dry clean and press', price: 45.00, image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&h=300&fit=crop' },
          { name: 'Evening Gown / Formal Dress', description: 'Luxury gown cleaning and preservation', price: 55.00, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=300&fit=crop' },
          { name: 'Luxury Saree / Lehenga', description: 'Bridal and ethnic wear specialist care', price: 50.00, image: 'https://images.unsplash.com/photo-1551188831-00ddcb6c6bd3?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 6,
      },
      {
        name: 'Curtain Cleaning',
        slug: 'curtain-cleaning',
        description: 'Deep cleaning service for curtains, drapes, and blinds. We remove dust, allergens, and odours, treat stains, and return your window coverings fresh and bright. Re-hanging service available on request.',
        shortDescription: 'Freshen up your home',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop',
        category: 'specialty',
        pricingType: 'per_item',
        pricePerItem: 18.00,
        estimatedDays: 4,
        features: ['Dust & allergen removal', 'Stain treatment', 'Odour elimination', 'Re-hanging available', 'Colour-safe cleaning'],
        items: [
          { name: 'Single Curtain Panel (small)', description: 'Up to 1.5m drop', price: 14.00, image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&h=300&fit=crop' },
          { name: 'Single Curtain Panel (large)', description: '1.5m–3m drop', price: 22.00, image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&h=300&fit=crop' },
          { name: 'Sheer / Voile Curtain', description: 'Delicate sheer fabric cleaning', price: 12.00, image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&h=300&fit=crop' },
          { name: 'Blackout Curtain', description: 'Heavy blackout panel deep clean', price: 26.00, image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 7,
      },
      {
        name: 'Shoe Cleaning',
        slug: 'shoe-cleaning',
        description: 'Professional shoe cleaning, restoration, and protection service. From trainers to leather dress shoes, we deep-clean, deodorise, polish, and apply protective coating so your footwear looks brand new.',
        shortDescription: 'Restore your footwear',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
        category: 'specialty',
        pricingType: 'per_item',
        pricePerItem: 12.00,
        estimatedDays: 2,
        features: ['Deep clean', 'Deodorising treatment', 'Polish & shine', 'Protective coating', 'Suede & leather safe'],
        items: [
          { name: 'Trainers / Sneakers', description: 'Full deep clean inside and out', price: 12.00, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop' },
          { name: 'Leather Dress Shoes', description: 'Leather clean, condition and polish', price: 15.00, image: 'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=300&h=300&fit=crop' },
          { name: 'Suede / Nubuck Shoes', description: 'Specialist suede brush and clean', price: 18.00, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop' },
          { name: 'Boots (Ankle / Calf)', description: 'Boot deep clean and condition', price: 22.00, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 8,
      },
      {
        name: 'Bedding & Linen',
        slug: 'bedding-and-linen',
        description: 'Thorough sanitised cleaning for bedsheets, duvet covers, blankets, comforters, and pillow cases. We use high-temperature cycles to eliminate dust mites and allergens, leaving your bedding fresh and hygienically clean.',
        shortDescription: 'Fresh bed every night',
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
        category: 'washing',
        pricingType: 'per_item',
        pricePerItem: 10.00,
        estimatedDays: 3,
        features: ['High-temperature sanitise', 'Dust mite elimination', 'Fabric softener included', 'Anti-allergen treatment', 'Tumble-dry finish'],
        items: [
          { name: 'Single Duvet / Quilt', description: 'Single bed duvet wash and dry', price: 16.00, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=300&fit=crop' },
          { name: 'Double / King Duvet', description: 'Large duvet deep wash', price: 24.00, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=300&fit=crop' },
          { name: 'Bed Sheet Set (per set)', description: 'Sheet, pillowcases, duvet cover', price: 14.00, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=300&fit=crop' },
          { name: 'Pillow (each)', description: 'Pillow wash and sanitise', price: 8.00, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=300&fit=crop' },
          { name: 'Blanket / Throw', description: 'Blanket deep wash and tumble dry', price: 12.00, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 9,
      },
      // ===== 10 NEW SERVICES =====
      {
        name: 'Stain Removal Treatment',
        slug: 'stain-removal',
        description: 'Targeted professional stain removal treatment for stubborn stains such as wine, coffee, grease, ink, blood, and more. We analyse the fabric and the stain type to select the safest and most effective removal method.',
        shortDescription: 'Banish stubborn stains',
        image: 'https://images.unsplash.com/photo-1558618047-3c8c77b7427a?w=600&h=400&fit=crop',
        category: 'specialty',
        pricingType: 'per_item',
        pricePerItem: 9.00,
        estimatedDays: 2,
        features: ['Fabric-safe solvents', 'Multiple stain types', 'Colour-safe treatment', 'Pre-treatment inspection', 'No result – no charge policy'],
        items: [
          { name: 'Food & Beverage Stain', description: 'Wine, coffee, sauce, juice', price: 9.00, image: 'https://images.unsplash.com/photo-1558618047-3c8c77b7427a?w=300&h=300&fit=crop' },
          { name: 'Grease & Oil Stain', description: 'Oil, grease, makeup', price: 11.00, image: 'https://images.unsplash.com/photo-1558618047-3c8c77b7427a?w=300&h=300&fit=crop' },
          { name: 'Ink & Dye Stain', description: 'Pen, marker, fabric dye', price: 13.00, image: 'https://images.unsplash.com/photo-1558618047-3c8c77b7427a?w=300&h=300&fit=crop' },
          { name: 'Biological Stain', description: 'Blood, sweat, protein-based stains', price: 12.00, image: 'https://images.unsplash.com/photo-1558618047-3c8c77b7427a?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 10,
      },
      {
        name: 'Suit & Formal Wear Cleaning',
        slug: 'suit-formal-cleaning',
        description: 'Specialist cleaning for business suits, tuxedos, blazers, and all formal attire. We dry-clean, re-shape, and steam-press every piece so you are always boardroom and event ready.',
        shortDescription: 'Always presentation-ready',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop',
        category: 'dry_cleaning',
        pricingType: 'per_item',
        pricePerItem: 20.00,
        estimatedDays: 3,
        features: ['Dry-clean & re-shape', 'Steam press finish', 'Garment bag included', 'Lining care', 'Button & seam check'],
        items: [
          { name: '2-Piece Suit', description: 'Jacket and trouser dry clean & press', price: 28.00, image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&h=300&fit=crop' },
          { name: '3-Piece Suit', description: 'Jacket, waistcoat & trouser', price: 36.00, image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&h=300&fit=crop' },
          { name: 'Tuxedo', description: 'Full tuxedo cleaning and press', price: 40.00, image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&h=300&fit=crop' },
          { name: 'Blazer / Sports Coat', description: 'Blazer dry clean and press', price: 18.00, image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 11,
      },
      {
        name: 'Leather & Suede Cleaning',
        slug: 'leather-suede-cleaning',
        description: 'Expert cleaning and conditioning for leather jackets, suede coats, and leather accessories. We restore suppleness, remove stains, and apply a protective treatment to keep your leather looking its best.',
        shortDescription: 'Keep leather looking new',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=400&fit=crop',
        category: 'specialty',
        pricingType: 'per_item',
        pricePerItem: 30.00,
        estimatedDays: 4,
        features: ['Specialist leather cleaner', 'Conditioning treatment', 'Colour restoration', 'Protective finish', 'Suede & nappa safe'],
        items: [
          { name: 'Leather Jacket', description: 'Full clean and condition', price: 35.00, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop' },
          { name: 'Suede Jacket / Coat', description: 'Suede deep clean and brush', price: 40.00, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop' },
          { name: 'Leather Trousers / Skirt', description: 'Leather bottom garment care', price: 28.00, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop' },
          { name: 'Leather Belt / Accessory', description: 'Belt and small leather accessory clean', price: 10.00, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 12,
      },
      {
        name: 'Bag & Accessories Cleaning',
        slug: 'bag-accessories-cleaning',
        description: 'Professional cleaning for handbags, backpacks, clutches, and accessories. Whether fabric, leather, or synthetic, we deep-clean interiors and exteriors, remove stains, and restore hardware shine.',
        shortDescription: 'Restore your favourite bags',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=400&fit=crop',
        category: 'specialty',
        pricingType: 'per_item',
        pricePerItem: 15.00,
        estimatedDays: 3,
        features: ['Interior & exterior clean', 'Hardware polishing', 'Stain removal', 'Leather conditioning', 'Fabric deodorising'],
        items: [
          { name: 'Handbag (small/medium)', description: 'Compact handbag clean & condition', price: 18.00, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop' },
          { name: 'Tote / Large Handbag', description: 'Large bag full clean', price: 25.00, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop' },
          { name: 'Backpack', description: 'Backpack deep clean inside and out', price: 22.00, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop' },
          { name: 'Clutch / Evening Bag', description: 'Delicate clutch clean', price: 14.00, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 13,
      },
      {
        name: 'Baby & Kids Clothes Washing',
        slug: 'baby-kids-washing',
        description: 'Gentle, hypoallergenic laundry service designed for baby and children\'s clothing. We use fragrance-free, dermatologically tested detergents and high-temperature sanitising cycles to ensure every item is perfectly safe.',
        shortDescription: 'Safe & gentle for little ones',
        image: 'https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=600&h=400&fit=crop',
        category: 'washing',
        pricingType: 'per_kg',
        pricePerKg: 6.00,
        estimatedDays: 2,
        features: ['Hypoallergenic detergent', 'Fragrance-free', 'High-temp sanitise', 'Dermatologically tested', 'Soft tumble-dry'],
        items: [
          { name: 'Baby Bundle (up to 3kg)', description: 'Newborn & infant clothing wash', price: 18.00, image: 'https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=300&h=300&fit=crop' },
          { name: 'Kids Clothes Bundle (up to 5kg)', description: 'Toddler & children clothing wash', price: 28.00, image: 'https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=300&h=300&fit=crop' },
          { name: 'Baby Bedding Set', description: 'Cot sheets, blankets, sleeping bag', price: 22.00, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=300&fit=crop' },
          { name: 'Soft Toys / Comforters', description: 'Sanitised wash for plush toys', price: 8.00, image: 'https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 14,
      },
      {
        name: 'Carpet & Rug Cleaning',
        slug: 'carpet-rug-cleaning',
        description: 'Deep steam-cleaning and hot-water extraction for carpets and rugs of all sizes. We remove embedded dirt, stains, pet odours, and allergens, leaving your flooring fresh, bright, and hygienically clean.',
        shortDescription: 'Deep clean for floors & rugs',
        image: 'https://images.unsplash.com/photo-1558618047-0bce75f4b80c?w=600&h=400&fit=crop',
        category: 'specialty',
        pricingType: 'per_item',
        pricePerItem: 35.00,
        estimatedDays: 4,
        features: ['Steam & hot-water extraction', 'Stain & odour removal', 'Anti-bacterial treatment', 'Fast drying', 'Pet-safe products'],
        items: [
          { name: 'Small Rug (up to 2m²)', description: 'Small rug deep clean', price: 28.00, image: 'https://images.unsplash.com/photo-1558618047-0bce75f4b80c?w=300&h=300&fit=crop' },
          { name: 'Medium Rug (2–6m²)', description: 'Medium area rug steam clean', price: 45.00, image: 'https://images.unsplash.com/photo-1558618047-0bce75f4b80c?w=300&h=300&fit=crop' },
          { name: 'Large Rug / Carpet (6m²+)', description: 'Large carpet hot-water extraction', price: 70.00, image: 'https://images.unsplash.com/photo-1558618047-0bce75f4b80c?w=300&h=300&fit=crop' },
          { name: 'Persian / Antique Rug', description: 'Specialist hand-wash for valuable rugs', price: 90.00, image: 'https://images.unsplash.com/photo-1558618047-0bce75f4b80c?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 15,
      },
      {
        name: 'Uniform & Workwear Cleaning',
        slug: 'uniform-workwear-cleaning',
        description: 'Reliable bulk cleaning service for uniforms, workwear, chef whites, healthcare scrubs, and corporate attire. Regular collection and delivery plans available for businesses and individuals.',
        shortDescription: 'Professional uniform care',
        image: 'https://images.unsplash.com/photo-1580508174046-170816f65662?w=600&h=400&fit=crop',
        category: 'washing',
        pricingType: 'per_item',
        pricePerItem: 6.00,
        estimatedDays: 2,
        features: ['Bulk pricing available', 'Business accounts', 'Regular collection plans', 'Badge & emblem safe', 'Stain pre-treatment'],
        items: [
          { name: 'Work Shirt / Polo', description: 'Uniform shirt wash and press', price: 5.00, image: 'https://images.unsplash.com/photo-1580508174046-170816f65662?w=300&h=300&fit=crop' },
          { name: 'Trousers / Uniform Pants', description: 'Work trousers wash and crease press', price: 6.00, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop' },
          { name: 'Chef Whites (set)', description: 'Full chef uniform set', price: 14.00, image: 'https://images.unsplash.com/photo-1580508174046-170816f65662?w=300&h=300&fit=crop' },
          { name: 'Healthcare / Scrubs (set)', description: 'Medical scrubs hygiene wash', price: 12.00, image: 'https://images.unsplash.com/photo-1580508174046-170816f65662?w=300&h=300&fit=crop' },
          { name: 'Hi-Vis / Safety Jacket', description: 'Hi-visibility workwear clean', price: 10.00, image: 'https://images.unsplash.com/photo-1580508174046-170816f65662?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 16,
      },
      {
        name: 'Sports & Activewear Cleaning',
        slug: 'sports-activewear-cleaning',
        description: 'High-performance wash for gym clothes, sportswear, cycling kits, and outdoor gear. Our sports wash cycle removes odour-causing bacteria, preserves technical fabrics, and keeps moisture-wicking properties intact.',
        shortDescription: 'Fresh kit every session',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop',
        category: 'washing',
        pricingType: 'per_kg',
        pricePerKg: 5.00,
        estimatedDays: 1,
        features: ['Odour-eliminating wash', 'Technical fabric safe', 'Moisture-wick preserved', 'Low-temp cycle', 'Anti-bacterial rinse'],
        items: [
          { name: 'Sports Bundle (up to 3kg)', description: 'Gym bag of activewear', price: 15.00, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=300&fit=crop' },
          { name: 'Cycling / Running Kit (set)', description: 'Jersey, bib shorts, socks', price: 14.00, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=300&fit=crop' },
          { name: 'Football / Team Kit (set)', description: 'Shirt, shorts, socks', price: 10.00, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=300&fit=crop' },
          { name: 'Wetsuit / Waterproof Jacket', description: 'Technical outerwear specialist wash', price: 20.00, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 17,
      },
      {
        name: 'Wedding & Bridal Wear Cleaning',
        slug: 'wedding-bridal-cleaning',
        description: 'Specialist cleaning and preservation service for wedding dresses, bridal lehengas, and formal occasion wear. We clean, restore, and can seal your outfit for long-term preservation as a keepsake.',
        shortDescription: 'Preserve your special day',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop',
        category: 'premium',
        pricingType: 'per_item',
        pricePerItem: 80.00,
        estimatedDays: 7,
        features: ['Expert bridal care', 'Embellishment safe', 'Museum-quality press', 'Long-term preservation box', 'Colour restoration'],
        items: [
          { name: 'Wedding Dress (clean & press)', description: 'Full wedding gown specialist clean', price: 80.00, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=300&fit=crop' },
          { name: 'Wedding Dress (clean & preserve)', description: 'Clean + acid-free preservation box', price: 150.00, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=300&fit=crop' },
          { name: 'Bridal Lehenga / Saree', description: 'Embroidered bridal ethnic wear', price: 70.00, image: 'https://images.unsplash.com/photo-1551188831-00ddcb6c6bd3?w=300&h=300&fit=crop' },
          { name: 'Bridesmaids Dress', description: 'Formal occasion dress clean', price: 30.00, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 18,
      },
      {
        name: 'Alterations & Repairs',
        slug: 'alterations-repairs',
        description: 'In-house tailoring for clothing alterations, repairs, and modifications. From taking in a dress to replacing a zip, our skilled tailors handle all garment types quickly and professionally.',
        shortDescription: 'Perfect fit, every time',
        image: 'https://images.unsplash.com/photo-1558171813-d3e1ee3fa60c?w=600&h=400&fit=crop',
        category: 'specialty',
        pricingType: 'per_item',
        pricePerItem: 8.00,
        estimatedDays: 3,
        features: ['Skilled in-house tailors', 'All garment types', 'Quick turnaround', 'Invisible repairs', 'Free fitting consultation'],
        items: [
          { name: 'Zip Replacement', description: 'Trouser, dress or jacket zip', price: 10.00, image: 'https://images.unsplash.com/photo-1558171813-d3e1ee3fa60c?w=300&h=300&fit=crop' },
          { name: 'Hem (trousers / dress)', description: 'Shorten or let down hem', price: 8.00, image: 'https://images.unsplash.com/photo-1558171813-d3e1ee3fa60c?w=300&h=300&fit=crop' },
          { name: 'Waistband Take-In', description: 'Reduce waist size', price: 12.00, image: 'https://images.unsplash.com/photo-1558171813-d3e1ee3fa60c?w=300&h=300&fit=crop' },
          { name: 'Button Replacement', description: 'Single or full set of buttons', price: 6.00, image: 'https://images.unsplash.com/photo-1558171813-d3e1ee3fa60c?w=300&h=300&fit=crop' },
          { name: 'Seam Repair', description: 'Split seam repair', price: 7.00, image: 'https://images.unsplash.com/photo-1558171813-d3e1ee3fa60c?w=300&h=300&fit=crop' },
        ],
        isActive: true,
        sortOrder: 19,
      },
    ];

    for (const svc of servicesData) {
      const existing = await Service.findOne({ slug: svc.slug });
      if (existing) {
        Object.assign(existing, svc);
        await existing.save();
        console.log(`  Updated service: ${svc.name}`);
      } else {
        await Service.create(svc);
        console.log(`  Created service: ${svc.name}`);
      }
    }

    const allServices = await Service.find({ isActive: true });
    const serviceIds = allServices.map(s => s._id);

    // ==================== STORES (Location-wise for Dhaka) ====================
    console.log('\n🏪 Seeding Location-based Stores...');
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

    for (const store of storesData) {
      const existing = await Store.findOne({ slug: store.slug });
      const storePayload = {
        ...store,
        location: { type: 'Point', coordinates: [store.longitude, store.latitude] },
        services: serviceIds,
        isActive: true,
      };
      delete storePayload.latitude;
      delete storePayload.longitude;

      if (existing) {
        Object.assign(existing, storePayload);
        await existing.save();
        console.log(`  Updated store: ${store.name}`);
      } else {
        await Store.create(storePayload);
        console.log(`  Created store: ${store.name}`);
      }
    }

    // ==================== USERS (Delivery & Staff) ====================
    console.log('\n👥 Seeding Users...');

    const deliveryBoys = [
      { name: 'Rahim Delivery', email: 'delivery1@ultrawash.com', phone: '+8801711111101', password: hashedPassword, role: 'delivery', isVerified: true, currentLocation: { type: 'Point', coordinates: [90.4125, 23.8103] } },
      { name: 'Karim Delivery', email: 'delivery2@ultrawash.com', phone: '+8801711111102', password: hashedPassword, role: 'delivery', isVerified: true, currentLocation: { type: 'Point', coordinates: [90.4200, 23.8150] } },
      { name: 'Jamal Delivery', email: 'delivery3@ultrawash.com', phone: '+8801711111103', password: hashedPassword, role: 'delivery', isVerified: true, currentLocation: { type: 'Point', coordinates: [90.3950, 23.7900] } },
    ];

    const staffMembers = [
      { name: 'Salam Staff', email: 'staff1@ultrawash.com', phone: '+8801711111201', password: hashedPassword, role: 'staff', isVerified: true },
      { name: 'Hasan Staff', email: 'staff2@ultrawash.com', phone: '+8801711111202', password: hashedPassword, role: 'staff', isVerified: true },
      { name: 'Mina Staff', email: 'staff3@ultrawash.com', phone: '+8801711111203', password: hashedPassword, role: 'staff', isVerified: true },
    ];

    // Admin user
    const adminUser = { name: 'Admin', email: 'admin@ultrawash.com', phone: '+8801700000000', password: hashedPassword, role: 'admin', isVerified: true };

    // Demo customer user
    const demoUser = { name: 'Demo User', email: 'user@ultrawash.com', phone: '+8801711111301', password: hashedPassword, role: 'user', isVerified: true, address: 'House 15, Road 5, Mirpur 10, Dhaka' };

    for (const u of [adminUser, demoUser, ...deliveryBoys, ...staffMembers]) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        existing.role = u.role;
        existing.password = u.password;
        if (u.currentLocation) existing.currentLocation = u.currentLocation;
        await existing.save();
        console.log(`  Updated: ${u.email} (${u.role})`);
      } else {
        await User.create(u);
        console.log(`  Created: ${u.email} (${u.role})`);
      }
    }

    console.log('\n✅ All data seeded successfully!');
    console.log('\n📋 Login Credentials (all passwords: 123456):');
    console.log('  Admin:     admin@ultrawash.com');
    console.log('  Delivery:  delivery1@ultrawash.com, delivery2@ultrawash.com, delivery3@ultrawash.com');
    console.log('  Staff:     staff1@ultrawash.com, staff2@ultrawash.com, staff3@ultrawash.com');
    console.log('  Customer:  user@ultrawash.com');
    console.log('\n🏪 Stores seeded: Gulshan, Dhanmondi, Banani, Uttara, Mirpur, Mohammadpur');
    console.log('📦 Services seeded (18 total): Wash & Fold, Wash & Iron, Dry Cleaning, Ironing Only, Premium/Delicate Wash, Premium Laundry, Curtain Cleaning, Shoe Cleaning, Bedding & Linen, Stain Removal, Suit & Formal Wear, Leather & Suede, Bag & Accessories, Baby & Kids, Carpet & Rug, Uniform & Workwear, Sports & Activewear, Wedding & Bridal, Alterations & Repairs');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedAll();
