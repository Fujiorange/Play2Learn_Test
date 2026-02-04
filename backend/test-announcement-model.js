// Test to verify Announcement model is correctly defined
// This validates the schema without requiring a database connection

const path = require('path');
const modelPath = path.join(__dirname, 'models', 'Announcement.js');

console.log('🧪 Testing Announcement Model...\n');

try {
  // Load the model
  const Announcement = require(modelPath);
  
  // Verify model exists
  if (!Announcement) {
    throw new Error('Announcement model not exported');
  }
  console.log('✅ Announcement model loaded successfully');
  
  // Verify schema structure
  const schema = Announcement.schema;
  if (!schema) {
    throw new Error('Model schema not found');
  }
  console.log('✅ Schema structure exists');
  
  // Verify required fields
  const requiredFields = ['title', 'content', 'author', 'schoolId'];
  const paths = schema.paths;
  
  requiredFields.forEach(field => {
    if (!paths[field]) {
      throw new Error(`Required field '${field}' not found in schema`);
    }
    if (!paths[field].isRequired) {
      throw new Error(`Field '${field}' is not marked as required`);
    }
    console.log(`✅ Required field '${field}' is properly defined`);
  });
  
  // Verify enum fields
  const enumFields = {
    priority: ['info', 'urgent', 'event'],
    audience: ['all', 'student', 'students', 'teacher', 'teachers', 'parent', 'parents']
  };
  
  Object.keys(enumFields).forEach(field => {
    if (!paths[field]) {
      throw new Error(`Enum field '${field}' not found in schema`);
    }
    const enumValues = paths[field].enumValues;
    if (!enumValues || enumValues.length === 0) {
      throw new Error(`Field '${field}' does not have enum values defined`);
    }
    
    // Check if all expected values are present
    const expectedValues = enumFields[field];
    const missingValues = expectedValues.filter(v => !enumValues.includes(v));
    if (missingValues.length > 0) {
      throw new Error(`Field '${field}' is missing enum values: ${missingValues.join(', ')}`);
    }
    
    console.log(`✅ Enum field '${field}' has correct values: ${enumValues.join(', ')}`);
  });
  
  // Verify optional fields exist
  const optionalFields = ['pinned', 'expiresAt', 'createdAt', 'updatedAt'];
  optionalFields.forEach(field => {
    if (!paths[field]) {
      throw new Error(`Field '${field}' not found in schema`);
    }
    console.log(`✅ Optional field '${field}' exists`);
  });
  
  // Verify indexes
  const indexes = schema.indexes();
  if (!indexes || indexes.length === 0) {
    console.log('⚠️  Warning: No indexes defined (MongoDB will create default _id index)');
  } else {
    console.log(`✅ Found ${indexes.length} custom indexes defined:`);
    indexes.forEach((index, i) => {
      const fields = Object.keys(index[0]).join(', ');
      console.log(`   ${i + 1}. Index on: ${fields}`);
    });
  }
  
  // Verify pre-save hook exists
  const preSaveHooks = schema.s.hooks._pres.get('save') || [];
  if (preSaveHooks.length === 0) {
    console.log('⚠️  Warning: No pre-save hooks defined');
  } else {
    console.log(`✅ Pre-save hook exists (for updatedAt timestamp)`);
  }
  
  // Test model name
  const modelName = Announcement.modelName;
  if (modelName !== 'Announcement') {
    throw new Error(`Model name is '${modelName}', expected 'Announcement'`);
  }
  console.log(`✅ Model name is correct: '${modelName}'`);
  
  console.log('\n🎉 All tests passed! Announcement model is correctly defined.\n');
  
  // Print summary
  console.log('📊 Summary:');
  console.log(`   - Model: ${modelName}`);
  console.log(`   - Required fields: ${requiredFields.join(', ')}`);
  console.log(`   - Enum fields: ${Object.keys(enumFields).join(', ')}`);
  console.log(`   - Optional fields: ${optionalFields.join(', ')}`);
  console.log(`   - Indexes: ${indexes.length} custom indexes`);
  console.log(`   - Pre-save hooks: ${preSaveHooks.length}\n`);
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
