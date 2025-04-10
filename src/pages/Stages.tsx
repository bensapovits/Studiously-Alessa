import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Settings,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import StagesKanban from '../components/StagesKanban';
import FollowUpModal from '../components/FollowUpModal';

interface FollowUpPrompt {
  contactId: string;
  contactName: string;
}

function Stages() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'connect' | 'grow'>('connect');
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [followUpPrompt, setFollowUpPrompt] = useState<FollowUpPrompt | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setError('Authentication error');
    }
  };

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const handleStageChange = async (contactId: string, newStage: string) => {
    try {
      // First update the contact's stage to Call Completed
      if (newStage === 'Call Completed') {
        await updateContactStage(contactId, newStage);
        
        // Then show the follow-up prompt
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
          setFollowUpPrompt({
            contactId,
            contactName: `${contact.first_name} ${contact.last_name}`
          });
        }
      } else {
        // For other stages, update immediately
        await updateContactStage(contactId, newStage);
      }
    } catch (error) {
      console.error('Error updating contact stage:', error);
      setError('Failed to update contact stage');
      loadData(); // Reload on error
    }
  };

  const updateContactStage = async (contactId: string, newStage: string) => {
    const { error } = await supabase
      .from('contacts')
      .update({ stage: newStage })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Update local state
    setContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.id === contactId 
          ? { ...contact, stage: newStage }
          : contact
      )
    );
  };

  const handleFollowUpSelect = async (frequency: string) => {
    if (!followUpPrompt) return;

    try {
      // Create the follow-up record
      const { error: followUpError } = await supabase
        .from('follow_ups')
        .insert([{
          contact_id: followUpPrompt.contactId,
          user_id: user.id,
          frequency,
          next_due_date: new Date().toISOString(),
          status: 'pending'
        }]);

      if (followUpError) throw followUpError;

      // Update the contact's stage to the frequency
      await updateContactStage(followUpPrompt.contactId, frequency);

      // Switch to grow tab
      setActiveTab('grow');
    } catch (error) {
      console.error('Error setting follow-up:', error);
      setError('Failed to set follow-up frequency');
    } finally {
      setFollowUpPrompt(null);
      await loadData(); // Reload data to ensure everything is in sync
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.first_name?.toLowerCase().includes(query) ||
      contact.last_name?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center flex-1">
              <div className="w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -mt-2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                <button
                  onClick={() => setActiveTab('connect')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md ${
                    activeTab === 'connect'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Connect
                </button>
                <button
                  onClick={() => setActiveTab('grow')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md ${
                    activeTab === 'grow'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Grow
                </button>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4">
          <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <StagesKanban
          contacts={filteredContacts}
          activeTab={activeTab}
          onStageChange={handleStageChange}
          onContactClick={(contactId) => navigate(`/contacts/${contactId}`)}
        />
      </div>

      {/* Follow-up Frequency Modal */}
      {followUpPrompt && (
        <FollowUpModal
          contactName={followUpPrompt.contactName}
          onClose={() => setFollowUpPrompt(null)}
          onSelect={handleFollowUpSelect}
        />
      )}
    </div>
  );
}

export default Stages;