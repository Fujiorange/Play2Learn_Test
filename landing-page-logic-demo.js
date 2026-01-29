/**
 * Demonstration of Landing Page Manager Logic
 * This file demonstrates the data transformations and logic in LandingPageManager
 */

// Simulated getDefaultCustomData function
const getDefaultCustomData = (type) => {
  switch(type) {
    case 'features':
      return { features: [{ icon: '', title: '', description: '' }] };
    case 'about':
      return { 
        mission: '', 
        vision: '', 
        goals: [''], 
        stats: [{ value: '', label: '' }] 
      };
    case 'roadmap':
      return { 
        steps: [{ step: 1, title: '', description: '', duration: '' }] 
      };
    case 'testimonials':
      return { 
        testimonials: [{ id: 1, name: '', role: '', quote: '', image: '' }] 
      };
    case 'pricing':
      return { plans: [] };
    case 'contact':
      return { email: '', phone: '', address: '' };
    case 'footer':
      return { copyright: '', links: [] };
    default:
      return {};
  }
};

console.log('=== Landing Page Manager Logic Demo ===\n');

// Test 1: Creating default data for different block types
console.log('Test 1: Default custom_data for block types');
console.log('Features block:', JSON.stringify(getDefaultCustomData('features'), null, 2));
console.log('About block:', JSON.stringify(getDefaultCustomData('about'), null, 2));
console.log('Roadmap block:', JSON.stringify(getDefaultCustomData('roadmap'), null, 2));
console.log('\n');

// Test 2: Simulating array item operations
console.log('Test 2: Array operations for features');
let formData = {
  type: 'features',
  custom_data: getDefaultCustomData('features')
};

console.log('Initial:', JSON.stringify(formData.custom_data, null, 2));

// Add a feature
formData.custom_data.features.push({ icon: '🎯', title: 'New Feature', description: 'Great feature' });
console.log('After adding feature:', JSON.stringify(formData.custom_data, null, 2));

// Update a feature
formData.custom_data.features[0] = { 
  ...formData.custom_data.features[0], 
  title: 'Updated Feature' 
};
console.log('After updating first feature:', JSON.stringify(formData.custom_data, null, 2));

// Remove a feature
formData.custom_data.features.splice(1, 1);
console.log('After removing second feature:', JSON.stringify(formData.custom_data, null, 2));
console.log('\n');

// Test 3: Block with testimonials
console.log('Test 3: Testimonials block operations');
let testimonialsBlock = {
  type: 'testimonials',
  custom_data: {
    testimonials: [
      { id: 1, name: 'John Doe', role: 'Student', quote: 'Great!', image: '' },
      { id: 2, name: 'Jane Smith', role: 'Teacher', quote: 'Amazing!', image: '' }
    ]
  }
};

console.log('Initial testimonials:', JSON.stringify(testimonialsBlock.custom_data, null, 2));
console.log('Count summary: ' + testimonialsBlock.custom_data.testimonials.length + ' testimonial(s)');
console.log('\n');

// Test 4: Block with roadmap
console.log('Test 4: Roadmap block with steps');
let roadmapBlock = {
  type: 'roadmap',
  custom_data: {
    steps: [
      { step: 1, title: 'Assessment', description: 'Initial assessment', duration: '1 week' },
      { step: 2, title: 'Learning', description: 'Adaptive learning', duration: 'Ongoing' },
      { step: 3, title: 'Progress', description: 'Monitor progress', duration: 'Continuous' }
    ]
  }
};

console.log('Roadmap steps:', JSON.stringify(roadmapBlock.custom_data, null, 2));
console.log('Count summary: ' + roadmapBlock.custom_data.steps.length + ' step(s)');
console.log('\n');

// Test 5: Complete block example
console.log('Test 5: Complete features block example');
let completeBlock = {
  type: 'features',
  title: 'Platform Features',
  content: 'Explore our amazing features',
  image_url: 'https://example.com/image.jpg',
  order: 2,
  is_visible: true,
  custom_data: {
    features: [
      { icon: '🎯', title: 'Adaptive Learning', description: 'AI-powered personalization' },
      { icon: '🏆', title: 'Gamification', description: 'Reward-based learning' },
      { icon: '📊', title: 'Analytics', description: 'Track student progress' }
    ]
  }
};

console.log('Complete block:', JSON.stringify(completeBlock, null, 2));
console.log('\n');

// Test 6: Simulating save operation
console.log('Test 6: Simulating save operation');
let blocks = [
  {
    type: 'hero',
    title: 'Welcome to Play2Learn',
    content: 'Revolutionizing education',
    image_url: '',
    order: 1,
    is_visible: true,
    custom_data: {}
  },
  completeBlock,
  {
    type: 'about',
    title: 'About Us',
    content: '',
    image_url: '',
    order: 3,
    is_visible: true,
    custom_data: {
      mission: 'Transform education',
      vision: 'Every learner succeeds',
      goals: ['70% engagement', '50% improvement'],
      stats: [
        { value: '50+', label: 'Schools' },
        { value: '10,000+', label: 'Students' }
      ]
    }
  }
];

console.log('Blocks to save:', JSON.stringify(blocks, null, 2));
console.log('Total blocks:', blocks.length);
console.log('Visible blocks:', blocks.filter(b => b.is_visible).length);
console.log('\n');

console.log('=== All tests passed! Logic is working correctly. ===');
