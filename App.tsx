import React, { useState, useEffect } from 'react';
import { Layout } from 'lucide-react';
import { Header } from './components/Header';
import { Calendar } from './components/Calendar';
import { TaskPanel } from './components/TaskPanel';
import { Dashboard } from './components/Dashboard';
import { Task } from './types';
import { taskService } from './services/taskService';

// Current date state helpers
const getToday = () => new Date();

export default function App() {
  const [currentDate, setCurrentDate] = useState(getToday()); // The month we are viewing
  const [selectedDate, setSelectedDate] = useState(getToday()); // The specific day selected
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'calendar' | 'dashboard'>('calendar');

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Load tasks on mount
  useEffect(() => {
    const loadTasks = () => {
      const storedTasks = taskService.getAllTasks();
      setTasks(storedTasks);
      setLoading(false);
    };
    loadTasks();
  }, []);

  // CRUD Operations
  const handleCreateTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask = taskService.createTask(task);
    setTasks(prev => [...prev, newTask]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const savedTask = taskService.updateTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
  };

  const handleDeleteTask = (taskId: string) => {
    taskService.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
  };

  const handleYearChange = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + increment);
    setCurrentDate(newDate);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors duration-200">
      {/* Top Header / Navigation Bar simulating the "Tabs" look */}
      <Header 
        currentDate={currentDate} 
        onMonthChange={handleMonthChange}
        onYearChange={handleYearChange}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        currentView={currentView}
        setView={setCurrentView}
      />

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden p-4 gap-4">
        {currentView === 'calendar' ? (
          <>
            {/* Left Side: Calendar View */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-colors duration-200">
               <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-700 dark:text-slate-100 flex items-center gap-2 pl-2">
                    <Layout className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h2>
               </div>
               
               <div className="flex-1 p-4 overflow-auto bg-slate-50 dark:bg-slate-900/50">
                 <Calendar 
                    currentMonth={currentDate}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    tasks={tasks}
                 />
               </div>
            </div>

            {/* Right Side: Task Manager Panel */}
            <div className="w-full md:w-[450px] bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col transition-colors duration-200 overflow-hidden">
              <TaskPanel 
                selectedDate={selectedDate}
                tasks={tasks}
                onAdd={handleCreateTask}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
              />
            </div>
          </>
        ) : (
          /* Dashboard View */
          <div className="w-full h-full">
            <Dashboard tasks={tasks} currentDate={currentDate} />
          </div>
        )}
      </main>
    </div>
  );
}
