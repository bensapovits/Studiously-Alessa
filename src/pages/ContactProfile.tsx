import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  Linkedin,
  Briefcase,
  GraduationCap,
  Clock,
  Send,
  Plus,
  CheckCircle,
  MessageSquare,
  Calendar,
  ExternalLink,
  Edit3,
  X,
  Loader2,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  MoreVertical,
  MapPin,
  AlertCircle
} from 'lucide-react';
import NotionEditor from '../components/NotionEditor';
import EmailComposer from '../components/EmailComposer';
import MeetingScheduler from '../components/MeetingScheduler';
import TaskForm from '../components/TaskForm';
import { Note, getNotes, createNote, updateNote } from '../lib/notes';
import { Contact, getContact, updateContact, updateContactLastContacted, getContactTasks, getContactEvents } from '../lib/contacts';
import { Task, createTask } from '../lib/tasks';
import { Event, createEvent } from '../lib/events';
import { Email, getContactEmails, createEmail } from '../lib/emails';
import { createFollowUp, completeFollowUp, snoozeFollowUp, updateFollowUpFrequency, getFollowUp } from '../lib/follow-ups';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

function ContactProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [showFrequencyMenu, setShowFrequencyMenu] = useState(false);
  const [followUpFrequency, setFollowUpFrequency] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && id) {
      loadContact();
      loadNotes();
      loadEmails();
      loadFollowUp();
    }
  }, [id, user]);

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

  const loadFollowUp = async () => {
    try {
      if (!id) return;
      const followUp = await getFollowUp(id);
      if (followUp) {
        setFollowUpFrequency(followUp.frequency);
      } else {
        setFollowUpFrequency(null);
      }
    } catch (error) {
      console.error('Error loading follow-up:', error);
    }
  };

  async function loadContact() {
    try {
      if (!id) return;
      
      const [contactData, tasksData, eventsData] = await Promise.all([
        getContact(id),
        getContactTasks(id),
        getContactEvents(id)
      ]);

      setContact(contactData);
      setTasks(tasksData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading contact:', error);
      setError('Failed to load contact');
    } finally {
      setLoading(false);
    }
  }

  async function loadEmails() {
    try {
      if (!id) return;
      const emailsData = await getContactEmails(id);
      setEmails(emailsData);
    } catch (error) {
      console.error('Error loading emails:', error);
    }
  }

  async function loadNotes() {
    try {
      const notesData = await getNotes(id!);
      setNotes(notesData);
      if (notesData.length > 0) {
        setCurrentNote(notesData[0]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }

  async function handleNoteChange(content: string) {
    try {
      if (!user) throw new Error('Not authenticated');
      if (!id) throw new Error('No contact selected');

      if (currentNote) {
        const updatedNote = await updateNote(currentNote.id, content);
        setNotes(notes.map(note => 
          note.id === updatedNote.id ? updatedNote : note
        ));
        setCurrentNote(updatedNote);
      } else {
        const newNote = await createNote({
          content,
          contact_id: id,
          user_id: user.id
        });
        setNotes([newNote, ...notes]);
        setCurrentNote(newNote);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to save note');
    }
  }

  const handleEmailSuccess = async () => {
    if (contact) {
      await updateContactLastContacted(contact.id);
      setContact({
        ...contact,
        last_contacted: new Date().toISOString()
      });
    }
    await loadEmails();
  };

  const handleNewTask = () => {
    setShowTaskForm(true);
  };

  const handleTaskSuccess = async () => {
    await loadContact();
  };

  const handleNewEvent = () => {
    setShowMeetingScheduler(true);
  };

  const handleMeetingSuccess = async () => {
    await loadContact();
  };

  const handleCall = () => {
    if (contact?.phone) {
      window.location.href = `tel:${contact.phone}`;
    }
  };

  const handleToggleNotes = () => {
    setShowNotes(!showNotes);
    if (!showNotes && !currentNote) {
      setCurrentNote(notes[0] || null);
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    // Implementation would go here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Contact not found
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-none bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center min-w-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-blue-600">
                  {contact.first_name.charAt(0)}
                </span>
              </div>
              <div className="ml-4 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {contact.first_name} {contact.last_name}
                </h1>
                {contact.company && (
                  <p className="text-sm text-gray-500 truncate">{contact.company}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEmailComposer(true)}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </button>
              <button
                onClick={handleCall}
                disabled={!contact.phone}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call
              </button>
              <button
                onClick={handleNewTask}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Task
              </button>
              <button
                onClick={handleNewEvent}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Meeting
              </button>
              <button
                onClick={handleToggleNotes}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                  showNotes
                    ? 'text-blue-600 bg-blue-50 border border-blue-200'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-8 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-6">
              {/* Info Card */}
              <div className="col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Info</h2>
                  <div className="space-y-4">
                    {contact.email && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <a href={`tel:${contact.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.linkedin && (
                      <div className="flex items-center">
                        <Linkedin className="h-5 w-5 text-gray-400 mr-3" />
                        <a
                          href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          LinkedIn Profile
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Professional Info</h2>
                  <div className="space-y-4">
                    {contact.company && (
                      <div className="flex items-center">
                        <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900">{contact.company}</span>
                      </div>
                    )}
                    {contact.college && (
                      <div className="flex items-center">
                        <GraduationCap className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900">{contact.college}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Status</h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">
                        Last contacted: {format(new Date(contact.last_contacted), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">Stage: {contact.stage}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="col-span-2 space-y-6">
                {/* Tasks Section */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
                      <button
                        onClick={handleNewTask}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {tasks.length === 0 ? (
                      <p className="p-6 text-sm text-gray-500 text-center">No tasks yet</p>
                    ) : (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-center min-w-0">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleComplete(task.id, !task.completed)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300"
                            />
                            <span className={`ml-3 text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.title}
                            </span>
                          </div>
                          {task.due_date && (
                            <span className="text-xs text-gray-500">
                              Due {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Events Section */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Events</h2>
                      <button
                        onClick={handleNewEvent}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {events.length === 0 ? (
                      <p className="p-6 text-sm text-gray-500 text-center">No events scheduled</p>
                    ) : (
                      events.map((event) => (
                        <div
                          key={event.id}
                          className="p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {event.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}
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

                {/* Emails Section */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Recent Emails</h2>
                      <button
                        onClick={() => setShowEmailComposer(true)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {emails.length === 0 ? (
                      <p className="p-6 text-sm text-gray-500 text-center">No emails yet</p>
                    ) : (
                      emails.map((email) => (
                        <div
                          key={email.id}
                          className="p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            {email.direction === 'incoming' ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {email.subject}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {email.content}
                            </p>
                            <span className="text-xs text-gray-500 ml-4">
                              {format(new Date(email.sent_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Panel */}
      <div
        className={`w-[400px] bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${
          showNotes ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex-none border-b border-gray-200">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-medium text-gray-900">Notes</h2>
              <button
                onClick={handleToggleNotes}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center space-x-1 px-4 pb-4">
              <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
                <button className="p-1.5 rounded hover:bg-gray-100">
                  <Bold className="h-4 w-4" />
                </button>
                <button className="p-1.5 rounded hover:bg-gray-100">
                  <Italic className="h-4 w-4" />
                </button>
                <button className="p-1.5 rounded hover:bg-gray-100">
                  <Underline className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
                <button className="p-1.5 rounded hover:bg-gray-100">
                  <List className="h-4 w-4" />
                </button>
                <button className="p-1.5 rounded hover:bg-gray-100">
                  <ListOrdered className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center space-x-1">
                <button className="p-1.5 rounded hover:bg-gray-100">
                  <Heading1 className="h-4 w-4" />
                </button>
                <button className="p-1.5 rounded hover:bg-gray-100">
                  <Heading2 className="h-4 w-4" />
                </button>
                <button className="p-1.5 rounded hover:bg-gray-100">
                  <Heading3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <NotionEditor
              content={currentNote?.content || ''}
              onChange={handleNoteChange}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEmailComposer && contact && (
        <EmailComposer
          recipients={[{
            id: contact.id,
            name: `${contact.first_name} ${contact.last_name}`,
            email: contact.email || ''
          }]}
          onClose={() => setShowEmailComposer(false)}
          onSuccess={handleEmailSuccess}
        />
      )}

      {showMeetingScheduler && contact && (
        <MeetingScheduler
          contact={{
            id: contact.id,
            name: `${contact.first_name} ${contact.last_name}`,
            email: contact.email || ''
          }}
          onClose={() => setShowMeetingScheduler(false)}
          onSuccess={handleMeetingSuccess}
        />
      )}

      {showTaskForm && contact && (
        <TaskForm
          contact={{
            id: contact.id,
            name: `${contact.first_name} ${contact.last_name}`
          }}
          onClose={() => setShowTaskForm(false)}
          onSuccess={handleTaskSuccess}
        />
      )}
    </div>
  );
}

export default ContactProfile;