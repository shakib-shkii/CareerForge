import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getJobSearchConfig, saveJobSearchConfig } from '../services/jobSearch';
import { AI_PROVIDERS, getAIConfig, saveAIConfig, testAIConnection } from '../services/aiProviders';
import type { AIProvider } from '../services/aiProviders';
import {
  Plug,
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Shield,
  Search,
  Globe,
  Briefcase,
  Loader2,
  Check,
} from 'lucide-react';

type TabType = 'ai' | 'jobs' | 'browse';

export default function Connectors() {
  const { setAiApiKey } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('ai');
  
  // AI Provider state
  const [aiConfig, setAiConfig] = useState(getAIConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const envGoogleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';

  // Job Search state
  const [jobConfig, setJobConfig] = useState(getJobSearchConfig());
  const [showRapidKey, setShowRapidKey] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [jobSaved, setJobSaved] = useState(false);
  const [testingRemoteOK, setTestingRemoteOK] = useState(false);
  const [testingJSearch, setTestingJSearch] = useState(false);
  const [remoteOKStatus, setRemoteOKStatus] = useState<'success' | 'error' | null>(null);
  const [jSearchStatus, setJSearchStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    setJobConfig(getJobSearchConfig());
    setAiConfig(getAIConfig());
  }, []);

  const handleSaveAI = () => {
    const effectiveKey = aiConfig.apiKey || envGoogleApiKey;
    const configToSave: Partial<Parameters<typeof saveAIConfig>[0]> = {
      provider: aiConfig.provider,
      model: aiConfig.model,
    };
    if (aiConfig.apiKey) {
      configToSave.apiKey = aiConfig.apiKey;
    }
    saveAIConfig(configToSave);
    if (aiConfig.provider === 'google' && effectiveKey) {
      setAiApiKey(effectiveKey);
    }
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 3000);
  };

  const handleTestAI = async () => {
    const effectiveKey = aiConfig.apiKey || envGoogleApiKey;
    if (!effectiveKey) {
      alert('Please enter an API key first or configure VITE_GOOGLE_API_KEY.');
      return;
    }

    setAiTesting(true);
    setAiTestResult(null);

    const result = await testAIConnection({ ...aiConfig, apiKey: effectiveKey });
    setAiTestResult(result);
    if (result.success && aiConfig.provider === 'google') {
      if (aiConfig.apiKey) {
        saveAIConfig({ provider: aiConfig.provider, model: aiConfig.model, apiKey: aiConfig.apiKey });
      }
      setAiApiKey(effectiveKey);
    }
    setAiTesting(false);
  };

  const selectProvider = (provider: AIProvider) => {
    const newConfig = {
      ...aiConfig,
      provider: provider.id,
      model: provider.models[0]?.id || '',
    };
    setAiConfig(newConfig);
    setAiTestResult(null);
  };

  const handleSaveJobConfig = () => {
    saveJobSearchConfig(jobConfig);
    setJobSaved(true);
    setTimeout(() => setJobSaved(false), 3000);
  };

  const testRemoteOK = async () => {
    setTestingRemoteOK(true);
    setRemoteOKStatus(null);
    try {
      const response = await fetch('https://remoteok.com/api');
      if (response.ok) {
        const data = await response.json();
        setRemoteOKStatus(Array.isArray(data) && data.length > 0 ? 'success' : 'error');
      } else {
        setRemoteOKStatus('error');
      }
    } catch {
      setRemoteOKStatus('error');
    } finally {
      setTestingRemoteOK(false);
    }
  };

  const testJSearch = async () => {
    if (!jobConfig.rapidApiKey) {
      alert('Please enter your RapidAPI key first');
      return;
    }
    setTestingJSearch(true);
    setJSearchStatus(null);
    try {
      const response = await fetch(
        'https://jsearch.p.rapidapi.com/search?query=developer&num_pages=1',
        {
          headers: {
            'X-RapidAPI-Key': jobConfig.rapidApiKey,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
          },
        }
      );
      setJSearchStatus(response.ok ? 'success' : 'error');
      if (response.ok) saveJobSearchConfig({ rapidApiKey: jobConfig.rapidApiKey });
    } catch {
      setJSearchStatus('error');
    } finally {
      setTestingJSearch(false);
    }
  };

  const effectiveApiKey = aiConfig.apiKey || envGoogleApiKey;
  const selectedProvider = AI_PROVIDERS.find(p => p.id === aiConfig.provider);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Plug size={24} />
          <div>
            <h3 className="text-lg font-bold">Connectors & Integrations</h3>
            <p className="text-white/80 text-sm">
              Configure AI providers and job search APIs for your career platform
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm">
        {[
          { id: 'ai' as const, label: 'AI Providers', icon: <Sparkles size={16} /> },
          { id: 'jobs' as const, label: 'Job Search APIs', icon: <Briefcase size={16} /> },
          { id: 'browse' as const, label: 'Browse All', icon: <Search size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* AI Providers Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          {/* Current Provider Card */}
          {selectedProvider && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-violet-50 to-indigo-50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg">
                    {selectedProvider.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-lg">{selectedProvider.name}</h4>
                      {selectedProvider.isFree && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Free</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{selectedProvider.description}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                    effectiveApiKey
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}>
                    {effectiveApiKey ? <><CheckCircle2 size={16} /> Configured</> : <><AlertCircle size={16} /> Not Set</>}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Model Selection */}
                {selectedProvider.models.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <select
                      value={aiConfig.model}
                      onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 bg-white text-sm"
                    >
                      {selectedProvider.models.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name} {model.isFree ? '(Free)' : ''} - {model.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* API Key */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Key size={14} /> API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={aiConfig.apiKey}
                      onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-sm"
                      placeholder={`Enter your ${selectedProvider.name} API key...`}
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Get your API key from{' '}
                    <a
                      href={selectedProvider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1"
                    >
                      {selectedProvider.name} <ExternalLink size={12} />
                    </a>
                    {selectedProvider.rateLimit && ` • Rate limit: ${selectedProvider.rateLimit}`}
                  </p>
                  {!aiConfig.apiKey && envGoogleApiKey && (
                    <p className="text-xs text-emerald-700 mt-2">
                      Using environment API key from <code>VITE_GOOGLE_API_KEY</code>.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveAI}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${
                      aiSaved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700'
                    }`}
                  >
                    {aiSaved ? <><CheckCircle2 size={18} /> Saved!</> : 'Save Configuration'}
                  </button>
                  <button
                    onClick={handleTestAI}
                    disabled={aiTesting || !(aiConfig.apiKey || envGoogleApiKey)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 font-medium transition-all"
                  >
                    {aiTesting ? <Loader2 size={18} className="animate-spin" /> : 'Test Connection'}
                  </button>
                </div>

                {aiTestResult && (
                  <div className={`flex flex-col gap-1 p-4 rounded-xl ${
                    aiTestResult.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      {aiTestResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      <span className="font-medium">
                        {aiTestResult.success ? `${selectedProvider.name} connected successfully!` : 'Connection failed'}
                      </span>
                    </div>
                    {aiTestResult.error && <p className="text-sm ml-6">{aiTestResult.error}</p>}
                  </div>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedProvider.features.map(f => (
                    <span key={f} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Single Provider Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h4 className="font-bold text-gray-900 mb-4">AI Provider</h4>
            <p className="text-sm text-gray-600">
              This app uses a single Google AI provider for resume tailoring, ATS checking, and CV parsing.
            </p>
            <div className="mt-4 rounded-2xl border border-gray-200 p-4 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{selectedProvider?.icon}</div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedProvider?.name}</p>
                  <p className="text-xs text-gray-500">{selectedProvider?.description}</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p>Model: {selectedProvider?.models[0]?.name}</p>
                <p>Rate limit: {selectedProvider?.rateLimit}</p>
                <p>Only the Google AI provider is supported in this version.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Search APIs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* RemoteOK */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Globe size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">RemoteOK</h4>
                  <p className="text-sm text-gray-500">Free API for remote job listings worldwide</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={16} /> Free - No Key Required
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">API Endpoint</p>
                  <p className="text-sm text-gray-500 font-mono">https://remoteok.com/api</p>
                </div>
                <button
                  onClick={testRemoteOK}
                  disabled={testingRemoteOK}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-medium text-sm transition-all"
                >
                  {testingRemoteOK ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Test
                </button>
              </div>
              {remoteOKStatus && (
                <div className={`mt-3 flex items-center gap-2 p-3 rounded-xl text-sm ${
                  remoteOKStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {remoteOKStatus === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {remoteOKStatus === 'success' ? 'RemoteOK API is working!' : 'Failed to connect'}
                </div>
              )}
            </div>
          </div>

          {/* JSearch */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
                  <Briefcase size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">JSearch (RapidAPI)</h4>
                  <p className="text-sm text-gray-500">Real-time jobs from Google Jobs, LinkedIn, Indeed & more</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                  jobConfig.rapidApiKey
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                  {jobConfig.rapidApiKey ? <><CheckCircle2 size={16} /> Configured</> : <><AlertCircle size={16} /> Not Set</>}
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Key size={14} /> RapidAPI Key
                </label>
                <div className="relative">
                  <input
                    type={showRapidKey ? 'text' : 'password'}
                    value={jobConfig.rapidApiKey}
                    onChange={(e) => setJobConfig({ ...jobConfig, rapidApiKey: e.target.value })}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                    placeholder="Enter your RapidAPI key..."
                  />
                  <button
                    onClick={() => setShowRapidKey(!showRapidKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showRapidKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Get your key from{' '}
                  <a href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                    RapidAPI JSearch <ExternalLink size={12} />
                  </a>
                  {' '}(Free: 200 requests/month)
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveJobConfig} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${
                  jobSaved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                }`}>
                  {jobSaved ? <><CheckCircle2 size={18} /> Saved!</> : 'Save'}
                </button>
                <button onClick={testJSearch} disabled={testingJSearch || !jobConfig.rapidApiKey} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 font-medium transition-all">
                  {testingJSearch ? 'Testing...' : 'Test'}
                </button>
              </div>
              {jSearchStatus && (
                <div className={`flex items-center gap-2 p-4 rounded-xl ${
                  jSearchStatus === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {jSearchStatus === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span className="font-medium">{jSearchStatus === 'success' ? 'JSearch connected!' : 'Connection failed'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Google Custom Search */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center shadow-lg">
                  <Search size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">Google Custom Search</h4>
                  <p className="text-sm text-gray-500">Search job listings across the web</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Google API Key</label>
                  <div className="relative">
                    <input
                      type={showGoogleKey ? 'text' : 'password'}
                      value={jobConfig.googleApiKey}
                      onChange={(e) => setJobConfig({ ...jobConfig, googleApiKey: e.target.value })}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm"
                      placeholder="Google API key..."
                    />
                    <button onClick={() => setShowGoogleKey(!showGoogleKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showGoogleKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search Engine ID</label>
                  <input
                    type="text"
                    value={jobConfig.googleSearchEngineId}
                    onChange={(e) => setJobConfig({ ...jobConfig, googleSearchEngineId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm"
                    placeholder="Search Engine ID..."
                  />
                </div>
              </div>
              <button onClick={handleSaveJobConfig} className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${
                jobSaved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600'
              }`}>
                {jobSaved ? <><CheckCircle2 size={18} /> Saved!</> : 'Save Google Config'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browse All Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* AI Providers */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-violet-600" />
              AI Providers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AI_PROVIDERS.map(provider => (
                <div
                  key={provider.id}
                  className={`bg-white rounded-2xl border-2 p-5 transition-all ${
                    provider.status === 'available'
                      ? 'border-gray-200 hover:border-violet-300 hover:shadow-md cursor-pointer'
                      : 'border-gray-100 opacity-60'
                  }`}
                  onClick={() => provider.status === 'available' && setActiveTab('ai') && selectProvider(provider)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{provider.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{provider.name}</h4>
                        {provider.isFree && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">Free</span>
                        )}
                      </div>
                      {provider.status === 'coming_soon' && (
                        <span className="text-xs text-amber-600 font-medium">Coming Soon</span>
                      )}
                      {provider.status === 'beta' && (
                        <span className="text-xs text-blue-600 font-medium">Beta</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{provider.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.features.slice(0, 3).map(f => (
                      <span key={f} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{f}</span>
                    ))}
                    {provider.features.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">+{provider.features.length - 3}</span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{provider.models.length} models</span>
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1"
                    >
                      Visit <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job APIs */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-blue-600" />
              Job Search APIs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'RemoteOK', icon: '🌍', desc: 'Free remote job listings', free: true, url: 'https://remoteok.com' },
                { name: 'JSearch (RapidAPI)', icon: '🔍', desc: 'Google Jobs, LinkedIn, Indeed', free: true, url: 'https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch' },
                { name: 'Google Custom Search', icon: '🔎', desc: 'Search jobs across the web', free: true, url: 'https://programmablesearchengine.google.com/' },
                { name: 'LinkedIn Jobs', icon: '💼', desc: 'Professional network jobs', free: false, url: 'https://linkedin.com', coming: true },
                { name: 'Indeed API', icon: '📋', desc: 'Millions of job listings', free: false, url: 'https://indeed.com', coming: true },
                { name: 'Glassdoor', icon: '🚪', desc: 'Jobs with company reviews', free: false, url: 'https://glassdoor.com', coming: true },
              ].map(api => (
                <div
                  key={api.name}
                  className={`bg-white rounded-2xl border-2 p-5 ${
                    api.coming ? 'border-gray-100 opacity-60' : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                  }`}
                  onClick={() => !api.coming && setActiveTab('jobs')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{api.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{api.name}</h4>
                        {api.free && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">Free</span>}
                      </div>
                      {api.coming && <span className="text-xs text-amber-600 font-medium">Coming Soon</span>}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{api.desc}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <a
                      href={api.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                    >
                      Learn more <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <Shield size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900 text-sm">Your API Keys are Secure</p>
          <p className="text-xs text-blue-700 mt-1">
            All API keys are stored locally in your browser and are only used to communicate directly with their respective services. They are never sent to any third-party server.
          </p>
        </div>
      </div>
    </div>
  );
}
