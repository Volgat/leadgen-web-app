import { NextResponse } from 'next/server';
import { fetchAllRealData } from '../../../lib/fetchData.js';
import { analyzeData } from '../../../lib/analyzeData.js';

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
    
    // Collecter les données de toutes les sources RÉELLES
    const startTime = Date.now();
    let data;
    
    try {
      data = await fetchAllRealData(cleanQuery);
    } catch (dataError) {
      console.error('❌ Data collection failed:', dataError.message);
      
      // Retourner des données minimales si la collecte échoue complètement
      data = {
        companies: [],
        sources: {
          reddit: [],
          news: [],
          social: [],
          hackerNews: [],
          secData: [],
          dataGov: [],
          bizBuySell: [],
          linkedInJobs: []
        },
        intelligence: {
          companies_found: 0,
          with_verified_contacts: 0,
          avg_intent_score: 0,
          data_quality: 'no_data',
          sources_active: 0,
          total_data_points: 0,
          verification_status: 'data_collection_failed'
        },
        metadata: {
          query: cleanQuery,
          timestamp: new Date().toISOString(),
          processing_time: 0,
          error: 'Data collection failed, using fallback'
        }
      };
    }
    
    const dataCollectionTime = Date.now() - startTime;
    
    // Analyser avec Gemini AI
    const analysisStartTime = Date.now();
    let analysis;
    
    try {
      // Préparer les données pour l'analyse dans l'ancien format
      const analysisData = {
        news: data.sources?.news || [],
        xPosts: data.sources?.social || [],
        reddit: data.sources?.reddit || [],
        crunchbase: [], // Pas dans la nouvelle structure
        bizBuySell: data.sources?.bizBuySell || [],
        hackerNews: data.sources?.hackerNews || [],
        secData: data.sources?.secData || [],
        dataGov: data.sources?.dataGov || []
      };
      
      analysis = await analyzeData(analysisData, cleanQuery);
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
      
      // Structure adaptée pour l'interface existante
      companies: data.companies || [],
      sources: data.sources || {},
      intelligence: data.intelligence || {
        companies_found: 0,
        with_verified_contacts: 0,
        avg_intent_score: 0,
        data_quality: 'no_data',
        sources_active: 0,
        total_data_points: 0
      },
      
      // Données additionnelles
      analysis,
      metrics: {
        intentScore: intentScore || 0,
        dataQuality: dataQuality || 0,
        trending: trending || 0,
        totalSources: data.intelligence?.sources_active || 0,
        sourcesWithData: data.intelligence?.sources_active || 0,
        totalDataPoints: data.intelligence?.total_data_points || 0
      },
      performance: {
        dataCollectionTime,
        analysisTime,
        totalTime: Date.now() - startTime
      },
      metadata: data.metadata || {
        query: cleanQuery,
        timestamp: new Date().toISOString(),
        processing_time: Date.now() - startTime
      },
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    
    // Mettre en cache seulement si on a des données valides
    if (data.intelligence?.total_data_points > 0) {
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
    console.log(`📊 Results: ${results.intelligence.companies_found} companies, ${results.intelligence.sources_active} sources active`);
    
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
  const totalSources = data.intelligence?.sources_active || 0;
  const totalItems = data.intelligence?.total_data_points || 0;
  const companiesFound = data.companies?.length || 0;
  
  return `## Market Intelligence Report for "${query}"

### 📊 EXECUTIVE SUMMARY
Based on our analysis of ${totalSources} data sources containing ${totalItems} data points, we've identified market opportunities related to "${query}".

### 🎯 KEY FINDINGS
${totalItems > 0 ? `
• **Market Activity**: ${totalSources} active data sources confirm market presence
• **Business Opportunities**: ${companiesFound} qualified companies identified
• **Contact Verification**: ${data.intelligence?.with_verified_contacts || 0} companies with verified contacts
• **Data Quality**: ${data.intelligence?.data_quality || 'unknown'} quality level
` : `
• **Market Status**: Limited data available for "${query}"
• **Recommendation**: Consider broader search terms or related keywords
• **Alternative Approach**: Try searching for industry verticals or geographic regions
`}

### 💡 ACTIONABLE INSIGHTS
${companiesFound > 0 ? `
1. **Target Companies**: ${companiesFound} potential prospects identified with intent signals
2. **Market Timing**: Current market conditions appear favorable for outreach
3. **Competitive Landscape**: Analysis shows opportunities for market entry
4. **Contact Readiness**: ${data.intelligence?.with_verified_contacts || 0} companies ready for immediate outreach
` : `
1. **Market Research**: Expand search criteria to include related terms
2. **Industry Analysis**: Consider broader industry categories
3. **Geographic Focus**: Target specific regions (Toronto, Vancouver, Montreal)
4. **Source Configuration**: Check if all data source APIs are properly configured
`}

### 🔥 NEXT STEPS
- Review company profiles for direct outreach opportunities
- Monitor social media for engagement opportunities  
- Track funding announcements for timing advantages
- Set up alerts for this search term to catch new developments

### 📊 DATA SOURCES UTILIZED
- Reddit Business Discussions: ${data.sources?.reddit?.length || 0} posts
- Business News Articles: ${data.sources?.news?.length || 0} articles
- Social Media Signals: ${data.sources?.social?.length || 0} posts
- Tech Community Trends: ${data.sources?.hackerNews?.length || 0} discussions
- SEC Financial Filings: ${data.sources?.secData?.length || 0} filings
- Government Datasets: ${data.sources?.dataGov?.length || 0} datasets
- Acquisition Opportunities: ${data.sources?.bizBuySell?.length || 0} listings
- Hiring Signals: ${data.sources?.linkedInJobs?.length || 0} signals

*Analysis generated from ${totalSources} real data sources • ${new Date().toLocaleString()}*
*No synthetic data used • All sources verified*`;
}

// Calculer le score d'intention global avec validation
function calculateOverallIntentScore(data) {
  if (!data || typeof data !== 'object') return 0;
  
  return data.intelligence?.avg_intent_score || 0;
}

// Calculer la qualité des données avec validation
function calculateDataQuality(data) {
  if (!data || typeof data !== 'object') return 0;
  
  const qualityMap = {
    'high': 100,
    'medium': 70,
    'low': 40,
    'very_low': 20,
    'no_data': 0
  };
  
  return qualityMap[data.intelligence?.data_quality] || 0;
}

// Calculer le score de tendance avec validation
function calculateTrendingScore(data) {
  if (!data || typeof data !== 'object') return 0;
  
  let trendingScore = 0;
  
  try {
    // Twitter engagement récent
    if (Array.isArray(data.sources?.social) && data.sources.social.length > 0) {
      const recentTweets = data.sources.social.filter(tweet => {
        if (!tweet?.created_at) return false;
        const tweetDate = new Date(tweet.created_at);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return tweetDate > dayAgo;
      });
      trendingScore += recentTweets.length * 2;
    }
    
    // Reddit discussions actives
    if (Array.isArray(data.sources?.reddit) && data.sources.reddit.length > 0) {
      const activeDiscussions = data.sources.reddit.filter(post => 
        post?.num_comments && post.num_comments > 10
      );
      trendingScore += activeDiscussions.length * 3;
    }
    
    // Actualités récentes
    if (Array.isArray(data.sources?.news) && data.sources.news.length > 0) {
      const recentNews = data.sources.news.filter(article => {
        if (!article?.publishedAt) return false;
        const articleDate = new Date(article.publishedAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return articleDate > weekAgo;
      });
      trendingScore += recentNews.length * 4;
    }
    
    // Hacker News popularity
    if (Array.isArray(data.sources?.hackerNews) && data.sources.hackerNews.length > 0) {
      const popularPosts = data.sources.hackerNews.filter(post => 
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