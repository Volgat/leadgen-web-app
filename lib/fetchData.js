// lib/fetchData.js - ES6 Modules uniquement
import axios from 'axios';
import { processRealData } from './dataProcessor.js';
import { 
  scrapeSECData, 
  scrapeDataGov, 
  scrapeBizBuySellReal, 
  scrapeLinkedInJobs,
  randomDelay 
} from './scrapingEngine.js';

// Configuration API
const API_CONFIG = {
  timeout: 30000,
  maxRetries: 2,
  retryDelay: 2000
};

// Cache pour Reddit token
let redditToken = null;
let redditTokenExpiry = null;

// ===============================
// SOURCES AVEC API - DONNÉES RÉELLES
// ===============================

// Reddit - Discussions business réelles
async function getRedditToken() {
  if (redditToken && redditTokenExpiry && Date.now() < redditTokenExpiry) {
    return redditToken;
  }

  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    throw new Error('Reddit API credentials not configured');
  }

  try {
    const auth = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SBGLeadGen/1.0'
        },
        timeout: API_CONFIG.timeout
      }
    );

    redditToken = response.data.access_token;
    redditTokenExpiry = Date.now() + (response.data.expires_in * 1000);
    
    return redditToken;
  } catch (err) {
    console.error('Reddit Auth Error:', err.message);
    throw err;
  }
}

async function fetchRedditRealData(query) {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.warn('⚠️ Reddit API not configured - skipping Reddit data');
    return [];
  }

  try {
    console.log('📱 Fetching real Reddit business discussions...');
    
    const token = await getRedditToken();
    const results = [];
    
    // Subreddits B2B ciblés pour données professionnelles
    const businessSubreddits = [
      'business', 'entrepreneur', 'smallbusiness', 'startups', 
      'investing', 'sales', 'marketing', 'consulting', 'freelance',
      'canada', 'toronto', 'vancouver', 'montreal'
    ];
    
    for (const subreddit of businessSubreddits) {
      try {
        await randomDelay(2000, 4000);
        
        const response = await axios.get(`https://oauth.reddit.com/r/${subreddit}/search`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': process.env.REDDIT_USER_AGENT || 'SBGLeadGen/1.0'
          },
          params: {
            q: query,
            sort: 'relevance',
            limit: 10,
            type: 'link',
            t: 'month',
            restrict_sr: true
          },
          timeout: API_CONFIG.timeout
        });
        
        response.data.data.children.forEach(item => {
          const post = item.data;
          
          if (post.title.length > 20 && (post.selftext?.length > 50 || post.num_comments > 3)) {
            const intentScore = calculateRedditIntentScore(post);
            
            if (intentScore >= 3) {
              results.push({
                title: post.title,
                selftext: post.selftext || '',
                url: `https://reddit.com${post.permalink}`,
                subreddit: post.subreddit,
                score: post.score,
                created_utc: post.created_utc,
                num_comments: post.num_comments,
                upvote_ratio: post.upvote_ratio,
                author: post.author,
                intent_score: intentScore,
                business_context: extractBusinessContext(post),
                companies_mentioned: extractCompanyMentions(post.title + ' ' + (post.selftext || '')),
                type: 'reddit_real'
              });
            }
          }
        });
        
      } catch (subredditError) {
        console.warn(`⚠️ Error fetching r/${subreddit}:`, subredditError.message);
      }
    }
    
    const sortedResults = results
      .sort((a, b) => b.intent_score - a.intent_score)
      .slice(0, 20);
    
    console.log(`✅ Found ${sortedResults.length} real Reddit business discussions`);
    return sortedResults;
    
  } catch (err) {
    console.error('Reddit API Error:', err.message);
    return [];
  }
}

// News API - Articles business réels
async function fetchNewsRealData(query) {
  if (!process.env.NEWSAPI_KEY) {
    console.warn('⚠️ NewsAPI not configured - skipping news data');
    return [];
  }

  try {
    console.log('📰 Fetching real business news...');
    
    const businessQuery = `"${query}" AND (company OR business OR startup OR CEO OR funding OR acquisition OR investment)`;
    
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: { 
        q: businessQuery,
        apiKey: process.env.NEWSAPI_KEY,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 30,
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        domains: 'techcrunch.com,bloomberg.com,reuters.com,wsj.com,fortune.com,businessinsider.com,cnbc.com,globeandmail.com,theglobeandmail.com,financialpost.com'
      },
      timeout: API_CONFIG.timeout
    });

    const relevantArticles = response.data.articles
      .filter(article => {
        const title = article.title?.toLowerCase() || '';
        const description = article.description?.toLowerCase() || '';
        const content = title + ' ' + description;
        
        const businessKeywords = ['company', 'business', 'startup', 'funding', 'ceo', 'founder', 'investment', 'acquisition', 'merger', 'ipo', 'revenue'];
        const hasBusinessContent = businessKeywords.some(keyword => content.includes(keyword));
        
        const hasQualityContent = article.title && 
                                 article.description && 
                                 article.title.length > 20 &&
                                 article.description.length > 50 &&
                                 !article.title.toLowerCase().includes('[removed]');
        
        return hasBusinessContent && hasQualityContent;
      })
      .slice(0, 12)
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        business_relevance: calculateBusinessRelevance(article, query),
        companies_mentioned: extractCompanyMentions(article.title + ' ' + article.description),
        content_quality: calculateContentQuality(article),
        type: 'news_real'
      }));

    console.log(`✅ Found ${relevantArticles.length} relevant business articles`);
    return relevantArticles.sort((a, b) => b.business_relevance - a.business_relevance);
    
  } catch (err) {
    console.error('NewsAPI Error:', err.message);
    return [];
  }
}

// Twitter/X - Signaux business réels
async function fetchTwitterRealData(query) {
  if (!process.env.X_BEARER_TOKEN) {
    console.warn('⚠️ Twitter API not configured - skipping social data');
    return [];
  }

  try {
    console.log('🐦 Fetching real business social signals...');
    
    await randomDelay(3000, 6000);

    const businessQuery = `"${query}" (company OR business OR startup OR CEO OR founder OR hiring OR funding OR launched) -is:retweet lang:en`;
    
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`,
      },
      params: {
        query: businessQuery,
        max_results: 20,
        'tweet.fields': 'created_at,public_metrics,context_annotations,author_id,geo',
        'user.fields': 'name,username,verified,public_metrics'
      },
      timeout: API_CONFIG.timeout
    });
    
    const businessTweets = response.data.data?.filter(tweet => {
      const text = tweet.text.toLowerCase();
      
      const businessIndicators = ['company', 'business', 'ceo', 'founder', 'startup', 'funding', 'hiring', 'launched', 'announcing', 'partnership'];
      const hasBusinessContent = businessIndicators.some(indicator => text.includes(indicator));
      
      const hasQualityContent = tweet.text.length > 50 &&
                               !text.includes('rt @') &&
                               (tweet.public_metrics.like_count > 1 || tweet.public_metrics.retweet_count > 0);
      
      return hasBusinessContent && hasQualityContent;
    }).map(tweet => ({
      text: tweet.text,
      created_at: tweet.created_at,
      engagement: {
        likes: tweet.public_metrics.like_count,
        retweets: tweet.public_metrics.retweet_count,
        replies: tweet.public_metrics.reply_count,
        quotes: tweet.public_metrics.quote_count
      },
      business_signals: extractBusinessSignals(tweet.text),
      companies_mentioned: extractCompanyMentions(tweet.text),
      author_id: tweet.author_id,
      engagement_score: (tweet.public_metrics.like_count * 2) + (tweet.public_metrics.retweet_count * 3) + tweet.public_metrics.reply_count,
      type: 'twitter_real'
    })) || [];
    
    console.log(`✅ Found ${businessTweets.length} business-relevant social signals`);
    return businessTweets
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 10);
    
  } catch (err) {
    console.error('Twitter API Error:', err.message);
    if (err.response?.status === 429) {
      console.warn('⚠️ Twitter rate limit reached - this is normal');
    }
    return [];
  }
}

// ===============================
// SOURCES AVEC SCRAPING - DONNÉES RÉELLES
// ===============================

async function fetchSECRealData(query) {
  try {
    console.log('🏛️ Fetching real SEC financial data...');
    return await scrapeSECData(query);
  } catch (error) {
    console.error('SEC Data Error:', error.message);
    return [];
  }
}

async function fetchDataGovRealData(query) {
  try {
    console.log('📊 Fetching real government datasets...');
    return await scrapeDataGov(query);
  } catch (error) {
    console.error('Data.gov Error:', error.message);
    return [];
  }
}

async function fetchBizBuySellRealData(query) {
  try {
    console.log('💼 Fetching real acquisition opportunities...');
    return await scrapeBizBuySellReal(query);
  } catch (error) {
    console.error('BizBuySell Error:', error.message);
    return [];
  }
}

async function fetchLinkedInJobsRealData(query) {
  try {
    console.log('💼 Fetching real hiring signals...');
    return await scrapeLinkedInJobs(query);
  } catch (error) {
    console.error('LinkedIn Jobs Error:', error.message);
    return [];
  }
}

async function fetchHackerNewsRealData(query) {
  try {
    console.log('🔶 Fetching real tech trend signals...');
    
    const searchResponse = await axios.get(`https://hn.algolia.com/api/v1/search`, {
      params: {
        query: query,
        tags: 'story',
        hitsPerPage: 15,
        numericFilters: 'points>5'
      },
      timeout: API_CONFIG.timeout
    });
    
    const relevantPosts = searchResponse.data.hits
      .filter(hit => {
        const title = hit.title?.toLowerCase() || '';
        const hasRelevantContent = title.length > 20 && 
                                  (title.includes('company') || title.includes('startup') || 
                                   title.includes('business') || title.includes('tech') ||
                                   title.includes('saas') || title.includes('ai'));
        return hasRelevantContent && hit.points > 5;
      })
      .slice(0, 8)
      .map(hit => ({
        title: hit.title,
        url: hit.url,
        points: hit.points,
        num_comments: hit.num_comments,
        created_at: hit.created_at,
        author: hit.author,
        relevance_score: hit.points + hit.num_comments,
        trend_indicator: hit.points > 100 ? 'trending' : hit.points > 50 ? 'popular' : 'normal',
        companies_mentioned: extractCompanyMentions(hit.title),
        type: 'hackernews_real'
      }));
    
    console.log(`✅ Found ${relevantPosts.length} relevant tech discussions`);
    return relevantPosts.sort((a, b) => b.relevance_score - a.relevance_score);
    
  } catch (err) {
    console.error('Hacker News Error:', err.message);
    return [];
  }
}

// ===============================
// FONCTIONS D'ANALYSE
// ===============================

function calculateRedditIntentScore(post) {
  let score = 0;
  const text = (post.title + ' ' + (post.selftext || '')).toLowerCase();
  
  const strongIntents = ['looking for', 'need urgently', 'hiring immediately', 'buying', 'selling', 'budget approved', 'ready to purchase'];
  strongIntents.forEach(intent => {
    if (text.includes(intent)) score += 4;
  });
  
  const mediumIntents = ['need', 'want', 'searching', 'recommendations', 'advice', 'suggestions'];
  mediumIntents.forEach(intent => {
    if (text.includes(intent)) score += 2;
  });
  
  const urgencyWords = ['urgent', 'asap', 'immediately', 'now', 'soon', 'today'];
  urgencyWords.forEach(word => {
    if (text.includes(word)) score += 3;
  });
  
  const budgetRegex = /\$[\d,]+k?|\d+k budget|budget.*\d+|revenue.*\$|spending.*\$/i;
  if (budgetRegex.test(text)) score += 5;
  
  const targetLocations = ['canada', 'toronto', 'vancouver', 'montreal', 'ontario', 'bc', 'quebec'];
  targetLocations.forEach(location => {
    if (text.includes(location)) score += 2;
  });
  
  score += Math.min(2, post.num_comments / 5);
  score += Math.min(1, post.score / 15);
  
  return Math.round(score);
}

function extractBusinessContext(post) {
  const text = (post.title + ' ' + (post.selftext || '')).toLowerCase();
  const context = {};
  
  if (text.includes('startup') || text.includes('founding')) context.stage = 'startup';
  else if (text.includes('small business') || text.includes('family business')) context.stage = 'small_business';
  else if (text.includes('enterprise') || text.includes('corporation') || text.includes('large company')) context.stage = 'enterprise';
  else if (text.includes('growing') || text.includes('expanding')) context.stage = 'growth';
  
  const industries = ['tech', 'software', 'saas', 'ai', 'healthcare', 'finance', 'fintech', 'retail', 'manufacturing', 'construction', 'consulting'];
  industries.forEach(industry => {
    if (text.includes(industry)) context.industry = industry;
  });
  
  const locations = {
    'toronto': { city: 'Toronto', province: 'Ontario', country: 'Canada', market: 'primary' },
    'vancouver': { city: 'Vancouver', province: 'BC', country: 'Canada', market: 'primary' },
    'montreal': { city: 'Montreal', province: 'Quebec', country: 'Canada', market: 'primary' },
    'calgary': { city: 'Calgary', province: 'Alberta', country: 'Canada', market: 'secondary' },
    'ottawa': { city: 'Ottawa', province: 'Ontario', country: 'Canada', market: 'secondary' },
    'ontario': { province: 'Ontario', country: 'Canada', market: 'primary' },
    'canada': { country: 'Canada', market: 'primary' },
    'new york': { city: 'New York', state: 'NY', country: 'USA', market: 'secondary' },
    'san francisco': { city: 'San Francisco', state: 'CA', country: 'USA', market: 'secondary' },
    'california': { state: 'California', country: 'USA', market: 'secondary' }
  };
  
  Object.entries(locations).forEach(([keyword, locationData]) => {
    if (text.includes(keyword)) {
      context.location = locationData;
    }
  });
  
  const budgetMatch = text.match(/\$[\d,]+k?|\d+k budget/i);
  if (budgetMatch) context.budget_mentioned = budgetMatch[0];
  
  const revenueMatch = text.match(/revenue.*\$[\d,]+|annual.*\$[\d,]+/i);
  if (revenueMatch) context.revenue_mentioned = revenueMatch[0];
  
  return context;
}

function calculateBusinessRelevance(article, query) {
  const content = (article.title + ' ' + article.description).toLowerCase();
  const queryWords = query.toLowerCase().split(' ');
  
  let relevance = 0;
  
  queryWords.forEach(word => {
    if (content.includes(word)) relevance += 3;
  });
  
  const premiumKeywords = ['ceo', 'founder', 'funding', 'investment', 'acquisition', 'ipo', 'revenue', 'growth', 'expansion', 'partnership'];
  premiumKeywords.forEach(keyword => {
    if (content.includes(keyword)) relevance += 2;
  });
  
  const qualitySources = ['techcrunch', 'bloomberg', 'reuters', 'wsj', 'fortune', 'cnbc'];
  if (qualitySources.some(source => article.source.name.toLowerCase().includes(source))) {
    relevance += 3;
  }
  
  return Math.min(10, relevance);
}

function calculateContentQuality(article) {
  let quality = 5;
  
  if (article.title.length > 30 && article.title.length < 100) quality += 1;
  
  if (article.description && article.description.length > 100) quality += 1;
  
  const reliableSources = ['reuters', 'bloomberg', 'wsj', 'cnbc', 'techcrunch', 'fortune'];
  if (reliableSources.some(source => article.source.name.toLowerCase().includes(source))) {
    quality += 2;
  }
  
  const articleDate = new Date(article.publishedAt);
  const daysSincePublished = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublished < 7) quality += 1;
  
  return Math.min(10, quality);
}

function extractCompanyMentions(text) {
  const mentions = [];
  
  const companyPatterns = [
    /([A-Z][a-zA-Z\s]{2,30}(?:Inc|Corp|LLC|Ltd|Company|Solutions|Technologies|Software|Systems|Group|Services)\.?)/g,
    /([A-Z][a-z]+[A-Z][a-zA-Z]+)/g,
    /([A-Z][a-zA-Z\s]{2,20}\.(?:com|ca|org|net))/g
  ];
  
  companyPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/\.$/, '').trim();
        if (cleaned.length > 3 && cleaned.length < 50 && 
            !cleaned.includes(' the ') && !cleaned.includes(' and ') &&
            /[A-Z]/.test(cleaned)) {
          mentions.push(cleaned);
        }
      });
    }
  });
  
  return [...new Set(mentions)];
}

function extractBusinessSignals(text) {
  const signals = [];
  const content = text.toLowerCase();
  
  const hiringKeywords = ['hiring', 'we\'re hiring', 'join our team', 'now hiring', 'looking for', 'seeking'];
  hiringKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      signals.push({ type: 'hiring', keyword, confidence: 0.9 });
    }
  });
  
  const fundingKeywords = ['funding', 'raised', 'investment', 'series a', 'series b', 'seed round', 'venture capital'];
  fundingKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      signals.push({ type: 'funding', keyword, confidence: 0.8 });
    }
  });
  
  const launchKeywords = ['launched', 'announcing', 'introducing', 'unveiling', 'releasing', 'beta'];
  launchKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      signals.push({ type: 'product_launch', keyword, confidence: 0.7 });
    }
  });
  
  const partnershipKeywords = ['partnership', 'collaboration', 'joint venture', 'strategic alliance', 'teaming up'];
  partnershipKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      signals.push({ type: 'partnership', keyword, confidence: 0.6 });
    }
  });
  
  const expansionKeywords = ['expanding', 'growing', 'scaling', 'new office', 'opening', 'international'];
  expansionKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      signals.push({ type: 'expansion', keyword, confidence: 0.7 });
    }
  });
  
  return signals;
}

// ===============================
// FONCTION PRINCIPALE - TOUTES DONNÉES RÉELLES
// ===============================

export async function fetchAllRealData(query) {
  console.log(`🔍 Starting REAL data collection for: "${query}"`);
  console.log('📊 Collecting verified business intelligence from all sources...');
  console.log('⚠️ NO SYNTHETIC DATA - Real sources only');
  
  const startTime = Date.now();
  
  const dataPromises = [
    fetchRedditRealData(query),
    fetchNewsRealData(query),
    fetchTwitterRealData(query),
    fetchHackerNewsRealData(query),
    fetchSECRealData(query),
    fetchDataGovRealData(query),
    fetchBizBuySellRealData(query),
    fetchLinkedInJobsRealData(query)
  ];
  
  console.log('⏳ Processing 8 real data sources in parallel...');
  
  const [
    redditData, 
    newsData, 
    twitterData, 
    hackerNewsData,
    secData,
    dataGovData,
    bizBuySellData,
    linkedInJobsData
  ] = await Promise.all(dataPromises);
  
  const dataCollectionTime = Date.now() - startTime;
  
  const rawData = {
    reddit: redditData,
    news: newsData,
    xPosts: twitterData,
    hackerNews: hackerNewsData,
    secData: secData,
    dataGov: dataGovData,
    bizBuySell: bizBuySellData,
    linkedInJobs: linkedInJobsData
  };
  
  const sourcesWithData = Object.keys(rawData).filter(key => rawData[key] && rawData[key].length > 0);
  const totalDataPoints = Object.values(rawData).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  
  console.log(`📊 Data collection results:`);
  console.log(`✅ ${sourcesWithData.length}/8 sources returned data`);
  console.log(`📈 ${totalDataPoints} total real data points collected`);
  
  Object.entries(rawData).forEach(([source, data]) => {
    if (data && data.length > 0) {
      console.log(`  • ${source}: ${data.length} items`);
    }
  });
  
  console.log('🧠 Processing real data to extract qualified companies...');
  const processedData = await processRealData(rawData, query);
  
  const results = {
    companies: processedData.companies || [],
    
    sources: {
      reddit: redditData.slice(0, 6),
      news: newsData.slice(0, 4),
      social: twitterData.slice(0, 4),
      hackerNews: hackerNewsData.slice(0, 3),
      secData: secData.slice(0, 3),
      dataGov: dataGovData.slice(0, 2),
      bizBuySell: bizBuySellData.slice(0, 3),
      linkedInJobs: linkedInJobsData.slice(0, 3)
    },
    
    intelligence: {
      companies_found: processedData.companies?.length || 0,
      with_verified_contacts: processedData.metrics?.with_contacts || 0,
      avg_intent_score: processedData.metrics?.avg_intent_score || 0,
      data_quality: processedData.metrics?.data_quality || 'no_data',
      sources_active: sourcesWithData.length,
      total_data_points: totalDataPoints,
      data_collection_time: dataCollectionTime,
      last_updated: new Date().toISOString(),
      verification_status: 'all_real_data'
    },
    
    metadata: {
      query: query,
      timestamp: new Date().toISOString(),
      processing_time: Date.now() - startTime,
      data_sources: {
        reddit: redditData.length > 0,
        news: newsData.length > 0,
        social: twitterData.length > 0,
        hackerNews: hackerNewsData.length > 0,
        sec: secData.length > 0,
        dataGov: dataGovData.length > 0,
        bizBuySell: bizBuySellData.length > 0,
        linkedInJobs: linkedInJobsData.length > 0
      },
      quality_assurance: {
        no_synthetic_data: true,
        real_sources_only: true,
        verified_scraping: true,
        contact_verification: processedData.metrics?.with_contacts > 0
      }
    }
  };
  
  console.log(`✅ REAL data processing complete:`);
  console.log(`🏢 ${results.companies.length} qualified companies extracted from real sources`);
  console.log(`📧 ${results.intelligence.with_verified_contacts} companies with verified contacts`);
  console.log(`🎯 Average intent score: ${results.intelligence.avg_intent_score}/100`);
  console.log(`📊 Data quality: ${results.intelligence.data_quality}`);
  console.log(`⏱️ Total processing time: ${Math.round(results.metadata.processing_time/1000)}s`);
  console.log(`🚫 ZERO synthetic data generated`);
  
  return results;
}

// Exports nommés seulement
export {
  fetchRedditRealData,
  fetchNewsRealData,
  fetchTwitterRealData,
  fetchHackerNewsRealData,
  fetchSECRealData,
  fetchDataGovRealData,
  fetchBizBuySellRealData,
  fetchLinkedInJobsRealData
};