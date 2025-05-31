'use client';
import { useState, useEffect } from 'react';

export default function LeadGenApp() {
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leadMessage, setLeadMessage] = useState('');
  const [error, setError] = useState('');

  // Exemples de recherches populaires
  const popularSearches = [
    'AI startups Toronto',
    'businesses for sale Vancouver',
    'physiotherapy clinics',
    'tech companies Montreal',
    'restaurant franchise opportunities',
    'digital marketing agencies'
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              🧠 Business Intelligence Lead Generator
            </h1>
            <div className="text-sm text-blue-200">
              Powered by AI • 9 Data Sources
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Discover Business Opportunities & Intent Signals
          </h2>
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto">
            Search for any business topic and get AI-powered insights from news, social media, 
            market data, and more. Find leads with real buying intent.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., AI startups Toronto, businesses for sale, physiotherapy clinics..."
                className="flex-1 px-6 py-4 text-lg rounded-xl border-2 border-blue-300/30 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? '🔍' : 'Search'}
              </button>
            </div>
          </div>

          {/* Popular Searches */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="text-blue-200 text-sm">Popular searches:</span>
            {popularSearches.slice(0, 4).map((search, index) => (
              <button
                key={index}
                onClick={() => setQuery(search)}
                className="px-3 py-1 bg-white/10 text-blue-200 text-sm rounded-full hover:bg-white/20 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-blue-200 text-lg">Analyzing data from 9 sources...</p>
            <p className="text-blue-300 text-sm mt-2">This may take 10-15 seconds</p>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column - AI Analysis */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Metrics */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">📊 Analysis Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{results.metrics.intentScore}</div>
                    <div className="text-sm text-blue-200">Intent Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{results.metrics.dataQuality}%</div>
                    <div className="text-sm text-blue-200">Data Quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{results.metrics.trending}</div>
                    <div className="text-sm text-blue-200">Trending Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{results.metrics.sourcesWithData}</div>
                    <div className="text-sm text-blue-200">Sources Found</div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">🤖 AI-Powered Insights</h3>
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-blue-100 leading-relaxed">
                    {results.analysis}
                  </div>
                </div>
              </div>

              {/* Data Sources */}
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* News */}
                {results.data.news && results.data.news.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">📰 Recent News</h4>
                    <div className="space-y-2">
                      {results.data.news.slice(0, 3).map((article, i) => (
                        <div key={i} className="text-sm">
                          <a href={article.url} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-300 hover:text-blue-200 font-medium">
                            {article.title}
                          </a>
                          <p className="text-blue-200 text-xs mt-1">{article.source}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reddit */}
                {results.data.reddit && results.data.reddit.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">💬 Reddit Discussions</h4>
                    <div className="space-y-2">
                      {results.data.reddit.slice(0, 3).map((post, i) => (
                        <div key={i} className="text-sm">
                          <div className="text-blue-300 font-medium">{post.title}</div>
                          <div className="text-blue-200 text-xs">
                            r/{post.subreddit} • {post.score} points • Intent: {post.intent_score || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Twitter */}
                {results.data.xPosts && results.data.xPosts.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">🐦 Social Media</h4>
                    <div className="space-y-2">
                      {results.data.xPosts.slice(0, 3).map((tweet, i) => (
                        <div key={i} className="text-sm">
                          <div className="text-blue-300">{tweet.text.substring(0, 120)}...</div>
                          <div className="text-blue-200 text-xs">
                            {tweet.likes} likes • {tweet.retweets} retweets
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Opportunities */}
                {results.data.bizBuySell && results.data.bizBuySell.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="font-semibold text-white mb-3">🏢 Business Opportunities</h4>
                    <div className="space-y-2">
                      {results.data.bizBuySell.slice(0, 3).map((business, i) => (
                        <div key={i} className="text-sm">
                          <div className="text-blue-300 font-medium">{business.title}</div>
                          <div className="text-blue-200 text-xs">
                            {business.price} • {business.location}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Right Column - Lead Capture */}
            <div className="space-y-6">
              
              {/* Lead Capture Form */}
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
                <h3 className="text-xl font-semibold text-white mb-4">📧 Get Alerts & Updates</h3>
                <p className="text-blue-200 text-sm mb-4">
                  Stay informed about new opportunities and trends in "{query}"
                </p>
                
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-lg border border-blue-300/30 bg-white/10 text-white placeholder-blue-200 focus:border-blue-400 focus:outline-none"
                  />
                  
                  <button
                    onClick={handleLeadSubmit}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Subscribe to Alerts
                  </button>
                  
                  {leadMessage && (
                    <div className={`text-sm p-2 rounded ${leadMessage.includes('✅') ? 'text-green-200 bg-green-500/20' : 'text-red-200 bg-red-500/20'}`}>
                      {leadMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">⚡ Performance</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Data Collection:</span>
                    <span className="text-white">{results.performance.dataCollectionTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">AI Analysis:</span>
                    <span className="text-white">{results.performance.analysisTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Total Time:</span>
                    <span className="text-white">{results.performance.totalTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Data Points:</span>
                    <span className="text-white">{results.metrics.totalDataPoints}</span>
                  </div>
                </div>
              </div>

              {/* Data Sources Status */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">📡 Data Sources</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(results.data).filter(([key, value]) => key !== 'metadata' && Array.isArray(value)).map(([source, data]) => (
                    <div key={source} className="flex justify-between items-center">
                      <span className="text-blue-200 capitalize">{source.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${data.length > 0 ? 'bg-green-500/20 text-green-200' : 'bg-gray-500/20 text-gray-300'}`}>
                        {data.length > 0 ? `${data.length} items` : 'No data'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/20 text-center text-blue-200">
          <p>Built with Next.js, Gemini AI, and 9 data sources • Powered by Silver Birch Growth</p>
        </footer>

      </main>
    </div>
  );
}