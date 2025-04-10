import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Plus,
  FolderPlus,
  Tag,
  Clock,
  ChevronDown,
  Loader2,
  X,
  Pencil,
  Trash2,
  AlertCircle,
  LayoutGrid,
  KanbanSquare,
  Folder
} from 'lucide-react';
import { Task, getTasks, createTask, updateTask, deleteTask, toggleTaskComplete } from '../lib/tasks';
import { Project, getProjects, createProject, updateProject, deleteProject } from '../lib/projects';
import { supabase } from '../lib/supabase';
import TaskGrid from '../components/TaskGrid';
import TaskKanban from '../components/TaskKanban';
import TaskEditForm from '../components/TaskEditForm';

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('grid');
  const [showProjectMenu, setShowProjectMenu] = useState(false);

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
        throw new Error('Not authenticated');
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

      const [tasksData, projectsData] = await Promise.all([
        getTasks(),
        getProjects()
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await updateTask(taskId, { status });
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status');
    }
  };

  const handleEditTask = async (updatedTask: Task) => {
    try {
      const { id, ...taskData } = updatedTask;
      await updateTask(id, taskData);
      setTasks(tasks.map(task =>
        task.id === id ? updatedTask : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      await toggleTaskComplete(taskId, completed);
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, completed } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const filteredTasks = selectedProject
    ? tasks.filter(task => task.project_id === selectedProject)
    : tasks;

  const selectedProjectName = selectedProject
    ? projects.find(p => p.id === selectedProject)?.name
    : 'All Tasks';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            
            {/* Project Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Folder className="h-4 w-4" />
                <span>{selectedProjectName}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showProjectMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setShowNewProjectModal(true);
                      setShowProjectMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </button>
                  
                  <div className="h-px bg-gray-200 my-1" />
                  
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setShowProjectMenu(false);
                    }}
                    className={`w-full flex items-center px-4 py-2 text-sm ${
                      !selectedProject ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    All Tasks
                  </button>

                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between group px-4 py-2 hover:bg-gray-50"
                    >
                      <button
                        onClick={() => {
                          setSelectedProject(project.id);
                          setShowProjectMenu(false);
                        }}
                        className={`flex items-center flex-1 text-sm ${
                          selectedProject === project.id ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${project.color} mr-2`} />
                        {project.name}
                      </button>
                      <div className="hidden group-hover:flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                            setShowNewProjectModal(true);
                            setShowProjectMenu(false);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('grid')}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === 'grid'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === 'kanban'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <KanbanSquare className="h-4 w-4 mr-2" />
                Kanban
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="h-full p-8">
            {error && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <Tabs.Content value="grid" className="h-full outline-none">
              <TaskGrid
                tasks={filteredTasks}
                onComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
              />
            </Tabs.Content>

            <Tabs.Content value="kanban" className="h-full outline-none">
              <TaskKanban
                tasks={filteredTasks}
                onStatusChange={handleStatusChange}
                onComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
              />
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>

      {/* Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-lg mx-4">
            <TaskEditForm
              task={{
                id: '',
                title: '',
                description: '',
                priority: 'medium',
                status: 'Not Started',
                completed: false,
                project_id: selectedProject || undefined,
                user_id: user.id
              } as Task}
              onSave={async (task) => {
                try {
                  const newTask = await createTask(task);
                  setTasks([newTask, ...tasks]);
                  setShowNewTaskModal(false);
                } catch (error) {
                  console.error('Error creating task:', error);
                  setError('Failed to create task');
                }
              }}
              onCancel={() => setShowNewTaskModal(false)}
            />
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const projectData = {
                  name: formData.get('name') as string,
                  color: formData.get('color') as string,
                  user_id: user.id
                };

                try {
                  if (editingProject) {
                    const updated = await updateProject(editingProject.id, projectData);
                    setProjects(projects.map(p => p.id === editingProject.id ? updated : p));
                  } else {
                    const newProject = await createProject(projectData);
                    setProjects([...projects, newProject]);
                  }
                  setShowNewProjectModal(false);
                  setEditingProject(null);
                } catch (error) {
                  console.error('Error saving project:', error);
                  setError('Failed to save project');
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProject?.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-purple-500',
                      'bg-red-500',
                      'bg-yellow-500',
                      'bg-pink-500',
                      'bg-indigo-500',
                      'bg-cyan-500'
                    ].map((color) => (
                      <label key={color} className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="color"
                          value={color}
                          defaultChecked={editingProject ? editingProject.color === color : false}
                          className="sr-only peer"
                          required
                        />
                        <div className={`w-8 h-8 rounded-full ${color} cursor-pointer ring-2 ring-transparent hover:ring-gray-400 peer-checked:ring-gray-900`} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProjectModal(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;