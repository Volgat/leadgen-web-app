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

  // Calculer les stats globales pour toutes les sources
  const getGlobalStats = () => {
    if (!results?.data) return null;
    
    return {
      totalSources: results.metadata?.sourcesWithData || 0,
      totalDataPoints: results.metadata?.totalDataPoints || 0,
      companiesFound: results.data?.crunchbase?.length || 0,
      redditHighIntent: results.metadata?.redditHighIntent || 0,
      newsArticles: results.data?.news?.length || 0,
      acquisitionOpps: results.data?.bizBuySell?.length || 0,
      overallSentiment: results.metadata?.overallSentiment || 'neutral'
    };
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
                9-Source Intelligence
                <span className="block text-green-600">AI-Powered Lead Generation</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Our AI aggregates data from 9 premium sources - Reddit discussions, news articles, company databases, acquisition opportunities, and more - to find high-intent B2B prospects in Canada & the U.S.
              </p>
              
              {/* Search Interface */}
              <div className="mb-8">
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g., physiotherapy clinic, AI startup Toronto, SaaS companies..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-gray-900"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : 'Start Intelligence'}
                  </button>
                </div>
                <p className="text-sm text-gray-500">Use PIN: <span className="font-mono font-bold">SBG2025</span> • 9 Sources + AI Analysis</p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Right Column - 9 Source Overview */}
            <div className="grid grid-cols-3 gap-4">
              
              {/* Source Icons */}
              <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <div className="font-semibold text-sm">Reddit</div>
                <div className="text-xs text-gray-600">Business Intent</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-semibold text-sm">Crunchbase</div>
                <div className="text-xs text-gray-600">Company Data</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl mb-2">📰</div>
                <div className="font-semibold text-sm">News API</div>
                <div className="text-xs text-gray-600">Market Intel</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-2xl mb-2">💼</div>
                <div className="font-semibold text-sm">BizBuySell</div>
                <div className="text-xs text-gray-600">Acquisitions</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-2xl mb-2">🔶</div>
                <div className="font-semibold text-sm">Hacker News</div>
                <div className="text-xs text-gray-600">Tech Trends</div>
              </div>
              
              <div className="text-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="text-2xl mb-2">🐦</div>
                <div className="font-semibold text-sm">Twitter/X</div>
                <div className="text-xs text-gray-600">Social Signals</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">🏛️</div>
                <div className="font-semibold text-sm">SEC Data</div>
                <div className="text-xs text-gray-600">Financial Intel</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold text-sm">Data.gov</div>
                <div className="text-xs text-gray-600">Gov Data</div>
              </div>
              
              <div className="text-center p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="text-2xl mb-2">🇺🇸</div>
                <div className="font-semibold text-sm">Truth Social</div>
                <div className="text-xs text-gray-600">Sentiment</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How Our AI Works Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">How Our AI Intelligence Engine Works</h2>
          <p className="text-xl text-center text-gray-600 mb-16">9 data sources → AI aggregation → Qualified leads with intent scores</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Multi-Source Data Collection</h3>
              <p className="text-gray-600">Our system simultaneously queries 9 premium data sources including Reddit, Crunchbase, news APIs, and government databases for comprehensive market intelligence.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Analysis & Aggregation</h3>
              <p className="text-gray-600">Google Gemini AI processes and correlates data from all sources, detecting intent signals, budget mentions, urgency indicators, and cross-referencing company information.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Qualified Leads with Scores</h3>
              <p className="text-gray-600">Get ranked prospects with intent scores (0-10), contact information, personalized email hooks, and actionable intelligence from multiple verified sources.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-block w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">AI Intelligence Engine Processing</h3>
            <p className="text-gray-600 text-lg">Aggregating data from 9 premium sources and analyzing with Gemini AI...</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm text-gray-500">
              <div>📱 Analyzing Reddit discussions</div>
              <div>🏢 Processing company databases</div>
              <div>📰 Scanning news intelligence</div>
              <div>💼 Checking acquisition opportunities</div>
              <div>🔶 Monitoring tech trends</div>
              <div>🎯 Calculating intent scores</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results && !loading && (
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            
            {/* Results Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">AI Intelligence Report</h2>
              <p className="text-xl text-gray-600">
                Processed {getGlobalStats()?.totalDataPoints || 0} data points from {getGlobalStats()?.totalSources || 0}/9 sources
              </p>
            </div>

            {/* Global Intelligence Metrics */}
            <div className="grid md:grid-cols-5 gap-6 mb-16">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {getGlobalStats()?.totalSources || 0}/9
                </div>
                <div className="text-gray-700 font-medium">Active Sources</div>
                <div className="text-gray-500 text-sm">Data Streams</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {getGlobalStats()?.companiesFound || 0}
                </div>
                <div className="text-gray-700 font-medium">Companies</div>
                <div className="text-gray-500 text-sm">Identified</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {getGlobalStats()?.redditHighIntent || 0}
                </div>
                <div className="text-gray-700 font-medium">High-Intent</div>
                <div className="text-gray-500 text-sm">Reddit Posts</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {getGlobalStats()?.newsArticles || 0}
                </div>
                <div className="text-gray-700 font-medium">News Articles</div>
                <div className="text-gray-500 text-sm">Market Intel</div>
              </div>
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-6 text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  getGlobalStats()?.overallSentiment === 'positive' ? 'text-green-600' : 
                  getGlobalStats()?.overallSentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {getGlobalStats()?.overallSentiment === 'positive' ? '📈' : 
                   getGlobalStats()?.overallSentiment === 'negative' ? '📉' : '➡️'}
                </div>
                <div className="text-gray-700 font-medium">Market Sentiment</div>
                <div className="text-gray-500 text-sm">{getGlobalStats()?.overallSentiment || 'neutral'}</div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Left Column - Primary Intelligence */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* High-Intent Reddit Discussions */}
                {results.data?.reddit && results.data.reddit.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      🔥 High-Intent Business Discussions
                      <span className="text-sm font-normal bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                        Reddit Intelligence
                      </span>
                    </h3>
                    
                    <div className="space-y-4">
                      {results.data.reddit.filter(p => p.intent_score >= 6).slice(0, 3).map((post, i) => (
                        <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2">{post.title}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>r/{post.subreddit}</span>
                                <span>•</span>
                                <span>{post.num_comments} comments</span>
                                <span>•</span>
                                <span>Intent: {post.intent_score}/10</span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-xl font-bold text-orange-600">{post.intent_score}/10</div>
                              <div className="text-xs text-gray-500">INTENT</div>
                            </div>
                          </div>
                          
                          {post.selftext && (
                            <p className="text-gray-700 mb-3">{post.selftext.length > 150 ? post.selftext.substring(0, 150) + '...' : post.selftext}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.budget_hints?.length > 0 && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                💰 Budget Mentioned
                              </span>
                            )}
                            {post.location_hints?.length > 0 && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                📍 {post.location_hints[0]}
                              </span>
                            )}
                            {post.urgency_level && post.urgency_level !== 'low' && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                🚨 {post.urgency_level.toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          {post.email_hook && (
                            <div className="bg-white border border-orange-300 rounded p-3 text-sm">
                              <span className="font-semibold text-orange-800">Email Hook: </span>
                              <span className="italic">"{post.email_hook}"</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Company Intelligence */}
                {results.data?.crunchbase && results.data.crunchbase.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      🏢 Company Intelligence
                      <span className="text-sm font-normal bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        Crunchbase Data
                      </span>
                    </h3>
                    
                    <div className="grid md:grid-cols-1 gap-6">
                      {results.data.crunchbase.slice(0, 3).map((company, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">{company.name}</h4>
                              <p className="text-gray-600">{company.location}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">{company.score || 75}/100</div>
                              <div className="text-sm text-gray-500">Quality Score</div>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-4">{company.description}</p>
                          
                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-gray-500">Funding</div>
                              <div className="font-semibold text-gray-900">{company.funding_total || 'Not disclosed'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Employees</div>
                              <div className="font-semibold text-gray-900">{company.employee_count || 'Not specified'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Categories</div>
                              <div className="font-semibold text-gray-900">{company.categories || 'Technology'}</div>
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acquisition Opportunities */}
                {results.data?.bizBuySell && results.data.bizBuySell.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      💼 Acquisition Opportunities
                      <span className="text-sm font-normal bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                        BizBuySell Data
                      </span>
                    </h3>
                    
                    <div className="space-y-4">
                      {results.data.bizBuySell.slice(0, 2).map((business, i) => (
                        <div key={i} className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900">{business.title}</h4>
                              <p className="text-gray-600">{business.location}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-600">{business.price}</div>
                              <div className="text-sm text-gray-500">Asking Price</div>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-2">{business.description}</p>
                          <div className="text-sm text-gray-600">Revenue: {business.revenue}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar - Supporting Intelligence */}
              <div className="space-y-8">
                
                {/* AI Analysis Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">🤖 AI Analysis Summary</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <div className="whitespace-pre-wrap">{results.analysis}</div>
                  </div>
                </div>

                {/* Multi-Source Intelligence Breakdown */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Source Breakdown</h3>
                  <div className="space-y-3">
                    
                    {results.data?.news && results.data.news.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">📰</span>
                          <span className="text-sm font-medium">News Articles</span>
                        </div>
                        <span className="font-bold text-green-600">{results.data.news.length}</span>
                      </div>
                    )}
                    
                    {results.data?.reddit && results.data.reddit.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-500">📱</span>
                          <span className="text-sm font-medium">Reddit Discussions</span>
                        </div>
                        <span className="font-bold text-orange-600">{results.data.reddit.length}</span>
                      </div>
                    )}
                    
                    {results.data?.crunchbase && results.data.crunchbase.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500">🏢</span>
                          <span className="text-sm font-medium">Companies</span>
                        </div>
                        <span className="font-bold text-blue-600">{results.data.crunchbase.length}</span>
                      </div>
                    )}
                    
                    {results.data?.hackerNews && results.data.hackerNews.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">🔶</span>
                          <span className="text-sm font-medium">Tech Trends</span>
                        </div>
                        <span className="font-bold text-yellow-600">{results.data.hackerNews.length}</span>
                      </div>
                    )}
                    
                    {results.data?.bizBuySell && results.data.bizBuySell.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-500">💼</span>
                          <span className="text-sm font-medium">Acquisitions</span>
                        </div>
                        <span className="font-bold text-purple-600">{results.data.bizBuySell.length}</span>
                      </div>
                    )}
                    
                    {results.data?.xPosts && results.data.xPosts.length > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-500">🐦</span>
                          <span className="text-sm font-medium">Social Signals</span>
                        </div>
                        <span className="font-bold text-indigo-600">{results.data.xPosts.length}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lead Capture */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📧 Get Intelligence Alerts</h3>
                  <p className="text-gray-600 mb-4">Receive real-time alerts when new high-intent prospects are detected for "{query}"</p>
                  
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
                      Subscribe to AI Intelligence
                    </button>
                    
                    {leadMessage && (
                      <div className={`text-sm p-3 rounded-lg ${leadMessage.includes('✅') ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                        {leadMessage}
                      </div>
                    )}
                  </div>
                </div>

                {/* Supporting Data */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Supporting Intelligence</h3>
                  <div className="space-y-4">
                    
                    {results.data?.news && results.data.news.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">📰 Latest News</h4>
                        <div className="space-y-2">
                          {results.data.news.slice(0, 2).map((article, i) => (
                            <div key={i} className="text-sm">
                              <a href={article.url} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:text-blue-800 font-medium">
                                {article.title.length > 60 ? article.title.substring(0, 60) + '...' : article.title}
                              </a>
                              <p className="text-gray-500">{article.source}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.data?.hackerNews && results.data.hackerNews.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">🔶 Tech Trends</h4>
                        <div className="space-y-2">
                          {results.data.hackerNews.slice(0, 1).map((post, i) => (
                            <div key={i} className="text-sm">
                              <div className="text-gray-700 font-medium">{post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title}</div>
                              <div className="text-gray-500">{post.points} points • {post.num_comments} comments</div>
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
          <p className="text-gray-400">Powered by Silver Birch Growth Inc. • 9-Source Intelligence • Gemini AI Analysis</p>
          <p className="text-gray-500 text-sm mt-2">Real business intelligence from multiple verified sources, analyzed and scored by AI</p>
        </div>
      </footer>

    </div>
  );
}