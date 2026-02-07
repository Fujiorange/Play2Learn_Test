/**
 * Testimonial Auto-Publishing Service
 * Automatically publishes 5-star positive testimonials to the landing page
 * Manages a maximum of 10 published testimonials
 */

const Testimonial = require('../models/Testimonial');

// Configuration
const MAX_PUBLISHED_TESTIMONIALS = parseInt(process.env.MAX_PUBLISHED_TESTIMONIALS || '10');
const AUTO_PUBLISH_RATING_THRESHOLD = 5;
const AUTO_PUBLISH_SENTIMENT = 'positive';

/**
 * Check if a testimonial meets auto-publishing criteria
 * @param {Object} testimonial - The testimonial document
 * @returns {boolean} - True if testimonial meets criteria
 */
function meetsAutoPublishCriteria(testimonial) {
  return (
    testimonial.rating === AUTO_PUBLISH_RATING_THRESHOLD &&
    testimonial.sentiment_label === AUTO_PUBLISH_SENTIMENT
  );
}

/**
 * Auto-publish testimonials that meet criteria
 * Manages the limit of published testimonials
 * @param {Object} testimonial - The newly created testimonial
 * @returns {Promise<Object>} - Result with published status and message
 */
async function processAutoPublish(testimonial) {
  try {
    // Check if testimonial meets auto-publish criteria
    if (!meetsAutoPublishCriteria(testimonial)) {
      return {
        auto_published: false,
        message: 'Testimonial does not meet auto-publish criteria'
      };
    }

    // Mark testimonial as published
    testimonial.published_to_landing = true;
    testimonial.auto_published = true;
    testimonial.published_date = new Date();
    testimonial.approved = true; // Auto-approve 5-star positive testimonials
    await testimonial.save();

    // Check current count of published testimonials
    const publishedCount = await Testimonial.countDocuments({
      published_to_landing: true
    });

    // If we exceed the limit, unpublish the oldest auto-published testimonial
    if (publishedCount > MAX_PUBLISHED_TESTIMONIALS) {
      const excessCount = publishedCount - MAX_PUBLISHED_TESTIMONIALS;
      
      // Find oldest auto-published testimonials to unpublish
      const toUnpublish = await Testimonial.find({
        published_to_landing: true,
        auto_published: true
      })
        .sort({ published_date: 1 }) // Oldest first
        .limit(excessCount);

      // Unpublish them
      for (const oldTestimonial of toUnpublish) {
        oldTestimonial.published_to_landing = false;
        oldTestimonial.auto_published = false;
        await oldTestimonial.save();
      }

      return {
        auto_published: true,
        message: `Testimonial auto-published. Unpublished ${excessCount} older testimonial(s) to maintain limit of ${MAX_PUBLISHED_TESTIMONIALS}`,
        unpublished_count: excessCount
      };
    }

    return {
      auto_published: true,
      message: 'Testimonial auto-published successfully'
    };
  } catch (error) {
    console.error('Error in auto-publish process:', error);
    return {
      auto_published: false,
      message: 'Failed to auto-publish testimonial',
      error: error.message
    };
  }
}

/**
 * Rebalance published testimonials to ensure we have up to MAX_PUBLISHED_TESTIMONIALS
 * This can be run periodically or manually to ensure optimal testimonial display
 * @returns {Promise<Object>} - Result with statistics
 */
async function rebalancePublishedTestimonials() {
  try {
    // Count currently published testimonials
    const currentPublished = await Testimonial.countDocuments({
      published_to_landing: true
    });

    // If we're at or above the limit, we're good
    if (currentPublished >= MAX_PUBLISHED_TESTIMONIALS) {
      return {
        success: true,
        message: `Already at maximum (${currentPublished}/${MAX_PUBLISHED_TESTIMONIALS})`,
        published_count: currentPublished
      };
    }

    // Find eligible testimonials that aren't published yet
    const slotsAvailable = MAX_PUBLISHED_TESTIMONIALS - currentPublished;
    const eligibleTestimonials = await Testimonial.find({
      rating: AUTO_PUBLISH_RATING_THRESHOLD,
      sentiment_label: AUTO_PUBLISH_SENTIMENT,
      published_to_landing: false
    })
      .sort({ created_at: -1 }) // Newest first
      .limit(slotsAvailable);

    // Publish them
    let publishedCount = 0;
    for (const testimonial of eligibleTestimonials) {
      testimonial.published_to_landing = true;
      testimonial.auto_published = true;
      testimonial.published_date = new Date();
      testimonial.approved = true;
      await testimonial.save();
      publishedCount++;
    }

    return {
      success: true,
      message: `Rebalanced: published ${publishedCount} additional testimonial(s)`,
      newly_published: publishedCount,
      total_published: currentPublished + publishedCount
    };
  } catch (error) {
    console.error('Error in rebalance process:', error);
    return {
      success: false,
      message: 'Failed to rebalance testimonials',
      error: error.message
    };
  }
}

/**
 * Get statistics about testimonials
 * @returns {Promise<Object>} - Statistics object
 */
async function getTestimonialStats() {
  try {
    const total = await Testimonial.countDocuments({});
    const published = await Testimonial.countDocuments({ published_to_landing: true });
    const autoPublished = await Testimonial.countDocuments({ auto_published: true });
    const manualPublished = await Testimonial.countDocuments({ 
      published_to_landing: true, 
      auto_published: false 
    });

    // Calculate average rating
    const avgRatingResult = await Testimonial.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;

    // Get sentiment distribution
    const sentimentDist = await Testimonial.aggregate([
      { $group: { _id: '$sentiment_label', count: { $sum: 1 } } }
    ]);

    const sentimentDistribution = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    sentimentDist.forEach(item => {
      sentimentDistribution[item._id] = item.count;
    });

    return {
      total_testimonials: total,
      published_count: published,
      auto_published_count: autoPublished,
      manual_published_count: manualPublished,
      average_rating: Math.round(avgRating * 10) / 10,
      sentiment_distribution: sentimentDistribution,
      slots_available: Math.max(0, MAX_PUBLISHED_TESTIMONIALS - published),
      max_published_limit: MAX_PUBLISHED_TESTIMONIALS
    };
  } catch (error) {
    console.error('Error getting testimonial stats:', error);
    throw error;
  }
}

module.exports = {
  processAutoPublish,
  rebalancePublishedTestimonials,
  getTestimonialStats,
  meetsAutoPublishCriteria,
  MAX_PUBLISHED_TESTIMONIALS
};
