// Shared constants for license plans
// Used by both backend and frontend to ensure consistency

export const LICENSE_PLANS = {
  starter: { 
    teacher_limit: 50, 
    student_limit: 500, 
    price: 2500,
    name: 'Starter'
  },
  professional: { 
    teacher_limit: 100, 
    student_limit: 1000, 
    price: 5000,
    name: 'Professional'
  },
  enterprise: { 
    teacher_limit: 250, 
    student_limit: 2500, 
    price: 10000,
    name: 'Enterprise'
  }
};

export default LICENSE_PLANS;
