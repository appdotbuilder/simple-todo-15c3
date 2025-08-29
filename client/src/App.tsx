import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit3, Plus, Calendar, Bell, Clock } from 'lucide-react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state for creating tasks
  const [createFormData, setCreateFormData] = useState<CreateTaskInput>({
    title: '',
    description: null,
    due_date: null,
    reminder_date: null
  });

  // Form state for editing tasks
  const [editFormData, setEditFormData] = useState<Partial<UpdateTaskInput>>({
    title: '',
    description: null,
    due_date: null,
    reminder_date: null
  });

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createTask.mutate(createFormData);
      setTasks((prev: Task[]) => [response, ...prev]);
      setCreateFormData({
        title: '',
        description: null,
        due_date: null,
        reminder_date: null
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateTask.mutate({
        id: editingTask.id,
        ...editFormData
      });
      setTasks((prev: Task[]) => 
        prev.map((task: Task) => task.id === response.id ? response : task)
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      const response = await trpc.toggleTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => 
        prev.map((task: Task) => task.id === response.id ? response : task)
      );
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      reminder_date: task.reminder_date
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✨ My Tasks</h1>
          <p className="text-gray-600">Stay organized and get things done</p>
        </div>

        {/* Create Task Button */}
        <div className="mb-8 text-center">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Plus className="w-5 h-5 mr-2" />
                Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateTask}>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task with optional due date and reminder.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="What needs to be done?"
                      value={createFormData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Additional details (optional)"
                      value={createFormData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateTaskInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={createFormData.due_date ? new Date(createFormData.due_date).toISOString().slice(0, 16) : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateTaskInput) => ({
                          ...prev,
                          due_date: e.target.value ? new Date(e.target.value) : null
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminder_date">Reminder</Label>
                    <Input
                      id="reminder_date"
                      type="datetime-local"
                      value={createFormData.reminder_date ? new Date(createFormData.reminder_date).toISOString().slice(0, 16) : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateTaskInput) => ({
                          ...prev,
                          reminder_date: e.target.value ? new Date(e.target.value) : null
                        }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks yet</h3>
            <p className="text-gray-500">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task: Task) => (
              <Card key={task.id} className={`transition-all hover:shadow-md ${
                task.completed ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`text-sm mt-1 ${
                            task.completed ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(task)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{task.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button variant="destructive" onClick={() => handleDeleteTask(task.id)}>
                              Delete
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {task.due_date && (
                      <Badge variant={isOverdue(task.due_date) ? "destructive" : "secondary"} className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due: {formatDate(task.due_date)}
                        {isOverdue(task.due_date) && !task.completed && ' (Overdue)'}
                      </Badge>
                    )}
                    {task.reminder_date && (
                      <Badge variant="outline" className="text-xs">
                        <Bell className="w-3 h-3 mr-1" />
                        Reminder: {formatDateTime(task.reminder_date)}
                      </Badge>
                    )}
                    {task.completed && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        ✓ Completed
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Created: {formatDateTime(task.created_at)}
                    {task.updated_at && task.updated_at !== task.created_at && (
                      <span className="ml-2">• Updated: {formatDateTime(task.updated_at)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Task Dialog */}
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleUpdateTask}>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>
                  Make changes to your task.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateTaskInput>) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: Partial<UpdateTaskInput>) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-due-date">Due Date</Label>
                  <Input
                    id="edit-due-date"
                    type="datetime-local"
                    value={editFormData.due_date ? new Date(editFormData.due_date).toISOString().slice(0, 16) : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateTaskInput>) => ({
                        ...prev,
                        due_date: e.target.value ? new Date(e.target.value) : null
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-reminder-date">Reminder</Label>
                  <Input
                    id="edit-reminder-date"
                    type="datetime-local"
                    value={editFormData.reminder_date ? new Date(editFormData.reminder_date).toISOString().slice(0, 16) : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateTaskInput>) => ({
                        ...prev,
                        reminder_date: e.target.value ? new Date(e.target.value) : null
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Task'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;