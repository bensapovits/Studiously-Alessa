import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, isToday } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Event, getEvents, createEvent } from '../lib/events';
import { supabase } from '../lib/supabase';
import NewEventForm from '../components/NewEventForm';

// Generate hours from 1 AM to 12 AM (midnight)
const HOURS = Array.from({ length: 24 }, (_, i) => (i + 1) % 24);

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewEventModal, setShowNewEventModal] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startDate = startOfWeek(currentDate);
      const endDate = addWeeks(startDate, 1);
      const eventsData = await getEvents(startDate, endDate);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: Omit<Event, 'id' | 'created_at'>) => {
    try {
      const newEvent = await createEvent(eventData);
      setEvents([...events, newEvent]);
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event');
    }
  };

  const weekDays = Array.from({ length: 5 }, (_, i) => 
    addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i)
  );

  const getEventsForDayAndHour = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, date) && eventDate.getHours() === hour;
    });
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-none border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Today
              </button>
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                  className="p-1 rounded hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                  className="p-1 rounded hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {format(weekDays[0], 'MMMM yyyy')}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -mt-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Filter className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowNewEventModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </button>
          </div>
        </div>
      </div>

      {/* Days Header */}
      <div className="flex-none bg-white">
        <div className="flex pt-2">
          <div className="w-16 flex-none" /> {/* Time gutter spacer */}
          {weekDays.map((date) => (
            <div
              key={date.toString()}
              className={`flex-1 p-2 text-center ${
                isToday(date) ? 'bg-blue-50' : ''
              }`}
            >
              <div className="text-xs font-medium text-gray-500 uppercase">
                {format(date, 'EEE')}
              </div>
              <div className={`text-sm font-semibold mt-1 ${
                isToday(date) ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {format(date, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex min-h-full pt-3 border-t border-gray-200">
          {/* Time Column */}
          <div className="w-16 flex-none border-r border-gray-200 bg-white">
            {HOURS.map((hour) => (
              <div key={hour} className="h-20">
                <div className="relative h-full">
                  <div className="absolute -top-2.5 right-4 text-xs font-medium text-gray-500">
                    {formatHour(hour)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Events Grid */}
          <div className="flex-1 grid grid-cols-5">
            {weekDays.map((date) => (
              <div key={date.toString()} className="border-r border-gray-200">
                {HOURS.map((hour) => {
                  const eventsForSlot = getEventsForDayAndHour(date, hour);
                  return (
                    <div
                      key={`${date}-${hour}`}
                      className="h-20 border-b border-gray-200 relative"
                    >
                      {eventsForSlot.map((event) => (
                        <div
                          key={event.id}
                          className="absolute inset-x-1 top-1 bottom-1 bg-blue-100 rounded-lg p-2 overflow-hidden"
                        >
                          <div className="flex flex-col h-full">
                            <div className="text-xs font-medium text-blue-700 truncate">
                              {event.title}
                            </div>
                            {event.location && (
                              <div className="flex items-center text-xs text-blue-600 mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {showNewEventModal && (
        <NewEventForm
          onClose={() => setShowNewEventModal(false)}
          onSubmit={handleCreateEvent}
        />
      )}
    </div>
  );
}

export default Calendar;