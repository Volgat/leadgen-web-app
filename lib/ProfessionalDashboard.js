import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ProfessionalDashboard() {
  const [activeTab, setActiveTab] = useState('executive');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  // Données simulées de niveau institutionnel
  const executiveSummary = {
    totalSignals: 47,
    criticalOpportunities: 8,
    highConfidenceLeads: 12,
    marketTemperature: 'Hot',
    pipelineValue: '$2.4M',
    competitivePressure: 'High',
    recommendedFocus: 'Executive Turnover Signals'
  };

  const intentSignals = [
    {
      company: 'TechCorp Solutions',
      type: 'Employee Turnover Risk',
      severity: 'Critical',
      details: '3 VP-level employees marked "Open to Work" on LinkedIn',
      urgency: 95,
      confidence: 92,
      timeline: 'Within 48h',
      action: 'Contact CEO immediately - leadership vacuum imminent',
      value: '$450K',
      source: 'LinkedIn Pro Recruiter'
    },
    {
      company: 'DataFlow Systems',
      type: 'Pre-Funding Activity',
      severity: 'High',
      details: 'CFO hired, 40% hiring increase, PR firm engaged',
      urgency: 88,
      confidence: 89,
      timeline: 'Within 2 weeks',
      action: 'Accelerate sales cycle - funding window closing',
      value: '$320K',
      source: 'Multi-Signal Analysis'
    },
    {
      company: 'CloudTech Inc',
      type: 'Board Movement',
      severity: 'Medium',
      details: 'CTO joined 2 additional boards - networking opportunity',
      urgency: 72,
      confidence: 85,
      timeline: 'Within 1 month',
      action: 'Board member introduction strategy',
      value: '$280K',
      source: 'Executive Tracking'
    },
    {
      company: 'ScaleUp Ventures',
      type: 'Technology Adoption',
      severity: 'High',
      details: 'Job posts for AI/ML roles, competitor adopted similar tech',
      urgency: 81,
      confidence: 78,
      timeline: 'Within 3 weeks',
      action: 'Pilot program proposal',
      value: '$380K',
      source: 'Tech Stack Analysis'
    },
    {
      company: 'Growth Analytics',
      type: 'M&A Preparation',
      severity: 'Medium',
      details: 'Investment banker hired, legal firm switch to M&A specialist',
      urgency: 76,
      confidence: 82,
      timeline: 'Within 6 weeks',
      action: 'Position as acquisition-friendly solution',
      value: '$190K',
      source: 'M&A Intelligence'
    }
  ];

  const opportunityMatrix = [
    { name: 'TechCorp Solutions', urgency: 95, confidence: 92, value: 450 },
    { name: 'DataFlow Systems', urgency: 88, confidence: 89, value: 320 },
    { name: 'ScaleUp Ventures', urgency: 81, confidence: 78, value: 380 },
    { name: 'Growth Analytics', urgency: 76, confidence: 82, value: 190 },
    { name: 'CloudTech Inc', urgency: 72, confidence: 85, value: 280 },
  ];

  const signalTrends = [
    { date: '2024-05-25', executive_turnover: 12, funding_signals: 8, tech_adoption: 15, ma_activity: 6 },
    { date: '2024-05-26', executive_turnover: 15, funding_signals: 11, tech_adoption: 18, ma_activity: 8 },
    { date: '2024-05-27', executive_turnover: 18, funding_signals: 9, tech_adoption: 22, ma_activity: 7 },
    { date: '2024-05-28', executive_turnover: 14, funding_signals: 13, tech_adoption: 19, ma_activity: 9 },
    { date: '2024-05-29', executive_turnover: 21, funding_signals: 16, tech_adoption: 25, ma_activity: 12 },
    { date: '2024-05-30', executive_turnover: 19, funding_signals: 14, tech_adoption: 21, ma_activity: 10 },
    { date: '2024-06-01', executive_turnover: 23, funding_signals: 18, tech_adoption: 28, ma_activity: 15 }
  ];

  const pieData = [
    { name: 'Executive Turnover', value: 35, color: '#ef4444' },
    { name: 'Funding Activity', value: 25, color: '#3b82f6' },
    { name: 'Tech Adoption', value: 22, color: '#8b5cf6' },
    { name: 'M&A Signals', value: 18, color: '#f59e0b' }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyBar = (urgency) => {
    const width = urgency;
    let color = 'bg-gray-300';
    if (urgency >= 90) color = 'bg-red-500';
    else if (urgency >= 80) color = 'bg-orange-500';
    else if (urgency >= 70) color = 'bg-yellow-500';
    else if (urgency >= 60) color = 'bg-blue-500';
    else color = 'bg-green-500';

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${width}%` }}></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Professionnel */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SB</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Silver Birch Intelligence</h1>
                <p className="text-sm text-gray-600">Advanced B2B Prospecting Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1d">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'executive', label: 'Executive Summary', icon: '📊' },
              { id: 'signals', label: 'Intent Signals', icon: '🎯' },
              { id: 'matrix', label: 'Opportunity Matrix', icon: '🔥' },
              { id: 'trends', label: 'Signal Trends', icon: '📈' },
              { id: 'intelligence', label: 'Competitive Intel', icon: '🕵️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Executive Summary Tab */}
        {activeTab === 'executive' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Signals</p>
                    <p className="text-3xl font-bold text-gray-900">{executiveSummary.totalSignals}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">📡</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-600 text-sm font-medium">↗ +12% vs last week</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Opportunities</p>
                    <p className="text-3xl font-bold text-red-600">{executiveSummary.criticalOpportunities}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-xl">🚨</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-red-600 text-sm font-medium">Immediate action required</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                    <p className="text-3xl font-bold text-green-600">{executiveSummary.pipelineValue}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xl">💰</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-600 text-sm font-medium">↗ +28% potential value</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Market Temperature</p>
                    <p className="text-3xl font-bold text-orange-600">{executiveSummary.marketTemperature}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-xl">🌡️</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-orange-600 text-sm font-medium">High activity detected</span>
                </div>
              </div>
            </div>

            {/* Signal Distribution Chart */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Signal Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, value}) => `${name}: ${value}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Recommendations</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-medium text-gray-900">Immediate Priority</h4>
                    <p className="text-sm text-gray-600">Focus on executive turnover signals - 8 companies showing critical leadership risk</p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-medium text-gray-900">This Week</h4>
                    <p className="text-sm text-gray-600">Accelerate pre-funding companies - funding windows are narrowing</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">Strategic</h4>
                    <p className="text-sm text-gray-600">Leverage board movement connections for warm introductions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Intent Signals Tab */}
        {activeTab === 'signals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Advanced Intent Signals</h2>
              <p className="text-sm text-gray-600">Powered by proprietary multi-source intelligence</p>
            </div>

            <div className="space-y-4">
              {intentSignals.map((signal, index) => (
                <div key={index} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{signal.company}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(signal.severity)}`}>
                            {signal.severity}
                          </span>
                          <span className="text-sm text-gray-500">• {signal.type}</span>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{signal.details}</p>
                        
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Urgency Score</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{signal.urgency}%</span>
                              <div className="flex-1">
                                {getUrgencyBar(signal.urgency)}
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Confidence</p>
                            <p className="text-sm font-medium">{signal.confidence}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Est. Value</p>
                            <p className="text-sm font-medium text-green-600">{signal.value}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Timeline: <span className="font-medium">{signal.timeline}</span></span>
                            <span className="text-sm text-gray-600">Source: <span className="font-medium">{signal.source}</span></span>
                          </div>
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-1">Recommended Action</h4>
                      <p className="text-sm text-blue-800">{signal.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunity Matrix Tab */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Opportunity Priority Matrix</h2>
              <p className="text-gray-600">Companies plotted by urgency score vs confidence level</p>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={opportunityMatrix}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'urgency' ? `${value}% urgency` : 
                      name === 'confidence' ? `${value}% confidence` : 
                      `$${value}K value`, 
                      name === 'urgency' ? 'Urgency' : 
                      name === 'confidence' ? 'Confidence' : 'Value'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="urgency" fill="#ef4444" name="Urgency Score" />
                  <Bar dataKey="confidence" fill="#3b82f6" name="Confidence" />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} name="Pipeline Value ($K)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">High Priority Actions</h3>
                <div className="space-y-3">
                  {opportunityMatrix.slice(0, 3).map((company, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{company.name}</p>
                        <p className="text-sm text-gray-600">Urgency: {company.urgency}% • Value: ${company.value}K</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Take Action →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Allocation</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Immediate Action (24-48h)</span>
                    <span className="font-semibold">3 companies</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">This Week</span>
                    <span className="font-semibold">2 companies</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monitor & Nurture</span>
                    <span className="font-semibold">8 companies</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Pipeline Value</span>
                      <span className="font-bold text-green-600">$1,620K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signal Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Signal Trends Analysis</h2>
              <p className="text-gray-600">Track intent signal patterns over time</p>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={signalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="executive_turnover" stroke="#ef4444" strokeWidth={2} name="Executive Turnover" />
                  <Line type="monotone" dataKey="funding_signals" stroke="#3b82f6" strokeWidth={2} name="Funding Signals" />
                  <Line type="monotone" dataKey="tech_adoption" stroke="#8b5cf6" strokeWidth={2} name="Tech Adoption" />
                  <Line type="monotone" dataKey="ma_activity" stroke="#f59e0b" strokeWidth={2} name="M&A Activity" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Up</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Executive Turnover</span>
                    <span className="text-green-600 font-medium">+18%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tech Adoption</span>
                    <span className="text-green-600 font-medium">+12%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Peak activity: Fridays 2-4 PM</p>
                  <p className="text-sm text-gray-600">Sector focus: FinTech, HealthTech</p>
                  <p className="text-sm text-gray-600">Geographic: Toronto, Vancouver</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictions</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Next week: +25% funding signals</p>
                  <p className="text-sm text-gray-600">Q2 outlook: High M&A activity</p>
                  <p className="text-sm text-gray-600">AI adoption: Accelerating</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Competitive Intelligence Tab */}
        {activeTab === 'intelligence' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Competitive Intelligence</h2>
              <p className="text-gray-600">Market dynamics and competitive positioning insights</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Pressure Analysis</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900">High Pressure Sectors</h4>
                    <p className="text-sm text-red-800 mt-1">FinTech, AI/ML - Multiple vendors competing</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900">Emerging Opportunities</h4>
                    <p className="text-sm text-yellow-800 mt-1">HealthTech, CleanTech - Early market</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900">Blue Ocean</h4>
                    <p className="text-sm text-green-800 mt-1">ESG Tech, Quantum Computing - Low competition</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Recommendations</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">First Mover Advantage</h4>
                    <p className="text-sm text-gray-600">Target companies before competitors detect signals</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium text-gray-900">Relationship Leverage</h4>
                    <p className="text-sm text-gray-600">Use board connections for warm introductions</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-gray-900">Timing Optimization</h4>
                    <p className="text-sm text-gray-600">Strike during leadership transitions</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Proprietary Advantage</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">What Others Miss</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Pre-public funding signals</li>
                    <li>• Executive "Open to Work" patterns</li>
                    <li>• Board movement intelligence</li>
                    <li>• M&A preparation indicators</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Our Intelligence Edge</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 48-72h advance warning</li>
                    <li>• 89% signal accuracy rate</li>
                    <li>• Multi-source correlation</li>
                    <li>• Automated prioritization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}