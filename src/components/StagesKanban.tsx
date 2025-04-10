import React, { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent,
  MouseSensor, 
  TouchSensor,
  KeyboardSensor,
  useSensor, 
  useSensors,
  DragOverlay,
  useDroppable,
  closestCenter
} from '@dnd-kit/core';
import { 
  SortableContext, 
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Clock, ArrowRight, Building, GraduationCap, Mail, Phone } from 'lucide-react';

// Stage definitions with colors and descriptions
const stages = {
  connect: [
    { 
      id: 'New',
      name: 'New',
      color: 'bg-blue-100 text-blue-800',
      description: 'Recently added contacts'
    },
    { 
      id: 'Contacted',
      name: 'Contacted',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Initial outreach made'
    },
    { 
      id: 'Meeting Booked',
      name: 'Meeting Booked',
      color: 'bg-purple-100 text-purple-800',
      description: 'Scheduled for meeting'
    },
    { 
      id: 'Call Completed',
      name: 'Call Completed',
      color: 'bg-green-100 text-green-800',
      description: 'First call completed'
    },
    { 
      id: 'Follow Up',
      name: 'Follow Up',
      color: 'bg-red-100 text-red-800',
      description: 'Needs follow-up'
    }
  ],
  grow: [
    { 
      id: 'Weekly',
      name: 'Weekly',
      color: 'bg-indigo-100 text-indigo-800',
      description: 'Weekly check-ins'
    },
    { 
      id: 'Biweekly',
      name: 'Biweekly',
      color: 'bg-pink-100 text-pink-800',
      description: 'Bi-weekly check-ins'
    },
    { 
      id: 'Monthly',
      name: 'Monthly',
      color: 'bg-orange-100 text-orange-800',
      description: 'Monthly check-ins'
    },
    { 
      id: 'Quarterly',
      name: 'Quarterly',
      color: 'bg-teal-100 text-teal-800',
      description: 'Quarterly check-ins'
    },
    { 
      id: 'Semiannual',
      name: 'Semiannual',
      color: 'bg-cyan-100 text-cyan-800',
      description: '6-month check-ins'
    },
    { 
      id: 'Annual',
      name: 'Annual',
      color: 'bg-emerald-100 text-emerald-800',
      description: 'Annual check-ins'
    }
  ]
};

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  company?: string;
  college?: string;
  stage: string;
  last_contacted?: string;
}

interface StagesKanbanProps {
  contacts: Contact[];
  activeTab: 'connect' | 'grow';
  onStageChange: (contactId: string, newStage: string) => Promise<void>;
  onContactClick: (contactId: string) => void;
}

function ContactCard({ contact, onClick }: { contact: Contact; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: contact.id,
    data: {
      type: 'Contact',
      contact
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    cursor: 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow touch-none"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 
            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={onClick}
          >
            {contact.first_name} {contact.last_name}
          </h3>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>

        <div className="space-y-1">
          {contact.company && (
            <div className="flex items-center text-sm text-gray-500">
              <Building className="h-4 w-4 mr-1.5" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}
          {contact.college && (
            <div className="flex items-center text-sm text-gray-500">
              <GraduationCap className="h-4 w-4 mr-1.5" />
              <span className="truncate">{contact.college}</span>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center text-sm text-gray-500">
              <Mail className="h-4 w-4 mr-1.5" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center text-sm text-gray-500">
              <Phone className="h-4 w-4 mr-1.5" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>

        {contact.last_contacted && (
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            Last contacted: {format(new Date(contact.last_contacted), 'MMM d, yyyy')}
          </div>
        )}
      </div>
    </div>
  );
}

function StageColumn({ 
  id, 
  name, 
  color,
  description,
  contacts,
  onContactClick
}: { 
  id: string;
  name: string;
  color: string;
  description: string;
  contacts: Contact[];
  onContactClick: (contactId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ 
    id,
    data: {
      type: 'Column',
      stage: id
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-none w-80 flex flex-col ${
        isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      } bg-gray-50 rounded-lg mx-2 first:ml-0 last:mr-0`}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
              {name}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {contacts.length} contacts
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <SortableContext
          items={contacts.map(contact => contact.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {contacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onClick={() => onContactClick(contact.id)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function StagesKanban({ 
  contacts, 
  activeTab,
  onStageChange,
  onContactClick
}: StagesKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, args) => {
        const draggable = args.context.active;
        if (!draggable) return;

        const element = draggable.node.current;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }
    })
  );

  const handleDragStart = (event: { active: { id: string; data: { current: any } } }) => {
    const contact = contacts.find(c => c.id === event.active.id);
    setActiveId(event.active.id);
    setActiveContact(contact || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveContact(null);

    if (!over) return;

    const contactId = active.id as string;
    const newStage = over.id as string;

    // Find the contact and its current stage
    const contact = contacts.find(c => c.id === contactId);
    if (!contact || contact.stage === newStage) return;

    // Update the contact's stage
    await onStageChange(contactId, newStage);
  };

  const currentStages = stages[activeTab];

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto">
        <div className="inline-flex h-full min-w-full pb-4">
          {currentStages.map((stage) => (
            <StageColumn
              key={stage.id}
              id={stage.id}
              name={stage.name}
              color={stage.color}
              description={stage.description}
              contacts={contacts.filter(contact => contact.stage === stage.id)}
              onContactClick={onContactClick}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeContact && (
          <div className="transform-none">
            <ContactCard
              contact={activeContact}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}