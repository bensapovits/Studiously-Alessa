import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface AddFieldModalProps {
  onClose: () => void;
  onAdd: (field: { name: string; type: string }) => Promise<void>;
}

export default function AddFieldModal({ onClose, onAdd }: AddFieldModalProps) {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'url', label: 'URL' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (!fieldName.trim()) {
        throw new Error('Field name is required');
      }

      // Convert field name to snake_case
      const formattedName = fieldName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_');

      await onAdd({ name: formattedName, type: fieldType });
      onClose();
    } catch (error) {
      console.error('Error adding field:', error);
      // Improve error message for duplicate fields
      if (error instanceof Error && error.message.includes('already exists')) {
        setError(`Field "${fieldName}" already exists. Please use a different name.`);
      } else {
        setError(error instanceof Error ? error.message : 'Failed to add field');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Add Custom Field</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter field name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fieldTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Field Type Details</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Text: For general text content</li>
              <li>• Number: For numeric values only</li>
              <li>• Date: For date values</li>
              <li>• Email: With email validation</li>
              <li>• Phone: For phone numbers</li>
              <li>• URL: For web addresses</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !fieldName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}