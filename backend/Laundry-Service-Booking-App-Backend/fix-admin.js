import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://naasmind12:naasmind12@cluster0.bnhloit.mongodb.net/ultrawash';

async function fixAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Hash the password
    const hash = await bcrypt.hash('admin123', 10);

    // Look for existing admin@demo.com
    const existing = await usersCollection.findOne({ email: 'admin@demo.com' });

    if (existing) {
      console.log("Admin exists. Updating password and ensuring role is admin.");
      await usersCollection.updateOne(
        { email: 'admin@demo.com' },
        { $set: { password: hash, role: 'admin', isVerified: true } }
      );
    } else {
      console.log("Admin does not exist. Creating admin@demo.com.");
      await usersCollection.insertOne({
        name: "Demo Admin",
        email: "admin@demo.com",
        phone: "+8801900000000",
        password: hash,
        role: "admin",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log("✅ admin@demo.com / admin123 is now configured as admin.");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error setting up admin:", error);
    process.exit(1);
  }
}

fixAdmin();
