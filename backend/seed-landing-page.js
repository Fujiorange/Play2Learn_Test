// backend/seed-landing-page.js - Seed default landing page data
require('dotenv').config();
const mongoose = require('mongoose');
const LandingPage = require('./models/LandingPage');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

const defaultBlocks = [
  {
    type: 'hero',
    title: 'Revolutionizing Education Through Adaptive Learning',
    content: 'Personalized learning paths powered by AI with incentive-driven engagement to maximize student success and teacher effectiveness.',
    image_url: '',
    order: 1,
    is_visible: true,
    custom_data: {}
  },
  {
    type: 'features',
    title: 'Platform Features',
    content: '',
    image_url: '',
    order: 2,
    is_visible: true,
    custom_data: {
      features: [
        {
          icon: '🎯',
          title: 'Adaptive Learning Paths',
          description: 'AI-powered personalized learning journeys based on individual student performance and learning styles.'
        },
        {
          icon: '🏆',
          title: 'Incentive System',
          description: 'Gamified rewards and recognition system to motivate students and enhance engagement.'
        },
        {
          icon: '📊',
          title: 'Real-time Analytics',
          description: 'Comprehensive dashboards for teachers to monitor student progress and identify areas for improvement.'
        }
      ]
    }
  },
  {
    type: 'about',
    title: 'About Play2Learn',
    content: '',
    image_url: '',
    order: 3,
    is_visible: true,
    custom_data: {
      mission: 'To transform education by providing adaptive learning solutions that personalize education for every student while empowering teachers with intelligent tools and insights.',
      vision: 'A world where every learner achieves their full potential through personalized, engaging, and effective educational experiences powered by cutting-edge technology.',
      goals: [
        'Increase student engagement by 70% through incentive-driven learning',
        'Improve learning outcomes by 50% through adaptive personalization',
        'Reduce teacher workload by 40% with AI-powered assistance',
        'Reach 1 million students within 3 years'
      ],
      stats: [
        { value: '50+', label: 'Schools Partnered' },
        { value: '10,000+', label: 'Active Students' },
        { value: '95%', label: 'Satisfaction Rate' },
        { value: '40%', label: 'Improvement in Results' }
      ]
    }
  },
  {
    type: 'roadmap',
    title: 'Learning Journey Roadmap',
    content: '',
    image_url: '',
    order: 4,
    is_visible: true,
    custom_data: {
      steps: [
        {
          step: 1,
          title: 'Assessment & Onboarding',
          description: 'Initial student assessment to determine learning level and style. School and teacher onboarding process.',
          duration: '1-2 weeks'
        },
        {
          step: 2,
          title: 'Personalized Learning Path',
          description: 'AI creates customized learning journey based on assessment results and educational goals.',
          duration: 'Ongoing'
        },
        {
          step: 3,
          title: 'Adaptive Learning Sessions',
          description: 'Engaging learning modules that adjust difficulty based on student performance in real-time.',
          duration: 'Daily sessions'
        },
        {
          step: 4,
          title: 'Incentive & Reward System',
          description: 'Students earn points, badges, and rewards for completing milestones and showing improvement.',
          duration: 'Continuous'
        },
        {
          step: 5,
          title: 'Progress Monitoring',
          description: 'Teachers and administrators track progress through comprehensive analytics dashboards.',
          duration: 'Real-time'
        },
        {
          step: 6,
          title: 'Success & Advancement',
          description: 'Students advance to higher levels, with preparation for standardized tests and future academic challenges.',
          duration: 'Quarterly reviews'
        }
      ]
    }
  },
  {
    type: 'testimonials',
    title: 'Success Stories',
    content: 'Hear what our users say about Play2Learn.',
    image_url: '',
    order: 5,
    is_visible: true,
    custom_data: {
      testimonials: [
        {
          id: 1,
          name: 'Alex Johnson',
          role: 'Parent of a 5-year-old',
          quote: 'Play2Learn has transformed my child\'s learning experience. The games are fun and educational, making homework feel like playtime!',
          image: 'https://via.placeholder.com/100x100?text=AJ'
        },
        {
          id: 2,
          name: 'Maria Gonzalez',
          role: 'Elementary School Teacher',
          quote: 'As a teacher, I love how Play2Learn integrates interactive elements into lessons. My students are more engaged and retain information better.',
          image: 'https://via.placeholder.com/100x100?text=MG'
        },
        {
          id: 3,
          name: 'David Lee',
          role: 'High School Student',
          quote: 'Play2Learn helped me ace my math exams. The gamified challenges made studying addictive and effective. Highly recommend!',
          image: 'https://via.placeholder.com/100x100?text=DL'
        },
        {
          id: 4,
          name: 'Sophia Patel',
          role: 'Homeschooling Mom',
          quote: 'With Play2Learn, homeschooling is no longer a chore. The variety of subjects and adaptive difficulty keep my kids motivated every day.',
          image: 'https://via.placeholder.com/100x100?text=SP'
        }
      ]
    }
  },
  {
    type: 'pricing',
    title: 'Subscription Plans',
    content: 'Flexible licensing options for schools of all sizes',
    image_url: '',
    order: 6,
    is_visible: true,
    custom_data: {}
  },
  {
    type: 'contact',
    title: 'Contact & Support',
    content: '',
    image_url: '',
    order: 7,
    is_visible: true,
    custom_data: {}
  },
  {
    type: 'footer',
    title: '',
    content: '',
    image_url: '',
    order: 8,
    is_visible: true,
    custom_data: {}
  }
];

async function seedLandingPage() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if a landing page already exists
    const existingPage = await LandingPage.findOne();
    
    if (existingPage) {
      console.log('⚠️  Landing page already exists. Skipping seed.');
      console.log('To re-seed, delete existing landing pages first or use the admin panel to update.');
    } else {
      console.log('📝 Creating default landing page...');
      
      const landingPage = new LandingPage({
        blocks: defaultBlocks,
        is_active: true,
        version: 1
      });

      await landingPage.save();
      console.log('✅ Default landing page created successfully!');
      console.log(`   Created ${defaultBlocks.length} blocks`);
    }

    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding landing page:', error);
    process.exit(1);
  }
}

// Run the seeder
seedLandingPage();
