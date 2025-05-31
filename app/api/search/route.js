import { NextResponse } from 'next/server';
//  pas src/ :
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
    const data = await fetchAllData(cleanQuery);
    const dataCollectionTime = Date.now() - startTime;
    
    // Analyser avec Gemini AI
    const analysisStartTime = Date.now();
    const analysis = await analyzeData(data, cleanQuery);
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
        intentScore,
        dataQuality,
        trending,
        totalSources: data.metadata.totalSources,
        sourcesWithData: data.metadata.sourcesWithData,
        totalDataPoints: data.metadata.totalDataPoints
      },
      performance: {
        dataCollectionTime,
        analysisTime,
        totalTime: Date.now() - startTime
      },
      timestamp: new Date().toISOString()
    };
    
    // Mettre en cache
    searchCache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });
    
    // Nettoyer le cache périodiquement
    if (searchCache.size > 100) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }
    
    console.log(`✅ Search completed in ${results.performance.totalTime}ms`);
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ Search API Error:', error);
    
    return NextResponse.json({
      error: 'Internal server error during search',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Calculer le score d'intention global
function calculateOverallIntentScore(data) {
  let totalScore = 0;
  let scoreCount = 0;
  
  // Score basé sur Reddit
  if (data.reddit && data.reddit.length > 0) {
    const redditScore = data.reddit.reduce((sum, post) => sum + (post.intent_score || 0), 0);
    totalScore += redditScore;
    scoreCount += data.reddit.length;
  }
  
  // Score basé sur Twitter engagement
  if (data.xPosts && data.xPosts.length > 0) {
    const twitterScore = data.xPosts.reduce((sum, tweet) => {
      const engagement = (tweet.engagement_score || 0) / 100; // Normaliser
      return sum + Math.min(engagement, 10);
    }, 0);
    totalScore += twitterScore;
    scoreCount += data.xPosts.length;
  }
  
  // Score basé sur les entreprises à vendre
  if (data.bizBuySell && data.bizBuySell.length > 0) {
    totalScore += data.bizBuySell.length * 5; // Forte intention d'achat/vente
    scoreCount += data.bizBuySell.length;
  }
  
  // Score basé sur les actualités
  if (data.news && data.news.length > 0) {
    totalScore += data.news.length * 2; // Intérêt médiatique
    scoreCount += data.news.length;
  }
  
  return scoreCount > 0 ? Math.round(totalScore / scoreCount * 10) / 10 : 0;
}

// Calculer la qualité des données
function calculateDataQuality(data) {
  const weights = {
    news: 0.2,
    xPosts: 0.15,
    reddit: 0.25,
    crunchbase: 0.2,
    bizBuySell: 0.1,
    hackerNews: 0.1
  };
  
  let qualityScore = 0;
  
  Object.keys(weights).forEach(source => {
    if (data[source] && data[source].length > 0) {
      qualityScore += weights[source] * Math.min(data[source].length / 5, 1);
    }
  });
  
  return Math.round(qualityScore * 100);
}

// Calculer le score de tendance
function calculateTrendingScore(data) {
  let trendingScore = 0;
  
  // Twitter engagement récent
  if (data.xPosts && data.xPosts.length > 0) {
    const recentTweets = data.xPosts.filter(tweet => {
      const tweetDate = new Date(tweet.created_at);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return tweetDate > dayAgo;
    });
    trendingScore += recentTweets.length * 2;
  }
  
  // Reddit discussions actives
  if (data.reddit && data.reddit.length > 0) {
    const activeDiscussions = data.reddit.filter(post => post.num_comments > 10);
    trendingScore += activeDiscussions.length * 3;
  }
  
  // Actualités récentes
  if (data.news && data.news.length > 0) {
    const recentNews = data.news.filter(article => {
      const articleDate = new Date(article.publishedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return articleDate > weekAgo;
    });
    trendingScore += recentNews.length * 4;
  }
  
  // Hacker News popularity
  if (data.hackerNews && data.hackerNews.length > 0) {
    const popularPosts = data.hackerNews.filter(post => post.points > 50);
    trendingScore += popularPosts.length * 2;
  }
  
  return Math.min(trendingScore, 100);
}

// Export pour Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';