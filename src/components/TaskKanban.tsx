import React, { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  useDroppable,
  closestCenter
} from '@dnd-kit/core';
import { 
  SortableContext, 
  useSortable, 
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Task } from '../lib/tasks';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import TaskEditForm from './TaskEditForm';

interface TaskKanbanProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: string) => void;
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

const columns = [
  { id: 'Not Started', name: 'Not Started' },
  { id: 'In Progress', name: 'In Progress' },
  { id: 'Completed', name: 'Completed' }
];

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

function TaskCard({ task, onComplete, onDelete, onEdit }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'Task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    cursor: 'grab'
  };

  const handleSave = (updatedTask: Task) => {
    onEdit(updatedTask);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style}>
        <TaskEditForm
          task={task}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

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
          <div className="flex items-center space-x-3 flex-1">
            <button
              onClick={() => onComplete(task.id, !task.completed)}
              className={`flex-none ${task.completed ? 'text-green-500' : 'text-gray-300'}`}
            >
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            <h3
              className={`text-sm font-medium cursor-pointer ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}
              onClick={() => setIsEditing(true)}
            >
              {task.title}
            </h3>
          </div>
          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {task.description && (
          <p className="text-sm text-gray-500 mb-2">{task.description}</p>
        )}
        <div className="flex items-center space-x-3">
          {task.due_date && (
            <span className="text-xs text-gray-500">
              Due {format(new Date(task.due_date), 'MMM d, yyyy')}
            </span>
          )}
          {task.priority && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          )}
          {task.project?.name && (
            <div className="flex items-center space-x-1">
              <span className={`h-2 w-2 rounded-full ${task.project.color}`} />
              <span className="text-xs text-gray-500">{task.project.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ id, name, tasks, onComplete, onDelete, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ 
    id,
    data: {
      type: 'Column',
      status: id
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-none w-80 flex flex-col ${
        isOver ? 'bg-blue-50' : 'bg-gray-50'
      } rounded-lg mx-2 first:ml-0 last:mr-0`}
    >
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">{name}</h3>
        <div className="mt-1">
          <span className="text-sm text-gray-500">
            {tasks.length} tasks
          </span>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <SortableContext
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function TaskKanban({ tasks, onStatusChange, onComplete, onDelete, onEdit }: TaskKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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
    })
  );

  const handleDragStart = (event: { active: { id: string; data: { current: any } } }) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveId(event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find the task and its current status
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If dropping over another task, get its status
    const overTask = tasks.find(t => t.id === overId);
    const newStatus = overTask ? overTask.status : overId;

    // Only update if the status has changed
    if (newStatus !== task.status) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto">
        <div className="inline-flex h-full min-w-full pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              name={column.name}
              tasks={tasks.filter(task => task.status === column.id)}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="transform-none">
            <TaskCard
              task={activeTask}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}