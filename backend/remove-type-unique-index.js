// backend/remove-type-unique-index.js
// This script removes the unique index on the 'type' field if it exists
// Run this script to fix the issue where creating multiple licenses with the same type fails

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function removeTypeUniqueIndex() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('licenses');

    console.log('\n📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    
    console.log('\nCurrent indexes on licenses collection:');
    indexes.forEach(index => {
      console.log(`   - ${index.name}:`, JSON.stringify(index.key));
    });

    // Check if there's a unique index on 'type'
    const typeIndex = indexes.find(index => 
      index.key && index.key.type === 1 && index.unique === true
    );

    if (typeIndex) {
      console.log(`\n🗑️  Removing unique index on 'type' field: ${typeIndex.name}`);
      await collection.dropIndex(typeIndex.name);
      console.log('✅ Successfully removed unique index on type field');
    } else {
      console.log('\n✅ No unique index found on type field - nothing to remove');
    }

    // Verify final state
    console.log('\n📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`   - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\nYou can now create multiple licenses with the same type (e.g., multiple "paid" licenses)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

removeTypeUniqueIndex();
