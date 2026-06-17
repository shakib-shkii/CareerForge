import { useStore } from '../store/useStore';
import {
  User,
  Briefcase,
  FileText,
  ScanSearch,
  Target,
  Plug,
  Send,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

export default function Dashboard() {
  const { profile, cvUploaded, aiApiKey, matchSessions, appliedJobs, setCurrentPage } = useStore();

  const stats = [
    {
      label: 'Profile Complete',
      value: cvUploaded ? 'Yes' : 'Incomplete',
      icon: <User size={24} />,
      color: cvUploaded ? 'from-emerald-500 to-green-600' : 'from-amber-500 to-orange-600',
      bgColor: cvUploaded ? 'bg-emerald-50' : 'bg-amber-50',
    },
    {
      label: 'Active Sessions',
      value: matchSessions.filter((s) => s.status === 'in_progress').length,
      icon: <Target size={24} />,
      color: 'from-violet-500 to-indigo-600',
      bgColor: 'bg-violet-50',
    },
    {
      label: 'Applications Sent',
      value: appliedJobs.length,
      icon: <Send size={24} />,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'AI Connector',
      value: aiApiKey ? 'Active' : 'Setup Required',
      icon: <Plug size={24} />,
      color: aiApiKey ? 'from-emerald-500 to-green-600' : 'from-red-500 to-rose-600',
      bgColor: aiApiKey ? 'bg-emerald-50' : 'bg-red-50',
    },
  ];

  const quickActions = [
    {
      title: 'Upload & Parse CV',
      description: 'Upload your resume to auto-fill your profile with AI extraction',
      icon: <FileCheck size={28} />,
      page: 'profile' as const,
      gradient: 'from-violet-500 to-indigo-600',
    },
    {
      title: 'Browse Jobs',
      description: 'Find matching jobs and start tailoring your resume',
      icon: <Briefcase size={28} />,
      page: 'jobs' as const,
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Tailor Resume & Cover Letter',
      description: 'Use AI to customize your resume for any job description',
      icon: <FileText size={28} />,
      page: 'tailor' as const,
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      title: 'ATS Compatibility Check',
      description: 'Check how well your resume passes ATS systems',
      icon: <ScanSearch size={28} />,
      page: 'ats' as const,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Match Score Booster',
      description: 'Iteratively improve your match score with AI guidance',
      icon: <Target size={28} />,
      page: 'match-session' as const,
      gradient: 'from-rose-500 to-pink-600',
    },
    {
      title: 'Setup Connectors',
      description: 'Configure Google AI for tailoring and ATS checking',
      icon: <Plug size={28} />,
      page: 'connectors' as const,
      gradient: 'from-slate-600 to-slate-800',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHpNNDAgMzBoNHYxaC00ek0yOCAzOGg0djFoLTR6TTMyIDM0aDR2MWgtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles size={28} />
            <h1 className="text-2xl lg:text-3xl font-bold">
              Welcome{profile.name ? `, ${profile.name.split(' ')[0]}` : ' to CareerForge AI'}!
            </h1>
          </div>
          <p className="text-white/80 max-w-2xl text-lg">
            Your AI-powered career companion. Upload your CV, browse jobs, tailor your resume, check ATS compatibility, and boost your match scores — all powered by Google AI.
          </p>
        </div>
      </div>

      {/* Setup checklist */}
      {(!aiApiKey || !cvUploaded) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-violet-600" />
            Getting Started
          </h3>
          <div className="space-y-3">
            <div
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                aiApiKey
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-amber-50 border border-amber-200 hover:bg-amber-100'
              }`}
              onClick={() => !aiApiKey && setCurrentPage('connectors')}
            >
              {aiApiKey ? (
                <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
              ) : (
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {aiApiKey ? 'Google AI Connected' : 'Connect Google AI'}
                </p>
                <p className="text-sm text-gray-500">
                  {aiApiKey
                    ? 'Your AI engine is ready for tailoring and ATS checks'
                    : 'Add your API key to enable AI features'}
                </p>
              </div>
              {!aiApiKey && <ArrowRight size={16} className="text-amber-600" />}
            </div>
            <div
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                cvUploaded
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-amber-50 border border-amber-200 hover:bg-amber-100'
              }`}
              onClick={() => !cvUploaded && setCurrentPage('profile')}
            >
              {cvUploaded ? (
                <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
              ) : (
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {cvUploaded ? 'CV Uploaded & Parsed' : 'Upload Your CV'}
                </p>
                <p className="text-sm text-gray-500">
                  {cvUploaded
                    ? 'Your profile has been auto-filled from your CV'
                    : 'Upload to auto-extract your profile details'}
                </p>
              </div>
              {!cvUploaded && <ArrowRight size={16} className="text-amber-600" />}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => setCurrentPage(action.page)}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-violet-300 transition-all duration-200 text-left group"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{action.title}</h4>
              <p className="text-sm text-gray-500">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      {matchSessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Match Sessions</h3>
          <div className="space-y-3">
            {matchSessions.slice(-3).reverse().map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 cursor-pointer transition-all"
                onClick={() => {
                  useStore.getState().setActiveSessionId(session.id);
                  setCurrentPage('match-session');
                }}
              >
                <div>
                  <p className="font-medium text-gray-900">{session.jobTitle}</p>
                  <p className="text-sm text-gray-500">{session.company}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-violet-600">{session.currentScore}%</p>
                    <p className="text-xs text-gray-500">Match Score</p>
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
                    {session.status === 'applied'
                      ? 'Applied'
                      : session.status === 'ready'
                      ? 'Ready'
                      : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
