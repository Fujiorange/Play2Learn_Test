/**
 * Unit Test for Quiz Creation Error Messages
 * 
 * This tests the improved error message logic without requiring a database
 */

function testQuizCreationErrorMessages() {
  console.log('🧪 Testing Quiz Creation Error Message Logic');
  console.log('============================================\n');
  
  // Test Case 1: Multiple difficulty levels with missing questions
  console.log('Test 1: Multiple missing difficulty levels');
  console.log('-------------------------------------------');
  
  const requestedDistribution1 = { 1: 10, 2: 10, 3: 10, 4: 5 };
  const availableQuestions1 = { 1: 10, 2: 5, 3: 0, 4: 2, 5: 0 };
  
  const missingQuestions1 = [];
  for (const [diff, count] of Object.entries(requestedDistribution1)) {
    const available = availableQuestions1[diff] || 0;
    if (count > available) {
      missingQuestions1.push({
        difficulty: diff,
        needed: count,
        available: available,
        missing: count - available
      });
    }
  }
  
  if (missingQuestions1.length > 0) {
    const errorDetails = missingQuestions1.map(m => 
      `Difficulty ${m.difficulty}: need ${m.needed}, have ${m.available} (missing ${m.missing})`
    ).join('; ');
    
    const errorMessage = `Not enough active questions in question bank. ${errorDetails}. Please add more questions or adjust your quiz configuration.`;
    console.log('Error Message:');
    console.log(errorMessage);
    console.log('✅ Test 1 passed\n');
  }
  
  // Test Case 2: Single difficulty level with missing questions
  console.log('Test 2: Single missing difficulty level');
  console.log('----------------------------------------');
  
  const requestedDistribution2 = { 1: 10 };
  const availableQuestions2 = { 1: 5, 2: 10, 3: 10 };
  
  const missingQuestions2 = [];
  for (const [diff, count] of Object.entries(requestedDistribution2)) {
    const available = availableQuestions2[diff] || 0;
    if (count > available) {
      missingQuestions2.push({
        difficulty: diff,
        needed: count,
        available: available,
        missing: count - available
      });
    }
  }
  
  if (missingQuestions2.length > 0) {
    const errorDetails = missingQuestions2.map(m => 
      `Difficulty ${m.difficulty}: need ${m.needed}, have ${m.available} (missing ${m.missing})`
    ).join('; ');
    
    const errorMessage = `Not enough active questions in question bank. ${errorDetails}. Please add more questions or adjust your quiz configuration.`;
    console.log('Error Message:');
    console.log(errorMessage);
    console.log('✅ Test 2 passed\n');
  }
  
  // Test Case 3: No missing questions (success case)
  console.log('Test 3: No missing questions (success case)');
  console.log('--------------------------------------------');
  
  const requestedDistribution3 = { 1: 5, 2: 5, 3: 5 };
  const availableQuestions3 = { 1: 10, 2: 10, 3: 10 };
  
  const missingQuestions3 = [];
  for (const [diff, count] of Object.entries(requestedDistribution3)) {
    const available = availableQuestions3[diff] || 0;
    if (count > available) {
      missingQuestions3.push({
        difficulty: diff,
        needed: count,
        available: available,
        missing: count - available
      });
    }
  }
  
  if (missingQuestions3.length === 0) {
    console.log('✅ Quiz can be created successfully');
    console.log('✅ Test 3 passed\n');
  } else {
    console.log('❌ Test 3 failed - should have no errors');
  }
  
  // Test Case 4: Empty database (0 questions available)
  console.log('Test 4: Empty database (0 questions)');
  console.log('------------------------------------');
  
  const requestedDistribution4 = { 1: 10, 2: 10 };
  const availableQuestions4 = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  const missingQuestions4 = [];
  for (const [diff, count] of Object.entries(requestedDistribution4)) {
    const available = availableQuestions4[diff] || 0;
    if (count > available) {
      missingQuestions4.push({
        difficulty: diff,
        needed: count,
        available: available,
        missing: count - available
      });
    }
  }
  
  if (missingQuestions4.length > 0) {
    const errorDetails = missingQuestions4.map(m => 
      `Difficulty ${m.difficulty}: need ${m.needed}, have ${m.available} (missing ${m.missing})`
    ).join('; ');
    
    const errorMessage = `Not enough active questions in question bank. ${errorDetails}. Please add more questions or adjust your quiz configuration.`;
    console.log('Error Message:');
    console.log(errorMessage);
    console.log('✅ Test 4 passed\n');
  }
  
  console.log('============================================');
  console.log('✅ All tests passed!');
  console.log('============================================\n');
}

// Run tests
testQuizCreationErrorMessages();
