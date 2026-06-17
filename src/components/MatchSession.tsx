import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Target,
  Loader2,
  CheckCircle2,
  Plus,
  Play,
  Copy,
  Download,
  Send,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { tailorResume, getMatchImprovements } from '../services/gemini';
import type { MatchSession as MatchSessionType } from '../types';

export default function MatchSession() {
  const {
    profile,
    selectedJob,
    matchSessions,
    addMatchSession,
    updateMatchSession,
    activeSessionId,
    setActiveSessionId,
    addAppliedJob,
  } = useStore();

  const [jobDescription, setJobDescription] = useState(
    selectedJob
      ? `${selectedJob.title} at ${selectedJob.company}\n\n${selectedJob.description}\n\nRequirements:\n${selectedJob.requirements.map((r) => `• ${r}`).join('\n')}`
      : ''
  );
  const [jobTitle, setJobTitle] = useState(selectedJob?.title || '');
  const [company, setCompany] = useState(selectedJob?.company || '');
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'cover'>('resume');
  const [copied, setCopied] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const activeSession = matchSessions.find((s) => s.id === activeSessionId);

  const startNewSession = async () => {
    if (!profile.rawCvText && !profile.summary) {
      alert('Please upload your CV in Profile first!');
      return;
    }
    if (!jobDescription.trim() || !jobTitle.trim() || !company.trim()) {
      alert('Please fill in the job title, company, and description!');
      return;
    }
    if (!jobDescription.trim() || !jobTitle.trim() || !company.trim()) {
      alert('Please fill in the job title, company, and description!');
      return;
    }

    setLoading(true);
    try {
      const cvText = profile.rawCvText || buildCVFromProfile();
      const result = await tailorResume(cvText, jobDescription, profile);

      const session: MatchSessionType = {
        id: Date.now().toString(),
        jobId: selectedJob?.id || '',
        jobTitle,
        company,
        currentScore: result.matchScoreAfter,
        targetScore: 90,
        suggestions: result.changes,
        appliedSuggestions: result.changes,
        tailoredResume: result.content,
        tailoredCoverLetter: result.coverLetter,
        status: 'in_progress',
      };

      addMatchSession(session);
      setActiveSessionId(session.id);
    } catch (error: any) {
      alert('Error creating session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const improveScore = async () => {
    if (!activeSession) return;

    setImproving(true);
    try {
      const result = await getMatchImprovements(
        activeSession.tailoredResume,
        jobDescription,
        activeSession.currentScore,
        activeSession.appliedSuggestions
      );

      updateMatchSession(activeSession.id, {
        currentScore: result.newScore,
        suggestions: [...activeSession.suggestions, ...result.suggestions],
        appliedSuggestions: [...activeSession.appliedSuggestions, ...result.suggestions],
        tailoredResume: result.improvedResume,
        tailoredCoverLetter: result.improvedCoverLetter,
        status: result.newScore >= 85 ? 'ready' : 'in_progress',
      });
    } catch (error: any) {
      alert('Error improving: ' + error.message);
    } finally {
      setImproving(false);
    }
  };

  const handleApply = () => {
    if (!activeSession) return;
    updateMatchSession(activeSession.id, { status: 'applied' });
    if (activeSession.jobId) {
      addAppliedJob(activeSession.jobId);
    }
    alert('Application marked as sent! Your tailored resume and cover letter are ready.');
  };

  const buildCVFromProfile = () => {
    let cv = `${profile.name}\n${profile.title}\n${profile.email} | ${profile.phone} | ${profile.location}\n\n`;
    cv += `SUMMARY\n${profile.summary}\n\n`;
    cv += `SKILLS\n${profile.skills.join(', ')}\n\n`;
    cv += `EXPERIENCE\n`;
    profile.experience.forEach((exp) => {
      cv += `${exp.role} at ${exp.company} (${exp.duration})\n${exp.description}\n\n`;
    });
    cv += `EDUCATION\n`;
    profile.education.forEach((edu) => {
      cv += `${edu.degree} - ${edu.institution} (${edu.year})\n`;
    });
    return cv;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Target size={24} />
          <div>
            <h3 className="text-lg font-bold">Match Score Booster</h3>
            <p className="text-white/80 text-sm">
              Iteratively improve your match score with AI-guided suggestions until you're ready to apply
            </p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {matchSessions.length > 0 && !activeSession && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h4 className="font-bold text-gray-900 mb-4">Your Sessions</h4>
          <div className="space-y-3">
            {matchSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setJobTitle(session.jobTitle);
                  setCompany(session.company);
                }}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 cursor-pointer transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900">{session.jobTitle}</p>
                  <p className="text-sm text-gray-500">{session.company}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-violet-600">{session.currentScore}%</p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.status === 'applied'
                        ? 'bg-emerald-100 text-emerald-700'
                        : session.status === 'ready'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {session.status === 'applied' ? 'Applied' : session.status === 'ready' ? 'Ready' : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!activeSession ? (
        /* New Session Form */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <Plus size={18} className="text-emerald-600" />
            Start New Match Session
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm"
                placeholder="e.g. Senior Frontend Developer"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm"
                placeholder="e.g. TechCorp"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm resize-none"
              placeholder="Paste the full job description..."
            />
          </div>
          <button
            onClick={startNewSession}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 transition-all font-medium shadow-lg shadow-emerald-200"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating Session...
              </>
            ) : (
              <>
                <Play size={18} />
                Start Match Session
              </>
            )}
          </button>
        </div>
      ) : (
        /* Active Session */
        <div className="space-y-6">
          {/* Score Display */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{activeSession.jobTitle}</h3>
                <p className="text-gray-500">{activeSession.company}</p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    activeSession.status === 'applied'
                      ? 'bg-emerald-100 text-emerald-700'
                      : activeSession.status === 'ready'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {activeSession.status === 'applied' ? '✓ Applied' : activeSession.status === 'ready' ? '✓ Ready to Apply' : '⚡ In Progress'}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 112 112">
                      <circle cx="56" cy="56" r="48" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="none"
                        stroke={activeSession.currentScore >= 70 ? '#10b981' : activeSession.currentScore >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - activeSession.currentScore / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{activeSession.currentScore}%</span>
                      <span className="text-xs text-gray-500">Score</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={improveScore}
                    disabled={improving || activeSession.status === 'applied'}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 font-medium text-sm shadow-lg transition-all"
                  >
                    {improving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Zap size={16} />
                    )}
                    Boost Score
                  </button>
                  {activeSession.status !== 'applied' && (
                    <button
                      onClick={handleApply}
                      className="w-full flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 font-medium text-sm shadow-lg transition-all"
                    >
                      <Send size={16} /> Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Score progress bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Current: {activeSession.currentScore}%</span>
                <span>Target: {activeSession.targetScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (activeSession.currentScore / activeSession.targetScore) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-violet-600" />
                Applied Improvements ({activeSession.appliedSuggestions.length})
              </h4>
              {showSuggestions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showSuggestions && (
              <div className="mt-4 space-y-2">
                {activeSession.appliedSuggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resume & Cover Letter */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('resume')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'resume'
                    ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tailored Resume
              </button>
              <button
                onClick={() => setActiveTab('cover')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'cover'
                    ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Cover Letter
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() =>
                    copyToClipboard(
                      activeTab === 'resume' ? activeSession.tailoredResume : activeSession.tailoredCoverLetter
                    )
                  }
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all"
                >
                  {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() =>
                    downloadAsText(
                      activeTab === 'resume' ? activeSession.tailoredResume : activeSession.tailoredCoverLetter,
                      activeTab === 'resume' ? 'tailored_resume.txt' : 'cover_letter.txt'
                    )
                  }
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all"
                >
                  <Download size={14} /> Download
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {activeTab === 'resume' ? activeSession.tailoredResume : activeSession.tailoredCoverLetter}
                </pre>
              </div>
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={() => setActiveSessionId(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm transition-all"
          >
            <RotateCcw size={16} /> Back to Sessions
          </button>
        </div>
      )}
    </div>
  );
}
