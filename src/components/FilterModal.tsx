import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface FilterModalProps {
  columns: { key: string; name: string }[];
  onClose: () => void;
  onApply: (filters: FilterCondition[]) => void;
  onClear: () => void;
}

export default function FilterModal({ columns, onClose, onApply, onClear }: FilterModalProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { field: columns[0].key, operator: 'contains', value: '' }
  ]);

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' }
  ];

  const addCondition = () => {
    setConditions([...conditions, { field: columns[0].key, operator: 'contains', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof FilterCondition, value: string) => {
    setConditions(conditions.map((condition, i) => 
      i === index ? { ...condition, [field]: value } : condition
    ));
  };

  const handleApply = () => {
    onApply(conditions);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Filter Contacts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {conditions.map((condition, index) => (
            <div key={index} className="flex items-center space-x-4">
              <select
                value={condition.field}
                onChange={(e) => updateCondition(index, 'field', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {columns.map(column => (
                  <option key={column.key} value={column.key}>
                    {column.name}
                  </option>
                ))}
              </select>

              <select
                value={condition.operator}
                onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              {!['isEmpty', 'isNotEmpty'].includes(condition.operator) && (
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  placeholder="Enter value"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              <button
                onClick={() => removeCondition(index)}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={addCondition}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </button>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
          >
            Clear Filters
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}