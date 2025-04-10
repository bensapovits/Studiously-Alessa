import React, { useState } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { X, CalendarIcon, MapPin, ChevronDown, Clock } from 'lucide-react';
import { Event } from '../lib/events';

interface NewEventFormProps {
  onClose: () => void;
  onSubmit: (event: Omit<Event, 'id' | 'created_at'>) => Promise<void>;
  initialDate?: Date;
  initialTime?: string;
}

export default function NewEventForm({ onClose, onSubmit, initialDate, initialTime }: NewEventFormProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(initialDate || null);
  const [endDate, setEndDate] = useState<Date | null>(initialDate || null);
  const [startTime, setStartTime] = useState(initialTime || '09:30');
  const [endTime, setEndTime] = useState(initialTime || '10:30');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;

    try {
      setLoading(true);

      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);

      const startDateTime = new Date(startDate);
      startDateTime.setHours(startHours, startMinutes, 0);

      const endDateTime = new Date(endDate || startDate);
      endDateTime.setHours(endHours, endMinutes, 0);

      await onSubmit({
        title,
        type: 'event',
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location
      });

      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1C1C1E] rounded-lg shadow-xl w-full max-w-lg mx-4 text-white">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full bg-transparent text-2xl font-semibold placeholder-gray-500 focus:outline-none"
            required
          />

          {/* Start Time */}
          <div className="flex items-center space-x-4">
            <Clock className="h-5 w-5 text-gray-400" />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#2C2C2E] rounded-lg"
                >
                  <span>{startDate ? format(startDate, 'M/d/yyyy') : 'Start date'}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {showStartDatePicker && (
                  <div className="absolute mt-1 bg-[#2C2C2E] rounded-lg shadow-xl z-10 border border-gray-700">
                    <DayPicker
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setShowStartDatePicker(false);
                        if (!endDate) setEndDate(date);
                      }}
                      className="text-white"
                    />
                  </div>
                )}
              </div>
              {!isAllDay && (
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-[#2C2C2E] rounded-lg px-3 py-2 appearance-none"
                >
                  {generateTimeOptions().map(time => (
                    <option key={time} value={time}>
                      {formatTimeDisplay(time)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* End Time */}
          <div className="flex items-center space-x-4">
            <Clock className="h-5 w-5 text-gray-400" />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#2C2C2E] rounded-lg"
                >
                  <span>{endDate ? format(endDate, 'M/d/yyyy') : 'End date'}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {showEndDatePicker && (
                  <div className="absolute mt-1 bg-[#2C2C2E] rounded-lg shadow-xl z-10 border border-gray-700">
                    <DayPicker
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        setShowEndDatePicker(false);
                      }}
                      disabled={{ before: startDate || undefined }}
                      className="text-white"
                    />
                  </div>
                )}
              </div>
              {!isAllDay && (
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-[#2C2C2E] rounded-lg px-3 py-2 appearance-none"
                >
                  {generateTimeOptions().map(time => (
                    <option key={time} value={time}>
                      {formatTimeDisplay(time)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span>All day</span>
              </label>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-4">
            <MapPin className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="flex-1 bg-[#2C2C2E] px-3 py-2 rounded-lg placeholder-gray-500 focus:outline-none"
            />
          </div>

          {/* Calendar Selection */}
          <div className="flex items-center space-x-4">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select className="flex-1 bg-[#2C2C2E] px-3 py-2 rounded-lg appearance-none">
              <option>Events</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title || !startDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}