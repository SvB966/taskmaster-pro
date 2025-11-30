import React, { useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle, AlertCircle, Clock, Calendar as CalendarIcon, PieChart, TrendingUp, Activity } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  currentDate: Date;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, currentDate }) => {
  // --- 1. KPI Calculations ---
  const kpis = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Start/End of current week
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

    const total = tasks.length;
    const byStatus = {
      [TaskStatus.NOT_STARTED]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0
    };

    let overdue = 0;
    let todayCount = 0;
    let weekCount = 0;

    tasks.forEach(task => {
      // Status Counts
      if (byStatus[task.status] !== undefined) {
        byStatus[task.status]++;
      }

      // Overdue: Due date is before today AND not completed
      if (task.date < todayStr && task.status !== TaskStatus.COMPLETED) {
        overdue++;
      }

      // Today
      if (task.date === todayStr) {
        todayCount++;
      }

      // This Week
      const taskDate = new Date(task.date);
      // We interpret task.date as midnight local time roughly for comparison
      // Actually strictly parsing YYYY-MM-DD:
      const [y, m, d] = task.date.split('-').map(Number);
      const tDate = new Date(y, m - 1, d);
      
      if (tDate >= startOfWeek && tDate <= endOfWeek) {
        weekCount++;
      }
    });

    return { total, byStatus, overdue, todayCount, weekCount };
  }, [tasks]);

  // --- 2. Chart Data Preparation ---

  // Pie Chart Data
  const pieData = [
    { label: 'Not Started', value: kpis.byStatus[TaskStatus.NOT_STARTED], color: '#ef4444' }, // Red-500
    { label: 'In Progress', value: kpis.byStatus[TaskStatus.IN_PROGRESS], color: '#f59e0b' }, // Amber-500
    { label: 'Completed', value: kpis.byStatus[TaskStatus.COMPLETED], color: '#10b981' },   // Emerald-500
  ].filter(d => d.value > 0);

  const totalForPie = pieData.reduce((acc, cur) => acc + cur.value, 0);
  
  // Calculate conic gradient stops
  let currentAngle = 0;
  const gradientStops = pieData.map(d => {
    const percentage = (d.value / totalForPie) * 100;
    const start = currentAngle;
    const end = currentAngle + percentage;
    currentAngle = end;
    return `${d.color} ${start}% ${end}%`;
  }).join(', ');

  const pieGradient = totalForPie > 0 
    ? `conic-gradient(${gradientStops})` 
    : 'conic-gradient(#e2e8f0 0% 100%)';


  // Line Chart Data (Last 14 days)
  const lineChartData = useMemo(() => {
    const days = 14;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Created: Filter by createdAt timestamp converted to YYYY-MM-DD
      const createdCount = tasks.filter(t => {
        const cDate = new Date(t.createdAt).toISOString().split('T')[0];
        return cDate === dateStr;
      }).length;

      // Completed: Filter by scheduled date where status is completed
      // (Using scheduled date as proxy for completion date for this visualization)
      const completedCount = tasks.filter(t => t.date === dateStr && t.status === TaskStatus.COMPLETED).length;

      data.push({ date: displayDate, created: createdCount, completed: completedCount });
    }
    return data;
  }, [tasks]);

  // SVG Chart Helpers
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = 20;
  const maxVal = Math.max(
    ...lineChartData.map(d => d.created), 
    ...lineChartData.map(d => d.completed), 
    5 // Minimum scale
  );

  const getY = (val: number) => chartHeight - padding - (val / maxVal) * (chartHeight - padding * 2);
  const getX = (index: number) => padding + (index / (lineChartData.length - 1)) * (chartWidth - padding * 2);

  const pointsCreated = lineChartData.map((d, i) => `${getX(i)},${getY(d.created)}`).join(' ');
  const pointsCompleted = lineChartData.map((d, i) => `${getX(i)},${getY(d.completed)}`).join(' ');

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Activity className="text-sky-600 dark:text-sky-400" />
          Dashboard Insights
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Overview of your productivity and task status.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Tasks</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{kpis.total}</h3>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Overdue</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{kpis.overdue}</h3>
          </div>
        </div>

        {/* Today */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Due Today</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{kpis.todayCount}</h3>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <CalendarIcon size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">This Week</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{kpis.weekCount}</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Task Status Distribution (Pie / Donut) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-slate-400" />
            Status Distribution
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            {/* The Pie Chart */}
            <div className="relative w-48 h-48 rounded-full shadow-inner" style={{ background: pieGradient }}>
              {/* Inner circle for Donut effect */}
              <div className="absolute inset-0 m-auto w-32 h-32 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-slate-800 dark:text-slate-100">{kpis.total}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Tasks</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
               {pieData.map((d, i) => (
                 <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-24">{d.label}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{d.value}</span>
                    <span className="text-xs text-slate-400">({((d.value/totalForPie)*100).toFixed(0)}%)</span>
                 </div>
               ))}
               {pieData.length === 0 && (
                 <p className="text-slate-400 text-sm">No tasks data available.</p>
               )}
            </div>
          </div>
        </div>

        {/* Productivity Trend (Line Chart) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-400" />
            Productivity Trend (Last 14 Days)
          </h3>
          <p className="text-xs text-slate-500 mb-6">Tasks Created vs. Tasks Scheduled & Completed</p>
          
          <div className="flex-1 min-h-[200px] w-full relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
               {/* Grid Lines */}
               {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                 <line 
                   key={tick}
                   x1={padding} 
                   y1={chartHeight - padding - tick * (chartHeight - padding*2)} 
                   x2={chartWidth - padding} 
                   y2={chartHeight - padding - tick * (chartHeight - padding*2)} 
                   stroke="currentColor" 
                   className="text-slate-200 dark:text-slate-700" 
                   strokeWidth="1"
                 />
               ))}

               {/* Line: Created */}
               <polyline 
                 fill="none" 
                 stroke="#3b82f6" // blue-500
                 strokeWidth="3" 
                 points={pointsCreated} 
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 className="drop-shadow-sm"
               />
               
               {/* Line: Completed */}
               <polyline 
                 fill="none" 
                 stroke="#10b981" // emerald-500
                 strokeWidth="3" 
                 points={pointsCompleted} 
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 className="drop-shadow-sm"
               />

               {/* X-Axis Labels (Show every 3rd or so to avoid clutter) */}
               {lineChartData.map((d, i) => {
                 if (i % 3 !== 0 && i !== lineChartData.length -1) return null;
                 return (
                   <text 
                     key={i} 
                     x={getX(i)} 
                     y={chartHeight} 
                     className="text-[10px] fill-slate-400" 
                     textAnchor="middle"
                   >
                     {d.date}
                   </text>
                 );
               })}
            </svg>
          </div>
          
          {/* Chart Legend */}
          <div className="flex justify-center gap-6 mt-4">
             <div className="flex items-center gap-2">
               <div className="w-3 h-1 bg-blue-500 rounded-full"></div>
               <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Created</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-1 bg-emerald-500 rounded-full"></div>
               <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Completed (Scheduled)</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
