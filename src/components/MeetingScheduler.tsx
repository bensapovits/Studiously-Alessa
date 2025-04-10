import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, X, Send, Loader2 } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, addMinutes, setHours, setMinutes } from 'date-fns';
import { createEvent } from '../lib/events';
import { createEmail } from '../lib/emails';

interface MeetingSchedulerProps {
  contact: {
    id: string;
    name: string;
    email: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function MeetingScheduler({ contact, onClose, onSuccess }: MeetingSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return slots;
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (!selectedDate) {
        throw new Error('Please select a date');
      }

      // Parse time and create start/end times
      const [hours, minutes] = time.split(':').map(Number);
      const startTime = setMinutes(setHours(selectedDate, hours), minutes);
      const endTime = addMinutes(startTime, parseInt(duration));

      // Create calendar event
      const event = await createEvent({
        title,
        description,
        type: 'meeting',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location,
        contact_id: contact.id
      });

      // Send email invitation
      if (contact.email) {
        const emailContent = `
Hi ${contact.name},

I'd like to schedule a meeting with you:

Title: ${title}
Date: ${format(startTime, 'PPPP')}
Time: ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}
${location ? `Location: ${location}` : ''}

${description ? `\nDetails:\n${description}` : ''}

Please let me know if this time works for you.

Best regards`;

        await createEmail({
          subject: `Meeting: ${title}`,
          content: emailContent,
          sent_at: new Date().toISOString(),
          direction: 'outgoing',
          contact_id: contact.id
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      setError(error instanceof Error ? error.message : 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Schedule Meeting</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter meeting title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span>
                    {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                  </span>
                </div>
              </button>
              {showDatePicker && (
                <div className="absolute mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setShowDatePicker(false);
                    }}
                    disabled={{ before: new Date() }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {generateTimeSlots().map(slot => (
                    <option key={slot} value={slot}>
                      {format(setMinutes(setHours(new Date(), parseInt(slot.split(':')[0])), parseInt(slot.split(':')[1])), 'h:mm a')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add location (optional)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add meeting description (optional)"
            />
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
              disabled={loading || !selectedDate || !title}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Schedule & Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}