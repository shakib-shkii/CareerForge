import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { initDatabase } from './services/database';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Jobs from './components/Jobs';
import TailorResume from './components/TailorResume';
import ATSChecker from './components/ATSChecker';
import MatchSession from './components/MatchSession';
import Connectors from './components/Connectors';
import Applications from './components/Applications';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { 
    currentPage, 
    isAuthenticated, 
    setUser, 
    loadProfile, 
    loadSessions, 
    loadAppliedJobs 
  } = useStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initDatabase();
      // Load user data if authenticated
      if (isAuthenticated) {
        await Promise.all([loadProfile(), loadSessions(), loadAppliedJobs()]);
      }
      setInitializing(false);
    };
    init();
  }, []);

  const handleLogin = async (user: { id: string; name: string; email: string }) => {
    setUser(user);
    await Promise.all([
      useStore.getState().loadProfile(),
      useStore.getState().loadSessions(),
      useStore.getState().loadAppliedJobs(),
    ]);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 size={48} className="animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading CareerForge AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <Profile />;
      case 'jobs':
        return <Jobs />;
      case 'tailor':
        return <TailorResume />;
      case 'ats':
        return <ATSChecker />;
      case 'match-session':
        return <MatchSession />;
      case 'connectors':
        return <Connectors />;
      case 'applications':
        return <Applications />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}
