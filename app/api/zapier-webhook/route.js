import { NextResponse } from 'next/server';

// Cache pour stocker les données Zapier temporairement
const zapierCache = new Map();

export async function POST(request) {
  try {
    const data = await request.json();
    const { zapier_webhook_id, query, companies, contacts, intent_data } = data;

    // Valider la requête Zapier
    if (!zapier_webhook_id) {
      return NextResponse.json({
        error: 'Invalid Zapier webhook'
      }, { status: 400 });
    }

    // Stocker les données dans le cache avec timestamp
    const cacheKey = `${zapier_webhook_id}_${query || 'general'}`;
    zapierCache.set(cacheKey, {
      data: {
        companies: companies || [],
        contacts: contacts || [],
        intent_data: intent_data || []
      },
      timestamp: Date.now(),
      query: query
    });

    console.log(`📥 Zapier webhook received: ${cacheKey}, ${companies?.length || 0} companies`);

    // Nettoyer le cache (supprimer les entrées > 1 heure)
    const oneHour = 60 * 60 * 1000;
    for (const [key, value] of zapierCache.entries()) {
      if (Date.now() - value.timestamp > oneHour) {
        zapierCache.delete(key);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data received and cached',
      companies_count: companies?.length || 0
    });

  } catch (error) {
    console.error('❌ Zapier webhook error:', error);
    return NextResponse.json({
      error: 'Failed to process webhook data',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const webhook_id = searchParams.get('webhook_id');

    if (!webhook_id) {
      return NextResponse.json({
        error: 'webhook_id parameter required'
      }, { status: 400 });
    }

    const cacheKey = `${webhook_id}_${query || 'general'}`;
    const cachedData = zapierCache.get(cacheKey);

    if (!cachedData) {
      return NextResponse.json({
        error: 'No data found for this webhook_id and query',
        available_keys: Array.from(zapierCache.keys())
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: cachedData.data,
      cached_at: new Date(cachedData.timestamp).toISOString(),
      age_minutes: Math.round((Date.now() - cachedData.timestamp) / (1000 * 60))
    });

  } catch (error) {
    console.error('❌ Zapier webhook GET error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve webhook data',
      message: error.message
    }, { status: 500 });
  }
}

// Export du cache pour utilisation dans d'autres modules
export { zapierCache };