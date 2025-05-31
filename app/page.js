'use client';
import { useState, useEffect } from 'react';

export default function LeadGenApp() {
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
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

      setLeadMessage('✅ Successfully subscribed to alerts!');
      setEmail('');
    } catch (err) {
      setLeadMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Content */}
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Smarter B2B Growth Starts Here
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Automated lead discovery, powerful intent signals, and outreach tools for founders and GTM teams in Canada & the U.S.
              </p>
              
              {/* Search Interface */}
              <div className="mb-8">
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g., AI startups Toronto, SaaS companies, physiotherapy clinics..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-gray-900"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Start Free'}
                  </button>
                </div>
                <p className="text-sm text-gray-500">Use PIN: <span className="font-mono font-bold">SBG2025</span></p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Right Column - Stats */}
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-500 mb-2">2.5M+</div>
                <div className="text-gray-600 font-medium">Companies</div>
                <div className="text-gray-500 text-sm">Indexed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-500 mb-2">98%</div>
                <div className="text-gray-600 font-medium">Accuracy Rate</div>
                <div className="text-gray-500 text-sm">Contact Verification</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-500 mb-2">12+</div>
                <div className="text-gray-600 font-medium">Intent Signals</div>
                <div className="text-gray-500 text-sm">Real-time Tracking</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-500 mb-2">24hr</div>
                <div className="text-gray-600 font-medium">Data Refresh</div>
                <div className="text-gray-500 text-sm">Always Current</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Search any industry or keyword</h3>
              <p className="text-gray-600">Use natural language to find exactly what you're looking for</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI finds high-value prospects</h3>
              <p className="text-gray-600">Our algorithms identify companies showing buying intent</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Get insights, leads & hooks</h3>
              <p className="text-gray-600">Receive detailed company profiles with personalized outreach ideas</p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Book meetings or export to CRM</h3>
              <p className="text-gray-600">Seamlessly integrate with your existing workflow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-block w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Analyzing Market Intelligence</h3>
            <p className="text-gray-600 text-lg">Processing data from 9 premium sources...</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results && !loading && (
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            
            {/* Results Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Every Company Gets a Score</h2>
              <p className="text-xl text-gray-600">AI-powered analysis of {results.metadata.totalDataPoints} data points from {results.metadata.sourcesWithData} sources</p>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{results.metrics.intentScore}/10</div>
                <div className="text-gray-700 font-medium">Intent Score</div>
                <div className="text-gray-500 text-sm">Market Interest</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{results.metadata.companiesWithContacts || 0}</div>
                <div className="text-gray-700 font-medium">Companies</div>
                <div className="text-gray-500 text-sm">With Contacts</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{Math.round(results.metadata.avgCompanyScore || 0)}/100</div>
                <div className="text-gray-700 font-medium">Avg Score</div>
                <div className="text-gray-500 text-sm">Company Quality</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{results.performance.totalTime}ms</div>
                <div className="text-gray-700 font-medium">Response Time</div>
                <div className="text-gray-500 text-sm">Real-time Analysis</div>
              </div>
            </div>

            {/* Company Results Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Companies List */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">🏢 High-Value Companies</h3>
                <div className="space-y-4">
                  {results.data.crunchbase && results.data.crunchbase.slice(0, 5).map((company, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{company.name}</h4>
                          <p className="text-gray-600">{company.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{company.score || 85}/100</div>
                          <div className="text-sm text-gray-500">Quality Score</div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{company.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500">Funding</div>
                          <div className="font-semibold text-gray-900">{company.funding_total || 'Not disclosed'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Employees</div>
                          <div className="font-semibold text-gray-900">{company.employee_count || 'Not specified'}</div>
                        </div>
                      </div>

                      {company.contacts && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="text-sm font-semibold text-green-800 mb-2">📧 Contact Information</div>
                          <div className="grid md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Email: </span>
                              <span className="text-green-700 font-medium">{company.contacts.email}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Phone: </span>
                              <span className="text-green-700 font-medium">{company.contacts.phone}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {company.intent_signals && (
                        <div className="mt-4">
                          <div className="text-sm font-semibold text-gray-700 mb-2">🎯 Intent Signals</div>
                          <div className="flex gap-2 flex-wrap">
                            {company.intent_signals.hiring > 0 && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                Hiring ({company.intent_signals.hiring}/10)
                              </span>
                            )}
                            {company.intent_signals.funding > 0 && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                Funding ({company.intent_signals.funding}/10)
                              </span>
                            )}
                            {company.intent_signals.expansion > 0 && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                Expansion ({company.intent_signals.expansion}/10)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar with AI Analysis and Lead Capture */}
              <div className="space-y-8">
                
                {/* AI Analysis */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">🤖 AI Market Analysis</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <div className="whitespace-pre-wrap">{results.analysis}</div>
                  </div>
                </div>

                {/* Lead Capture */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📧 Get More Intelligence</h3>
                  <p className="text-gray-600 mb-4">Stay ahead with real-time alerts about "{query}" opportunities</p>
                  
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
                      Subscribe to Intelligence Alerts
                    </button>
                    
                    {leadMessage && (
                      <div className={`text-sm p-3 rounded-lg ${leadMessage.includes('✅') ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                        {leadMessage}
                      </div>
                    )}
                  </div>
                </div>

                {/* Market Intelligence */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Market Intelligence</h3>
                  <div className="space-y-4">
                    
                    {results.data.news && results.data.news.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">📰 Latest News</h4>
                        <div className="space-y-2">
                          {results.data.news.slice(0, 3).map((article, i) => (
                            <div key={i} className="text-sm">
                              <a href={article.url} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:text-blue-800 font-medium">
                                {article.title}
                              </a>
                              <p className="text-gray-500">{article.source}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.data.reddit && results.data.reddit.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">💬 Community Insights</h4>
                        <div className="space-y-2">
                          {results.data.reddit.slice(0, 2).map((post, i) => (
                            <div key={i} className="text-sm">
                              <div className="text-gray-700 font-medium">{post.title}</div>
                              <div className="text-gray-500">r/{post.subreddit} • Intent: {post.intent_score || 0}/10</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">Powered by Silver Birch Growth Inc. • Next.js 15 • AI-Driven • 9 Data Sources</p>
          <p className="text-gray-500 text-sm mt-2">Real-time business intelligence for smarter B2B growth</p>
        </div>
      </footer>

    </div>
  );
}