// Sentiment Analysis Keywords
// Used for enhanced sentiment detection in testimonials

// POSITIVE SENTIMENT WORDS (350+)
const positiveKeywords = [
  // Excellence and quality
  'excellent', 'outstanding', 'exceptional', 'superb', 'magnificent', 'marvelous', 
  'wonderful', 'fantastic', 'terrific', 'phenomenal', 'remarkable', 'extraordinary', 
  'brilliant', 'stellar', 'first-rate', 'top-notch', 'premium', 'superior', 
  'high-quality', 'quality', 'premium-grade',
  
  // Basic positive adjectives
  'great', 'good', 'nice', 'fine', 'decent', 'solid', 'competent', 'satisfactory', 
  'adequate', 'acceptable', 'reasonable', 'fair', 'respectable', 'commendable', 
  'praiseworthy', 'admirable', 'laudable', 'esteemed', 'appreciated', 'like', 'love',
  'enjoy', 'enjoyed', 'enjoying',
  
  // Learning and comprehension
  'mastered', 'learned', 'understood', 'comprehended', 'grasped', 'absorbed', 
  'acquired', 'retained', 'memorized', 'recalled', 'applied', 'implemented', 
  'utilized', 'practiced', 'exercised', 'demonstrated', 'exhibited', 'accomplished', 
  'achieved', 'completed', 'finished', 'concluded', 'fulfilled',
  
  // Educational value
  'educational', 'instructive', 'informative', 'enlightening', 'illuminating', 
  'revealing', 'clarifying', 'explanatory', 'descriptive', 'detailed', 'thorough', 
  'comprehensive', 'exhaustive', 'complete', 'extensive', 'in-depth', 'profound', 
  'deep', 'substantial', 'meaningful', 'significant',
  
  // Skills and expertise
  'skillful', 'skilled', 'proficient', 'adept', 'capable', 'qualified', 'trained', 
  'educated', 'knowledgeable', 'expert', 'master', 'specialist', 'professional', 
  'seasoned', 'experienced', 'veteran',
  
  // Engagement and interest
  'engaging', 'captivating', 'absorbing', 'immersive', 'gripping', 'riveting', 
  'compelling', 'fascinating', 'interesting', 'intriguing', 'stimulating', 
  'thought-provoking', 'mind-expanding', 'eye-opening', 'entertaining', 'enjoyable', 
  'pleasurable', 'delightful', 'amusing', 'fun', 'recreational', 'leisure',
  
  // Usability and user experience
  'intuitive', 'user-friendly', 'easy-to-use', 'simple', 'straightforward', 
  'uncomplicated', 'effortless', 'smooth', 'seamless', 'fluid', 'flowing', 
  'responsive', 'fast', 'quick', 'speedy', 'efficient', 'effective', 'productive', 
  'time-saving', 'convenient', 'accessible', 'available', 'reachable', 'obtainable', 
  'attainable', 'achievable',
  
  // Organization and clarity
  'organized', 'structured', 'systematic', 'methodical', 'orderly', 'tidy', 'neat', 
  'clean', 'clear', 'lucid', 'transparent', 'understandable', 'comprehensible', 
  'coherent', 'logical', 'rational', 'sensible', 'practical', 'functional', 'usable', 
  'workable',
  
  // Support and guidance
  'helpful', 'supportive', 'assistive', 'guiding', 'directive', 'tutorial', 
  'mentoring', 'coaching', 'training', 'teaching', 'educating', 'attentive', 
  'caring', 'considerate', 'thoughtful', 'kind', 'friendly', 'warm', 'welcoming', 
  'hospitable', 'inviting',
  
  // Relevance and value
  'relevant', 'applicable', 'practical', 'useful', 'valuable', 'beneficial', 
  'advantageous', 'profitable', 'gainful', 'rewarding', 'fruitful', 'constructive', 
  'optimistic', 'hopeful', 'encouraging', 'motivating', 'inspiring', 'uplifting', 
  'empowering', 'enabling', 'facilitating', 'aiding', 'assisting',
  
  // Modern and innovative
  'modern', 'contemporary', 'current', 'up-to-date', 'recent', 'fresh', 'new', 
  'novel', 'innovative', 'creative', 'original', 'unique', 'distinctive', 'special', 
  'different', 'unusual', 'uncommon',
  
  // Credibility and trust
  'certified', 'accredited', 'recognized', 'approved', 'validated', 'verified', 
  'confirmed', 'authenticated', 'authorized', 'licensed', 'official', 'formal', 
  'legitimate', 'genuine',
  
  // Collaboration and community
  'collaborative', 'cooperative', 'interactive', 'participatory', 'social', 
  'communal', 'collective', 'shared', 'mutual', 'reciprocal',
  
  // Value for money
  'affordable', 'inexpensive', 'cheap', 'economical', 'budget-friendly', 
  'cost-effective', 'value-for-money', 'worthwhile', 'worthy', 'deserving', 
  'meritorious', 'justified', 'equitable',
  
  // Flexibility and customization
  'flexible', 'adaptable', 'adjustable', 'modifiable', 'customizable', 
  'personalized', 'tailored', 'individualized', 'specific', 'targeted', 'handy', 
  'ready',
  
  // Improvement and advancement
  'improved', 'enhanced', 'better', 'advanced', 'evolved', 'developed', 'grown', 
  'matured', 'refined', 'polished', 'perfected', 'optimized', 'maximized', 
  'increased', 'expanded', 'extended',
  
  // Recommendation and success
  'recommended', 'suggested', 'advised', 'endorsed', 'supported', 'backed', 
  'promoted', 'marketed', 'advertised', 'successful', 'triumphant', 'victorious', 
  'winning', 'prevailing', 'overcoming', 'conquering', 'dominating', 'leading',
  
  // Satisfaction and emotions
  'satisfied', 'pleased', 'content', 'happy', 'joyful', 'delighted', 'thrilled', 
  'excited', 'enthusiastic', 'eager', 'keen', 'interested', 'motivated', 'driven', 
  'determined', 'committed', 'dedicated',
  
  // Reliability and security
  'reliable', 'dependable', 'trustworthy', 'consistent', 'stable', 'secure', 'safe', 
  'protected', 'guarded', 'defended', 'robust', 'strong', 'powerful', 'potent',
  
  // Quality and compatibility
  'crisp', 'sharp', 'high-definition', 'hd', '4k', 'ultra-hd', 'surround', 'stereo', 
  'dolby', 'cinematic', 'theatrical', 'mobile-friendly', 'responsive-design', 
  'cross-platform', 'multi-device', 'compatible', 'interoperable', 'integrated',
  
  // Positive phrases (check these first to avoid double-counting)
  'highly recommend', 'strongly recommend', 'exceeded expectations',
  'great experience', 'amazing experience', 'wonderful experience',
  'love it', 'loved it', 'absolutely love', 'really love',
  'highly satisfied', 'very satisfied', 'extremely satisfied',
  'works great', 'works well', 'works perfectly'
];

// NEUTRAL SENTIMENT WORDS (100+)
const neutralKeywords = [
  // Action verbs
  'use', 'used', 'using', 'access', 'accessed', 'accessing', 'open', 'opened', 
  'opening', 'close', 'closed', 'closing', 'start', 'started', 'starting', 'stop', 
  'stopped', 'stopping', 'continue', 'continued', 'continuing', 'pause', 'paused', 
  'pausing',
  
  // Platform and interface terms
  'platform', 'website', 'application', 'app', 'software', 'program', 'system', 
  'interface', 'dashboard', 'portal', 'gateway', 'entry', 'page', 'screen', 
  'window', 'tab', 'panel', 'section', 'area', 'module',
  
  // Learning and educational terms
  'lesson', 'course', 'tutorial', 'guide', 'manual', 'documentation', 'instructions', 
  'directions', 'steps', 'procedures', 'study', 'studying', 'learn', 'learning', 
  'practice', 'practicing', 'review', 'reviewing', 'revise', 'revising', 'memorize', 
  'memorizing', 'understand', 'understanding', 'comprehend', 'comprehending', 
  'analyze', 'analyzing', 'evaluate', 'evaluating', 'assess', 'assessing',
  
  // Media and content types
  'video', 'audio', 'text', 'image', 'picture', 'graphic', 'animation', 'simulation',
  'quiz', 'test', 'exam', 'assignment', 'project', 'homework', 'exercise', 
  'activity', 'reading', 'writing', 'speaking', 'listening', 'watching',
  
  // Time references
  'today', 'yesterday', 'tomorrow', 'recently', 'previously', 'currently', 'now', 
  'then', 'soon', 'later', 'earlier', 'daily', 'weekly', 'monthly', 'yearly', 
  'annually', 'regularly', 'occasionally', 'sometimes', 'often', 'frequently', 
  'seldom', 'rarely', 'never', 'always', 'forever',
  
  // Quantity and measure
  'some', 'many', 'few', 'several', 'numerous', 'countless', 'all', 'none', 'any', 
  'every', 'each', 'both', 'either', 'neither', 'more', 'less', 'most', 'least', 
  'enough', 'sufficient', 'additional', 'extra', 'supplementary', 'complementary',
  
  // Status and state
  'unavailable', 'present', 'absent', 'existing', 'missing', 'incomplete', 
  'finished', 'unfinished', 'done', 'undone', 'unready', 'prepared', 'unprepared',
  
  // Technical actions
  'download', 'upload', 'install', 'uninstall', 'update', 'upgrade', 'configure', 
  'settings', 'preferences', 'options', 'choices', 'selection', 'decision', 
  'determination', 'resolution',
  
  // Feedback and communication
  'score', 'grade', 'rating', 'feedback', 'comment', 'suggestion', 'recommendation', 
  'advice', 'tip', 'hint', 'clue', 'indication', 'sign', 'marker', 'indicator', 
  'message', 'email', 'notification', 'alert', 'reminder', 'announcement', 
  'bulletin', 'news', 'information', 'data', 'details', 'particulars', 'specifics', 
  'facts', 'evidence',
  
  // General descriptors
  'basic', 'fundamental', 'essential', 'necessary', 'required', 'mandatory', 
  'optional', 'elective', 'voluntary', 'discretionary', 'standard', 'normal', 
  'regular', 'usual', 'typical', 'common', 'average', 'medium', 'intermediate', 
  'moderate'
];

// NEGATIVE SENTIMENT WORDS (300+)
const negativeKeywords = [
  // Quality and performance issues
  'poor', 'bad', 'terrible', 'awful', 'horrible', 'dreadful', 'atrocious', 'abysmal', 
  'appalling', 'deplorable', 'lousy', 'rotten', 'shoddy', 'inferior', 'substandard', 
  'second-rate', 'low-quality', 'tacky', 'flimsy', 'fragile', 'weak', 'feeble', 
  'insufficient',
  
  // Emotional negative responses
  'disappointing', 'dissatisfying', 'unsatisfying', 'frustrating', 'annoying', 
  'irritating', 'aggravating', 'exasperating', 'infuriating', 'maddening', 'enraging', 
  'outraging', 'offending', 'insulting', 'humiliating', 'embarrassing', 'shaming', 
  'disgracing',
  
  // Confusion and complexity
  'confusing', 'bewildering', 'baffling', 'perplexing', 'puzzling', 'mystifying', 
  'complicated', 'complex', 'convoluted', 'tangled', 'knotted', 'twisted', 'muddled', 
  'jumbled', 'disorganized', 'chaotic', 'messy', 'cluttered', 'untidy', 'disorderly',
  
  // Difficulty and effort
  'difficult', 'hard', 'challenging', 'arduous', 'strenuous', 'laborious', 'taxing', 
  'demanding', 'exhausting', 'draining', 'fatiguing', 'overwhelming', 'overpowering', 
  'crushing', 'burdensome', 'onerous', 'oppressive', 'unbearable', 'intolerable', 
  'insufferable',
  
  // Technical problems
  'buggy', 'glitchy', 'broken', 'malfunctioning', 'faulty', 'defective', 'flawed', 
  'imperfect', 'damaged', 'impaired', 'compromised', 'corrupted', 'infected', 
  'contaminated', 'polluted', 'tainted',
  
  // Performance issues
  'slow', 'laggy', 'sluggish', 'unresponsive', 'frozen', 'crashed', 'crashes', 
  'freezes', 'hangs', 'stalls', 'stops', 'fails',
  
  // Outdated and obsolete
  'outdated', 'obsolete', 'dated', 'old-fashioned', 'archaic', 'antiquated', 
  'ancient', 'old', 'aged', 'expired', 'past', 'former', 'previous', 'superseded', 
  'replaced', 'substituted', 'succeeded',
  
  // Boring and unengaging
  'boring', 'dull', 'tedious', 'monotonous', 'repetitive', 'redundant', 'repeating', 
  'looping', 'cyclic', 'routine', 'habitual', 'customary', 'uninteresting', 
  'unexciting', 'uninspiring', 'unmotivating', 'disinteresting', 'unappealing', 
  'unattractive', 'undesirable',
  
  // Inaccuracy and errors
  'inaccurate', 'incorrect', 'wrong', 'erroneous', 'mistaken', 'false', 'untrue', 
  'invalid', 'void', 'null', 'empty', 'blank', 'lacking', 'deficient', 'inadequate', 
  'scarce', 'rare', 'strange', 'odd',
  
  // Deception and dishonesty
  'misleading', 'deceptive', 'deceiving', 'tricking', 'fooling', 'cheating', 
  'swindling', 'defrauding', 'scamming', 'conning', 'dishonest', 'untruthful', 
  'lying', 'fraudulent', 'counterfeit', 'fake', 'phony', 'sham', 'bogus', 'artificial',
  
  // Irrelevance and disconnection
  'irrelevant', 'unrelated', 'unconnected', 'disconnected', 'separate', 'distinct', 
  'divergent', 'diverging', 'splitting', 'branching', 'forking', 'dividing', 
  'separating',
  
  // Lack of support
  'unhelpful', 'unsupportive', 'uncooperative', 'gone', 'away', 'departed', 'left', 
  'abandoned', 'deserted', 'forsaken', 'neglected', 'ignored', 'overlooked', 'missed', 
  'skipped', 'passed',
  
  // Cost and value issues
  'expensive', 'costly', 'pricey', 'high-priced', 'overpriced', 'exorbitant', 
  'extravagant', 'lavish', 'luxurious', 'wasteful', 'squandering', 'spending', 
  'consuming', 'useless', 'worthless', 'valueless', 'pointless', 'meaningless', 
  'senseless', 'absurd', 'ridiculous', 'ludicrous', 'preposterous',
  
  // Time and efficiency
  'time-consuming', 'lengthy', 'long', 'extended', 'prolonged', 'protracted', 
  'drawn-out', 'stretched', 'enlarged',
  
  // Inflexibility
  'inflexible', 'rigid', 'stiff', 'unbending', 'unyielding', 'uncompromising', 
  'stubborn', 'obstinate', 'pigheaded', 'dogmatic', 'doctrinaire', 'ideological', 
  'theoretical', 'limited', 'restricted', 'constrained', 'confined', 'bounded', 
  'circumscribed', 'delimited', 'defined', 'specified', 'stated',
  
  // Privacy and security
  'invasive', 'intrusive', 'prying', 'snooping', 'spying', 'eavesdropping', 
  'monitoring', 'watching', 'observing', 'tracking', 'following', 'pursuing', 
  'chasing', 'hunting',
  
  // Compatibility issues
  'incompatible', 'conflicting', 'clashing', 'contrasting', 'opposing', 
  'contradicting', 'denying', 'refuting', 'rejecting', 'refusing', 'declining',
  
  // Update and installation problems
  'broken-update', 'failed-update', 'corrupted-update', 'buggy-update', 
  'glitchy-update', 'slow-update',
  
  // Unprofessional behavior
  'rude', 'impolite', 'discourteous', 'disrespectful', 'insolent', 'impertinent', 
  'cheeky', 'sassy', 'fresh', 'unprofessional', 'amateurish', 'inexperienced', 
  'novice',
  
  // Content issues
  'outdated-content', 'irrelevant-content', 'incorrect-content', 'misleading-content', 
  'biased-content', 'partial-content', 'unbalanced-content', 'one-sided', 'partial',
  
  // Navigation problems
  'confusing-navigation', 'poor-navigation', 'bad-navigation', 'complicated-navigation', 
  'complex-navigation', 'difficult-navigation',
  
  // Loading and performance errors
  'slow-loading', 'never-loads', 'fails-to-load', 'loading-error', 'connection-error', 
  'network-error', 'server-error', 'timeout',
  
  // Installation issues
  'difficult-installation', 'failed-installation', 'corrupted-installation', 
  'incomplete-installation', 'partial-installation',
  
  // Account and access problems
  'login-problems', 'password-issues', 'account-locked', 'suspended-account', 
  'banned-account', 'deleted-account',
  
  // Payment and billing issues
  'billing-problems', 'payment-failed', 'overcharged', 'double-charged', 
  'unauthorized-charge', 'fraudulent-charge',
  
  // Security and privacy violations
  'data-breach', 'privacy-violation', 'information-leak', 'exposed-data', 
  'compromised-data', 'stolen-data',
  
  // Access restrictions
  'inaccessible', 'blocked', 'geoblocked', 'region-locked', 'country-restricted',
  
  // Emotional impact
  'demotivating', 'discouraging', 'disheartening', 'depressing', 'saddening', 
  'upsetting', 'distressing', 'troubling', 'worrisome', 'concerning', 'alarming', 
  'frightening', 'scary', 'terrifying', 'horrifying', 'petrifying',
  
  // Negative phrases (check these first to avoid double-counting)
  // Note: "not good", "not great" are NOT included here as per user requirement
  // Negated positive words should result in NEUTRAL sentiment, not negative
  'terrible experience', 'bad experience', 'worst experience', 'never again',
  'not recommended', 'dont recommend', "don't recommend", 
  'do not recommend', 'avoid', 'waste of time', 'waste of money',
  'not worth', 'not helpful', 'does not work', "doesn't work", 'didnt work', "didn't work"
];

/**
 * Analyze sentiment based on feedback text ONLY (ignoring star rating)
 * @param {string} message - The text to analyze
 * @param {number} rating - Star rating (1-5) - NOT USED for sentiment determination
 * @param {object} sentimentAnalyzer - Sentiment library instance
 * @returns {object} - { score: number, label: string }
 */
function analyzeSentiment(message, rating, sentimentAnalyzer) {
  // Constants for negation detection
  // We look back 30 characters to capture up to 5 words of context
  // This handles phrases like "I never had a good experience"
  const NEGATION_LOOKBACK_CHARS = 30;
  const MAX_NEGATION_DISTANCE_WORDS = 5;
  
  // The sentiment library typically assigns around -3 for negated positive words
  // (e.g., "not good" gets -3). We counteract this to achieve neutral sentiment.
  // This value is based on empirical testing with the 'sentiment' npm package v5.0.2
  const SENTIMENT_LIB_NEGATION_ADJUSTMENT = 3;
  
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
  
  // Define negation words
  const negationWords = [
    'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere', 'none',
    "don't", "doesn't", "didn't", "won't", "wouldn't", "shouldn't", "couldn't",
    "can't", "cannot", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't",
    "hadn't", 'without', 'lack', 'lacking', 'absent', 'barely', 'hardly', 'scarcely',
    'rarely', 'seldom'
  ];
  
  // Helper function to check if a keyword is preceded by a negation word
  const isPrecededByNegation = (index, keyword) => {
    // Look back in the text to find negation words
    const beforeText = lowerMessage.substring(Math.max(0, index - NEGATION_LOOKBACK_CHARS), index).trim();
    const words = beforeText.split(/\s+/);
    
    // Check recent words for negation (allows for phrases with distance between negation and keyword)
    const recentWords = words.slice(-MAX_NEGATION_DISTANCE_WORDS);
    return recentWords.some(word => negationWords.includes(word.replace(/[^\w']/g, '')));
  };
  
  // Check negative keywords (phrases first, then single words)
  const sortedNegativeKeywords = [...negativeKeywords].sort((a, b) => b.length - a.length);
  for (const keyword of sortedNegativeKeywords) {
    let index = lowerMessage.indexOf(keyword);
    while (index !== -1) {
      const end = index + keyword.length;
      if (!isOverlapping(index, end)) {
        // Check for negation before negative keyword (e.g., "not bad" becomes positive)
        const hasNegation = isPrecededByNegation(index, keyword);
        
        if (hasNegation) {
          // Negation of negative becomes positive
          sentimentScore += 5;
        } else {
          // Weight negative keywords more heavily (5 instead of 3)
          sentimentScore -= 5;
        }
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
        // Check for negation before positive keyword (e.g., "not good")
        const hasNegation = isPrecededByNegation(index, keyword);
        
        if (hasNegation) {
          // Negation of positive word results in NEUTRAL sentiment
          // The sentiment library already gave this a negative score (e.g., -3 for "not good")
          // We need to counteract that to make it neutral
          sentimentScore += SENTIMENT_LIB_NEGATION_ADJUSTMENT;
        } else {
          // Weight positive keywords more heavily (5 instead of 3)
          sentimentScore += 5;
        }
        matchedRanges.push([index, end]);
      }
      index = lowerMessage.indexOf(keyword, end);
    }
  }
  
  // Note: Neutral keywords are tracked for reference but don't affect sentiment score
  // They help in understanding the context but don't shift sentiment
  
  // Determine sentiment label based ONLY on text analysis
  // Star rating is NOT considered per user request
  let sentimentLabel = 'neutral';
  
  if (sentimentScore > 2) {
    sentimentLabel = 'positive';
  } else if (sentimentScore < -2) {
    sentimentLabel = 'negative';
  }
  
  return {
    score: sentimentScore,
    label: sentimentLabel
  };
}

module.exports = {
  negativeKeywords,
  positiveKeywords,
  neutralKeywords,
  analyzeSentiment
};
