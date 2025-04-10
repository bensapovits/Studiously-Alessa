import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  FileText,
  Home,
  Users,
  UserCircle,
  Plus,
  ArrowRight,
  CheckCircle,
  Settings,
  LogOut,
  Loader2,
  Bell
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Contacts from './pages/Contacts';
import ContactProfile from './pages/ContactProfile';
import AccountSettings from './pages/AccountSettings';
import Auth from './pages/Auth';
import Stages from './pages/Stages';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// Protected Route wrapper component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      setShowUserMenu(false);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 text-gray-900 flex flex-col border-r border-gray-200">
        {/* Profile Section */}
        <div className="p-4 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center space-x-3 group relative"
          >
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-medium text-blue-600">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-gray-500 truncate">Free Plan</p>
            </div>
            <Bell className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute left-0 right-0 mt-2 mx-4 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
              <button
                onClick={() => {
                  navigate('/account');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem 
            icon={<Home className="h-5 w-5" />} 
            text="Dashboard" 
            onClick={() => navigate('/')} 
          />
          <NavItem 
            icon={<FileText className="h-5 w-5" />} 
            text="Tasks" 
            onClick={() => navigate('/tasks')} 
          />
          <NavItem 
            icon={<CalendarIcon className="h-5 w-5" />} 
            text="Calendar" 
            onClick={() => navigate('/calendar')} 
          />
          <NavItem 
            icon={<Users className="h-5 w-5" />} 
            text="Contacts" 
            onClick={() => navigate('/contacts')} 
          />
          <NavItem 
            icon={<Clock className="h-5 w-5" />} 
            text="Stages" 
            onClick={() => navigate('/stages')} 
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <Contacts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts/:id"
              element={
                <ProtectedRoute>
                  <ContactProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stages"
              element={
                <ProtectedRoute>
                  <Stages />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-200"
    >
      {icon}
      <span className="ml-3">{text}</span>
    </button>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;