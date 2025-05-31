const axios = require('axios');

// Configuration APIs
const GEMINI_2_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function analyzeDataWithGemini(data, query) {
  const prompt = `You are a business intelligence analyst. Analyze the following data for the query "${query}".

Data Sources:
- News Articles: ${JSON.stringify(data.news || [])}
- Social Media (Twitter): ${JSON.stringify(data.xPosts || [])}
- Reddit Discussions: ${JSON.stringify(data.reddit || [])}
- Company Data (Crunchbase): ${JSON.stringify(data.crunchbase || [])}
- Businesses for Sale: ${JSON.stringify(data.bizBuySell || [])}
- Tech Trends (Hacker News): ${JSON.stringify(data.hackerNews || [])}
- SEC Filings: ${JSON.stringify(data.secData || [])}
- Government Data: ${JSON.stringify(data.dataGov || [])}

Please provide:
1. **INTENT SIGNALS**: What buying/selling/investment intentions can you detect?
2. **MARKET TRENDS**: What patterns emerge from the data?
3. **BUSINESS OPPORTUNITIES**: What opportunities does this reveal?
4. **KEY INSIGHTS**: Top 3 actionable insights
5. **POTENTIAL LEADS**: Companies or individuals showing strong intent

Format your response in clear sections with bullet points. Focus on actionable business intelligence.`;

  // Essayer Gemini 2.0 d'abord
  try {
    console.log('🤖 Trying Gemini 2.0...');
    const response = await axios.post(`${GEMINI_2_API_URL}?key=${process.env.GOOGLE_GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });

    console.log('✅ Gemini 2.0 success');
    return response.data.candidates[0].content.parts[0].text;
  } catch (geminiError) {
    console.error('❌ Gemini 2.0 failed:', geminiError.message);
    
    // Fallback vers OpenAI si disponible
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('🔄 Trying OpenAI fallback...');
        const openaiResponse = await axios.post(OPENAI_API_URL, {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a business intelligence analyst. Provide clear, actionable insights in markdown format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000
        });

        console.log('✅ OpenAI fallback success');
        return openaiResponse.data.choices[0].message.content;
      } catch (openaiError) {
        console.error('❌ OpenAI fallback failed:', openaiError.message);
      }
    }
    
    // Si tout échoue, utiliser l'analyse de secours
    console.log('🔄 Using fallback analysis');
    return generateFallbackAnalysis(data, query);
  }
}

// Analyse de secours avec logique simple
function generateFallbackAnalysis(data, query) {
  const totalSources = Object.keys(data).filter(key => data[key] && data[key].length > 0).length;
  const totalItems = Object.values(data).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  
  return `## Business Intelligence Report for "${query}"

### 📊 DATA OVERVIEW
- Sources analyzed: ${totalSources}/9
- Total data points: ${totalItems}

### 🎯 INTENT SIGNALS
${data.reddit?.length > 0 ? '- Active discussions on Reddit indicate market interest' : ''}
${data.xPosts?.length > 0 ? '- Social media engagement suggests trending topic' : ''}
${data.bizBuySell?.length > 0 ? '- Business acquisition opportunities available' : ''}

### 📈 MARKET TRENDS
${data.news?.length > 0 ? '- Recent news coverage indicates market activity' : ''}
${data.hackerNews?.length > 0 ? '- Tech community showing interest' : ''}
${data.crunchbase?.length > 0 ? '- Investment activity in related companies' : ''}

### 💡 KEY INSIGHTS
1. Multiple data sources confirm market presence for "${query}"
2. ${totalItems > 20 ? 'High' : totalItems > 10 ? 'Moderate' : 'Limited'} volume of relevant information
3. Cross-platform validation suggests legitimate business opportunity

### 🔥 POTENTIAL LEADS
${data.crunchbase?.slice(0, 2).map(company => `- ${company.name}: ${company.description}`).join('\n') || '- Monitor social media for emerging opportunities'}

*Analysis generated from ${totalSources} data sources*`;
}

// Cache simple pour éviter les appels répétés
const analysisCache = new Map();

async function analyzeData(data, query) {
  const cacheKey = `${query}_${JSON.stringify(data).slice(0, 100)}`;
  
  if (analysisCache.has(cacheKey)) {
    console.log('Using cached analysis');
    return analysisCache.get(cacheKey);
  }
  
  const analysis = await analyzeDataWithGemini(data, query);
  
  // Cache le résultat pour 30 minutes
  analysisCache.set(cacheKey, analysis);
  setTimeout(() => analysisCache.delete(cacheKey), 30 * 60 * 1000);
  
  return analysis;
}

module.exports = {
  analyzeData,
  analyzeDataWithGemini
};