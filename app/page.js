'use client';
import { useState, useEffect } from 'react';

export default function LeadGenApp() {
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leadMessage, setLeadMessage] = useState('');
  const [error, setError] = useState('');
  const [animatedStats, setAnimatedStats] = useState({ intentScore: 0, dataQuality: 0, trending: 0 });

  // Exemples de recherches populaires
  const popularSearches = [
    'AI startups Toronto',
    'businesses for sale Vancouver', 
    'physiotherapy clinics',
    'tech companies Montreal',
    'restaurant franchise opportunities',
    'digital marketing agencies'
  ];

  // Animation des statistiques
  useEffect(() => {
    if (results) {
      const timer = setTimeout(() => {
        setAnimatedStats({
          intentScore: results.metrics.intentScore,
          dataQuality: results.metrics.dataQuality,
          trending: results.metrics.trending
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [results]);

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

    if (!query.trim()) {
      setLeadMessage('Please perform a search first');
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse delay-1000"></div>

      {/* Navigation Header */}
      <nav className="relative bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">🧠</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Silver Birch Intelligence
                </h1>
                <p className="text-blue-200/80 text-sm">Business Lead Generator</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-blue-200/80 text-sm">
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>AI Powered</span>
              </span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>9 Data Sources</span>
              </span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Real-time Analysis</span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                Discover Business
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Opportunities
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100/90 mb-8 max-w-4xl mx-auto leading-relaxed">
              Uncover hidden market opportunities and intent signals with AI-powered analysis 
              from news, social media, market data, and more.
            </p>
          </div>

          {/* Search Interface */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative">
              <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., AI startups Toronto, businesses for sale, physiotherapy clinics..."
                    className="w-full px-6 py-5 text-lg bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/60 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-300"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-8 py-5 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center min-w-[140px]"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analyzing</span>
                    </div>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>🔍</span>
                      <span>Analyze</span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Popular Searches */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="text-blue-200/80 text-sm font-medium">Popular searches:</span>
              {popularSearches.slice(0, 4).map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-blue-200/80 hover:text-blue-100 text-sm rounded-full border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  {search}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 max-w-2xl mx-auto p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <span>❌</span>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="relative">
              <div className="inline-block w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-6"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-400/20 border-r-purple-400 rounded-full animate-spin animate-reverse mx-auto"></div>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">Analyzing Market Intelligence</h3>
            <p className="text-blue-200/80 text-lg mb-4">Processing data from 9 premium sources...</p>
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-blue-300/70 mb-2">
                <span>Progress</span>
                <span>Analyzing...</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {results && !loading && (
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Main Analysis Section */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Key Metrics Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl border border-blue-400/20 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                  <div className="text-4xl font-bold text-blue-400 mb-2">{animatedStats.intentScore}</div>
                  <div className="text-blue-200 font-medium">Intent Score</div>
                  <div className="text-blue-300/60 text-sm mt-1">Market Interest Level</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-xl border border-green-400/20 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                  <div className="text-4xl font-bold text-green-400 mb-2">{animatedStats.dataQuality}%</div>
                  <div className="text-green-200 font-medium">Data Quality</div>
                  <div className="text-green-300/60 text-sm mt-1">Source Reliability</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl border border-purple-400/20 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                  <div className="text-4xl font-bold text-purple-400 mb-2">{animatedStats.trending}</div>
                  <div className="text-purple-200 font-medium">Trending Score</div>
                  <div className="text-purple-300/60 text-sm mt-1">Market Momentum</div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">AI-Powered Market Analysis</h3>
                    <p className="text-blue-200/70">Generated by Gemini 2.5 Advanced Intelligence</p>
                  </div>
                </div>
                <div className="prose prose-invert prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-blue-50/90 leading-relaxed font-light">
                    {results.analysis}
                  </div>
                </div>
              </div>

              {/* Data Sources Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* News */}
                {results.data.news && results.data.news.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-bold text-white mb-4 flex items-center space-x-2">
                      <span className="text-xl">📰</span>
                      <span>Breaking News</span>
                      <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">{results.data.news.length}</span>
                    </h4>
                    <div className="space-y-3">
                      {results.data.news.slice(0, 3).map((article, i) => (
                        <div key={i} className="border-l-2 border-blue-400/50 pl-3">
                          <a href={article.url} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-300 hover:text-blue-200 font-medium transition-colors line-clamp-2">
                            {article.title}
                          </a>
                          <p className="text-blue-200/60 text-sm mt-1">{article.source} • {new Date(article.publishedAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reddit */}
                {results.data.reddit && results.data.reddit.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-bold text-white mb-4 flex items-center space-x-2">
                      <span className="text-xl">💬</span>
                      <span>Community Insights</span>
                      <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full text-xs">{results.data.reddit.length}</span>
                    </h4>
                    <div className="space-y-3">
                      {results.data.reddit.slice(0, 3).map((post, i) => (
                        <div key={i} className="border-l-2 border-orange-400/50 pl-3">
                          <div className="text-orange-300 font-medium line-clamp-2">{post.title}</div>
                          <div className="text-orange-200/60 text-sm flex items-center space-x-3 mt-1">
                            <span>r/{post.subreddit}</span>
                            <span>•</span>
                            <span>{post.score} points</span>
                            <span>•</span>
                            <span className="bg-orange-500/20 px-2 py-0.5 rounded text-xs">Intent: {post.intent_score || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Twitter */}
                {results.data.xPosts && results.data.xPosts.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-bold text-white mb-4 flex items-center space-x-2">
                      <span className="text-xl">🐦</span>
                      <span>Social Pulse</span>
                      <span className="bg-sky-500/20 text-sky-300 px-2 py-1 rounded-full text-xs">{results.data.xPosts.length}</span>
                    </h4>
                    <div className="space-y-3">
                      {results.data.xPosts.slice(0, 3).map((tweet, i) => (
                        <div key={i} className="border-l-2 border-sky-400/50 pl-3">
                          <div className="text-sky-300 text-sm line-clamp-3">{tweet.text.substring(0, 120)}...</div>
                          <div className="text-sky-200/60 text-xs flex items-center space-x-3 mt-2">
                            <span>❤️ {tweet.likes}</span>
                            <span>🔄 {tweet.retweets}</span>
                            <span>💬 {tweet.replies}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Opportunities */}
                {results.data.bizBuySell && results.data.bizBuySell.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-bold text-white mb-4 flex items-center space-x-2">
                      <span className="text-xl">🏢</span>
                      <span>Investment Opportunities</span>
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">{results.data.bizBuySell.length}</span>
                    </h4>
                    <div className="space-y-3">
                      {results.data.bizBuySell.slice(0, 3).map((business, i) => (
                        <div key={i} className="border-l-2 border-green-400/50 pl-3">
                          <div className="text-green-300 font-medium line-clamp-2">{business.title}</div>
                          <div className="text-green-200/60 text-sm mt-1 flex items-center space-x-3">
                            <span className="font-semibold">{business.price}</span>
                            <span>•</span>
                            <span>{business.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Lead Capture */}
              <div className="bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">📧</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Stay Ahead</h3>
                  <p className="text-purple-200/80">Get real-time alerts about new opportunities in "{query}"</p>
                </div>
                
                <div className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-4 rounded-xl border border-purple-300/30 bg-white/10 text-white placeholder-purple-200/60 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition-all duration-300"
                  />
                  
                  <button
                    onClick={handleLeadSubmit}
                    className="w-full px-4 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
                  >
                    🚀 Subscribe to Intelligence Alerts
                  </button>
                  
                  {leadMessage && (
                    <div className={`text-sm p-3 rounded-lg transition-all duration-300 ${leadMessage.includes('✅') ? 'text-green-200 bg-green-500/20 border border-green-400/30' : 'text-red-200 bg-red-500/20 border border-red-400/30'}`}>
                      {leadMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Performance Analytics</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200/80">Processing Time</span>
                    <span className="text-white font-semibold">{results.performance.totalTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200/80">Data Collection</span>
                    <span className="text-white font-semibold">{results.performance.dataCollectionTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200/80">AI Analysis</span>
                    <span className="text-white font-semibold">{results.performance.analysisTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200/80">Data Points</span>
                    <span className="text-white font-semibold">{results.metrics.totalDataPoints}</span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200/80">Sources Active</span>
                      <span className="text-green-400 font-semibold">{results.metrics.sourcesWithData}/9</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Sources Status */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <span>📡</span>
                  <span>Intelligence Sources</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(results.data).filter(([key, value]) => key !== 'metadata' && Array.isArray(value)).map(([source, data]) => (
                    <div key={source} className="flex justify-between items-center">
                      <span className="text-blue-200/80 capitalize font-medium">{source.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${data.length > 0 ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                          {data.length > 0 ? `${data.length} items` : 'No data'}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${data.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative mt-20 border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-blue-200/80 mb-4 md:mb-0">
              <p className="font-medium">Powered by Silver Birch Growth Inc.</p>
              <p className="text-sm">Next.js 15 • Gemini AI • 9 Premium Data Sources</p>
            </div>
            <div className="flex items-center space-x-6 text-blue-300/60 text-sm">
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Real-time</span>
              </span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Secure</span>
              </span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Enterprise</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}