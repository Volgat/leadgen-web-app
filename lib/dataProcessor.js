// lib/dataProcessor.js - ES6 Modules uniquement
import axios from 'axios';

// ===============================
// ENRICHISSEMENT CONTACT RÉEL
// ===============================

// Hunter.io - Email Finder (API gratuite 50/mois)
export async function enrichContactsHunter(companies) {
  if (!process.env.HUNTER_API_KEY || process.env.HUNTER_API_KEY.includes('votre_')) {
    console.warn('⚠️ Hunter.io API key not configured');
    return companies.map(company => ({
      ...company,
      contacts: { emails: [], domain_info: null },
      enrichment_status: 'hunter_not_configured'
    }));
  }

  const enrichedCompanies = [];
  
  for (const company of companies) {
    try {
      // Extraire le domaine du site web
      const domain = extractDomain(company.website || company.name);
      if (!domain) {
        enrichedCompanies.push({
          ...company,
          contacts: { emails: [], domain_info: null },
          enrichment_status: 'no_domain'
        });
        continue;
      }

      console.log(`🔍 Enriching contacts for ${company.name} (${domain})`);
      
      // Délai pour éviter rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // API Hunter.io pour trouver emails
      const response = await axios.get('https://api.hunter.io/v2/domain-search', {
        params: {
          domain: domain,
          api_key: process.env.HUNTER_API_KEY,
          limit: 5
        },
        timeout: 15000
      });

      const data = response.data.data;
      
      if (data && data.emails && data.emails.length > 0) {
        // Prendre les emails les plus pertinents (dirigeants, sales, etc.)
        const relevantEmails = data.emails
          .filter(email => email.confidence > 70) // Seulement emails fiables
          .filter(email => {
            const role = email.position?.toLowerCase() || '';
            return role.includes('ceo') || role.includes('founder') || 
                   role.includes('president') || role.includes('director') ||
                   role.includes('sales') || role.includes('business development') ||
                   role.includes('marketing') || role.includes('manager');
          })
          .sort((a, b) => b.confidence - a.confidence) // Trier par confiance
          .slice(0, 3); // Max 3 contacts par entreprise

        enrichedCompanies.push({
          ...company,
          contacts: {
            emails: relevantEmails.map(email => ({
              email: email.value,
              first_name: email.first_name,
              last_name: email.last_name,
              position: email.position,
              confidence: email.confidence,
              department: email.department,
              seniority: email.seniority,
              source: 'hunter.io'
            })),
            domain_info: {
              organization: data.organization,
              country: data.country,
              disposable: data.disposable,
              webmail: data.webmail,
              accept_all: data.accept_all,
              pattern: data.pattern
            }
          },
          enrichment_status: 'contacts_found',
          enrichment_timestamp: new Date().toISOString()
        });
      } else {
        // Aucun email trouvé
        enrichedCompanies.push({
          ...company,
          contacts: { emails: [], domain_info: null },
          enrichment_status: 'no_emails_found',
          enrichment_timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error(`❌ Hunter.io error for ${company.name}:`, error.message);
      enrichedCompanies.push({
        ...company,
        contacts: { emails: [], domain_info: null },
        enrichment_status: 'enrichment_failed',
        enrichment_error: error.message,
        enrichment_timestamp: new Date().toISOString()
      });
    }
  }

  const successCount = enrichedCompanies.filter(c => c.enrichment_status === 'contacts_found').length;
  console.log(`✅ Hunter.io enrichment: ${successCount}/${companies.length} companies enriched`);

  return enrichedCompanies;
}

// Clearbit Enrichment API (données d'entreprise détaillées)
export async function enrichCompanyDataClearbit(companies) {
  if (!process.env.CLEARBIT_API_KEY || process.env.CLEARBIT_API_KEY.includes('votre_')) {
    console.warn('⚠️ Clearbit API key not configured');
    return companies.map(company => ({
      ...company,
      clearbit_enriched: false,
      clearbit_status: 'not_configured'
    }));
  }

  const enrichedCompanies = [];

  for (const company of companies) {
    try {
      const domain = extractDomain(company.website || company.name);
      if (!domain) {
        enrichedCompanies.push({
          ...company,
          clearbit_enriched: false,
          clearbit_status: 'no_domain'
        });
        continue;
      }

      console.log(`🏢 Enriching company data for ${company.name} (${domain})`);

      // Délai pour éviter rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await axios.get(`https://company-stream.clearbit.com/v2/companies/find`, {
        params: { domain: domain },
        headers: {
          'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}`
        },
        timeout: 15000
      });

      const data = response.data;

      enrichedCompanies.push({
        ...company,
        clearbit_data: {
          name: data.name,
          legal_name: data.legalName,
          domain: data.domain,
          domain_aliases: data.domainAliases,
          logo: data.logo,
          description: data.description,
          founded_year: data.foundedYear,
          industry: data.category?.industry,
          industry_group: data.category?.industryGroup,
          sector: data.category?.sector,
          sub_industry: data.category?.subIndustry,
          sic_code: data.category?.sicCode,
          naics_code: data.category?.naicsCode,
          employees: data.metrics?.employees,
          employees_range: data.metrics?.employeesRange,
          estimated_annual_revenue: data.metrics?.estimatedAnnualRevenue,
          raised: data.metrics?.raised,
          annual_revenue: data.metrics?.annualRevenue,
          location: {
            street_number: data.geo?.streetNumber,
            street_name: data.geo?.streetName,
            city: data.geo?.city,
            postal_code: data.geo?.postalCode,
            state: data.geo?.state,
            state_code: data.geo?.stateCode,
            country: data.geo?.country,
            country_code: data.geo?.countryCode,
            lat: data.geo?.lat,
            lng: data.geo?.lng
          },
          tech_stack: data.tech || [],
          tags: data.tags || [],
          social_handles: {
            twitter: data.twitter?.handle,
            facebook: data.facebook?.handle,
            linkedin: data.linkedin?.handle,
            crunchbase: data.crunchbase?.handle
          },
          identifiers: {
            usEIN: data.identifiers?.usEIN,
            ticker: data.identifiers?.ticker
          },
          phone: data.phone,
          time_zone: data.timeZone,
          utc_offset: data.utcOffset
        },
        clearbit_enriched: true,
        clearbit_status: 'enriched',
        clearbit_timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Clearbit error for ${company.name}:`, error.message);
      enrichedCompanies.push({
        ...company,
        clearbit_enriched: false,
        clearbit_status: 'enrichment_failed',
        clearbit_error: error.message,
        clearbit_timestamp: new Date().toISOString()
      });
    }
  }

  const successCount = enrichedCompanies.filter(c => c.clearbit_enriched).length;
  console.log(`✅ Clearbit enrichment: ${successCount}/${companies.length} companies enriched`);

  return enrichedCompanies;
}

// ===============================
// CALCUL DE SCORES D'INTENTION RÉELS
// ===============================

export function calculateRealIntentScore(company, redditPosts, newsPosts, socialPosts, otherSources = {}) {
  let intentScore = 0;
  let signals = [];
  let confidence = 0;

  // 1. Signaux Reddit (source la plus fiable pour intent)
  const companyRedditMentions = redditPosts.filter(post => 
    isCompanyMentioned(company, post.title + ' ' + (post.selftext || ''))
  );

  companyRedditMentions.forEach(post => {
    if (post.intent_score >= 8) {
      intentScore += 30;
      signals.push({
        type: 'reddit_high_intent',
        description: `High intent discussion: "${post.title.substring(0, 60)}..."`,
        score: 30,
        confidence: 0.9,
        source: 'reddit',
        url: post.url
      });
    } else if (post.intent_score >= 6) {
      intentScore += 20;
      signals.push({
        type: 'reddit_medium_intent',
        description: `Active discussion: "${post.title.substring(0, 60)}..."`,
        score: 20,
        confidence: 0.8,
        source: 'reddit',
        url: post.url
      });
    } else if (post.intent_score >= 4) {
      intentScore += 10;
      signals.push({
        type: 'reddit_low_intent',
        description: `Business mention: "${post.title.substring(0, 60)}..."`,
        score: 10,
        confidence: 0.6,
        source: 'reddit',
        url: post.url
      });
    }
  });

  // 2. Signaux de financement (News + Clearbit)
  if (company.clearbit_data?.metrics?.raised) {
    intentScore += 25;
    signals.push({
      type: 'recent_funding',
      description: `Company raised: $${(company.clearbit_data.metrics.raised / 1000000).toFixed(1)}M`,
      score: 25,
      confidence: 0.95,
      source: 'clearbit'
    });
  }

  // Vérifier mentions de financement dans les news
  const fundingMentions = newsPosts.filter(article => 
    isCompanyMentioned(company, article.title + ' ' + article.description) &&
    (article.title.toLowerCase().includes('funding') || 
     article.title.toLowerCase().includes('investment') ||
     article.title.toLowerCase().includes('raised') ||
     article.title.toLowerCase().includes('series'))
  );

  fundingMentions.forEach(article => {
    intentScore += 20;
    signals.push({
      type: 'news_funding',
      description: `Funding news: "${article.title.substring(0, 60)}..."`,
      score: 20,
      confidence: 0.8,
      source: 'news',
      url: article.url
    });
  });

  // 3. Signaux de croissance (employés + Clearbit)
  if (company.clearbit_data?.metrics?.employees) {
    const employees = company.clearbit_data.metrics.employees;
    if (employees >= 10 && employees <= 500) { // Sweet spot pour B2B
      intentScore += 15;
      signals.push({
        type: 'optimal_company_size',
        description: `Optimal size: ${employees} employees`,
        score: 15,
        confidence: 0.9,
        source: 'clearbit'
      });
    }
  }

  // 4. Signaux géographiques (marché cible Canada/US)
  const location = company.clearbit_data?.location || company.location;
  if (location) {
    const locationText = JSON.stringify(location).toLowerCase();
    const canadaCities = ['toronto', 'vancouver', 'montreal', 'calgary', 'ottawa', 'canada'];
    const usCities = ['new york', 'san francisco', 'los angeles', 'chicago', 'boston', 'seattle', 'usa', 'united states'];
    
    if (canadaCities.some(city => locationText.includes(city))) {
      intentScore += 25;
      signals.push({
        type: 'target_market_canada',
        description: `Located in primary market: ${company.clearbit_data?.location?.city || location}`,
        score: 25,
        confidence: 0.95,
        source: 'location'
      });
    } else if (usCities.some(city => locationText.includes(city))) {
      intentScore += 15;
      signals.push({
        type: 'target_market_usa',
        description: `Located in secondary market: ${company.clearbit_data?.location?.city || location}`,
        score: 15,
        confidence: 0.85,
        source: 'location'
      });
    }
  }

  // 5. Signaux industrie (pertinence technologique)
  if (company.clearbit_data?.category) {
    const category = company.clearbit_data.category;
    const highValueIndustries = ['software', 'saas', 'technology', 'fintech', 'healthtech', 'ai', 'artificial intelligence'];
    
    const industryText = (category.industry + ' ' + category.sector + ' ' + category.subIndustry).toLowerCase();
    if (highValueIndustries.some(industry => industryText.includes(industry))) {
      intentScore += 15;
      signals.push({
        type: 'high_value_industry',
        description: `High-value industry: ${category.industry}`,
        score: 15,
        confidence: 0.8,
        source: 'clearbit'
      });
    }
  }

  // 6. Signaux de contact (disponibilité et qualité)
  if (company.contacts && company.contacts.emails && company.contacts.emails.length > 0) {
    const highConfidenceEmails = company.contacts.emails.filter(email => email.confidence > 90);
    if (highConfidenceEmails.length > 0) {
      intentScore += 15;
      signals.push({
        type: 'high_quality_contacts',
        description: `${highConfidenceEmails.length} high-confidence contact(s) available`,
        score: 15,
        confidence: 0.9,
        source: 'hunter'
      });
    } else {
      intentScore += 8;
      signals.push({
        type: 'contacts_available',
        description: `${company.contacts.emails.length} contact(s) available`,
        score: 8,
        confidence: 0.7,
        source: 'hunter'
      });
    }
  }

  // Calculer la confiance globale
  if (signals.length > 0) {
    confidence = signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length;
    confidence = Math.round(confidence * 100);
  }

  return {
    overall_score: Math.min(100, intentScore),
    signals: signals.sort((a, b) => b.score - a.score), // Trier par score décroissant
    confidence: confidence,
    signal_count: signals.length,
    last_updated: new Date().toISOString(),
    calculation_method: 'multi_source_weighted_scoring'
  };
}

// ===============================
// EXTRACTION D'ENTREPRISES RÉELLES À PARTIR DES DONNÉES
// ===============================

export function extractRealCompaniesFromSources(redditPosts, newsPosts, socialPosts, otherSources = {}) {
  const companies = new Map();

  // 1. Extraire entreprises mentionnées sur Reddit
  redditPosts.forEach(post => {
    const extractedCompanies = extractCompaniesFromText(post.title + ' ' + (post.selftext || ''));
    extractedCompanies.forEach(company => {
      const key = company.name.toLowerCase();
      if (!companies.has(key)) {
        companies.set(key, {
          ...company,
          discovery_source: 'reddit',
          discovery_context: post.title,
          reddit_mentions: 1,
          reddit_intent_score: post.intent_score || 0,
          reddit_posts: [post]
        });
      } else {
        const existing = companies.get(key);
        existing.reddit_mentions = (existing.reddit_mentions || 0) + 1;
        existing.reddit_intent_score = Math.max(existing.reddit_intent_score || 0, post.intent_score || 0);
        existing.reddit_posts = existing.reddit_posts || [];
        existing.reddit_posts.push(post);
      }
    });
  });

  // 2. Extraire entreprises mentionnées dans les news
  newsPosts.forEach(article => {
    const extractedCompanies = extractCompaniesFromText(article.title + ' ' + (article.description || ''));
    extractedCompanies.forEach(company => {
      const key = company.name.toLowerCase();
      if (!companies.has(key)) {
        companies.set(key, {
          ...company,
          discovery_source: 'news',
          discovery_context: article.title,
          news_mentions: 1,
          news_articles: [article]
        });
      } else {
        const existing = companies.get(key);
        existing.news_mentions = (existing.news_mentions || 0) + 1;
        existing.news_articles = existing.news_articles || [];
        existing.news_articles.push(article);
      }
    });
  });

  // 3. Extraire entreprises des posts sociaux
  socialPosts.forEach(post => {
    const extractedCompanies = extractCompaniesFromText(post.text);
    extractedCompanies.forEach(company => {
      const key = company.name.toLowerCase();
      if (!companies.has(key)) {
        companies.set(key, {
          ...company,
          discovery_source: 'social',
          discovery_context: post.text.substring(0, 100),
          social_mentions: 1,
          social_posts: [post]
        });
      } else {
        const existing = companies.get(key);
        existing.social_mentions = (existing.social_mentions || 0) + 1;
        existing.social_posts = existing.social_posts || [];
        existing.social_posts.push(post);
      }
    });
  });

  // Filtrer seulement les entreprises avec des signaux forts
  return Array.from(companies.values()).filter(company => {
    // Critères de qualification stricts
    const hasStrongRedditSignal = company.reddit_mentions && company.reddit_intent_score >= 6;
    const hasMultipleNewsMentions = company.news_mentions >= 2;
    const hasHighSocialEngagement = company.social_posts?.some(post => post.engagement_score > 20);
    const hasRedditWithBudget = company.reddit_posts?.some(post => 
      (post.title + ' ' + (post.selftext || '')).toLowerCase().includes('budget') ||
      (post.title + ' ' + (post.selftext || '')).toLowerCase().includes('$')
    );

    return hasStrongRedditSignal || 
           hasMultipleNewsMentions || 
           hasHighSocialEngagement ||
           hasRedditWithBudget;
  });
}

// Extraction d'entreprises à partir de texte (NLP amélioré)
export function extractCompaniesFromText(text) {
  const companies = [];
  
  // Patterns pour identifier des entreprises (améliorés)
  const companyPatterns = [
    // Entreprises avec suffixes légaux
    /([A-Z][a-zA-Z\s]{2,40}(?:Inc|Corp|LLC|Ltd|Company|Solutions|Technologies|Systems|Software|Group|Services|Consulting|Partners|Associates)\.?)/g,
    // Noms en CamelCase (ex: TechCorp, DataFlow, OpenAI)
    /([A-Z][a-z]+[A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)*)/g,
    // Entreprises avec domaines
    /([A-Z][a-zA-Z\s]{2,30}\.(?:com|ca|org|net|io|ai))/g,
    // Noms propres suivis de mots-clés business
    /([A-Z][a-zA-Z\s]{2,30}(?:\s+(?:startup|company|business|firm|agency|studio|labs?|ventures?)))/gi
  ];

  companyPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/\.$/, '').trim();
        
        // Filtres de qualité
        const isValidLength = cleaned.length > 3 && cleaned.length < 60;
        const hasCapitalLetter = /[A-Z]/.test(cleaned);
        const notCommonWords = !['The Company', 'Our Company', 'Your Business', 'This Business'].includes(cleaned);
        const notGenericTerms = !/(Inc|Corp|LLC|Ltd|Company|Solutions|Technologies)$/i.test(cleaned.replace(/\s+/g, ''));
        
        if (isValidLength && hasCapitalLetter && notCommonWords) {
          // Tentative d'extraction du site web
          let website = null;
          if (cleaned.includes('.')) {
            website = cleaned.toLowerCase().replace(/\s+/g, '');
            if (!website.startsWith('http')) {
              website = 'https://' + website;
            }
          } else {
            // Générer URL probable
            const domain = cleaned.toLowerCase()
              .replace(/\s+/g, '')
              .replace(/[^a-z0-9]/g, '');
            website = `https://www.${domain}.com`;
          }

          companies.push({
            name: cleaned,
            website: website,
            source: 'text_extraction',
            confidence: 0.7,
            extracted_from: text.substring(0, 200) + '...'
          });
        }
      });
    }
  });

  // Dédoublonner par nom similaire
  const uniqueCompanies = [];
  const seenNames = new Set();
  
  companies.forEach(company => {
    const normalizedName = company.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenNames.has(normalizedName)) {
      seenNames.add(normalizedName);
      uniqueCompanies.push(company);
    }
  });

  return uniqueCompanies;
}

// Vérifier si une entreprise est mentionnée dans un texte
function isCompanyMentioned(company, text) {
  const companyName = company.name.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Recherche exacte
  if (textLower.includes(companyName)) return true;
  
  // Recherche par mots-clés du nom
  const nameWords = companyName.split(/\s+/).filter(word => word.length > 3);
  if (nameWords.length > 1) {
    const matchedWords = nameWords.filter(word => textLower.includes(word));
    return matchedWords.length >= Math.ceil(nameWords.length / 2);
  }
  
  // Recherche par domaine si disponible
  if (company.website) {
    const domain = extractDomain(company.website);
    if (domain && textLower.includes(domain.replace('.com', '').replace('.ca', ''))) {
      return true;
    }
  }
  
  return false;
}

// ===============================
// FONCTIONS UTILITAIRES
// ===============================

export function extractDomain(website) {
  if (!website) return null;
  try {
    // Si c'est juste un nom d'entreprise, créer un domaine probable
    if (!website.includes('.') && !website.includes('http')) {
      const domain = website.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 20);
      return domain ? `${domain}.com` : null;
    }
    
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace('www.', '');
  } catch {
    const cleaned = website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    return cleaned.includes('.') ? cleaned : null;
  }
}

function extractEmployeeNumber(employeeRange) {
  if (!employeeRange) return 0;
  
  // Si c'est déjà un nombre
  if (typeof employeeRange === 'number') return employeeRange;
  
  // Extraire nombre d'une chaîne
  const match = employeeRange.toString().match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// ===============================
// FONCTION PRINCIPALE DE TRAITEMENT
// ===============================

export async function processRealData(rawData, query) {
  console.log('🔄 Processing real data into professional intelligence...');
  
  try {
    // 1. Extraire entreprises réelles des sources
    const extractedCompanies = extractRealCompaniesFromSources(
      rawData.reddit || [],
      rawData.news || [],
      rawData.xPosts || [],
      {
        secData: rawData.secData || [],
        bizBuySell: rawData.bizBuySell || [],
        hackerNews: rawData.hackerNews || []
      }
    );

    if (extractedCompanies.length === 0) {
      console.log('⚠️ No real companies extracted from sources');
      return {
        companies: [],
        metrics: {
          total_companies: 0,
          with_contacts: 0,
          avg_intent_score: 0,
          data_quality: 'insufficient_data'
        }
      };
    }

    console.log(`✅ Extracted ${extractedCompanies.length} real companies from sources`);

    // 2. Enrichir avec contacts réels (Hunter.io)
    console.log('📧 Enriching with real contact data...');
    const companiesWithContacts = await enrichContactsHunter(extractedCompanies);

    // 3. Enrichir avec données d'entreprise détaillées (Clearbit)
    console.log('🏢 Enriching with company intelligence...');
    const fullyEnrichedCompanies = await enrichCompanyDataClearbit(companiesWithContacts);

    // 4. Calculer scores d'intention réels
    console.log('🎯 Calculating real intent scores...');
    const companiesWithScores = fullyEnrichedCompanies.map(company => {
      const intentAnalysis = calculateRealIntentScore(
        company,
        rawData.reddit || [],
        rawData.news || [],
        rawData.xPosts || [],
        {
          secData: rawData.secData || [],
          bizBuySell: rawData.bizBuySell || [],
          hackerNews: rawData.hackerNews || []
        }
      );

      return {
        ...company,
        intent_analysis: intentAnalysis,
        intent_score: intentAnalysis.overall_score,
        confidence_score: intentAnalysis.confidence,
        signals: intentAnalysis.signals,
        signal_count: intentAnalysis.signal_count,
        last_analyzed: new Date().toISOString()
      };
    });

    // 5. Trier par qualité et score d'intention
    const rankedCompanies = companiesWithScores
      .filter(company => company.intent_score > 0) // Seulement entreprises avec signaux
      .sort((a, b) => {
        // Système de scoring sophistiqué
        const scoreA = calculateCompanyRankingScore(a);
        const scoreB = calculateCompanyRankingScore(b);
        return scoreB - scoreA;
      });

    // 6. Calculer métriques de qualité détaillées
    const metrics = {
      total_companies: rankedCompanies.length,
      with_contacts: rankedCompanies.filter(c => c.contacts?.emails?.length > 0).length,
      with_high_confidence_contacts: rankedCompanies.filter(c => 
        c.contacts?.emails?.some(email => email.confidence > 90)
      ).length,
      with_high_intent: rankedCompanies.filter(c => c.intent_score >= 70).length,
      with_clearbit_data: rankedCompanies.filter(c => c.clearbit_enriched).length,
      avg_intent_score: rankedCompanies.length > 0 ? 
        Math.round(rankedCompanies.reduce((sum, c) => sum + c.intent_score, 0) / rankedCompanies.length) : 0,
      avg_confidence: rankedCompanies.length > 0 ?
        Math.round(rankedCompanies.reduce((sum, c) => sum + (c.confidence_score || 0), 0) / rankedCompanies.length) : 0,
      data_sources_used: Object.keys(rawData).filter(key => rawData[key]?.length > 0).length,
      data_quality: determineDataQuality(rankedCompanies),
      processing_timestamp: new Date().toISOString(),
      extraction_stats: {
        reddit_companies: extractedCompanies.filter(c => c.discovery_source === 'reddit').length,
        news_companies: extractedCompanies.filter(c => c.discovery_source === 'news').length,
        social_companies: extractedCompanies.filter(c => c.discovery_source === 'social').length
      }
    };

    console.log(`✅ Processed ${rankedCompanies.length} qualified companies`);
    console.log(`📊 ${metrics.with_contacts} companies with verified contacts`);
    console.log(`🎯 ${metrics.with_high_intent} companies with high intent scores (≥70)`);
    console.log(`🏢 ${metrics.with_clearbit_data} companies with Clearbit enrichment`);

    return {
      companies: rankedCompanies.slice(0, 15), // Top 15 seulement
      metrics: metrics,
      processing_notes: {
        extraction_method: 'advanced_nlp_text_analysis',
        enrichment_apis: ['hunter.io', 'clearbit'],
        intent_calculation: 'multi_signal_weighted_scoring',
        quality_filter: 'intent_score > 0',
        ranking_algorithm: 'composite_scoring'
      }
    };

  } catch (error) {
    console.error('❌ Error processing real data:', error);
    return {
      companies: [],
      metrics: {
        total_companies: 0,
        with_contacts: 0,
        avg_intent_score: 0,
        data_quality: 'processing_error',
        error_message: error.message,
        error_stack: error.stack
      }
    };
  }
}

// Calculer score de ranking sophistiqué
function calculateCompanyRankingScore(company) {
  let score = 0;
  
  // Score d'intention (40% du total)
  score += (company.intent_score || 0) * 0.4;
  
  // Contacts disponibles (25% du total)
  if (company.contacts?.emails?.length > 0) {
    score += 25;
    // Bonus pour emails haute confiance
    const highConfidenceEmails = company.contacts.emails.filter(email => email.confidence > 90);
    score += highConfidenceEmails.length * 5;
  }
  
  // Données Clearbit (20% du total)
  if (company.clearbit_enriched) {
    score += 20;
    // Bonus pour données financières
    if (company.clearbit_data?.metrics?.estimatedAnnualRevenue) score += 5;
    if (company.clearbit_data?.metrics?.employees) score += 5;
  }
  
  // Confiance des signaux (10% du total)
  score += (company.confidence_score || 0) * 0.1;
  
  // Nombre de signaux (5% du total)
  score += Math.min((company.signal_count || 0) * 2, 10);
  
  return score;
}

// Déterminer qualité des données
function determineDataQuality(companies) {
  if (companies.length === 0) return 'no_data';
  
  const withContacts = companies.filter(c => c.contacts?.emails?.length > 0).length;
  const withHighIntent = companies.filter(c => c.intent_score >= 60).length;
  const withEnrichment = companies.filter(c => c.clearbit_enriched).length;
  
  const contactRate = withContacts / companies.length;
  const intentRate = withHighIntent / companies.length;
  const enrichmentRate = withEnrichment / companies.length;
  
  const avgQuality = (contactRate + intentRate + enrichmentRate) / 3;
  
  if (avgQuality >= 0.7) return 'high';
  if (avgQuality >= 0.4) return 'medium';
  if (avgQuality >= 0.2) return 'low';
  return 'very_low';
}