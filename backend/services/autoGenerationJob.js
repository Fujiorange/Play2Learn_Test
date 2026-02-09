// Background Job Service for Automatic Quiz Generation
const { autoGenerateQuizzes } = require('./quizGenerationService');

// Store interval ID for cleanup
let generationInterval = null;

/**
 * Start the automatic quiz generation job
 * Runs every hour to check and generate quizzes
 */
function startAutoGenerationJob() {
  if (generationInterval) {
    console.log('⚠️  Auto-generation job already running');
    return;
  }
  
  console.log('🚀 Starting automatic quiz generation job (runs every hour)');
  
  // Run immediately on startup
  autoGenerateQuizzes().catch(error => {
    console.error('❌ Initial auto-generation failed:', error);
  });
  
  // Then run every hour (3600000 ms)
  generationInterval = setInterval(async () => {
    try {
      console.log('⏰ Hourly quiz auto-generation triggered');
      await autoGenerateQuizzes();
    } catch (error) {
      console.error('❌ Hourly auto-generation failed:', error);
    }
  }, 3600000); // 1 hour in milliseconds
  
  console.log('✅ Auto-generation job started successfully');
}

/**
 * Stop the automatic quiz generation job
 */
function stopAutoGenerationJob() {
  if (generationInterval) {
    clearInterval(generationInterval);
    generationInterval = null;
    console.log('🛑 Auto-generation job stopped');
  }
}

/**
 * Get job status
 */
function getJobStatus() {
  return {
    running: generationInterval !== null,
    intervalMs: 3600000,
    intervalHours: 1
  };
}

module.exports = {
  startAutoGenerationJob,
  stopAutoGenerationJob,
  getJobStatus
};
