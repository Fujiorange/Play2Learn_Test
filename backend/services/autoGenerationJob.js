// Background Job Service for Automatic Quiz Generation
const { autoGenerateQuizzes } = require('./quizGenerationService');

// Configuration
const AUTO_GENERATION_INTERVAL_MS = parseInt(process.env.AUTO_GENERATION_INTERVAL_MS || '3600000', 10); // Default: 1 hour
const AUTO_GENERATION_INTERVAL_HOURS = AUTO_GENERATION_INTERVAL_MS / 3600000;

// Store interval ID for cleanup
let generationInterval = null;

/**
 * Start the automatic quiz generation job
 * Runs at configured interval to check and generate quizzes
 */
function startAutoGenerationJob() {
  if (generationInterval) {
    console.log('⚠️  Auto-generation job already running');
    return;
  }
  
  console.log(`🚀 Starting automatic quiz generation job (runs every ${AUTO_GENERATION_INTERVAL_HOURS} hour(s))`);
  
  // Run immediately on startup
  autoGenerateQuizzes().catch(error => {
    console.error('❌ Initial auto-generation failed:', error);
  });
  
  // Then run at configured interval
  generationInterval = setInterval(async () => {
    try {
      console.log('⏰ Scheduled quiz auto-generation triggered');
      await autoGenerateQuizzes();
    } catch (error) {
      console.error('❌ Scheduled auto-generation failed:', error);
    }
  }, AUTO_GENERATION_INTERVAL_MS);
  
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
    intervalMs: AUTO_GENERATION_INTERVAL_MS,
    intervalHours: AUTO_GENERATION_INTERVAL_HOURS
  };
}

module.exports = {
  startAutoGenerationJob,
  stopAutoGenerationJob,
  getJobStatus
};
