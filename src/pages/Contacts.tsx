import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  Download,
  Upload,
  Search,
  X,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import DataTable from '../components/DataTable';
import EmailComposer from '../components/EmailComposer';
import FilterModal from '../components/FilterModal';
import ImportModal from '../components/ImportModal';
import ExportModal from '../components/ExportModal';
import AddFieldModal from '../components/AddFieldModal';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin: string;
  company: string;
  college: string;
  stage: string;
  last_contacted: string;
}

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

const stages = [
  'New',
  'Contacted',
  'Meeting Booked',
  'Call Completed',
  'Follow Up'
] as const;

const stageColors = {
  'New': 'bg-blue-100 text-blue-800',
  'Contacted': 'bg-yellow-100 text-yellow-800',
  'Meeting Booked': 'bg-purple-100 text-purple-800',
  'Call Completed': 'bg-green-100 text-green-800',
  'Follow Up': 'bg-red-100 text-red-800'
};

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);

  const columns = [
    {
      key: 'first_name' as keyof Contact,
      name: 'First Name',
      width: 150,
      editable: true,
      onClick: handleContactClick
    },
    {
      key: 'last_name' as keyof Contact,
      name: 'Last Name',
      width: 150,
      editable: true,
      onClick: handleContactClick
    },
    {
      key: 'email' as keyof Contact,
      name: 'Email',
      width: 200,
      editable: true,
      onClick: handleContactClick,
      renderCell: (value: string, row: Contact) => {
        if (!editMode && value) {
          return (
            <button
              className="text-gray-900 hover:text-blue-600 hover:underline text-left w-full"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedContact(row);
                setShowEmailComposer(true);
              }}
            >
              {value}
            </button>
          );
        }
        return value || '';
      }
    },
    {
      key: 'phone' as keyof Contact,
      name: 'Phone',
      width: 150,
      editable: true,
      onClick: handleContactClick
    },
    {
      key: 'linkedin' as keyof Contact,
      name: 'LinkedIn',
      width: 100,
      editable: true,
      onClick: handleContactClick,
      renderCell: (value: string) => value ? (
        <div className="flex items-center justify-center h-full">
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-6 h-6 bg-[#0A66C2] text-white rounded"
            onClick={e => e.stopPropagation()}
            title={value}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
              className="text-white"
            >
              <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
            </svg>
          </a>
        </div>
      ) : null
    },
    {
      key: 'company' as keyof Contact,
      name: 'Company',
      width: 200,
      editable: true,
      onClick: handleContactClick,
      renderCell: (value: string) => value ? (
        <div className="flex items-center space-x-2">
          <img
            src={getLogoUrl(value, 'company')}
            alt={value}
            className="h-6 w-6 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(value)}&background=0D8ABC&color=fff`;
            }}
          />
          <span>{value}</span>
        </div>
      ) : null
    },
    {
      key: 'college' as keyof Contact,
      name: 'College',
      width: 200,
      editable: true,
      onClick: handleContactClick,
      renderCell: (value: string) => value ? (
        <div className="flex items-center space-x-2">
          <img
            src={getLogoUrl(value, 'college')}
            alt={value}
            className="h-6 w-6 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(value)}&background=4B5563&color=fff`;
            }}
          />
          <span>{value}</span>
        </div>
      ) : null
    },
    {
      key: 'stage' as keyof Contact,
      name: 'Stage',
      width: 150,
      editable: true,
      onClick: handleContactClick,
      renderCell: (value: string, row: Contact, isEditing: boolean, onEdit: (value: string) => void) => {
        if (isEditing) {
          return (
            <select
              value={value}
              onChange={(e) => onEdit(e.target.value)}
              className="w-full h-8 px-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            >
              {stages.map(stage => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          );
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageColors[value as keyof typeof stageColors]}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'last_contacted' as keyof Contact,
      name: 'Last Contacted',
      width: 150,
      editable: true,
      onClick: handleContactClick,
      renderCell: (value: string) => value ? format(new Date(value), 'MMM d, yyyy') : null
    },
    {
      key: 'actions' as keyof Contact,
      name: '',
      width: 50,
      renderCell: (_: any, row: Contact) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteContact(row.id);
          }}
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )
    }
  ];

  useEffect(() => {
    loadContacts();
  }, [activeFilters]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(contact => {
      return (
        contact.first_name?.toLowerCase().includes(query) ||
        contact.last_name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.college?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query)
      );
    });

    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);

  function handleContactClick(contact: Contact) {
    if (!editMode) {
      navigate(`/contacts/${contact.id}`);
    }
  }

  const getLogoUrl = (name: string, type: 'company' | 'college') => {
    if (!name) return null;
    const domain = type === 'company' ? 'com' : 'edu';
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://logo.clearbit.com/${cleanName}.${domain}`;
  };

  async function loadContacts() {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('contacts')
        .select('*');

      activeFilters.forEach(filter => {
        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.field, filter.value);
            break;
          case 'contains':
            query = query.ilike(filter.field, `%${filter.value}%`);
            break;
          case 'startsWith':
            query = query.ilike(filter.field, `${filter.value}%`);
            break;
          case 'endsWith':
            query = query.ilike(filter.field, `%${filter.value}`);
            break;
          case 'isEmpty':
            query = query.is(filter.field, null);
            break;
          case 'isNotEmpty':
            query = query.not(filter.field, 'is', null);
            break;
        }
      });

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddContact() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          linkedin: '',
          company: '',
          college: '',
          stage: 'New',
          last_contacted: new Date().toISOString(),
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setContacts([data, ...contacts]);
      setFilteredContacts([data, ...contacts]);
    } catch (error) {
      console.error('Error adding contact:', error);
      setError('Failed to add contact');
    }
  }

  async function handleDeleteContact(id: string) {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedContacts = contacts.filter(contact => contact.id !== id);
      setContacts(updatedContacts);
      setFilteredContacts(updatedContacts);
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError('Failed to delete contact');
    }
  }

  async function handleEdit(rowIndex: number, field: keyof Contact, value: any) {
    try {
      const contact = contacts[rowIndex];
      
      // Validate stage value if updating stage
      if (field === 'stage' && !stages.includes(value as typeof stages[number])) {
        throw new Error(`Invalid stage value. Must be one of: ${stages.join(', ')}`);
      }

      const { error } = await supabase
        .from('contacts')
        .update({ [field]: value })
        .eq('id', contact.id);

      if (error) {
        if (error.message.includes('contacts_stage_check')) {
          throw new Error(`Invalid stage value. Must be one of: ${stages.join(', ')}`);
        }
        throw error;
      }

      const updatedContacts = contacts.map((c, i) =>
        i === rowIndex ? { ...c, [field]: value } : c
      );
      setContacts(updatedContacts);
      setFilteredContacts(updatedContacts);
    } catch (error) {
      console.error('Error updating contact:', error);
      setError(error.message);
    }
  }

  async function handleSort(key: keyof Contact, direction: 'asc' | 'desc') {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order(key, { ascending: direction === 'asc' });

      if (error) throw error;
      setContacts(data);
      setFilteredContacts(data);
    } catch (error) {
      console.error('Error sorting contacts:', error);
      setError('Failed to sort contacts');
    }
  }

  const handleEmailSuccess = async () => {
    if (selectedContact) {
      const updatedContact = {
        ...selectedContact,
        last_contacted: new Date().toISOString()
      };

      const { error } = await supabase
        .from('contacts')
        .update({ last_contacted: updatedContact.last_contacted })
        .eq('id', selectedContact.id);

      if (!error) {
        const updatedContacts = contacts.map(c => 
          c.id === selectedContact.id ? updatedContact : c
        );
        setContacts(updatedContacts);
        setFilteredContacts(updatedContacts);
      }
    }

    setShowEmailComposer(false);
    setSelectedContact(null);
  };

  const handleApplyFilters = (filters: FilterCondition[]) => {
    setActiveFilters(filters);
  };

  const handleImport = async (data: any[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: importedData, error } = await supabase
        .from('contacts')
        .insert(data.map(row => ({ ...row, user_id: user.id })))
        .select();

      if (error) throw error;

      const updatedContacts = [...importedData, ...contacts];
      setContacts(updatedContacts);
      setFilteredContacts(updatedContacts);
    } catch (error) {
      console.error('Error importing contacts:', error);
      throw new Error('Failed to import contacts');
    }
  };

  const handleAddField = async (field: { name: string; type: string }) => {
    try {
      const { error } = await supabase.rpc('add_custom_field', {
        field_name: field.name,
        field_type: field.type
      });

      if (error) throw error;

      await loadContacts();
    } catch (error) {
      console.error('Error adding custom field:', error);
      throw error;
    }
  };

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
      <div className="flex-none bg-white border-b border-gray-200">
        <div className="airtable-toolbar">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 mr-4">
              <label className="text-sm text-gray-700">Edit</label>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  editMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={() => setShowFilterModal(true)}
              className="airtable-toolbar-button"
            >
              <Filter className="h-4 w-4 mr-2 inline-block" />
              Filter
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="airtable-toolbar-button"
            >
              <Upload className="h-4 w-4 mr-2 inline-block" />
              Import
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="airtable-toolbar-button"
            >
              <Download className="h-4 w-4 mr-2 inline-block" />
              Export
            </button>

            <button
              onClick={() => setShowAddFieldModal(true)}
              className="airtable-toolbar-button"
            >
              <Plus className="h-4 w-4 mr-2 inline-block" />
              Add Field
            </button>

            <button
              onClick={handleAddContact}
              className="airtable-toolbar-button airtable-toolbar-button-primary"
            >
              <Plus className="h-4 w-4 mr-2 inline-block" />
              Add Contact
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-700">Active Filters:</span>
              {activeFilters.map((filter, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {columns.find(col => col.key === filter.field)?.name} {filter.operator} {filter.value}
                  <button
                    onClick={() => setActiveFilters(filters => filters.filter((_, i) => i !== index))}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => setActiveFilters([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DataTable */}
      <div className="flex-1 overflow-hidden">
        <DataTable<Contact>
          data={filteredContacts}
          columns={columns}
          onSort={handleSort}
          onEdit={handleEdit}
          editMode={editMode}
        />
      </div>

      {showEmailComposer && selectedContact && (
        <EmailComposer
          recipients={[{
            id: selectedContact.id,
            name: `${selectedContact.first_name} ${selectedContact.last_name}`,
            email: selectedContact.email
          }]}
          onClose={() => {
            setShowEmailComposer(false);
            setSelectedContact(null);
          }}
          onSuccess={handleEmailSuccess}
        />
      )}

      {showFilterModal && (
        <FilterModal
          columns={columns}
          onClose={() => setShowFilterModal(false)}
          onApply={handleApplyFilters}
          onClear={() => setActiveFilters([])}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          columns={columns}
        />
      )}

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          data={filteredContacts}
          columns={columns}
          filters={activeFilters.length > 0 ? activeFilters : undefined}
        />
      )}

      {showAddFieldModal && (
        <AddFieldModal
          onClose={() => setShowAddFieldModal(false)}
          onAdd={handleAddField}
        />
      )}
    </div>
  );
}