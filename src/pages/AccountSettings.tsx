import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Mail, Key, Shield, Database, Loader2 } from 'lucide-react';

function AccountSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [gmailConnected, setGmailConnected] = useState(false);

  useEffect(() => {
    getUser();
    checkGmailConnection();
  }, []);

  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkGmailConnection() {
    try {
      const { data } = await supabase
        .from('user_integrations')
        .select('google_access_token')
        .single();
      
      setGmailConnected(Boolean(data?.google_access_token));
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
    }
  }

  async function handleGmailConnect() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: 'https://www.googleapis.com/auth/gmail.send'
          }
        }
      });

      if (error) throw error;
      
      // If we have a provider session URL, redirect to it
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      setError('Failed to connect Gmail');
    }
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setMessage('Email update initiated. Please check your email for confirmation.');
    } catch (error) {
      setError('Error updating email');
      console.error('Error:', error);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Error updating password');
      console.error('Error:', error);
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
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Please sign in to access account settings
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

      {message && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Email Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Email Settings</h2>
          </div>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Update Email
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Key className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Password Settings</h2>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Database className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png"
                  alt="Gmail"
                  className="h-8 w-8"
                />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Gmail</h3>
                  <p className="text-sm text-gray-500">Send emails directly from the platform</p>
                </div>
              </div>
              <button
                onClick={handleGmailConnect}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  gmailConnected
                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                    : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                }`}
              >
                {gmailConnected ? 'Connected' : 'Connect'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <img
                  src="https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg"
                  alt="LinkedIn"
                  className="h-8 w-8"
                />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">LinkedIn</h3>
                  <p className="text-sm text-gray-500">Import your LinkedIn connections</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                Connect
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png"
                  alt="Google Calendar"
                  className="h-8 w-8"
                />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Google Calendar</h3>
                  <p className="text-sm text-gray-500">Sync your calendar events</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;