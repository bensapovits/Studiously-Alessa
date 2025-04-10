import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  FileText,
  Calendar,
  Users,
  Plus,
  ArrowRight,
  CheckCircle,
  X,
  Loader2,
  MapPin,
  Shield,
  MessageSquare,
  ArrowUpRight,
  Bell
} from 'lucide-react';
import { Task, getTasks, createTask, toggleTaskComplete } from '../lib/tasks';
import { Event, getEvents } from '../lib/events';
import { supabase } from '../lib/supabase';
import { format, startOfDay, endOfDay, isAfter, isBefore, addDays } from 'date-fns';

function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

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

      const [tasksData, eventsData, contactsData, followUpsData] = await Promise.all([
        getTasks(),
        getEvents(startOfDay(new Date()), endOfDay(new Date())),
        supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('follow_ups')
          .select(`
            *,
            contacts (
              id,
              name,
              email,
              company
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .lte('next_due_date', addDays(new Date(), 7).toISOString())
          .order('next_due_date', { ascending: true })
      ]);

      setTasks(tasksData);
      setEvents(eventsData);
      setContacts(contactsData.data || []);
      setFollowUps(followUpsData.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const handleNewTask = () => {
    setShowNewTaskModal(true);
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      await toggleTaskComplete(taskId, completed);
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed } : task
      ));
    } catch (error: any) {
      console.error('Error updating task:', error);
      setError(error.message || 'Failed to update task');
    }
  };

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
                Please sign in to view your dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tasksForToday = tasks.filter(task => 
    task.due_date && 
    new Date(task.due_date).toDateString() === new Date().toDateString() &&
    !task.completed
  ).length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
          {error}
        </div>
      )}

      {/* Top Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => navigate('/tasks')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:border-blue-500 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-50 p-1.5 rounded-md text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-0.5">{tasksForToday}</p>
          <p className="text-xs font-medium text-gray-500">Tasks Due Today</p>
        </button>

        <button
          onClick={() => navigate('/contacts')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:border-blue-500 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-50 p-1.5 rounded-md text-purple-600">
              <Users className="h-4 w-4" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-0.5">{contacts.length}</p>
          <p className="text-xs font-medium text-gray-500">Contacts</p>
        </button>

        <button
          onClick={() => navigate('/calendar')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:border-blue-500 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-50 p-1.5 rounded-md text-green-600">
              <Calendar className="h-4 w-4" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-0.5">{events.length}</p>
          <p className="text-xs font-medium text-gray-500">Events Today</p>
        </button>

        <button
          onClick={() => navigate('/stages')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:border-blue-500 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-yellow-50 p-1.5 rounded-md text-yellow-600">
              <MessageSquare className="h-4 w-4" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-0.5">{followUps.length}</p>
          <p className="text-xs font-medium text-gray-500">Due Follow-ups</p>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-6">
        {/* Tasks and Events Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Tasks Widget */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
                <button
                  onClick={handleNewTask}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Task</span>
                </button>
              </div>
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">No tasks yet. Create one to get started!</p>
                ) : (
                  tasks.slice(0, 5).map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onComplete={(completed) => handleToggleComplete(task.id, completed)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Events Widget */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Today's Events</h2>
                <button 
                  onClick={() => navigate('/calendar')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">No events scheduled for today</p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{event.title}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(event.start_time), 'h:mm a')}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Due Follow-ups Widget */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Due Follow-ups</h2>
              <button 
                onClick={() => navigate('/stages')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {followUps.length === 0 ? (
                <p className="col-span-3 text-center text-sm text-gray-500 py-4">No follow-ups due soon</p>
              ) : (
                followUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className="p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={() => navigate(`/contacts/${followUp.contacts.id}`)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
                      >
                        {followUp.contacts.name}
                      </button>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isBefore(new Date(followUp.next_due_date), new Date())
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isBefore(new Date(followUp.next_due_date), new Date())
                          ? 'Overdue'
                          : format(new Date(followUp.next_due_date), 'MMM d')}
                      </span>
                    </div>
                    {followUp.contacts.company && (
                      <p className="text-xs text-gray-500 mb-2">{followUp.contacts.company}</p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Bell className="h-3 w-3 mr-1" />
                      <span className="capitalize">{followUp.frequency} follow-up</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function TaskItem({ task, onComplete }) {
  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => onComplete(e.target.checked)}
          className="rounded border-gray-300"
        />
        <div>
          <h3 className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          {task.due_date && (
            <p className="text-xs text-gray-500">
              {new Date(task.due_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
        {task.priority}
      </span>
    </div>
  );
}

export default Dashboard;