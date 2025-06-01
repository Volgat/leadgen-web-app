// lib/scrapingEngine.js - ES6 Modules uniquement
import axios from 'axios';
import * as cheerio from 'cheerio';

// Configuration de scraping robuste
const SCRAPING_CONFIG = {
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 5000,
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
  ]
};

// Fonction utilitaire pour rotation User-Agent et headers
export function getRandomHeaders() {
  const userAgent = SCRAPING_CONFIG.userAgents[Math.floor(Math.random() * SCRAPING_CONFIG.userAgents.length)];
  
  return {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
  };
}

// Délai aléatoire pour éviter la détection
export function randomDelay(min = 2000, max = 8000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// ===============================
// SEC EDGAR - SCRAPING RÉEL
// ===============================

export async function scrapeSECData(query) {
  try {
    console.log('🏛️ Scraping real SEC EDGAR data...');
    
    await randomDelay(3000, 6000);
    
    // Recherche SEC avec terme de requête
    const searchUrl = `https://www.sec.gov/edgar/search/`;
    const searchParams = {
      'q': query,
      'dateRange': 'custom',
      'startdt': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 an
      'enddt': new Date().toISOString().split('T')[0]
    };
    
    const response = await axios.get(searchUrl, {
      params: searchParams,
      headers: {
        ...getRandomHeaders(),
        'Host': 'www.sec.gov',
        'Referer': 'https://www.sec.gov/'
      },
      timeout: SCRAPING_CONFIG.timeout,
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    const filings = [];
    
    // Scraper les résultats de recherche SEC
    $('.preview-file').each((i, element) => {
      if (filings.length >= 10) return false; // Limiter à 10 résultats
      
      const $filing = $(element);
      const company = $filing.find('.entity-name').text().trim();
      const formType = $filing.find('.form').text().trim();
      const filingDate = $filing.find('.filed').text().trim();
      const description = $filing.find('.summary').text().trim();
      const documentUrl = $filing.find('a').attr('href');
      
      if (company && formType && filingDate) {
        filings.push({
          company_name: company,
          filing_type: formType,
          filing_date: filingDate,
          description: description || `${formType} filing for ${company}`,
          document_url: documentUrl ? `https://www.sec.gov${documentUrl}` : null,
          relevance_score: calculateSECRelevance(company, description, query),
          source: 'sec_edgar_scraped',
          scraped_at: new Date().toISOString()
        });
      }
    });
    
    // Si pas de résultats avec la recherche avancée, essayer recherche simple
    if (filings.length === 0) {
      console.log('🔄 Trying alternative SEC search method...');
      return await scrapeSECAlternative(query);
    }
    
    console.log(`✅ Scraped ${filings.length} real SEC filings`);
    return filings.sort((a, b) => b.relevance_score - a.relevance_score);
    
  } catch (error) {
    console.error('❌ SEC scraping error:', error.message);
    return await scrapeSECAlternative(query);
  }
}

// Méthode alternative pour SEC si la première échoue
async function scrapeSECAlternative(query) {
  try {
    await randomDelay(2000, 4000);
    
    // Utiliser l'API de recherche SEC (format JSON)
    const apiUrl = 'https://efts.sec.gov/LATEST/search-index';
    const response = await axios.get(apiUrl, {
      params: {
        'q': query,
        'dateRange': 'all',
        'category': 'form-cat1', // 10-K, 10-Q, 8-K
        'startdt': new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 mois
        'enddt': new Date().toISOString().split('T')[0]
      },
      headers: {
        ...getRandomHeaders(),
        'Accept': 'application/json'
      },
      timeout: SCRAPING_CONFIG.timeout
    });
    
    const data = response.data;
    const filings = [];
    
    if (data.hits && data.hits.hits) {
      data.hits.hits.slice(0, 8).forEach(hit => {
        const source = hit._source;
        if (source.display_names && source.display_names[0]) {
          filings.push({
            company_name: source.display_names[0],
            filing_type: source.form || 'Unknown',
            filing_date: source.file_date || 'Unknown',
            description: `${source.form} filing - ${source.display_names[0]}`,
            document_url: source.root_form ? `https://www.sec.gov/Archives/edgar/data/${source.root_form}` : null,
            relevance_score: calculateSECRelevance(source.display_names[0], source.form, query),
            source: 'sec_api_scraped',
            scraped_at: new Date().toISOString()
          });
        }
      });
    }
    
    return filings;
    
  } catch (error) {
    console.error('❌ SEC alternative scraping error:', error.message);
    return []; // Retourner tableau vide plutôt que données fictives
  }
}

// ===============================
// DATA.GOV - SCRAPING RÉEL
// ===============================

export async function scrapeDataGov(query) {
  try {
    console.log('📊 Scraping real Data.gov datasets...');
    
    await randomDelay(2000, 5000);
    
    // Recherche sur Data.gov avec API + scraping de backup
    const searchUrl = 'https://catalog.data.gov/dataset';
    const response = await axios.get(searchUrl, {
      params: {
        'q': query,
        'sort': 'score desc, metadata_modified desc',
        'ext_bbox': '', // Pas de limite géographique
        'ext_prev_extent': ''
      },
      headers: getRandomHeaders(),
      timeout: SCRAPING_CONFIG.timeout
    });
    
    const $ = cheerio.load(response.data);
    const datasets = [];
    
    // Scraper les résultats de datasets
    $('.dataset-item').each((i, element) => {
      if (datasets.length >= 8) return false;
      
      const $dataset = $(element);
      const title = $dataset.find('.dataset-heading a').text().trim();
      const description = $dataset.find('.notes').text().trim();
      const organization = $dataset.find('.dataset-organization').text().trim();
      const url = $dataset.find('.dataset-heading a').attr('href');
      const tags = $dataset.find('.tag').map((i, el) => $(el).text().trim()).get();
      const lastModified = $dataset.find('.automatic-local-datetime').attr('data-datetime');
      
      if (title && title.length > 10) {
        datasets.push({
          title: title,
          description: description || `Government dataset related to ${query}`,
          organization: organization || 'U.S. Government',
          url: url ? `https://catalog.data.gov${url}` : null,
          tags: tags.slice(0, 5), // Limiter les tags
          last_modified: lastModified || new Date().toISOString().split('T')[0],
          relevance_score: calculateDataGovRelevance(title, description, query),
          source: 'datagov_scraped',
          scraped_at: new Date().toISOString()
        });
      }
    });
    
    // Si pas assez de résultats, essayer l'API JSON
    if (datasets.length < 3) {
      console.log('🔄 Trying Data.gov API method...');
      const apiDatasets = await scrapeDataGovAPI(query);
      datasets.push(...apiDatasets);
    }
    
    console.log(`✅ Scraped ${datasets.length} real government datasets`);
    return datasets.sort((a, b) => b.relevance_score - a.relevance_score);
    
  } catch (error) {
    console.error('❌ Data.gov scraping error:', error.message);
    return await scrapeDataGovAPI(query); // Fallback à l'API
  }
}

// API Data.gov comme fallback
async function scrapeDataGovAPI(query) {
  try {
    const response = await axios.get('https://catalog.data.gov/api/3/action/package_search', {
      params: {
        q: query,
        rows: 10,
        sort: 'score desc'
      },
      headers: getRandomHeaders(),
      timeout: SCRAPING_CONFIG.timeout
    });
    
    const datasets = response.data.result.results.slice(0, 6).map(dataset => ({
      title: dataset.title,
      description: dataset.notes || `Government dataset: ${dataset.title}`,
      organization: dataset.organization?.title || 'U.S. Government',
      url: `https://catalog.data.gov/dataset/${dataset.name}`,
      tags: dataset.tags?.slice(0, 5).map(tag => tag.display_name) || [],
      last_modified: dataset.metadata_modified?.split('T')[0] || new Date().toISOString().split('T')[0],
      relevance_score: calculateDataGovRelevance(dataset.title, dataset.notes, query),
      source: 'datagov_api',
      scraped_at: new Date().toISOString()
    }));
    
    return datasets;
    
  } catch (error) {
    console.error('❌ Data.gov API error:', error.message);
    return []; // Retourner tableau vide
  }
}

// ===============================
// BIZBUYSELL - SCRAPING RÉEL AMÉLIORÉ
// ===============================

export async function scrapeBizBuySellReal(query) {
  try {
    console.log('💼 Scraping real BizBuySell listings...');
    
    await randomDelay(5000, 10000); // Délai plus long pour BizBuySell
    
    const searchUrl = 'https://www.bizbuysell.com/businesses-for-sale/search/';
    const response = await axios.get(searchUrl, {
      params: {
        'q': query,
        'location': 'Canada',
        'industry': '',
        'price_min': '',
        'price_max': '',
        'revenue_min': '',
        'sort': 'relevance'
      },
      headers: {
        ...getRandomHeaders(),
        'Referer': 'https://www.bizbuysell.com/',
        'Host': 'www.bizbuysell.com'
      },
      timeout: 35000,
      maxRedirects: 3
    });
    
    const $ = cheerio.load(response.data);
    const businesses = [];
    
    // Sélecteurs multiples pour robustesse
    const selectors = [
      '.business-card',
      '.listing-card', 
      '.business-listing',
      '.result-item',
      '.bfs-listing'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        if (businesses.length >= 8) return false;
        
        const $business = $(element);
        const title = $business.find('h3, h4, .business-title, .listing-title, .title').first().text().trim();
        const price = $business.find('.price, .asking-price, .business-price').first().text().trim();
        const location = $business.find('.location, .city, .business-location').first().text().trim();
        const revenue = $business.find('.revenue, .gross-revenue, .annual-revenue').first().text().trim();
        const industry = $business.find('.industry, .category, .business-type').first().text().trim();
        const description = $business.find('.description, .summary, .business-description, p').first().text().trim();
        const businessUrl = $business.find('a').first().attr('href');
        
        if (title && title.length > 15 && !title.toLowerCase().includes('advertisement')) {
          businesses.push({
            title: title,
            asking_price: price || 'Contact for Price',
            location: location || 'Location Available',
            annual_revenue: revenue || 'Revenue on Request',
            industry: industry || 'Business',
            description: description ? description.substring(0, 300) + (description.length > 300 ? '...' : '') : `${title} - business for sale`,
            listing_url: businessUrl ? (businessUrl.startsWith('http') ? businessUrl : `https://www.bizbuysell.com${businessUrl}`) : null,
            relevance_score: calculateBizBuySellRelevance(title, description, query),
            opportunity_type: 'acquisition',
            source: 'bizbuysell_scraped',
            scraped_at: new Date().toISOString()
          });
        }
      });
      
      if (businesses.length > 0) break; // Arrêter si on a trouvé des résultats
    }
    
    // Essayer méthode alternative si pas de résultats
    if (businesses.length === 0) {
      return await scrapeBizBuySellAlternative(query);
    }
    
    console.log(`✅ Scraped ${businesses.length} real business listings`);
    return businesses.sort((a, b) => b.relevance_score - a.relevance_score);
    
  } catch (error) {
    console.error('❌ BizBuySell scraping error:', error.message);
    return await scrapeBizBuySellAlternative(query);
  }
}

// Méthode alternative BizBuySell
async function scrapeBizBuySellAlternative(query) {
  try {
    // Essayer avec différents paramètres de recherche
    const alternativeUrl = 'https://www.bizbuysell.com/search/';
    const response = await axios.get(alternativeUrl, {
      params: {
        'search': query,
        'type': 'business',
        'location_type': 'country',
        'location_id': 'CA' // Canada
      },
      headers: getRandomHeaders(),
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    const businesses = [];
    
    // Parsing plus agressif
    $('div[class*="listing"], div[class*="business"], div[class*="result"]').each((i, element) => {
      if (businesses.length >= 5) return false;
      
      const $el = $(element);
      const textContent = $el.text();
      
      // Extraire informations avec regex si structure HTML varie
      const titleMatch = textContent.match(/([A-Z][^.!?]*(?:Business|Company|Corp|Inc|LLC|Ltd|Services|Solutions)[^.!?]*)/);
      const priceMatch = textContent.match(/\$[\d,]+(?:k|K|,\d{3})*|\$[\d,]+/);
      const locationMatch = textContent.match(/(Toronto|Vancouver|Montreal|Calgary|Ottawa|Ontario|BC|Quebec|Alberta|Canada)/i);
      
      if (titleMatch && titleMatch[1].length > 10) {
        businesses.push({
          title: titleMatch[1].trim(),
          asking_price: priceMatch ? priceMatch[0] : 'Contact for Price',
          location: locationMatch ? locationMatch[1] : 'Canada',
          annual_revenue: 'Revenue Available on Request',
          industry: 'Business Opportunity',
          description: `${titleMatch[1].trim()} - established business opportunity in Canada`,
          relevance_score: calculateBizBuySellRelevance(titleMatch[1], '', query),
          opportunity_type: 'acquisition',
          source: 'bizbuysell_alt_scraped',
          scraped_at: new Date().toISOString()
        });
      }
    });
    
    return businesses;
    
  } catch (error) {
    console.error('❌ BizBuySell alternative scraping error:', error.message);
    return []; // Retourner tableau vide
  }
}

// ===============================
// AUTRES SOURCES DE SCRAPING
// ===============================

// Scraping LinkedIn Jobs pour signaux d'embauche
export async function scrapeLinkedInJobs(query) {
  try {
    console.log('💼 Scraping LinkedIn hiring signals...');
    
    // Note: LinkedIn bloque agressivement le scraping
    // Alternative: utiliser Google search avec site:linkedin.com
    
    await randomDelay(3000, 7000);
    
    const googleSearchUrl = 'https://www.google.com/search';
    const response = await axios.get(googleSearchUrl, {
      params: {
        'q': `site:linkedin.com/jobs "${query}" hiring Canada`,
        'num': 20,
        'hl': 'en'
      },
      headers: getRandomHeaders(),
      timeout: SCRAPING_CONFIG.timeout
    });
    
    const $ = cheerio.load(response.data);
    const jobs = [];
    
    $('.g').each((i, element) => {
      if (jobs.length >= 10) return false;
      
      const $result = $(element);
      const title = $result.find('h3').text().trim();
      const link = $result.find('a').attr('href');
      const snippet = $result.find('.VwiC3b').text().trim();
      
      if (title && link && link.includes('linkedin.com/jobs')) {
        // Extraire nom de l'entreprise du titre ou snippet
        const companyMatch = title.match(/at\s+([^-]+)/i) || snippet.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is hiring/i);
        
        if (companyMatch) {
          jobs.push({
            company_name: companyMatch[1].trim(),
            job_title: title,
            job_url: link,
            description: snippet,
            hiring_signal: true,
            signal_strength: 'high',
            source: 'linkedin_jobs_scraped',
            scraped_at: new Date().toISOString()
          });
        }
      }
    });
    
    console.log(`✅ Found ${jobs.length} hiring signals`);
    return jobs;
    
  } catch (error) {
    console.error('❌ LinkedIn scraping error:', error.message);
    return []; // Retourner tableau vide
  }
}

// ===============================
// FONCTIONS DE CALCUL DE PERTINENCE
// ===============================

function calculateSECRelevance(company, description, query) {
  let score = 0;
  const text = (company + ' ' + description).toLowerCase();
  const queryWords = query.toLowerCase().split(' ');
  
  // Correspondance mots-clés
  queryWords.forEach(word => {
    if (text.includes(word)) score += 3;
  });
  
  // Bonus pour types de formulaires importants
  if (description.includes('10-K') || description.includes('10-Q')) score += 5;
  if (description.includes('8-K')) score += 3;
  if (description.includes('S-1')) score += 4; // IPO
  
  // Bonus pour entreprises technologiques
  const techKeywords = ['software', 'technology', 'tech', 'digital', 'ai', 'saas'];
  techKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 2;
  });
  
  return Math.min(10, score);
}

function calculateDataGovRelevance(title, description, query) {
  let score = 0;
  const text = (title + ' ' + description).toLowerCase();
  const queryWords = query.toLowerCase().split(' ');
  
  // Correspondance mots-clés
  queryWords.forEach(word => {
    if (text.includes(word)) score += 2;
  });
  
  // Bonus pour données business/économiques
  const businessKeywords = ['business', 'economic', 'industry', 'company', 'employment', 'statistics'];
  businessKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 1;
  });
  
  // Bonus pour données récentes
  if (title.includes('2024') || title.includes('2023')) score += 2;
  
  return Math.min(10, score);
}

function calculateBizBuySellRelevance(title, description, query) {
  let score = 0;
  const text = (title + ' ' + description).toLowerCase();
  const queryWords = query.toLowerCase().split(' ');
  
  // Correspondance mots-clés
  queryWords.forEach(word => {
    if (text.includes(word)) score += 4;
  });
  
  // Bonus pour localisation Canada
  const canadaKeywords = ['canada', 'toronto', 'vancouver', 'montreal', 'ontario', 'bc', 'quebec'];
  canadaKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 3;
  });
  
  // Bonus pour entreprises établies
  if (text.includes('established') || text.includes('profitable') || text.includes('revenue')) score += 2;
  
  return Math.min(10, score);
}