/**
 * Migration Script to Fix License Collection Index Issue
 * 
 * This script removes the unique index on 'type' field in the licenses collection
 * that was causing E11000 duplicate key errors.
 * 
 * Run this script once to fix the database schema.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function fixLicenseIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('\nChecking for licenses collection...');
    
    if (collectionNames.includes('licenses')) {
      console.log('✓ Found licenses collection');
      
      // Get existing indexes
      const indexes = await db.collection('licenses').indexes();
      console.log('\nCurrent indexes:');
      indexes.forEach(index => {
        console.log(`  - ${index.name}:`, JSON.stringify(index.key));
      });

      // Check if type_1 index exists
      const typeIndex = indexes.find(idx => idx.name === 'type_1');
      
      if (typeIndex) {
        console.log('\n⚠️  Found problematic unique index on "type" field');
        console.log('Dropping index type_1...');
        
        await db.collection('licenses').dropIndex('type_1');
        console.log('✓ Successfully dropped type_1 index');
      } else {
        console.log('\n✓ No problematic type_1 index found');
      }

      // Verify final state
      const finalIndexes = await db.collection('licenses').indexes();
      console.log('\nFinal indexes:');
      finalIndexes.forEach(index => {
        console.log(`  - ${index.name}:`, JSON.stringify(index.key));
      });

      // Count documents
      const count = await db.collection('licenses').countDocuments();
      console.log(`\n✓ Licenses collection has ${count} document(s)`);

    } else {
      console.log('ℹ️  No licenses collection exists yet');
      console.log('   The collection will be created automatically when you create your first license');
    }

    console.log('\n✓ Migration completed successfully!');
    console.log('\nYou can now create licenses without encountering duplicate key errors.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  }
}

// Run the migration
console.log('='.repeat(60));
console.log('License Collection Index Fix Migration');
console.log('='.repeat(60));
console.log();

fixLicenseIndexes();
