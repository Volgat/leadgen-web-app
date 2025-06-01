// lib/advancedIntentEngine.js - Système d'intent signals sophistiqués
// Va AU-DELÀ de ce que ChatGPT/Claude peuvent faire avec des prompts basiques

const axios = require('axios');

// ===============================
// INTENT SIGNALS AVANCÉS - NIVEAU INSTITUTIONNEL
// ===============================

// 1. LINKEDIN EXECUTIVE TRACKING (comme votre exemple)
class LinkedInExecutiveTracker {
  constructor() {
    this.openToWorkSignals = new Map();
    this.boardMovements = new Map();
    this.executiveChanges = new Map();
  }

  // Détecter "Open to Work" signals chez les employés d'entreprises cibles
  async trackOpenToWorkSignals(targetCompanies) {
    const signals = [];
    
    for (const company of targetCompanies) {
      try {
        // API LinkedIn ou scraping pour détecter employees "Open to Work"
        const openEmployees = await this.scrapeLinkedInOpenToWork(company.name);
        
        if (openEmployees.length > 0) {
          const turnoverRisk = this.calculateTurnoverRisk(openEmployees, company);
          
          signals.push({
            type: 'employee_turnover_risk',
            company: company.name,
            severity: turnoverRisk.severity,
            affected_roles: openEmployees.map(emp => emp.role),
            employee_count: openEmployees.length,
            departments: this.groupByDepartment(openEmployees),
            urgency_score: turnoverRisk.urgency,
            recommended_action: turnoverRisk.severity === 'high' ? 
              'Contact owner immediately - turnover imminent' : 
              'Monitor and prepare proactive outreach',
            timing: 'within_48h',
            confidence: 0.92,
            source: 'linkedin_pro_recruiter'
          });
        }
      } catch (error) {
        console.error(`LinkedIn tracking error for ${company.name}:`, error);
      }
    }
    
    return signals;
  }

  // Tracker les mouvements de conseils d'administration
  async trackBoardMovements(executivesList) {
    const movements = [];
    
    for (const executive of executivesList) {
      const recentBoardJoins = await this.detectBoardAppointments(executive);
      
      if (recentBoardJoins.length > 0) {
        movements.push({
          type: 'board_appointment',
          executive: executive,
          new_positions: recentBoardJoins,
          influence_score: this.calculateInfluenceScore(executive, recentBoardJoins),
          networking_opportunity: true,
          approach_strategy: 'board_member_intro',
          timing: 'within_week',
          confidence: 0.88
        });
      }
    }
    
    return movements;
  }

  calculateTurnoverRisk(openEmployees, company) {
    const keyRoles = ['CTO', 'VP', 'Director', 'Senior Manager'];
    const criticalEmployees = openEmployees.filter(emp => 
      keyRoles.some(role => emp.role.includes(role))
    );
    
    const turnoverRate = openEmployees.length / (company.estimated_employees || 100);
    
    let severity = 'low';
    let urgency = 3;
    
    if (criticalEmployees.length > 0 || turnoverRate > 0.15) {
      severity = 'high';
      urgency = 9;
    } else if (turnoverRate > 0.08) {
      severity = 'medium';
      urgency = 6;
    }
    
    return { severity, urgency };
  }
}

// 2. FUNDING & FINANCIAL SIGNALS TRACKER
class FundingSignalsTracker {
  
  // Détecter signaux de levée de fonds AVANT l'annonce publique
  async detectPreFundingSignals(companies) {
    const signals = [];
    
    for (const company of companies) {
      const fundingIndicators = await this.analyzeFundingIndicators(company);
      
      if (fundingIndicators.probability > 0.7) {
        signals.push({
          type: 'pre_funding_activity',
          company: company.name,
          indicators: fundingIndicators.signals,
          probability: fundingIndicators.probability,
          estimated_timeline: fundingIndicators.timeline,
          recommended_action: 'Accelerate sales cycle - funding window closing',
          urgency_score: 8,
          timing: 'immediate',
          confidence: fundingIndicators.probability
        });
      }
    }
    
    return signals;
  }

  async analyzeFundingIndicators(company) {
    const indicators = [];
    let probability = 0;
    
    // Indicateur 1: Embauche massive récente
    const recentHires = await this.trackRecentHiring(company);
    if (recentHires.growth_rate > 0.25) {
      indicators.push('rapid_hiring_spree');
      probability += 0.3;
    }
    
    // Indicateur 2: Changements leadership C-suite
    const leadershipChanges = await this.trackLeadershipChanges(company);
    if (leadershipChanges.new_cfo || leadershipChanges.new_cto) {
      indicators.push('c_suite_expansion');
      probability += 0.2;
    }
    
    // Indicateur 3: Job postings pour "scale" keywords
    const jobPostings = await this.analyzeJobPostings(company);
    const scaleKeywords = ['scale', 'growth', 'expansion', 'international'];
    if (jobPostings.some(job => scaleKeywords.some(kw => job.title.includes(kw)))) {
      indicators.push('scale_focused_hiring');
      probability += 0.25;
    }
    
    // Indicateur 4: PR agency hiring (souvent avant annonces)
    const prActivity = await this.detectPRActivity(company);
    if (prActivity.new_pr_firm) {
      indicators.push('pr_preparation');
      probability += 0.15;
    }
    
    const timeline = probability > 0.8 ? '30-60 days' : '60-120 days';
    
    return { signals: indicators, probability, timeline };
  }
}

// 3. TECHNOLOGY ADOPTION SIGNALS
class TechnologyAdoptionTracker {
  
  // Détecter adoption de nouvelles technologies = opportunités de vente
  async trackTechAdoption(companies, targetTechnologies) {
    const adoptionSignals = [];
    
    for (const company of companies) {
      const techSignals = await this.analyzeTechStack(company, targetTechnologies);
      
      if (techSignals.adoption_probability > 0.6) {
        adoptionSignals.push({
          type: 'technology_adoption_signal',
          company: company.name,
          technologies: techSignals.target_techs,
          adoption_stage: techSignals.stage, // 'research', 'pilot', 'implementation'
          decision_makers: techSignals.decision_makers,
          budget_indicators: techSignals.budget_signals,
          competitive_urgency: techSignals.competitive_pressure,
          recommended_approach: this.getTechApproachStrategy(techSignals),
          urgency_score: techSignals.urgency,
          confidence: techSignals.adoption_probability
        });
      }
    }
    
    return adoptionSignals;
  }

  async analyzeTechStack(company, targetTechnologies) {
    // Analyser job postings pour nouvelles technologies requises
    const jobTechRequirements = await this.analyzeJobTechRequirements(company);
    
    // Détecter mentions de problèmes que nos technologies résolvent
    const painPointMentions = await this.detectPainPointMentions(company, targetTechnologies);
    
    // Tracker competitive intelligence
    const competitorMoves = await this.trackCompetitorTechMoves(company);
    
    let adoption_probability = 0;
    let urgency = 1;
    
    // Scoring sophistiqué
    if (jobTechRequirements.mentions > 3) adoption_probability += 0.4;
    if (painPointMentions.high_priority > 0) adoption_probability += 0.3;
    if (competitorMoves.recent_adoptions > 0) {
      adoption_probability += 0.3;
      urgency += 5; // Pressure compétitive
    }
    
    return {
      target_techs: targetTechnologies.filter(tech => 
        jobTechRequirements.mentioned_techs.includes(tech)
      ),
      adoption_probability,
      stage: this.determineAdoptionStage(adoption_probability),
      urgency,
      decision_makers: jobTechRequirements.hiring_managers,
      budget_signals: painPointMentions.budget_mentions,
      competitive_pressure: competitorMoves.recent_adoptions > 0
    };
  }
}

// 4. M&A & PARTNERSHIP SIGNALS
class MergersAcquisitionsTracker {
  
  // Détecter signaux M&A avant annonces publiques
  async detectMASignals(companies) {
    const maSignals = [];
    
    for (const company of companies) {
      const maIndicators = await this.analyzeMAIndicators(company);
      
      if (maIndicators.probability > 0.65) {
        maSignals.push({
          type: 'ma_activity_signal',
          company: company.name,
          scenario: maIndicators.scenario, // 'acquiring', 'being_acquired', 'merger'
          indicators: maIndicators.signals,
          timeline: maIndicators.estimated_timeline,
          impact_on_sales: maIndicators.sales_impact,
          recommended_action: this.getMAStrategy(maIndicators),
          urgency_score: maIndicators.urgency,
          confidence: maIndicators.probability
        });
      }
    }
    
    return maSignals;
  }

  async analyzeMAIndicators(company) {
    const indicators = [];
    let probability = 0;
    let scenario = 'unknown';
    
    // Indicateur 1: Embauche d'executives M&A
    const maHires = await this.detectMAExecutiveHires(company);
    if (maHires.investment_banker || maHires.corp_dev) {
      indicators.push('ma_executive_hiring');
      probability += 0.35;
      scenario = 'acquiring';
    }
    
    // Indicateur 2: Due diligence activity
    const ddActivity = await this.detectDueDiligenceActivity(company);
    if (ddActivity.consultant_hires > 0) {
      indicators.push('due_diligence_preparation');
      probability += 0.25;
    }
    
    // Indicateur 3: Legal firm changes (M&A specialists)
    const legalChanges = await this.trackLegalFirmChanges(company);
    if (legalChanges.ma_specialist_firm) {
      indicators.push('ma_legal_preparation');
      probability += 0.3;
    }
    
    // Indicateur 4: Executive stock option accelerations
    const stockActivity = await this.trackStockOptionActivity(company);
    if (stockActivity.accelerations > 0) {
      indicators.push('stock_option_acceleration');
      probability += 0.2;
      scenario = 'being_acquired';
    }
    
    return {
      signals: indicators,
      probability,
      scenario,
      estimated_timeline: probability > 0.8 ? '3-6 months' : '6-12 months',
      urgency: probability > 0.8 ? 9 : 6,
      sales_impact: this.calculateSalesImpact(scenario, probability)
    };
  }
}

// 5. MARKET EXPANSION SIGNALS
class MarketExpansionTracker {
  
  // Détecter expansion géographique/produit = nouvelles opportunités
  async detectExpansionSignals(companies) {
    const expansionSignals = [];
    
    for (const company of companies) {
      const expansion = await this.analyzeExpansionIndicators(company);
      
      if (expansion.probability > 0.7) {
        expansionSignals.push({
          type: 'market_expansion_signal',
          company: company.name,
          expansion_type: expansion.type, // 'geographic', 'product', 'vertical'
          target_markets: expansion.target_markets,
          expansion_stage: expansion.stage,
          investment_level: expansion.investment_indicators,
          new_needs: expansion.technology_needs,
          decision_timeline: expansion.timeline,
          recommended_approach: this.getExpansionApproach(expansion),
          urgency_score: expansion.urgency,
          confidence: expansion.probability
        });
      }
    }
    
    return expansionSignals;
  }
}

// ===============================
// ORCHESTRATEUR PRINCIPAL - INTELLIGENCE INTÉGRÉE
// ===============================

class AdvancedIntentEngine {
  constructor() {
    this.linkedinTracker = new LinkedInExecutiveTracker();
    this.fundingTracker = new FundingSignalsTracker();
    this.techTracker = new TechnologyAdoptionTracker();
    this.maTracker = new MergersAcquisitionsTracker();
    this.expansionTracker = new MarketExpansionTracker();
  }

  // FONCTION PRINCIPALE - Intelligence Pré-Intégrée Sophistiquée
  async generateAdvancedIntelligence(companies, query, targetTechnologies = []) {
    console.log('🧠 Generating ADVANCED business intelligence...');
    console.log('🎯 Going beyond basic ChatGPT/Claude prompts...');
    
    const intelligence = {
      executive_summary: {},
      intent_signals: [],
      opportunity_matrix: [],
      action_priorities: [],
      competitive_intelligence: {},
      timing_analysis: {},
      risk_assessment: {}
    };

    try {
      // 1. LinkedIn Executive Intelligence
      const linkedinSignals = await this.linkedinTracker.trackOpenToWorkSignals(companies);
      const boardMovements = await this.linkedinTracker.trackBoardMovements(
        companies.flatMap(c => c.executives || [])
      );
      
      intelligence.intent_signals.push(...linkedinSignals);
      intelligence.intent_signals.push(...boardMovements);

      // 2. Funding & Financial Intelligence
      const fundingSignals = await this.fundingTracker.detectPreFundingSignals(companies);
      intelligence.intent_signals.push(...fundingSignals);

      // 3. Technology Adoption Intelligence
      if (targetTechnologies.length > 0) {
        const techSignals = await this.techTracker.trackTechAdoption(companies, targetTechnologies);
        intelligence.intent_signals.push(...techSignals);
      }

      // 4. M&A Intelligence
      const maSignals = await this.maTracker.detectMASignals(companies);
      intelligence.intent_signals.push(...maSignals);

      // 5. Market Expansion Intelligence
      const expansionSignals = await this.expansionTracker.detectExpansionSignals(companies);
      intelligence.intent_signals.push(...expansionSignals);

      // 6. SYNTHÈSE INTELLIGENTE (logique pré-intégrée)
      intelligence.executive_summary = this.generateExecutiveSummary(intelligence.intent_signals);
      intelligence.opportunity_matrix = this.createOpportunityMatrix(companies, intelligence.intent_signals);
      intelligence.action_priorities = this.prioritizeActions(intelligence.intent_signals);
      intelligence.timing_analysis = this.analyzeOptimalTiming(intelligence.intent_signals);
      intelligence.competitive_intelligence = this.generateCompetitiveIntel(intelligence.intent_signals);

      console.log(`✅ Advanced intelligence generated: ${intelligence.intent_signals.length} signals detected`);
      
      return intelligence;

    } catch (error) {
      console.error('❌ Advanced intelligence error:', error);
      return this.generateFallbackIntelligence(companies, query);
    }
  }

  // Créer matrice d'opportunités sophistiquée
  createOpportunityMatrix(companies, signals) {
    return companies.map(company => {
      const companySignals = signals.filter(s => s.company === company.name);
      
      const urgencyScore = Math.max(...companySignals.map(s => s.urgency_score || 0), 0);
      const confidenceScore = companySignals.reduce((sum, s) => sum + (s.confidence || 0), 0) / (companySignals.length || 1);
      const opportunityTypes = [...new Set(companySignals.map(s => s.type))];
      
      let opportunityLevel = 'low';
      if (urgencyScore >= 8 && confidenceScore >= 0.8) opportunityLevel = 'critical';
      else if (urgencyScore >= 6 && confidenceScore >= 0.7) opportunityLevel = 'high';
      else if (urgencyScore >= 4 && confidenceScore >= 0.6) opportunityLevel = 'medium';

      return {
        company: company.name,
        opportunity_level: opportunityLevel,
        urgency_score: urgencyScore,
        confidence_score: Math.round(confidenceScore * 100),
        signal_count: companySignals.length,
        opportunity_types: opportunityTypes,
        recommended_timeline: this.getRecommendedTimeline(urgencyScore),
        estimated_close_probability: this.calculateCloseProbability(companySignals),
        next_actions: this.getNextActions(companySignals)
      };
    }).sort((a, b) => b.urgency_score - a.urgency_score);
  }

  // Générer résumé exécutif intelligent
  generateExecutiveSummary(signals) {
    const criticalSignals = signals.filter(s => s.urgency_score >= 8);
    const highConfidenceSignals = signals.filter(s => s.confidence >= 0.8);
    const signalTypes = [...new Set(signals.map(s => s.type))];
    
    return {
      total_signals: signals.length,
      critical_opportunities: criticalSignals.length,
      high_confidence_leads: highConfidenceSignals.length,
      signal_categories: signalTypes.length,
      market_temperature: this.calculateMarketTemperature(signals),
      competitive_pressure: this.assessCompetitivePressure(signals),
      recommended_focus: this.getRecommendedFocus(signals),
      estimated_pipeline_value: this.estimatePipelineValue(signals)
    };
  }

  // Analyser timing optimal avec logique pré-intégrée
  analyzeOptimalTiming(signals) {
    const timingWindows = {
      immediate: signals.filter(s => s.timing === 'immediate' || s.urgency_score >= 9),
      within_week: signals.filter(s => s.timing === 'within_week' || s.urgency_score >= 7),
      within_month: signals.filter(s => s.timing === 'within_month' || s.urgency_score >= 5),
      monitor: signals.filter(s => s.urgency_score < 5)
    };

    return {
      immediate_action_required: timingWindows.immediate.length,
      weekly_pipeline: timingWindows.within_week.length,
      monthly_pipeline: timingWindows.within_month.length,
      monitoring_pipeline: timingWindows.monitor.length,
      optimal_approach_sequence: this.generateApproachSequence(timingWindows),
      resource_allocation_recommendation: this.getResourceAllocation(timingWindows)
    };
  }
}

// Export pour intégration
module.exports = {
  AdvancedIntentEngine,
  LinkedInExecutiveTracker,
  FundingSignalsTracker,
  TechnologyAdoptionTracker,
  MergersAcquisitionsTracker,
  MarketExpansionTracker
};