/**
 * Seed Questions Script
 * 
 * This script populates the database with sample questions for adaptive quizzes.
 * Run with: node backend/seed-questions.js
 */

const mongoose = require('mongoose');
const Question = require('./models/Question');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

// Sample questions with different difficulties
const sampleQuestions = [
  // Difficulty 1 (Easiest)
  {
    text: 'What is 2 + 2?',
    choices: ['3', '4', '5', '6'],
    answer: '4',
    difficulty: 1,
    subject: 'Math',
    topic: 'Basic Arithmetic',
    is_active: true
  },
  {
    text: 'What is 5 - 3?',
    choices: ['1', '2', '3', '4'],
    answer: '2',
    difficulty: 1,
    subject: 'Math',
    topic: 'Basic Arithmetic',
    is_active: true
  },
  {
    text: 'What is 3 + 1?',
    choices: ['2', '3', '4', '5'],
    answer: '4',
    difficulty: 1,
    subject: 'Math',
    topic: 'Basic Arithmetic',
    is_active: true
  },
  {
    text: 'What is 10 - 5?',
    choices: ['3', '4', '5', '6'],
    answer: '5',
    difficulty: 1,
    subject: 'Math',
    topic: 'Basic Arithmetic',
    is_active: true
  },
  {
    text: 'What is 6 + 2?',
    choices: ['6', '7', '8', '9'],
    answer: '8',
    difficulty: 1,
    subject: 'Math',
    topic: 'Basic Arithmetic',
    is_active: true
  },
  {
    text: 'What is 4 + 4?',
    choices: ['6', '7', '8', '9'],
    answer: '8',
    difficulty: 1,
    subject: 'Math',
    topic: 'Basic Arithmetic',
    is_active: true
  },
  {
    text: 'What is 9 - 4?',
    choices: ['3', '4', '5', '6'],
    answer: '5',
    difficulty: 1,
    subject: 'Math',
    topic: 'Basic Arithmetic',
    is_active: true
  },
  {
    text: 'What is 1 + 3?',
    choices: ['2', '3', '4', '5'],
    answer: '4',
    difficulty: 1,
    subject: 'Math',
    topic: 'Basic Arithmetic',
    is_active: true
  },
  {
    text: 'What is 7 - 2?',
    choices: ['3', '4', '5', '6'],
    answer: '5',
    difficulty: 1,
    subject: 'Math',
    topic: 'Basic Arithmetic',
    is_active: true
  },
  {
    text: 'What is 5 + 5?',
    choices: ['8', '9', '10', '11'],
    answer: '10',
    difficulty: 1,
    subject: 'Math',
    topic: 'Basic Arithmetic',
    is_active: true
  },

  // Difficulty 2 (Easy)
  {
    text: 'What is 12 + 8?',
    choices: ['18', '19', '20', '21'],
    answer: '20',
    difficulty: 2,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 25 - 10?',
    choices: ['13', '14', '15', '16'],
    answer: '15',
    difficulty: 2,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },
  {
    text: 'What is 6 × 3?',
    choices: ['15', '16', '17', '18'],
    answer: '18',
    difficulty: 2,
    subject: 'Math',
    topic: 'Multiplication',
    is_active: true
  },
  {
    text: 'What is 20 ÷ 4?',
    choices: ['3', '4', '5', '6'],
    answer: '5',
    difficulty: 2,
    subject: 'Math',
    topic: 'Division',
    is_active: true
  },
  {
    text: 'What is 15 + 7?',
    choices: ['20', '21', '22', '23'],
    answer: '22',
    difficulty: 2,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 30 - 12?',
    choices: ['16', '17', '18', '19'],
    answer: '18',
    difficulty: 2,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },
  {
    text: 'What is 7 × 4?',
    choices: ['26', '27', '28', '29'],
    answer: '28',
    difficulty: 2,
    subject: 'Math',
    topic: 'Multiplication',
    is_active: true
  },
  {
    text: 'What is 24 ÷ 6?',
    choices: ['2', '3', '4', '5'],
    answer: '4',
    difficulty: 2,
    subject: 'Math',
    topic: 'Division',
    is_active: true
  },
  {
    text: 'What is 18 + 9?',
    choices: ['25', '26', '27', '28'],
    answer: '27',
    difficulty: 2,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 40 - 15?',
    choices: ['23', '24', '25', '26'],
    answer: '25',
    difficulty: 2,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },

  // Difficulty 3 (Medium)
  {
    text: 'What is 45 + 37?',
    choices: ['80', '81', '82', '83'],
    answer: '82',
    difficulty: 3,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 100 - 67?',
    choices: ['31', '32', '33', '34'],
    answer: '33',
    difficulty: 3,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },
  {
    text: 'What is 12 × 8?',
    choices: ['94', '95', '96', '97'],
    answer: '96',
    difficulty: 3,
    subject: 'Math',
    topic: 'Multiplication',
    is_active: true
  },
  {
    text: 'What is 144 ÷ 12?',
    choices: ['10', '11', '12', '13'],
    answer: '12',
    difficulty: 3,
    subject: 'Math',
    topic: 'Division',
    is_active: true
  },
  {
    text: 'What is 56 + 89?',
    choices: ['143', '144', '145', '146'],
    answer: '145',
    difficulty: 3,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 200 - 78?',
    choices: ['120', '121', '122', '123'],
    answer: '122',
    difficulty: 3,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },
  {
    text: 'What is 15 × 9?',
    choices: ['133', '134', '135', '136'],
    answer: '135',
    difficulty: 3,
    subject: 'Math',
    topic: 'Multiplication',
    is_active: true
  },
  {
    text: 'What is 180 ÷ 15?',
    choices: ['10', '11', '12', '13'],
    answer: '12',
    difficulty: 3,
    subject: 'Math',
    topic: 'Division',
    is_active: true
  },
  {
    text: 'What is 73 + 68?',
    choices: ['139', '140', '141', '142'],
    answer: '141',
    difficulty: 3,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 150 - 89?',
    choices: ['59', '60', '61', '62'],
    answer: '61',
    difficulty: 3,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },

  // Difficulty 4 (Hard)
  {
    text: 'What is 234 + 567?',
    choices: ['799', '800', '801', '802'],
    answer: '801',
    difficulty: 4,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 1000 - 456?',
    choices: ['542', '543', '544', '545'],
    answer: '544',
    difficulty: 4,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },
  {
    text: 'What is 25 × 16?',
    choices: ['398', '399', '400', '401'],
    answer: '400',
    difficulty: 4,
    subject: 'Math',
    topic: 'Multiplication',
    is_active: true
  },
  {
    text: 'What is 360 ÷ 24?',
    choices: ['13', '14', '15', '16'],
    answer: '15',
    difficulty: 4,
    subject: 'Math',
    topic: 'Division',
    is_active: true
  },
  {
    text: 'What is 789 + 456?',
    choices: ['1243', '1244', '1245', '1246'],
    answer: '1245',
    difficulty: 4,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 2000 - 789?',
    choices: ['1209', '1210', '1211', '1212'],
    answer: '1211',
    difficulty: 4,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },
  {
    text: 'What is 32 × 18?',
    choices: ['574', '575', '576', '577'],
    answer: '576',
    difficulty: 4,
    subject: 'Math',
    topic: 'Multiplication',
    is_active: true
  },
  {
    text: 'What is 512 ÷ 32?',
    choices: ['14', '15', '16', '17'],
    answer: '16',
    difficulty: 4,
    subject: 'Math',
    topic: 'Division',
    is_active: true
  },
  {
    text: 'What is 345 + 678?',
    choices: ['1021', '1022', '1023', '1024'],
    answer: '1023',
    difficulty: 4,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 1500 - 678?',
    choices: ['820', '821', '822', '823'],
    answer: '822',
    difficulty: 4,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },

  // Difficulty 5 (Hardest)
  {
    text: 'What is 1234 + 5678?',
    choices: ['6910', '6911', '6912', '6913'],
    answer: '6912',
    difficulty: 5,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 10000 - 3456?',
    choices: ['6542', '6543', '6544', '6545'],
    answer: '6544',
    difficulty: 5,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },
  {
    text: 'What is 123 × 45?',
    choices: ['5533', '5534', '5535', '5536'],
    answer: '5535',
    difficulty: 5,
    subject: 'Math',
    topic: 'Multiplication',
    is_active: true
  },
  {
    text: 'What is 2048 ÷ 64?',
    choices: ['30', '31', '32', '33'],
    answer: '32',
    difficulty: 5,
    subject: 'Math',
    topic: 'Division',
    is_active: true
  },
  {
    text: 'What is 9876 + 1234?',
    choices: ['11108', '11109', '11110', '11111'],
    answer: '11110',
    difficulty: 5,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 20000 - 8765?',
    choices: ['11233', '11234', '11235', '11236'],
    answer: '11235',
    difficulty: 5,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  },
  {
    text: 'What is 256 × 78?',
    choices: ['19966', '19967', '19968', '19969'],
    answer: '19968',
    difficulty: 5,
    subject: 'Math',
    topic: 'Multiplication',
    is_active: true
  },
  {
    text: 'What is 4096 ÷ 128?',
    choices: ['30', '31', '32', '33'],
    answer: '32',
    difficulty: 5,
    subject: 'Math',
    topic: 'Division',
    is_active: true
  },
  {
    text: 'What is 7890 + 2345?',
    choices: ['10233', '10234', '10235', '10236'],
    answer: '10235',
    difficulty: 5,
    subject: 'Math',
    topic: 'Addition',
    is_active: true
  },
  {
    text: 'What is 15000 - 6789?',
    choices: ['8209', '8210', '8211', '8212'],
    answer: '8211',
    difficulty: 5,
    subject: 'Math',
    topic: 'Subtraction',
    is_active: true
  }
];

async function seedQuestions() {
  console.log('🌱 Starting to seed questions...');
  console.log('==================================\n');
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Check existing questions
    const existingCount = await Question.countDocuments();
    console.log(`📊 Existing questions: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('⚠️  Questions already exist in database.');
      console.log('   This will add more questions without removing existing ones.\n');
    }
    
    // Insert questions
    console.log('📝 Inserting sample questions...');
    const result = await Question.insertMany(sampleQuestions);
    console.log(`✅ Successfully inserted ${result.length} questions\n`);
    
    // Show distribution
    console.log('📊 Question distribution by difficulty:');
    for (let i = 1; i <= 5; i++) {
      const count = await Question.countDocuments({ difficulty: i, is_active: true });
      console.log(`   Difficulty ${i}: ${count} questions`);
    }
    
    console.log('\n==================================');
    console.log('✅ Seeding completed successfully!');
    console.log('==================================\n');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('\n==================================');
    console.error('❌ Seeding failed:', error.message);
    console.error('==================================\n');
    
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('Error closing connection:', closeError.message);
    }
    process.exit(1);
  }
}

// Run seeding
seedQuestions();
