import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { sampleJobs } from '../data/sampleJobs';
import { calculateJobMatchScore } from '../services/gemini';
import { searchAllJobs, getJobSearchConfig } from '../services/jobSearch';
import {
  Search,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Star,
  FileText,
  Target,
  Loader2,
  ChevronRight,
  Filter,
  ScanSearch,
  X,
  Globe,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Wifi,
  Database,
} from 'lucide-react';
import type { Job } from '../types';

type JobSource = 'all' | 'sample' | 'remoteok' | 'jsearch' | 'google';

export default function Jobs() {
  const { profile, setCurrentPage, setSelectedJob, appliedJobs, jobs, setJobs } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSource, setSelectedSource] = useState<JobSource>('all');
  const [calculating, setCalculating] = useState(false);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchErrors, setSearchErrors] = useState<{ source: string; error: string }[]>([]);
  const [liveSearchQuery, setLiveSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);

  const jobConfig = getJobSearchConfig();

  useEffect(() => {
    if (jobs.length === 0) {
      setJobs(sampleJobs);
    }
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        searchQuery === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || job.type.toLowerCase().includes(selectedType.toLowerCase());
      const matchesSource = selectedSource === 'all' || 
        (selectedSource === 'sample' && !job.source) ||
        job.source?.toLowerCase().includes(selectedSource);
      return matchesSearch && matchesType && matchesSource;
    });
  }, [jobs, searchQuery, selectedType, selectedSource]);

  const searchLiveJobs = async () => {
    if (!liveSearchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    setSearching(true);
    setSearchErrors([]);

    try {
      const sources: ('remoteok' | 'jsearch' | 'google')[] = ['remoteok'];
      if (jobConfig.rapidApiKey) sources.push('jsearch');
      if (jobConfig.googleApiKey && jobConfig.googleSearchEngineId) sources.push('google');

      const { jobs: liveJobs, errors } = await searchAllJobs(liveSearchQuery, sources, {
        location,
        remote: remoteOnly,
      });

      setSearchErrors(errors);
      
      // Merge with existing jobs, avoiding duplicates
      const existingIds = new Set(jobs.map(j => j.id));
      const newJobs = liveJobs.filter(j => !existingIds.has(j.id));
      
      if (newJobs.length > 0) {
        setJobs([...newJobs, ...jobs]);
      }

      if (newJobs.length === 0 && errors.length === 0) {
        alert('No new jobs found for your search.');
      }
    } catch (error: any) {
      alert('Error searching jobs: ' + error.message);
    } finally {
      setSearching(false);
    }
  };

  const calculateScores = async () => {
    if (!profile.skills.length && !profile.title) {
      alert('Please upload your CV or fill in your profile first.');
      return;
    }

    setCalculating(true);

    try {
      const updatedJobs = await Promise.all(
        filteredJobs.slice(0, 20).map(async (job) => {
          if (job.matchScore !== undefined) return job;
          const score = await calculateJobMatchScore(profile, job.description + '\n' + job.requirements.join('\n'));
          return { ...job, matchScore: score };
        })
      );
      
      // Update jobs array with new scores
      const jobMap = new Map(updatedJobs.map(j => [j.id, j]));
      setJobs(jobs.map(j => jobMap.get(j.id) || j));
    } catch (error: any) {
      alert('Error calculating scores: ' + error.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleTailor = (job: Job) => {
    setSelectedJob(job);
    setCurrentPage('tailor');
  };

  const handleMatchSession = (job: Job) => {
    setSelectedJob(job);
    setCurrentPage('match-session');
  };

  const handleATSCheck = (job: Job) => {
    setSelectedJob(job);
    setCurrentPage('ats');
  };

  const clearLiveJobs = () => {
    setJobs(sampleJobs);
  };

  const getSourceBadge = (source?: string) => {
    if (!source) return null;
    const colors: Record<string, string> = {
      'RemoteOK': 'bg-green-100 text-green-700',
      'JSearch': 'bg-blue-100 text-blue-700',
      'Google': 'bg-red-100 text-red-700',
    };
    const color = Object.entries(colors).find(([key]) => source.includes(key))?.[1] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {source.split(' ')[0]}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Live Search Panel */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Wifi size={24} />
          <div>
            <h3 className="text-lg font-bold">Real-Time Job Search</h3>
            <p className="text-white/80 text-sm">Search jobs from RemoteOK, Google Jobs, LinkedIn, Indeed & more</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              value={liveSearchQuery}
              onChange={(e) => setLiveSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLiveJobs()}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:bg-white/20 focus:border-white/40 transition-all"
              placeholder="Job title, skills, or keywords..."
            />
          </div>
          <div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:bg-white/20 focus:border-white/40 transition-all"
              placeholder="Location (optional)"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={searchLiveJobs}
              disabled={searching || !liveSearchQuery.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-gray-100 disabled:opacity-50 font-medium transition-all"
            >
              {searching ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              Search
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="rounded border-white/40"
            />
            Remote only
          </label>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>Sources:</span>
            <span className="px-2 py-0.5 bg-white/20 rounded">RemoteOK ✓</span>
            {jobConfig.rapidApiKey && <span className="px-2 py-0.5 bg-white/20 rounded">JSearch ✓</span>}
            {jobConfig.googleApiKey && <span className="px-2 py-0.5 bg-white/20 rounded">Google ✓</span>}
            {!jobConfig.rapidApiKey && !jobConfig.googleApiKey && (
              <button
                onClick={() => setCurrentPage('connectors')}
                className="px-2 py-0.5 bg-amber-500/30 text-amber-200 rounded hover:bg-amber-500/40"
              >
                + Add more sources
              </button>
            )}
          </div>
        </div>

        {searchErrors.length > 0 && (
          <div className="mt-3 space-y-1">
            {searchErrors.map((err, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-amber-200 bg-amber-500/20 px-3 py-1.5 rounded-lg">
                <AlertCircle size={14} />
                {err.source}: {err.error}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter & Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
              placeholder="Filter loaded jobs..."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 bg-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="remote">Remote</option>
              <option value="contract">Contract</option>
            </select>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as JobSource)}
              className="px-4 py-3 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 bg-white text-sm"
            >
              <option value="all">All Sources</option>
              <option value="sample">Sample Jobs</option>
              <option value="remoteok">RemoteOK</option>
              <option value="jsearch">JSearch</option>
              <option value="google">Google</option>
            </select>
            <button
              onClick={calculateScores}
              disabled={calculating}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition-all font-medium text-sm shadow-lg shadow-violet-200"
            >
              {calculating ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
              Calculate Match Scores
            </button>
            {jobs.some(j => j.source) && (
              <button
                onClick={clearLiveJobs}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-all"
              >
                <RefreshCw size={16} /> Reset to Sample
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Database size={14} />
            {filteredJobs.length} jobs loaded
          </span>
          <span className="flex items-center gap-1">
            <Globe size={14} />
            {jobs.filter(j => j.source).length} from live search
          </span>
        </div>
      </div>

      {/* Job detail modal */}
      {detailJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailJob(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{detailJob.title}</h2>
                  {getSourceBadge(detailJob.source)}
                </div>
                <p className="text-violet-600 font-medium">{detailJob.company}</p>
              </div>
              <button onClick={() => setDetailJob(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
                  <MapPin size={14} /> {detailJob.location}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
                  <Briefcase size={14} /> {detailJob.type}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
                  <DollarSign size={14} /> {detailJob.salary}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
                  <Clock size={14} /> {detailJob.posted}
                </span>
              </div>

              {detailJob.matchScore !== undefined && (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  detailJob.matchScore >= 70 ? 'bg-emerald-50 border border-emerald-200' :
                  detailJob.matchScore >= 50 ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className={`text-3xl font-bold ${
                    detailJob.matchScore >= 70 ? 'text-emerald-600' :
                    detailJob.matchScore >= 50 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {detailJob.matchScore}%
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Match Score</p>
                    <p className="text-sm text-gray-500">Based on your profile analysis</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{detailJob.description}</p>
              </div>

              {detailJob.requirements.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                  <ul className="space-y-2">
                    {detailJob.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight size={16} className="text-violet-500 shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {detailJob.applyUrl && (
                  <a
                    href={detailJob.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 font-medium text-sm shadow-lg"
                  >
                    <ExternalLink size={16} /> Apply Now
                  </a>
                )}
                <button
                  onClick={() => { setDetailJob(null); handleTailor(detailJob); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 font-medium text-sm shadow-lg"
                >
                  <FileText size={16} /> Tailor Resume
                </button>
                <button
                  onClick={() => { setDetailJob(null); handleATSCheck(detailJob); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 font-medium text-sm shadow-lg"
                >
                  <ScanSearch size={16} /> ATS Check
                </button>
                <button
                  onClick={() => { setDetailJob(null); handleMatchSession(detailJob); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 font-medium text-sm shadow-lg"
                >
                  <Target size={16} /> Boost Match Score
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all duration-200 overflow-hidden group cursor-pointer"
            onClick={() => setDetailJob(job)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
                      {job.title}
                    </h3>
                    {getSourceBadge(job.source)}
                  </div>
                  <p className="text-violet-600 font-medium text-sm">{job.company}</p>
                </div>
                {job.matchScore !== undefined && (
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg ${
                      job.matchScore >= 70
                        ? 'bg-emerald-100 text-emerald-700'
                        : job.matchScore >= 50
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {job.matchScore}%
                  </div>
                )}
                {appliedJobs.includes(job.id) && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full ml-2">
                    Applied
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                  <MapPin size={12} /> {job.location}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                  <Briefcase size={12} /> {job.type}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                  <DollarSign size={12} /> {job.salary}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                  <Clock size={12} /> {job.posted}
                </span>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>

              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 text-xs font-medium transition-all"
                  >
                    <ExternalLink size={14} /> Apply
                  </a>
                )}
                <button
                  onClick={() => handleTailor(job)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 text-xs font-medium transition-all"
                >
                  <FileText size={14} /> Tailor
                </button>
                <button
                  onClick={() => handleATSCheck(job)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 text-xs font-medium transition-all"
                >
                  <ScanSearch size={14} /> ATS
                </button>
                <button
                  onClick={() => handleMatchSession(job)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 text-xs font-medium transition-all"
                >
                  <Target size={14} /> Boost
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Filter size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No jobs found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or search for live jobs</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedSource('all');
            }}
            className="px-4 py-2 bg-violet-100 text-violet-700 rounded-xl hover:bg-violet-200 font-medium text-sm"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
