// lib/linkedinIntelligence.js - Scraping LinkedIn niveau professionnel
// Reproduction de la logique de votre business de recrutement Align Wellness

const axios = require('axios');
const cheerio = require('cheerio');

class LinkedInProIntelligence {
  constructor() {
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
    };
    this.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  }

  // FONCTION PRINCIPALE - Détecter "Open to Work" comme votre exemple
  async detectOpenToWorkSignals(targetCompanies) {
    console.log('🔍 Detecting LinkedIn "Open to Work" signals...');
    const signals = [];

    for (const company of targetCompanies) {
      try {
        await this.delay(3000); // Rate limiting important
        
        const openEmployees = await this.scrapeCompanyOpenToWork(company);
        
        if (openEmployees.length > 0) {
          const turnoverAnalysis = this.analyzeTurnoverRisk(company, openEmployees);
          
          signals.push({
            type: 'employee_turnover_risk',
            company: company.name,
            severity: turnoverAnalysis.severity,
            urgency_score: turnoverAnalysis.urgency,
            confidence: 0.92, // LinkedIn data is highly reliable
            
            // Données détaillées
            open_employees: openEmployees,
            affected_departments: turnoverAnalysis.departments,
            key_roles_at_risk: turnoverAnalysis.keyRoles,
            turnover_rate: turnoverAnalysis.rate,
            
            // Actions recommandées
            recommended_action: turnoverAnalysis.action,
            timing: turnoverAnalysis.timing,
            contact_strategy: turnoverAnalysis.strategy,
            
            // Métadonnées
            scraped_at: new Date().toISOString(),
            source: 'linkedin_pro_intelligence',
            data_freshness: 'real_time'
          });
        }
        
      } catch (error) {
        console.error(`LinkedIn scraping error for ${company.name}:`, error.message);
      }
    }

    console.log(`✅ Detected ${signals.length} turnover risk signals`);
    return signals;
  }

  // Scraper les employés "Open to Work" d'une entreprise
  async scrapeCompanyOpenToWork(company) {
    const openEmployees = [];
    
    try {
      // Méthode 1: Search LinkedIn avec "Open to Work" + company name
      const searchQuery = `"${company.name}" "open to work" site:linkedin.com`;
      const searchResults = await this.googleSearchLinkedIn(searchQuery);
      
      for (const profile of searchResults) {
        const employeeData = await this.extractEmployeeData(profile.url);
        if (employeeData && employeeData.isOpenToWork) {
          openEmployees.push(employeeData);
        }
        await this.delay(2000);
      }
      
      // Méthode 2: Company page employees (si accessible)
      const companyEmployees = await this.scrapeCompanyEmployees(company);
      const openCompanyEmployees = companyEmployees.filter(emp => emp.isOpenToWork);
      
      openEmployees.push(...openCompanyEmployees);
      
    } catch (error) {
      console.error(`Error scraping ${company.name} open to work:`, error);
    }
    
    return this.deduplicateEmployees(openEmployees);
  }

  // Google Search pour profiles LinkedIn "Open to Work"
  async googleSearchLinkedIn(query) {
    try {
      const response = await axios.get('https://www.google.com/search', {
        params: {
          q: query,
          num: 20
        },
        headers: this.headers,
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const profiles = [];

      $('.g').each((i, element) => {
        const $result = $(element);
        const link = $result.find('a').attr('href');
        const title = $result.find('h3').text();
        
        if (link && link.includes('linkedin.com/in/') && title.toLowerCase().includes('open to work')) {
          profiles.push({
            url: link,
            title: title,
            snippet: $result.find('.VwiC3b').text()
          });
        }
      });

      return profiles.slice(0, 10); // Limit results
    } catch (error) {
      console.error('Google search error:', error);
      return [];
    }
  }

  // Extraire données d'un profil LinkedIn
  async extractEmployeeData(profileUrl) {
    try {
      const response = await axios.get(profileUrl, {
        headers: this.headers,
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Extraire informations du profil
      const name = $('h1').first().text().trim();
      const title = $('.text-body-medium').first().text().trim();
      const location = $('[data-test-id="hero-location"]').text().trim();
      
      // Détecter "Open to Work" badge/mention
      const isOpenToWork = this.detectOpenToWorkStatus($, response.data);
      
      // Extraire expérience actuelle
      const currentCompany = this.extractCurrentCompany($);
      const department = this.identifyDepartment(title);
      const seniority = this.assessSeniorityLevel(title);
      
      return {
        name,
        title,
        location,
        currentCompany,
        department,
        seniority,
        isOpenToWork,
        profileUrl,
        scrapedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Profile extraction error:', error);
      return null;
    }
  }

  // Détecter status "Open to Work"
  detectOpenToWorkStatus($, html) {
    // Plusieurs indicateurs possibles
    const indicators = [
      $('.profile-open-to-work').length > 0,
      $('[data-test-id="open-to-work"]').length > 0,
      html.includes('Open to work'),
      html.includes('#OpenToWork'),
      html.includes('Looking for opportunities'),
      html.includes('Seeking new role'),
      $('.hiring-frame').length > 0
    ];
    
    return indicators.some(indicator => indicator === true);
  }

  // Analyser risque de turnover
  analyzeTurnoverRisk(company, openEmployees) {
    const totalEmployees = company.estimated_employees || 100;
    const openCount = openEmployees.length;
    const turnoverRate = openCount / totalEmployees;
    
    // Analyser par département
    const departments = this.groupByDepartment(openEmployees);
    
    // Identifier rôles clés
    const keyRoles = openEmployees.filter(emp => 
      ['senior', 'director', 'vp', 'manager', 'lead', 'principal'].some(keyword => 
        emp.title.toLowerCase().includes(keyword)
      )
    );
    
    // Calculer sévérité
    let severity = 'low';
    let urgency = 3;
    let action = 'Monitor situation';
    let timing = 'within_month';
    let strategy = 'informational_outreach';
    
    if (keyRoles.length >= 2 || turnoverRate > 0.15) {
      severity = 'critical';
      urgency = 95;
      action = 'Contact CEO/Owner immediately - leadership vacuum imminent';
      timing = 'within_48h';
      strategy = 'urgent_executive_outreach';
    } else if (keyRoles.length === 1 || turnoverRate > 0.08) {
      severity = 'high';
      urgency = 80;
      action = 'Proactive outreach to decision makers';
      timing = 'within_week';
      strategy = 'proactive_solution_positioning';
    } else if (openCount >= 3 || turnoverRate > 0.05) {
      severity = 'medium';
      urgency = 60;
      action = 'Prepare for upcoming needs';
      timing = 'within_2weeks';
      strategy = 'relationship_building';
    }
    
    return {
      severity,
      urgency,
      rate: Math.round(turnoverRate * 100) / 100,
      departments,
      keyRoles: keyRoles.map(emp => ({
        name: emp.name,
        title: emp.title,
        department: emp.department,
        seniority: emp.seniority
      })),
      action,
      timing,
      strategy
    };
  }

  // Détecter mouvements de conseils d'administration
  async detectBoardMovements(executivesList) {
    console.log('🎯 Detecting board member appointments...');
    const movements = [];
    
    for (const executive of executivesList) {
      try {
        await this.delay(2000);
        
        const boardSignals = await this.scrapeBoardAppointments(executive);
        
        if (boardSignals.length > 0) {
          movements.push({
            type: 'board_appointment',
            executive: executive,
            new_positions: boardSignals,
            influence_score: this.calculateInfluenceScore(executive, boardSignals),
            networking_opportunity: true,
            approach_strategy: 'board_member_introduction',
            timing: 'within_week',
            confidence: 0.88,
            recommended_action: `Leverage ${executive.name}'s new board position for warm introduction`
          });
        }
        
      } catch (error) {
        console.error(`Board detection error for ${executive.name}:`, error);
      }
    }
    
    return movements;
  }

  // Scraper nouvelles nominations au conseil
  async scrapeBoardAppointments(executive) {
    const appointments = [];
    
    try {
      // Search recent LinkedIn activity
      const activityUrl = `${executive.profileUrl}/recent-activity/`;
      const response = await axios.get(activityUrl, {
        headers: this.headers,
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      
      // Look for board-related posts/updates
      $('.feed-update').each((i, element) => {
        const $update = $(element);
        const text = $update.text().toLowerCase();
        
        if (text.includes('board') && 
            (text.includes('joined') || text.includes('appointed') || text.includes('director'))) {
          
          const company = this.extractCompanyFromBoardPost($update.text());
          const date = this.extractDateFromPost($update);
          
          if (company) {
            appointments.push({
              company,
              position: 'Board Member',
              appointment_date: date,
              announcement_text: $update.text().trim()
            });
          }
        }
      });
      
    } catch (error) {
      console.error('Board scraping error:', error);
    }
    
    return appointments;
  }

  // Fonctions utilitaires
  groupByDepartment(employees) {
    const departments = {};
    
    employees.forEach(emp => {
      const dept = emp.department || 'Other';
      if (!departments[dept]) departments[dept] = [];
      departments[dept].push(emp);
    });
    
    return departments;
  }

  identifyDepartment(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('tech')) {
      return 'Engineering';
    } else if (titleLower.includes('sales') || titleLower.includes('business development')) {
      return 'Sales';
    } else if (titleLower.includes('marketing')) {
      return 'Marketing';
    } else if (titleLower.includes('finance') || titleLower.includes('accounting')) {
      return 'Finance';
    } else if (titleLower.includes('hr') || titleLower.includes('people')) {
      return 'HR';
    } else if (titleLower.includes('operations') || titleLower.includes('ops')) {
      return 'Operations';
    } else {
      return 'Other';
    }
  }

  assessSeniorityLevel(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('ceo') || titleLower.includes('cto') || titleLower.includes('cfo')) {
      return 'C-Level';
    } else if (titleLower.includes('vp') || titleLower.includes('vice president')) {
      return 'VP';
    } else if (titleLower.includes('director')) {
      return 'Director';
    } else if (titleLower.includes('manager') || titleLower.includes('lead')) {
      return 'Manager';
    } else if (titleLower.includes('senior')) {
      return 'Senior';
    } else {
      return 'Individual Contributor';
    }
  }

  calculateInfluenceScore(executive, boardPositions) {
    let score = 50; // Base score
    
    // Add points for each board position
    score += boardPositions.length * 20;
    
    // Add points for executive seniority
    if (executive.title.includes('CEO')) score += 30;
    else if (executive.title.includes('CTO') || executive.title.includes('CFO')) score += 25;
    else if (executive.title.includes('VP')) score += 15;
    
    // Add points for company size/influence
    if (executive.companySize > 1000) score += 20;
    else if (executive.companySize > 100) score += 10;
    
    return Math.min(100, score);
  }

  deduplicateEmployees(employees) {
    const seen = new Set();
    return employees.filter(emp => {
      const key = `${emp.name}_${emp.title}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  extractCurrentCompany($) {
    // Extract current company from experience section
    return $('.experience-section .experience-item').first().find('.company-name').text().trim();
  }

  extractCompanyFromBoardPost(text) {
    // Extract company name from board appointment text
    const match = text.match(/board.*?(?:at|of|for)\s+([A-Z][a-zA-Z\s]+)/i);
    return match ? match[1].trim() : null;
  }

  extractDateFromPost($element) {
    const timeElement = $element.find('time');
    return timeElement.attr('datetime') || new Date().toISOString();
  }
}

// Intégration avec le système principal
async function enhanceWithLinkedInIntelligence(companies, query) {
  const linkedInIntel = new LinkedInProIntelligence();
  
  try {
    // 1. Détecter signaux "Open to Work"
    const turnoverSignals = await linkedInIntel.detectOpenToWorkSignals(companies);
    
    // 2. Détecter mouvements de conseils d'administration  
    const executives = companies.flatMap(c => c.executives || []);
    const boardMovements = await linkedInIntel.detectBoardMovements(executives);
    
    // 3. Combiner tous les signaux LinkedIn
    const allLinkedInSignals = [
      ...turnoverSignals,
      ...boardMovements
    ];
    
    console.log(`✅ LinkedIn Intelligence: ${allLinkedInSignals.length} signals detected`);
    
    return allLinkedInSignals;
    
  } catch (error) {
    console.error('❌ LinkedIn Intelligence error:', error);
    return [];
  }
}

module.exports = {
  LinkedInProIntelligence,
  enhanceWithLinkedInIntelligence
};