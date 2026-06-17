import { useStore } from '../store/useStore';
import {
  Send,
  CheckCircle2,
  Clock,
  FileText,
  Target,
  Download,
  Inbox,
  ArrowRight,
} from 'lucide-react';

export default function Applications() {
  const { matchSessions, setActiveSessionId, setCurrentPage } = useStore();

  const appliedSessions = matchSessions.filter((s) => s.status === 'applied');
  const inProgressSessions = matchSessions.filter((s) => s.status !== 'applied');

  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (matchSessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Inbox size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Applications Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start by browsing jobs, tailoring your resume, and boosting your match score before applying.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setCurrentPage('jobs')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 font-medium shadow-lg"
            >
              Browse Jobs <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Send size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{appliedSessions.length}</p>
              <p className="text-sm text-gray-500">Applied</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{inProgressSessions.length}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Target size={24} className="text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {matchSessions.length > 0
                  ? Math.round(matchSessions.reduce((a, b) => a + b.currentScore, 0) / matchSessions.length)
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-500">Avg Match Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Applications */}
      {appliedSessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600" />
              Sent Applications ({appliedSessions.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {appliedSessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{session.jobTitle}</h4>
                    <p className="text-sm text-violet-600 font-medium">{session.company}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-emerald-600">{session.currentScore}%</p>
                      <p className="text-xs text-gray-500">Match</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      Applied ✓
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadAsText(session.tailoredResume, `resume_${session.company.replace(/\s+/g, '_')}.txt`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-all"
                  >
                    <Download size={12} /> Resume
                  </button>
                  <button
                    onClick={() => downloadAsText(session.tailoredCoverLetter, `cover_letter_${session.company.replace(/\s+/g, '_')}.txt`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-all"
                  >
                    <Download size={12} /> Cover Letter
                  </button>
                  <button
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setCurrentPage('match-session');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 rounded-lg text-xs font-medium text-violet-700 transition-all"
                  >
                    <FileText size={12} /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress */}
      {inProgressSessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-amber-600" />
              In Progress ({inProgressSessions.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {inProgressSessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{session.jobTitle}</h4>
                    <p className="text-sm text-violet-600 font-medium">{session.company}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-amber-600">{session.currentScore}%</p>
                      <p className="text-xs text-gray-500">Match</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setCurrentPage('match-session');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 text-xs font-medium shadow-lg transition-all"
                    >
                      <Target size={14} /> Continue
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
