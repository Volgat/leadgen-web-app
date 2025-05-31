import { NextResponse } from 'next/server';
import { fetchAllData } from '../../../lib/fetchData';
import { analyzeData } from '../../../lib/analyzeData';

// Cache en mémoire pour éviter les appels répétés
const searchCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    // Validation de la requête
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        error: 'Query parameter is required and must be at least 2 characters long'
      }, { status: 400 });
    }

    const cleanQuery = query.trim().toLowerCase();
    
    // Vérifier le cache
    const cacheKey = `search_${cleanQuery}`;
    const cached = searchCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📂 Returning cached results for:', cleanQuery);
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log('🔍 New search request for:', cleanQuery);
    
    // Collecter les données de toutes les sources
    const startTime = Date.now();
    let data;
    
    try {
      data = await fetchAllData(cleanQuery);
    } catch (dataError) {
      console.error('❌ Data collection failed:', dataError.message);
      
      // Retourner des données minimales si la collecte échoue complètement
      data = {
        news: [],
        xPosts: [],
        reddit: [],
        crunchbase: [],
        bizBuySell: [],
        hackerNews: [],
        secData: [],
        dataGov: [],
        truthSocial: [],
        metadata: {
          query: cleanQuery,
          timestamp: new Date().toISOString(),
          totalSources: 9,
          sourcesWithData: 0,
          totalDataPoints: 0,
          companiesWithContacts: 0,
          avgCompanyScore: 0,
          error: 'Data collection failed, using fallback'
        }
      };
    }
    
    const dataCollectionTime = Date.now() - startTime;
    
    // Analyser avec Gemini AI
    const analysisStartTime = Date.now();
    let analysis;
    
    try {
      analysis = await analyzeData(data, cleanQuery);
    } catch (analysisError) {
      console.error('❌ AI analysis failed:', analysisError.message);
      
      // Analyse de fallback si l'IA échoue
      analysis = generateFallbackAnalysis(data, cleanQuery);
    }
    
    const analysisTime = Date.now() - analysisStartTime;
    
    // Calculer des métriques
    const intentScore = calculateOverallIntentScore(data);
    const dataQuality = calculateDataQuality(data);
    const trending = calculateTrendingScore(data);
    
    const results = {
      query: cleanQuery,
      data,
      analysis,
      metrics: {
        intentScore: intentScore || 0,
        dataQuality: dataQuality || 0,
        trending: trending || 0,
        totalSources: data.metadata?.totalSources || 9,
        sourcesWithData: data.metadata?.sourcesWithData || 0,
        totalDataPoints: data.metadata?.totalDataPoints || 0
      },
      performance: {
        dataCollectionTime,
        analysisTime,
        totalTime: Date.now() - startTime
      },
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    
    // Mettre en cache seulement si on a des données valides
    if (data.metadata?.totalDataPoints > 0) {
      searchCache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });
      
      // Nettoyer le cache périodiquement
      if (searchCache.size > 100) {
        const oldestKey = searchCache.keys().next().value;
        searchCache.delete(oldestKey);
      }
    }
    
    console.log(`✅ Search completed in ${results.performance.totalTime}ms`);
    console.log(`📊 Results: ${results.metrics.sourcesWithData}/${results.metrics.totalSources} sources, ${results.metrics.totalDataPoints} data points`);
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ Search API Critical Error:', error);
    
    // Retourner une réponse d'erreur structurée
    return NextResponse.json({
      error: 'Search service temporarily unavailable',
      message: 'Please try again in a few moments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      status: 'error',
      fallback: {
        suggestion: 'Try a simpler search term or check your internet connection'
      }
    }, { status: 500 });
  }
}

// Analyse de fallback si l'IA échoue
function generateFallbackAnalysis(data, query) {
  const totalSources = data.metadata?.sourcesWithData || 0;
  const totalItems = data.metadata?.totalDataPoints || 0;
  const companiesFound = data.crunchbase?.length || 0;
  
  return `## Market Intelligence Report for "${query}"

### 📊 EXECUTIVE SUMMARY
Based on our analysis of ${totalSources} data sources containing ${totalItems} data points, we've identified market opportunities related to "${query}".

### 🎯 KEY FINDINGS
${totalItems > 0 ? `
• **Market Activity**: ${totalSources} active data sources confirm market presence
• **Business Opportunities**: ${companiesFound} companies identified in this space
• **Market Sentiment**: ${data.xPosts?.length > 0 ? 'Positive social media engagement' : 'Limited social media activity'}
• **Investment Activity**: ${data.crunchbase?.filter(c => c.funding_total !== 'Funding info not available').length || 0} funded companies detected
` : `
• **Market Status**: Limited data available for "${query}"
• **Recommendation**: Consider broader search terms or related keywords
• **Alternative Approach**: Try searching for industry verticals or geographic regions
`}

### 💡 ACTIONABLE INSIGHTS
${companiesFound > 0 ? `
1. **Target Companies**: ${companiesFound} potential prospects identified with contact information
2. **Market Timing**: Current market conditions appear favorable for outreach
3. **Competitive Landscape**: Analysis shows opportunities for market entry
` : `
1. **Market Research**: Expand search criteria to include related terms
2. **Industry Analysis**: Consider broader industry categories
3. **Geographic Focus**: Target specific regions (Toronto, Vancouver, Montreal)
`}

### 🔥 NEXT STEPS
- Review company profiles for direct outreach opportunities
- Monitor social media for engagement opportunities  
- Track funding announcements for timing advantages
- Set up alerts for this search term to catch new developments

*Analysis generated from ${totalSources} sources • ${new Date().toLocaleString()}*`;
}

// Calculer le score d'intention global avec validation
function calculateOverallIntentScore(data) {
  if (!data || typeof data !== 'object') return 0;
  
  let totalScore = 0;
  let scoreCount = 0;
  
  try {
    // Score basé sur Reddit
    if (Array.isArray(data.reddit) && data.reddit.length > 0) {
      const redditScore = data.reddit.reduce((sum, post) => {
        const score = post?.intent_score || 0;
        return sum + (typeof score === 'number' ? score : 0);
      }, 0);
      totalScore += redditScore;
      scoreCount += data.reddit.length;
    }
    
    // Score basé sur Twitter engagement
    if (Array.isArray(data.xPosts) && data.xPosts.length > 0) {
      const twitterScore = data.xPosts.reduce((sum, tweet) => {
        const engagement = (tweet?.engagement_score || 0) / 100;
        return sum + Math.min(engagement, 10);
      }, 0);
      totalScore += twitterScore;
      scoreCount += data.xPosts.length;
    }
    
    // Score basé sur les entreprises à vendre
    if (Array.isArray(data.bizBuySell) && data.bizBuySell.length > 0) {
      totalScore += data.bizBuySell.length * 5;
      scoreCount += data.bizBuySell.length;
    }
    
    // Score basé sur les actualités récentes
    if (Array.isArray(data.news) && data.news.length > 0) {
      const recentNews = data.news.filter(article => {
        if (!article?.publishedAt) return false;
        const articleDate = new Date(article.publishedAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return articleDate > weekAgo;
      });
      totalScore += recentNews.length * 3;
      scoreCount += recentNews.length;
    }
    
    return scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : 0;
  } catch (error) {
    console.error('Error calculating intent score:', error);
    return 0;
  }
}

// Calculer la qualité des données avec validation
function calculateDataQuality(data) {
  if (!data || typeof data !== 'object') return 0;
  
  const weights = {
    news: 0.2,
    xPosts: 0.15,
    reddit: 0.25,
    crunchbase: 0.2,
    bizBuySell: 0.1,
    hackerNews: 0.1
  };
  
  let qualityScore = 0;
  
  try {
    Object.keys(weights).forEach(source => {
      if (Array.isArray(data[source]) && data[source].length > 0) {
        qualityScore += weights[source] * Math.min(data[source].length / 5, 1);
      }
    });
    
    return Math.round(qualityScore * 100);
  } catch (error) {
    console.error('Error calculating data quality:', error);
    return 0;
  }
}

// Calculer le score de tendance avec validation
function calculateTrendingScore(data) {
  if (!data || typeof data !== 'object') return 0;
  
  let trendingScore = 0;
  
  try {
    // Twitter engagement récent
    if (Array.isArray(data.xPosts) && data.xPosts.length > 0) {
      const recentTweets = data.xPosts.filter(tweet => {
        if (!tweet?.created_at) return false;
        const tweetDate = new Date(tweet.created_at);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return tweetDate > dayAgo;
      });
      trendingScore += recentTweets.length * 2;
    }
    
    // Reddit discussions actives
    if (Array.isArray(data.reddit) && data.reddit.length > 0) {
      const activeDiscussions = data.reddit.filter(post => 
        post?.num_comments && post.num_comments > 10
      );
      trendingScore += activeDiscussions.length * 3;
    }
    
    // Actualités récentes
    if (Array.isArray(data.news) && data.news.length > 0) {
      const recentNews = data.news.filter(article => {
        if (!article?.publishedAt) return false;
        const articleDate = new Date(article.publishedAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return articleDate > weekAgo;
      });
      trendingScore += recentNews.length * 4;
    }
    
    // Hacker News popularity
    if (Array.isArray(data.hackerNews) && data.hackerNews.length > 0) {
      const popularPosts = data.hackerNews.filter(post => 
        post?.points && post.points > 50
      );
      trendingScore += popularPosts.length * 2;
    }
    
    return Math.min(trendingScore, 100);
  } catch (error) {
    console.error('Error calculating trending score:', error);
    return 0;
  }
}

// Configuration pour Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';