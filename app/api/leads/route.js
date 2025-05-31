import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Fichier SQLite simple pour stocker les leads (Randy pourra voir ça)
const LEADS_FILE = path.join(process.cwd(), 'leads.json');

// Initialiser le fichier de leads s'il n'existe pas
function initializeLeadsFile() {
  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify([]));
  }
}

// Lire les leads existants
function readLeads() {
  try {
    initializeLeadsFile();
    const data = fs.readFileSync(LEADS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading leads:', error);
    return [];
  }
}

// Sauvegarder les leads
function saveLeads(leads) {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving leads:', error);
    return false;
  }
}

// Valider l'email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, query, source = 'web' } = body;

    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({
        error: 'Valid email is required'
      }, { status: 400 });
    }

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        error: 'Query is required'
      }, { status: 400 });
    }

    // Lire les leads existants
    const leads = readLeads();

    // Vérifier si l'email existe déjà pour cette requête
    const existingLead = leads.find(lead => 
      lead.email === email.toLowerCase() && 
      lead.query.toLowerCase() === query.toLowerCase()
    );

    if (existingLead) {
      // Mettre à jour la date de dernière activité
      existingLead.lastActive = new Date().toISOString();
      existingLead.requestCount = (existingLead.requestCount || 1) + 1;
      
      saveLeads(leads);
      
      return NextResponse.json({
        message: 'Email updated for alerts',
        status: 'updated',
        lead: existingLead
      });
    }

    // Créer un nouveau lead
    const newLead = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      query: query.trim(),
      source,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      requestCount: 1,
      status: 'active'
    };

    leads.push(newLead);
    
    if (saveLeads(leads)) {
      console.log(`📧 New lead captured: ${email} for "${query}"`);
      
      return NextResponse.json({
        message: 'Successfully subscribed to alerts!',
        status: 'created',
        lead: {
          id: newLead.id,
          email: newLead.email,
          query: newLead.query,
          createdAt: newLead.createdAt
        }
      });
    } else {
      throw new Error('Failed to save lead');
    }

  } catch (error) {
    console.error('❌ Leads API Error:', error);
    
    return NextResponse.json({
      error: 'Failed to process lead capture',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Endpoint pour Randy pour voir ses leads (avec auth basique)
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('admin');
    
    // Protection basique (Randy devra avoir cette clé)
    if (adminKey !== 'randy_admin_2024') {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const leads = readLeads();
    
    // Statistiques pour Randy
    const stats = {
      totalLeads: leads.length,
      activeLeads: leads.filter(lead => lead.status === 'active').length,
      topQueries: getTopQueries(leads),
      recentLeads: leads.slice(-10).reverse(),
      leadsBySource: getLeadsBySource(leads)
    };

    return NextResponse.json({
      stats,
      leads: leads.slice(-50).reverse() // 50 derniers leads
    });

  } catch (error) {
    console.error('❌ Leads GET Error:', error);
    
    return NextResponse.json({
      error: 'Failed to retrieve leads',
      message: error.message
    }, { status: 500 });
  }
}

// Analyser les requêtes les plus populaires
function getTopQueries(leads) {
  const queryCount = {};
  
  leads.forEach(lead => {
    const query = lead.query.toLowerCase();
    queryCount[query] = (queryCount[query] || 0) + 1;
  });
  
  return Object.entries(queryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));
}

// Analyser les leads par source
function getLeadsBySource(leads) {
  const sourceCount = {};
  
  leads.forEach(lead => {
    const source = lead.source || 'unknown';
    sourceCount[source] = (sourceCount[source] || 0) + 1;
  });
  
  return sourceCount;
}

export const runtime = 'nodejs';