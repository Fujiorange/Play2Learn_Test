// Sentiment Analysis Keywords
// Used for enhanced sentiment detection in testimonials

const negativeKeywords = [
  // Strong negative words
  'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike',
  'poor', 'disappointing', 'frustrated', 'useless', 'waste', 'broken',
  'annoying', 'confusing', 'difficult', 'hard', 'problem', 'issue',
  'bad', 'regret', 'unhappy', 'dissatisfied', 'disappointed',
  
  // Negative phrases (order matters - check these first to avoid double-counting)
  'terrible experience', 'bad experience', 'worst experience', 'never again',
  'not good', 'not great', 'not recommended', 'dont recommend', 'avoid'
];

const positiveKeywords = [
  // Strong positive words
  'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
  'best', 'awesome', 'brilliant', 'outstanding', 'perfect', 'superb',
  'great', 'impressed', 'satisfied', 'happy', 'pleased', 'delighted', 'thrilled',
  
  // Positive phrases (order matters - check these first to avoid double-counting)
  'highly recommend', 'exceeded expectations',
  'great experience', 'amazing experience', 'wonderful experience',
  'recommend'
];

/**
 * Analyze sentiment with keyword detection, avoiding double-counting of overlapping phrases
 * @param {string} message - The text to analyze
 * @param {number} rating - Star rating (1-5)
 * @param {object} sentimentAnalyzer - Sentiment library instance
 * @returns {object} - { score: number, label: string }
 */
function analyzeSentiment(message, rating, sentimentAnalyzer) {
  // Base sentiment from library
  const sentimentResult = sentimentAnalyzer.analyze(message);
  let sentimentScore = sentimentResult.score;
  
  const lowerMessage = message.toLowerCase();
  
  // Track which parts of the message have been matched to avoid double-counting
  let matchedRanges = [];
  
  // Helper to check if a position overlaps with already matched ranges
  const isOverlapping = (start, end) => {
    return matchedRanges.some(([s, e]) => 
      (start >= s && start < e) || (end > s && end <= e) || (start <= s && end >= e)
    );
  };
  
  // Check negative keywords (phrases first, then single words)
  const sortedNegativeKeywords = [...negativeKeywords].sort((a, b) => b.length - a.length);
  for (const keyword of sortedNegativeKeywords) {
    let index = lowerMessage.indexOf(keyword);
    while (index !== -1) {
      const end = index + keyword.length;
      if (!isOverlapping(index, end)) {
        sentimentScore -= 3;
        matchedRanges.push([index, end]);
      }
      index = lowerMessage.indexOf(keyword, end);
    }
  }
  
  // Check positive keywords (phrases first, then single words)
  const sortedPositiveKeywords = [...positiveKeywords].sort((a, b) => b.length - a.length);
  for (const keyword of sortedPositiveKeywords) {
    let index = lowerMessage.indexOf(keyword);
    while (index !== -1) {
      const end = index + keyword.length;
      if (!isOverlapping(index, end)) {
        sentimentScore += 3;
        matchedRanges.push([index, end]);
      }
      index = lowerMessage.indexOf(keyword, end);
    }
  }
  
  // Add minor adjustment based on rating (10% weight)
  const ratingAdjustment = (rating - 3) * 0.5;
  sentimentScore += ratingAdjustment;
  
  // Determine sentiment label
  let sentimentLabel = 'neutral';
  if (sentimentScore > 1) sentimentLabel = 'positive';
  else if (sentimentScore < -1) sentimentLabel = 'negative';
  
  return {
    score: sentimentScore,
    label: sentimentLabel
  };
}

module.exports = {
  negativeKeywords,
  positiveKeywords,
  analyzeSentiment
};
