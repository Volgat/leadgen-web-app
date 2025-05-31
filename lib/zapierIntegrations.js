const axios = require('axios');

// Cache local pour les intégrations Zapier
const zapierCache = new Map();

// Zapier Webhooks pour données réelles
const ZAPIER_WEBHOOKS = {
  crunchbase: process.env.ZAPIER_CRUNCHBASE_WEBHOOK,
  contacts: process.env.ZAPIER_CONTACTS_WEBHOOK,
  enrichment: process.env.ZAPIER_ENRICHMENT_WEBHOOK
};

// Crunchbase via Zapier - Données réelles d'entreprises
async function fetchCrunchbaseViaZapier(query) {
  try {
    if (!ZAPIER_WEBHOOKS.crunchbase) {
      throw new Error('Zapier Crunchbase webhook not configured');
    }

    console.log('🔗 Fetching Crunchbase data via Zapier...');
    
    const response = await axios.post(ZAPIER_WEBHOOKS.crunchbase, {
      query: query,
      fields: [
        'name', 'description', 'website', 'location', 
        'funding_total', 'employee_count', 'categories',
        'founded_on', 'last_funding_at', 'num_funding_rounds'
      ],
      limit: 8
    }, {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.companies) {
      return response.data.companies.map(company => ({
        name: company.name,
        description: company.description || `${company.name} operates in the ${query} sector`,
        website: company.website,
        location: company.location || 'Location not specified',
        funding_total: company.funding_total || 'Funding info not available',
        employee_count: company.employee_count || 'Employee count not available',
        categories: Array.isArray(company.categories) ? company.categories.join(', ') : company.categories || query,
        founded_on: company.founded_on,
        last_funding: company.last_funding_at,
        funding_rounds: company.num_funding_rounds || 0,
        score: calculateCompanyScore(company),
        type: 'crunchbase_zapier'
      }));
    }

    throw new Error('No companies returned from Zapier');
  } catch (err) {
    console.error('❌ Zapier Crunchbase Error:', err.message);
    throw err; // Pas de fallback - données réelles obligatoires
  }
}

// Enrichissement contacts via Zapier (Hunter.io, Apollo.io, etc.)
async function enrichCompanyContacts(companies) {
  try {
    if (!ZAPIER_WEBHOOKS.contacts || !companies.length) {
      return companies;
    }

    console.log('📧 Enriching contact data via Zapier...');

    const enrichmentPromises = companies.map(async (company) => {
      try {
        const response = await axios.post(ZAPIER_WEBHOOKS.contacts, {
          company_name: company.name,
          website: company.website,
          domain: extractDomain(company.website)
        }, {
          timeout: 15000
        });

        if (response.data && response.data.contacts) {
          return {
            ...company,
            contacts: {
              email: response.data.contacts.email || findEmailFromWebsite(company.website),
              phone: response.data.contacts.phone || 'Contact via website',
              linkedin: response.data.contacts.linkedin || '',
              key_people: response.data.contacts.key_people || []
            }
          };
        }

        return {
          ...company,
          contacts: {
            email: findEmailFromWebsite(company.website),
            phone: 'Contact via website',
            linkedin: '',
            key_people: []
          }
        };
      } catch (contactError) {
        console.error(`Contact enrichment failed for ${company.name}:`, contactError.message);
        return {
          ...company,
          contacts: {
            email: findEmailFromWebsite(company.website),
            phone: 'Contact via website',
            linkedin: '',
            key_people: []
          }
        };
      }
    });

    return await Promise.all(enrichmentPromises);
  } catch (err) {
    console.error('❌ Contact enrichment error:', err.message);
    return companies; // Retourner les entreprises sans contacts si échec
  }
}

// Données d'intent signals enrichies via Zapier
async function enrichIntentSignals(query, companies) {
  try {
    if (!ZAPIER_WEBHOOKS.enrichment) {
      return companies;
    }

    console.log('🎯 Enriching intent signals via Zapier...');

    const response = await axios.post(ZAPIER_WEBHOOKS.enrichment, {
      query: query,
      companies: companies.map(c => ({ name: c.name, website: c.website })),
      signals: ['hiring', 'funding', 'expansion', 'technology_adoption', 'partnerships']
    }, {
      timeout: 25000
    });

    if (response.data && response.data.enriched_companies) {
      return companies.map(company => {
        const enriched = response.data.enriched_companies.find(e => e.name === company.name);
        if (enriched) {
          return {
            ...company,
            intent_signals: {
              hiring: enriched.hiring_signals || 0,
              funding: enriched.funding_activity || 0,
              expansion: enriched.expansion_signals || 0,
              technology: enriched.tech_adoption || 0,
              partnerships: enriched.partnership_activity || 0,
              overall_score: enriched.intent_score || calculateIntentScore(company)
            }
          };
        }
        return {
          ...company,
          intent_signals: {
            hiring: 0,
            funding: 0,
            expansion: 0,
            technology: 0,
            partnerships: 0,
            overall_score: calculateIntentScore(company)
          }
        };
      });
    }

    return companies;
  } catch (err) {
    console.error('❌ Intent enrichment error:', err.message);
    return companies;
  }
}

// Fonctions utilitaires
function calculateCompanyScore(company) {
  let score = 50; // Score de base
  
  // Bonus pour le financement
  if (company.funding_total && company.funding_total !== 'Funding info not available') {
    score += 20;
  }
  
  // Bonus pour l'activité récente
  if (company.last_funding_at) {
    const lastFunding = new Date(company.last_funding_at);
    const monthsAgo = (Date.now() - lastFunding.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 12) score += 15;
    else if (monthsAgo < 24) score += 10;
  }
  
  // Bonus pour la taille
  if (company.employee_count) {
    const employees = extractEmployeeNumber(company.employee_count);
    if (employees > 100) score += 10;
    else if (employees > 10) score += 5;
  }
  
  return Math.min(score, 95); // Max 95 pour rester réaliste
}

function calculateIntentScore(company) {
  let score = 3; // Score de base sur 10
  
  if (company.funding_total && company.funding_total !== 'Funding info not available') {
    score += 2;
  }
  
  if (company.last_funding) {
    const lastFunding = new Date(company.last_funding);
    const monthsAgo = (Date.now() - lastFunding.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 6) score += 3;
    else if (monthsAgo < 12) score += 2;
  }
  
  return Math.min(score, 10);
}

function extractDomain(website) {
  if (!website) return '';
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace('www.', '');
  } catch {
    return website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

function findEmailFromWebsite(website) {
  if (!website) return 'info@company.com';
  const domain = extractDomain(website);
  return `info@${domain}`;
}

function extractEmployeeNumber(employeeRange) {
  if (!employeeRange) return 0;
  const match = employeeRange.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Export des fonctions
module.exports = {
  fetchCrunchbaseViaZapier,
  enrichCompanyContacts,
  enrichIntentSignals,
  calculateCompanyScore,
  calculateIntentScore
};