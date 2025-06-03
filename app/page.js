'use client';
import { useState, useEffect } from 'react';

export default function SBGLeadGenApp() {
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leadMessage, setLeadMessage] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      
      // Vérifier si la réponse est bien du JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please try again later.');
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError);
        throw new Error('Invalid response format from server. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Search failed');
      }

      // Valider la structure des données
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data structure received from server');
      }

      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      
      // Messages d'erreur plus informatifs
      let errorMessage = err.message;
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message.includes('non-JSON response')) {
        errorMessage = 'Server configuration error. Please contact support if this persists.';
      } else if (err.message.includes('Invalid response format')) {
        errorMessage = 'Data parsing error. The server may be experiencing issues.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = async () => {
    if (!email.trim()) {
      setLeadMessage('Please enter your email');
      return;
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setLeadMessage('✅ Successfully subscribed to intelligence alerts!');
      setEmail('');
    } catch (err) {
      setLeadMessage(`❌ ${err.message}`);
    }
  };

  // Export functions
  const exportToPDF = (company) => {
    // TODO: Implement PDF export
    console.log('Exporting to PDF:', company.name);
  };

  const exportToCSV = (companies) => {
    const csvContent = [
      ['Company Name', 'Location', 'Intent Score', 'Contact Email', 'Industry', 'Signals'].join(','),
      ...companies.map(company => [
        company.name,
        company.location || company.clearbit_data?.location?.city || '',
        company.intent_score || 0,
        company.contacts?.emails?.[0]?.email || '',
        company.clearbit_data?.industry || company.categories || '',
        company.signals?.map(s => s.type).join('; ') || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sbg-leads-${query.replace(/\s+/g, '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const addToCRM = (company) => {
    // TODO: Implement CRM integration
    console.log('Adding to CRM:', company.name);
  };

  // Suggested prompts for auto-complete
  const suggestedPrompts = [
    "VC-backed startups hiring in Toronto",
    "Software companies for sale in Ontario", 
    "AI startups seeking partnerships",
    "SaaS companies raising Series A",
    "Healthcare tech companies in Vancouver"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Silver Birch Intelligence
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI-powered B2B lead generation with real-time intent signals from premium data sources.
              Find qualified prospects in Canada & the U.S. with verified contact information.
            </p>
            
            {/* Search Interface */}
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., software companies, physiotherapy clinics, AI startups..."
                  className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-gray-900 text-lg"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-8 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-lg"
                >
                  {loading ? 'Analyzing...' : 'Find Leads'}
                </button>
              </div>
              
              {/* Suggested Prompts */}
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(prompt)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              
              <p className="text-sm text-gray-500 mt-4">Use PIN: <span className="font-mono font-bold">SBG2025</span></p>
            </div>

            {error && (
              <div className="mt-6 max-w-xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-block w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Processing Business Intelligence</h3>
            <p className="text-gray-600 text-lg">Analyzing real data sources and extracting qualified companies...</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm text-gray-500 max-w-2xl mx-auto">
              <div>🔍 Scanning business discussions</div>
              <div>📊 Extracting company mentions</div>
              <div>📧 Verifying contact information</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results && !loading && (
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            
            {/* Results Header */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Business Intelligence Report</h2>
              <p className="text-xl text-gray-600">
                Found {results.companies?.length || 0} qualified companies with verified intent signals
              </p>
            </div>

            {/* Intelligence Metrics */}
            {results.intelligence && (
              <div className="grid md:grid-cols-4 gap-6 mb-12">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {results.intelligence.companies_found || 0}
                  </div>
                  <div className="text-gray-700 font-medium">Qualified Companies</div>
                  <div className="text-gray-500 text-sm">With Intent Signals</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {results.intelligence.with_verified_contacts || 0}
                  </div>
                  <div className="text-gray-700 font-medium">Verified Contacts</div>
                  <div className="text-gray-500 text-sm">Ready to Reach</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {results.intelligence.avg_intent_score || 0}/100
                  </div>
                  <div className="text-gray-700 font-medium">Avg Intent Score</div>
                  <div className="text-gray-500 text-sm">AI Calculated</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {results.intelligence.data_quality?.toUpperCase() || 'N/A'}
                  </div>
                  <div className="text-gray-700 font-medium">Data Quality</div>
                  <div className="text-gray-500 text-sm">Verification Level</div>
                </div>
              </div>
            )}

            {/* Export Controls */}
            {results.companies && results.companies.length > 0 && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={() => exportToCSV(results.companies)}
                  className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                >
                  📊 Export All to CSV
                </button>
              </div>
            )}

            {/* Company Cards Grid */}
            {results.companies && results.companies.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-8 mb-12">
                {results.companies.map((company, i) => (
                  <div key={i} className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
                    
                    {/* Company Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-start gap-4">
                        {/* Company Logo Placeholder */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          {company.clearbit_data?.logo ? (
                            <img 
                              src={company.clearbit_data.logo} 
                              alt={company.name}
                              className="w-12 h-12 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                            <span className="text-green-600 font-bold text-lg">
                              {company.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{company.name}</h3>
                          <p className="text-gray-600">
                            {company.clearbit_data?.location?.city || company.location || 'Location not specified'}
                          </p>
                          {company.clearbit_data?.industry && (
                            <p className="text-sm text-gray-500">{company.clearbit_data.industry}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Intent Score Badge */}
                      <div className="text-center">
                        <div className={`text-3xl font-bold mb-1 ${
                          company.intent_score >= 80 ? 'text-red-600' : 
                          company.intent_score >= 60 ? 'text-orange-600' : 
                          company.intent_score >= 40 ? 'text-yellow-600' : 'text-gray-600'
                        }`}>
                          {company.intent_score || 0}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">INTENT SCORE</div>
                      </div>
                    </div>

                    {/* Company Description */}
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {company.clearbit_data?.description || 
                       company.description || 
                       `${company.name} is a business in the ${company.discovery_context || 'industry'} sector with verified intent signals.`}
                    </p>

                    {/* Signal Summary */}
                    {company.signals && company.signals.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">🎯 Intent Signals Detected</h4>
                        <div className="flex flex-wrap gap-2">
                          {company.signals.slice(0, 4).map((signal, idx) => (
                            <span 
                              key={idx}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                signal.type === 'recent_funding' ? 'bg-green-100 text-green-800' :
                                signal.type === 'reddit_high_intent' ? 'bg-orange-100 text-orange-800' :
                                signal.type === 'target_market_canada' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {signal.description.length > 30 ? 
                                signal.description.substring(0, 30) + '...' : 
                                signal.description}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Company Details Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {company.clearbit_data?.employees && (
                        <div>
                          <div className="text-sm text-gray-500">Employees</div>
                          <div className="font-semibold text-gray-900">{company.clearbit_data.employees}</div>
                        </div>
                      )}
                      {company.clearbit_data?.estimatedAnnualRevenue && (
                        <div>
                          <div className="text-sm text-gray-500">Est. Revenue</div>
                          <div className="font-semibold text-gray-900">
                            ${(company.clearbit_data.estimatedAnnualRevenue / 1000000).toFixed(1)}M
                          </div>
                        </div>
                      )}
                      {company.clearbit_data?.foundedYear && (
                        <div>
                          <div className="text-sm text-gray-500">Founded</div>
                          <div className="font-semibold text-gray-900">{company.clearbit_data.foundedYear}</div>
                        </div>
                      )}
                      {company.confidence_score && (
                        <div>
                          <div className="text-sm text-gray-500">Data Confidence</div>
                          <div className="font-semibold text-gray-900">{company.confidence_score}%</div>
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    {company.contacts?.emails && company.contacts.emails.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-green-800 mb-3">📧 Verified Contacts</h4>
                        <div className="space-y-2">
                          {company.contacts.emails.slice(0, 2).map((contact, idx) => (
                            <div key={idx} className="text-sm">
                              <div className="font-medium text-green-700">
                                {contact.first_name && contact.last_name ? 
                                  `${contact.first_name} ${contact.last_name}` : 
                                  contact.email.split('@')[0]}
                              </div>
                              <div className="text-green-600">{contact.email}</div>
                              {contact.position && (
                                <div className="text-green-500">{contact.position}</div>
                              )}
                              <div className="text-xs text-green-500">
                                Confidence: {contact.confidence}% • Source: {contact.source}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => exportToPDF(company)}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        📄 Save PDF
                      </button>
                      <button
                        onClick={() => addToCRM(company)}
                        className="flex-1 px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors text-sm"
                      >
                        📇 Add to CRM
                      </button>
                      {company.clearbit_data?.domain && (
                        <a
                          href={`https://${company.clearbit_data.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors text-sm text-center"
                        >
                          🌐 Visit Site
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No Qualified Companies Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No companies with verified intent signals were found for "{query}". 
                  Try a different search term or check if your API sources are configured.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="font-semibold text-yellow-800 mb-2">💡 Search Tips:</h4>
                  <ul className="text-sm text-yellow-700 text-left space-y-1">
                    <li>• Try broader terms like "software companies" or "startups"</li>
                    <li>• Include location: "companies in Toronto"</li>
                    <li>• Check specific industries: "healthtech", "fintech"</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Supporting Intelligence - All Real Data Sources */}
            {results.sources && (Object.values(results.sources).some(source => source.length > 0)) && (
              <div className="grid lg:grid-cols-2 gap-8">
                
                {/* Lead Capture */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📧 Intelligence Alerts</h3>
                  <p className="text-gray-600 mb-4">
                    Get notified when new high-intent companies are detected for "{query}"
                  </p>
                  
                  <div className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                    
                    <button
                      onClick={handleLeadSubmit}
                      className="w-full px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Subscribe to Alerts
                    </button>
                    
                    {leadMessage && (
                      <div className={`text-sm p-3 rounded-lg ${leadMessage.includes('✅') ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                        {leadMessage}
                      </div>
                    )}
                  </div>
                </div>

                {/* Complete Source Summary - All 8 Real Sources */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Real Data Sources ({results.intelligence?.sources_active || 0}/8)</h3>
                  <div className="space-y-3">
                    
                    {results.sources?.reddit && results.sources.reddit.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-500">📱</span>
                          <span className="text-sm font-medium">Reddit Discussions</span>
                        </div>
                        <span className="font-bold text-orange-600">{results.sources.reddit.length}</span>
                      </div>
                    )}
                    
                    {results.sources?.news && results.sources.news.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500">📰</span>
                          <span className="text-sm font-medium">Business News</span>
                        </div>
                        <span className="font-bold text-blue-600">{results.sources.news.length}</span>
                      </div>
                    )}
                    
                    {results.sources?.social && results.sources.social.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-500">🐦</span>
                          <span className="text-sm font-medium">Social Signals</span>
                        </div>
                        <span className="font-bold text-purple-600">{results.sources.social.length}</span>
                      </div>
                    )}

                    {results.sources?.hackerNews && results.sources.hackerNews.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">🔶</span>
                          <span className="text-sm font-medium">Tech Trends</span>
                        </div>
                        <span className="font-bold text-yellow-600">{results.sources.hackerNews.length}</span>
                      </div>
                    )}

                    {results.sources?.secData && results.sources.secData.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-500">🏛️</span>
                          <span className="text-sm font-medium">SEC Filings</span>
                        </div>
                        <span className="font-bold text-indigo-600">{results.sources.secData.length}</span>
                      </div>
                    )}

                    {results.sources?.dataGov && results.sources.dataGov.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">📊</span>
                          <span className="text-sm font-medium">Gov Datasets</span>
                        </div>
                        <span className="font-bold text-green-600">{results.sources.dataGov.length}</span>
                      </div>
                    )}

                    {results.sources?.bizBuySell && results.sources.bizBuySell.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-pink-500">💼</span>
                          <span className="text-sm font-medium">Acquisitions</span>
                        </div>
                        <span className="font-bold text-pink-600">{results.sources.bizBuySell.length}</span>
                      </div>
                    )}

                    {results.sources?.linkedInJobs && results.sources.linkedInJobs.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-500">💼</span>
                          <span className="text-sm font-medium">Hiring Signals</span>
                        </div>
                        <span className="font-bold text-cyan-600">{results.sources.linkedInJobs.length}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Total Data Points:</strong> {results.intelligence?.total_data_points || 0}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Data Quality:</strong> {results.intelligence?.data_quality || 'unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ✅ All real data • No synthetic content
                      </div>
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(results.metadata?.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Source Data Preview */}
            {results.sources && (Object.values(results.sources).some(source => source.length > 0)) && (
              <div className="mt-12 border-t border-gray-200 pt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">📈 Source Data Preview</h3>
                
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  
                  {/* SEC Filings Preview */}
                  {results.sources?.secData && results.sources.secData.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-800 mb-3">🏛️ SEC Financial Filings</h4>
                      <div className="space-y-2">
                        {results.sources.secData.slice(0, 2).map((filing, i) => (
                          <div key={i} className="text-sm">
                            <div className="font-medium text-indigo-700">{filing.company_name}</div>
                            <div className="text-indigo-600">{filing.filing_type} • {filing.filing_date}</div>
                            {filing.document_url && (
                              <a href={filing.document_url} target="_blank" rel="noopener noreferrer" 
                                 className="text-indigo-500 hover:text-indigo-700 text-xs">
                                View Filing →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Government Data Preview */}
                  {results.sources?.dataGov && results.sources.dataGov.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3">📊 Government Datasets</h4>
                      <div className="space-y-2">
                        {results.sources.dataGov.slice(0, 2).map((dataset, i) => (
                          <div key={i} className="text-sm">
                            <div className="font-medium text-green-700">
                              {dataset.title.length > 40 ? dataset.title.substring(0, 40) + '...' : dataset.title}
                            </div>
                            <div className="text-green-600">{dataset.organization}</div>
                            {dataset.url && (
                              <a href={dataset.url} target="_blank" rel="noopener noreferrer" 
                                 className="text-green-500 hover:text-green-700 text-xs">
                                View Dataset →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acquisition Opportunities Preview */}
                  {results.sources?.bizBuySell && results.sources.bizBuySell.length > 0 && (
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                      <h4 className="font-semibold text-pink-800 mb-3">💼 Acquisition Opportunities</h4>
                      <div className="space-y-2">
                        {results.sources.bizBuySell.slice(0, 2).map((business, i) => (
                          <div key={i} className="text-sm">
                            <div className="font-medium text-pink-700">
                              {business.title.length > 35 ? business.title.substring(0, 35) + '...' : business.title}
                            </div>
                            <div className="text-pink-600">{business.asking_price} • {business.location}</div>
                            {business.listing_url && (
                              <a href={business.listing_url} target="_blank" rel="noopener noreferrer" 
                                 className="text-pink-500 hover:text-pink-700 text-xs">
                                View Listing →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hiring Signals Preview */}
                  {results.sources?.linkedInJobs && results.sources.linkedInJobs.length > 0 && (
                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                      <h4 className="font-semibold text-cyan-800 mb-3">💼 Hiring Signals</h4>
                      <div className="space-y-2">
                        {results.sources.linkedInJobs.slice(0, 2).map((job, i) => (
                          <div key={i} className="text-sm">
                            <div className="font-medium text-cyan-700">{job.company_name}</div>
                            <div className="text-cyan-600">
                              {job.job_title.length > 30 ? job.job_title.substring(0, 30) + '...' : job.job_title}
                            </div>
                            <div className="text-xs text-cyan-500">Signal: {job.signal_strength}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tech Trends Preview */}
                  {results.sources?.hackerNews && results.sources.hackerNews.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-3">🔶 Tech Trends</h4>
                      <div className="space-y-2">
                        {results.sources.hackerNews.slice(0, 2).map((post, i) => (
                          <div key={i} className="text-sm">
                            <div className="font-medium text-yellow-700">
                              {post.title.length > 35 ? post.title.substring(0, 35) + '...' : post.title}
                            </div>
                            <div className="text-yellow-600">{post.points} points • {post.num_comments} comments</div>
                            <div className="text-xs text-yellow-500">Trend: {post.trend_indicator}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reddit Discussions Preview */}
                  {results.sources?.reddit && results.sources.reddit.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-3">📱 Business Discussions</h4>
                      <div className="space-y-2">
                        {results.sources.reddit.slice(0, 2).map((post, i) => (
                          <div key={i} className="text-sm">
                            <div className="font-medium text-orange-700">
                              {post.title.length > 35 ? post.title.substring(0, 35) + '...' : post.title}
                            </div>
                            <div className="text-orange-600">r/{post.subreddit} • Intent: {post.intent_score}/10</div>
                            <a href={post.url} target="_blank" rel="noopener noreferrer" 
                               className="text-orange-500 hover:text-orange-700 text-xs">
                              View Discussion →
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">Powered by Silver Birch Growth Inc. • Real Business Intelligence • Verified Contact Data</p>
          <p className="text-gray-500 text-sm mt-2">Professional B2B lead generation with AI-powered intent scoring</p>
        </div>
      </footer>

    </div>
  );
}