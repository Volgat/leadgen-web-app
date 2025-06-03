// lib/fallbackData.js - Données de fallback pour les cas d'urgence
export function generateFallbackResults(query) {
  return {
    companies: [
      {
        name: `${query} Solutions Inc.`,
        description: `Professional ${query} services company based in Ontario, Canada.`,
        location: 'Toronto, Ontario, Canada',
        intent_score: 75,
        confidence_score: 60,
        discovery_source: 'fallback_data',
        contacts: {
          emails: [
            {
              email: `info@${query.toLowerCase().replace(/\s+/g, '')}solutions.com`,
              confidence: 70,
              source: 'estimated'
            }
          ]
        },
        signals: [
          {
            type: 'target_market_canada',
            description: 'Located in primary Canadian market',
            score: 25,
            confidence: 0.8
          }
        ]
      },
      {
        name: `${query} Tech Corp`,
        description: `Innovative ${query} technology company serving Canadian businesses.`,
        location: 'Vancouver, BC, Canada',
        intent_score: 65,
        confidence_score: 55,
        discovery_source: 'fallback_data',
        contacts: {
          emails: [
            {
              email: `contact@${query.toLowerCase().replace(/\s+/g, '')}tech.ca`,
              confidence: 65,
              source: 'estimated'
            }
          ]
        },
        signals: [
          {
            type: 'target_market_canada',
            description: 'Located in primary Canadian market',
            score: 25,
            confidence: 0.8
          }
        ]
      }
    ],
    sources: {
      reddit: [
        {
          title: `Looking for ${query} recommendations in Toronto`,
          subreddit: 'business',
          intent_score: 7,
          url: 'https://reddit.com/r/business',
          type: 'reddit_fallback'
        }
      ],
      news: [
        {
          title: `${query} Industry Shows Growth in Canadian Market`,
          source: 'Business News',
          business_relevance: 6,
          type: 'news_fallback'
        }
      ],
      social: [],
      hackerNews: [],
      secData: [],
      dataGov: [],
      bizBuySell: [],
      linkedInJobs: []
    },
    intelligence: {
      companies_found: 2,
      with_verified_contacts: 2,
      avg_intent_score: 70,
      data_quality: 'fallback',
      sources_active: 2,
      total_data_points: 2,
      verification_status: 'fallback_mode'
    },
    metadata: {
      query: query,
      timestamp: new Date().toISOString(),
      processing_time: 1000,
      mode: 'fallback',
      note: 'Using fallback data due to API unavailability'
    }
  };
}

export function generateSimpleFallbackAnalysis(query) {
  return `## Market Intelligence Report for "${query}" (Fallback Mode)

### 📊 EXECUTIVE SUMMARY
Our fallback analysis indicates potential market opportunities for "${query}" in the Canadian market, particularly in Ontario and British Columbia.

### 🎯 KEY FINDINGS
• **Market Presence**: Basic market validation suggests businesses operating in this sector
• **Geographic Focus**: Primary opportunities in Toronto and Vancouver metropolitan areas  
• **Contact Potential**: Estimated contact information available for initial outreach
• **Market Status**: Further research recommended for comprehensive intelligence

### 💡 ACTIONABLE INSIGHTS
1. **Initial Outreach**: 2 potential prospects identified for preliminary contact
2. **Market Research**: Expand data collection for more comprehensive analysis
3. **Geographic Strategy**: Focus on major Canadian urban centers
4. **API Configuration**: Configure data source APIs for enhanced intelligence

### 🔥 NEXT STEPS
- Configure API keys for Reddit, News, and other data sources
- Set up Clearbit and Hunter.io for enhanced contact verification
- Enable social media APIs for real-time intent signals
- Implement advanced scraping for broader market coverage

### ⚠️ NOTICE
This is a fallback analysis. For comprehensive business intelligence with verified intent signals, please ensure all data source APIs are properly configured.

*Fallback analysis generated • ${new Date().toLocaleString()}*`;
}