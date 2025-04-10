import React from 'react';
import { X, Clock } from 'lucide-react';

interface FollowUpModalProps {
  onClose: () => void;
  onSelect: (frequency: string) => void;
  contactName: string;
}

const frequencies = [
  { id: 'weekly', label: 'Weekly', description: 'Follow up every week' },
  { id: 'biweekly', label: 'Bi-weekly', description: 'Follow up every two weeks' },
  { id: 'monthly', label: 'Monthly', description: 'Follow up once a month' },
  { id: 'quarterly', label: 'Quarterly', description: 'Follow up every three months' },
  { id: 'semiannual', label: 'Semi-annual', description: 'Follow up every six months' },
  { id: 'annual', label: 'Annual', description: 'Follow up once a year' }
];

export default function FollowUpModal({ onClose, onSelect, contactName }: FollowUpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Set Follow-up Frequency</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          How often would you like to follow up with {contactName}?
        </p>

        <div className="space-y-2">
          {frequencies.map((frequency) => (
            <button
              key={frequency.id}
              onClick={() => onSelect(frequency.id)}
              className="w-full flex items-center justify-between p-3 text-left text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <span>{frequency.label}</span>
              </div>
              <span className="text-gray-500 text-xs">
                {frequency.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}