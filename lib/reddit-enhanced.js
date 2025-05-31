// lib/reddit-enhanced.js - Module Reddit premium pour Silver Birch LeadGen
// Intégration transparente avec les autres sources de données

const axios = require('axios');

// Configuration Reddit premium
const REDDIT_ENHANCED_CONFIG = {
  // Subreddits B2B avec pondération par qualité de leads
  TARGET_SUBREDDITS: {
    'business': { weight: 3, focus: 'general_b2b', monthly_posts: 15000 },
    'entrepreneur': { weight: 4, focus: 'growth_needs', monthly_posts: 12000 },
    'smallbusiness': { weight: 5, focus: 'immediate_purchases', monthly_posts: 8000 },
    'investing': { weight: 3, focus: 'funding_signals', monthly_posts: 20000 },
    'startups': { weight: 4, focus: 'service_needs', monthly_posts: 10000 },
    'marketing': { weight: 3, focus: 'agency_needs', monthly_posts: 5000 },
    'sales': { weight: 4, focus: 'tool_purchases', monthly_posts: 4000 },
    'consulting': { weight: 3, focus: 'expertise_needs', monthly_posts: 3000 }
  },
  
  DELAYS: {
    between_subreddits: 2000,
    auth_retry: 5000,
    search_timeout: 20000
  }
};

// Algorithme d'analyse d'intention avancé
const INTENT_DETECTION = {
  // Signaux d'achat immédiat (score maximum)
  immediate_purchase: {
    keywords: [
      'need urgently', 'looking to buy', 'ready to purchase', 'budget approved', 
      'need asap', 'hiring immediately', 'contract ready', 'closing this month'
    ],
    score_boost: 12,
    urgency: 'critical'
  },
  
  // Recherche active avec budget (score très élevé)
  active_with_budget: {
    keywords: [
      'budget of', 'willing to spend', 'allocated $', 'price range up to',
      'investment of', 'looking for quotes', 'rfi for', 'rfp for'
    ],
    score_boost: 10,
    urgency: 'high'
  },
  
  // Évaluation de solutions (score élevé)
  solution_evaluation: {
    keywords: [
      'comparing options', 'evaluating', 'shortlisted', 'demo scheduled',
      'trial period', 'pilot program', 'poc', 'proof of concept'
    ],
    score_boost: 8,
    urgency: 'high'
  },
  
  // Recherche générale (score moyen)
  general_search: {
    keywords: [
      'looking for', 'need recommendations', 'anyone know', 'suggestions for',
      'help finding', 'advice on', 'experiences with'
    ],
    score_boost: 6,
    urgency: 'medium'
  },
  
  // Signaux de croissance (score moyen, mais important pour timing)
  growth_indicators: {
    keywords: [
      'expanding', 'growing team', 'scaling up', 'new office', 'hiring',
      'raised funding', 'series a', 'series b', 'just closed round'
    ],
    score_boost: 7,
    urgency: 'medium'
  }
};

// Détecter taille d'entreprise et sophistication
const BUSINESS_INDICATORS = {
  startup: { keywords: ['startup', 'founding', 'early stage'], size: '1-10', sophistication: 'high' },
  small_business: { keywords: ['small business', 'family business'], size: '10-50', sophistication: 'medium' },
  growing_company: { keywords: ['growing company', 'expanding business'], size: '50-200', sophistication: 'high' },
  enterprise: { keywords: ['enterprise', 'corporation', 'large company'], size: '200+', sophistication: 'very_high' }
};

// Analyse d'intention premium pour posts Reddit
function analyzeRedditIntentionPremium(post, query) {
  const fullText = `${post.title} ${post.selftext || ''}`.toLowerCase();
  
  let analysis = {
    overall_score: 0,
    confidence: 0,
    urgency_level: 'low',
    contact_readiness: 0,
    business_context: {
      size_indicators: [],
      sophistication_level: 'unknown',
      industry_hints: []
    },
    geographic_signals: {
      locations: [],
      market_focus: 'unknown'
    },
    financial_indicators: {
      budget_hints: [],
      funding_status: 'unknown',
      purchase_authority: 'unknown'
    },
    engagement_quality: {
      post_quality: 0,
      community_response: 0,
      author_credibility: 0
    },
    outreach_strategy: {
      email_hook: '',
      approach_type: 'cold',
      timing_recommendation: 'immediate'
    }
  };
  
  // 1. Analyser les signaux d'intention avec l'algorithme avancé
  Object.entries(INTENT_DETECTION).forEach(([category, config]) => {
    config.keywords.forEach(keyword => {
      if (fullText.includes(keyword)) {
        analysis.overall_score += config.score_boost;
        if (config.urgency === 'critical') analysis.urgency_level = 'critical';
        else if (config.urgency === 'high' && analysis.urgency_level !== 'critical') analysis.urgency_level = 'high';
        else if (config.urgency === 'medium' && !['critical', 'high'].includes(analysis.urgency_level)) analysis.urgency_level = 'medium';
      }
    });
  });
  
  // 2. Analyser le contexte business
  Object.entries(BUSINESS_INDICATORS).forEach(([type, config]) => {
    config.keywords.forEach(keyword => {
      if (fullText.includes(keyword)) {
        analysis.business_context.size_indicators.push({
          type,
          estimated_size: config.size,
          sophistication: config.sophistication
        });
      }
    });
  });
  
  // 3. Détection géographique avancée (focus Canada/US)
  const geoPatterns = {
    canada: {
      cities: ['toronto', 'vancouver', 'montreal', 'calgary', 'ottawa', 'edmonton', 'quebec city', 'winnipeg'],
      provinces: ['ontario', 'bc', 'british columbia', 'alberta', 'quebec', 'manitoba', 'saskatchewan'],
      general: ['canada', 'canadian']
    },
    usa: {
      cities: ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose', 'seattle', 'boston'],
      states: ['california', 'texas', 'florida', 'new york', 'pennsylvania'],
      general: ['usa', 'united states', 'america', 'american']
    }
  };
  
  Object.entries(geoPatterns).forEach(([country, patterns]) => {
    Object.entries(patterns).forEach(([type, locations]) => {
      locations.forEach(location => {
        if (fullText.includes(location)) {
          analysis.geographic_signals.locations.push({
            country,
            location,
            type,
            market_relevance: country === 'canada' ? 'primary' : 'secondary'
          });
          analysis.overall_score += country === 'canada' ? 3 : 2; // Bonus pour marché cible
        }
      });
    });
  });
  
  // 4. Analyse financière sophistiquée
  // Détection de budgets avec extraction de montants
  const budgetPatterns = [
    /budget\s*(?:of|around|approximately)?\s*\$?([\d,]+k?)/gi,
    /willing to spend\s*\$?([\d,]+k?)/gi,
    /allocated\s*\$?([\d,]+k?)/gi,
    /price range.*?\$?([\d,]+k?)/gi,
    /investment.*?\$?([\d,]+k?)/gi
  ];
  
  budgetPatterns.forEach(pattern => {
    const matches = [...fullText.matchAll(pattern)];
    matches.forEach(match => {
      analysis.financial_indicators.budget_hints.push({
        raw_text: match[0],
        estimated_amount: match[1],
        confidence: 0.8
      });
      analysis.overall_score += 8; // Gros bonus pour budget explicite
    });
  });
  
  // Signaux de financement
  const fundingKeywords = ['raised funding', 'series a', 'series b', 'seed round', 'investment', 'venture capital', 'vc funded'];
  fundingKeywords.forEach(keyword => {
    if (fullText.includes(keyword)) {
      analysis.financial_indicators.funding_status = 'funded';
      analysis.overall_score += 5;
    }
  });
  
  // 5. Qualité de l'engagement
  // Qualité du post (longueur, détails, structure)
  analysis.engagement_quality.post_quality = Math.min(10, Math.floor(
    (post.title.length / 10) + 
    ((post.selftext?.length || 0) / 50) + 
    (post.title.includes('?') ? 2 : 0) +
    (fullText.split(' ').length > 50 ? 3 : 0)
  ));
  
  // Réponse de la communauté
  analysis.engagement_quality.community_response = Math.min(10, Math.floor(
    (post.num_comments / 3) + 
    (post.score / 5) + 
    (post.upvote_ratio * 3)
  ));
  
  // 6. Calcul de contact readiness sophistiqué
  let contactScore = 0;
  
  // Bonus pour engagement élevé
  contactScore += Math.min(3, post.num_comments / 5);
  contactScore += Math.min(2, post.score / 10);
  contactScore += post.upvote_ratio > 0.8 ? 1 : 0;
  
  // Bonus pour questions directes et signaux d'urgence
  contactScore += post.title.includes('?') ? 2 : 0;
  contactScore += ['urgent', 'asap', 'immediately', 'now'].some(word => fullText.includes(word)) ? 3 : 0;
  contactScore += ['dm me', 'contact me', 'reach out'].some(phrase => fullText.includes(phrase)) ? 4 : 0;
  
  // Bonus pour contexte business professionnel
  contactScore += analysis.business_context.size_indicators.length > 0 ? 2 : 0;
  contactScore += analysis.financial_indicators.budget_hints.length > 0 ? 3 : 0;
  
  analysis.contact_readiness = Math.min(10, contactScore);
  
  // 7. Stratégie d'approche personnalisée
  if (analysis.financial_indicators.budget_hints.length > 0) {
    analysis.outreach_strategy.email_hook = `Regarding your Reddit question about solutions within your ${analysis.financial_indicators.budget_hints[0].estimated_amount} budget`;
    analysis.outreach_strategy.approach_type = 'warm_budget';
  } else if (analysis.geographic_signals.locations.length > 0) {
    const location = analysis.geographic_signals.locations[0].location;
    analysis.outreach_strategy.email_hook = `Fellow ${location} business owner - saw your Reddit post about ${query}`;
    analysis.outreach_strategy.approach_type = 'warm_geographic';
  } else if (analysis.urgency_level === 'critical') {
    analysis.outreach_strategy.email_hook = `Saw your urgent request on r/${post.subreddit} - we can help with ${query}`;
    analysis.outreach_strategy.approach_type = 'urgent_response';
  } else {
    analysis.outreach_strategy.email_hook = `Noticed your thoughtful question on r/${post.subreddit} about ${query}`;
    analysis.outreach_strategy.approach_type = 'professional';
  }
  
  // Timing recommendation
  if (analysis.urgency_level === 'critical') analysis.outreach_strategy.timing_recommendation = 'immediate';
  else if (analysis.urgency_level === 'high') analysis.outreach_strategy.timing_recommendation = 'within_24h';
  else analysis.outreach_strategy.timing_recommendation = 'within_week';
  
  // 8. Calcul de confidence global
  analysis.confidence = Math.min(100, Math.floor(
    (analysis.overall_score / 20 * 40) + // 40% based on intent score
    (analysis.engagement_quality.post_quality * 3) + // 30% based on post quality
    (analysis.engagement_quality.community_response * 2) + // 20% based on community response
    (analysis.contact_readiness) // 10% based on contact readiness
  ));
  
  return analysis;
}

// Fonction principale d'enrichissement Reddit (intégrée aux autres sources)
async function enhanceRedditData(basicRedditPosts, query) {
  if (!basicRedditPosts || basicRedditPosts.length === 0) {
    return basicRedditPosts;
  }
  
  console.log('🧠 Applying Reddit premium analysis...');
  
  const enhancedPosts = basicRedditPosts.map(post => {
    const premiumAnalysis = analyzeRedditIntentionPremium(post, query);
    
    return {
      ...post,
      // Données premium ajoutées
      intent_analysis: premiumAnalysis,
      intent_score: Math.min(10, Math.round(premiumAnalysis.overall_score / 2)), // Normaliser sur 10
      confidence_score: premiumAnalysis.confidence,
      contact_readiness: premiumAnalysis.contact_readiness,
      urgency_level: premiumAnalysis.urgency_level,
      
      // Signaux business structurés
      business_signals: premiumAnalysis.business_context.size_indicators,
      location_hints: premiumAnalysis.geographic_signals.locations.map(l => l.location),
      budget_hints: premiumAnalysis.financial_indicators.budget_hints.map(b => b.raw_text),
      
      // Stratégie d'approche
      email_hook: premiumAnalysis.outreach_strategy.email_hook,
      approach_type: premiumAnalysis.outreach_strategy.approach_type,
      timing_recommendation: premiumAnalysis.outreach_strategy.timing_recommendation,
      
      // Métadonnées premium
      analysis_timestamp: new Date().toISOString(),
      premium_analyzed: true,
      type: 'reddit_premium'
    };
  });
  
  // Trier par score d'intention et confidence
  enhancedPosts.sort((a, b) => {
    const scoreA = (a.intent_score * 0.6) + (a.confidence_score * 0.4);
    const scoreB = (b.intent_score * 0.6) + (b.confidence_score * 0.4);
    return scoreB - scoreA;
  });
  
  console.log(`✅ Reddit premium analysis complete: ${enhancedPosts.filter(p => p.intent_score >= 6).length}/${enhancedPosts.length} high-intent posts`);
  
  return enhancedPosts;
}

// Export pour intégration avec fetchData.js
module.exports = {
  enhanceRedditData,
  analyzeRedditIntentionPremium,
  REDDIT_ENHANCED_CONFIG,
  INTENT_DETECTION,
  BUSINESS_INDICATORS
};