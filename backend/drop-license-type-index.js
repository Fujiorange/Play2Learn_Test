// backend/drop-license-type-index.js - Drop the unique index on license type field
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function dropLicenseTypeIndex() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('licenses');

    // Get all indexes
    console.log('📋 Checking existing indexes on licenses collection...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Check if type_1 index exists
    const typeIndexExists = indexes.some(index => index.name === 'type_1');
    
    if (typeIndexExists) {
      console.log('🗑️  Dropping type_1 unique index...');
      await collection.dropIndex('type_1');
      console.log('✅ Successfully dropped type_1 index');
    } else {
      console.log('ℹ️  type_1 index does not exist. No action needed.');
    }

    // Verify indexes after drop
    console.log('\n📋 Final indexes on licenses collection:');
    const finalIndexes = await collection.indexes();
    console.log(JSON.stringify(finalIndexes, null, 2));

    console.log('\n✅ Migration completed successfully!');
    console.log('📝 Note: Multiple licenses with the same type (free/paid) can now be created.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

dropLicenseTypeIndex();