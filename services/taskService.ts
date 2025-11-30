import { Task } from '../types';

const STORAGE_KEY = 'taskmanager_db_v1';

export const taskService = {
  getAllTasks: (): Task[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load tasks", e);
      return [];
    }
  },

  saveAllTasks: (tasks: Task[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  },

  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const tasks = taskService.getAllTasks();
    const newTask: Task = {
      ...task,
      // Ensure defaults if not provided (handling legacy calls or partial objects)
      endTime: task.endTime || calculateDefaultEndTime(task.startTime),
      subtasks: task.subtasks || [],
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tasks.push(newTask);
    taskService.saveAllTasks(tasks);
    return newTask;
  },

  updateTask: (updatedTask: Task): Task => {
    const tasks = taskService.getAllTasks();
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = { ...updatedTask, updatedAt: Date.now() };
      taskService.saveAllTasks(tasks);
      return tasks[index];
    }
    throw new Error('Task not found');
  },

  deleteTask: (taskId: string) => {
    const tasks = taskService.getAllTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    taskService.saveAllTasks(filtered);
  }
};

// Helper to add 1 hour to start time for default end time
function calculateDefaultEndTime(startTime: string): string {
  if (!startTime) return '10:00';
  const [h, m] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(h);
  date.setMinutes(m + 60);
  const newH = date.getHours().toString().padStart(2, '0');
  const newM = date.getMinutes().toString().padStart(2, '0');
  return `${newH}:${newM}`;
}