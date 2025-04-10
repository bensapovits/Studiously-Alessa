import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Task } from '../lib/tasks';
import TaskEditForm from './TaskEditForm';

interface TaskGridProps {
  tasks: Task[];
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};

interface EditableTaskProps extends TaskGridProps {
  task: Task;
}

function EditableTask({ task, onComplete, onDelete, onEdit }: EditableTaskProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updatedTask: Task) => {
    onEdit(updatedTask);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative">
        <TaskEditForm
          task={task}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
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
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsEditing(true)}>
          <h3 className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-500 truncate">{task.description}</p>
          )}
          <div className="flex items-center space-x-4 mt-1">
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
            <span className="text-xs text-gray-500">
              {task.status}
            </span>
            {task.project?.name && (
              <div className="flex items-center space-x-1">
                <span className={`h-2 w-2 rounded-full ${task.project.color}`} />
                <span className="text-xs text-gray-500">{task.project.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="flex-none ml-4 text-gray-400 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function TaskGrid({ tasks, onComplete, onDelete, onEdit }: TaskGridProps) {
  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="space-y-2 pb-4">
        {tasks.map((task) => (
          <EditableTask
            key={task.id}
            task={task}
            tasks={tasks}
            onComplete={onComplete}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}