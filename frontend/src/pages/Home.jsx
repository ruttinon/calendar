import React, { useState, useEffect } from 'react';
import {
  format, addMonths, subMonths,
  startOfWeek, addDays, isSameMonth, isSameDay,
  startOfMonth, endOfMonth, endOfWeek, isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Check, ArrowRight, LayoutTemplate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import './Home.css';

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const Home = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const navigate = useNavigate();

  const loadTasks = async () => {
    const tasks = await api.getTodosByDate(format(selectedDate, 'yyyy-MM-dd'));
    setTodaysTasks(tasks);
  };

  useEffect(() => { loadTasks(); }, [selectedDate]);

  const toggleTask = async (id) => {
    await api.toggleTodo(id);
    loadTasks();
  };

  const addTask = async () => {
    if (!newTaskText.trim()) return;
    await api.createTodo({
      text: newTaskText,
      date_str: format(selectedDate, 'yyyy-MM-dd'),
      owner_id: 1
    });
    setNewTaskText('');
    loadTasks();
  };

  const monthStart = startOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });

  const weeks = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1); }
    weeks.push(week);
  }

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="greeting-row">
          <div className="greeting-text">
            <span className="greeting-sub">{getGreeting()}</span>
            <h1 className="greeting-name">Hello Ratthinon 👋</h1>
          </div>
          <div className="greeting-avatar">R</div>
        </div>
      </div>

      <div className="home-body-grid">
        {/* Calendar Column */}
        <div className="calendar-section prominent">
          <div className="month-header">
            <span className="month-label">{format(currentMonth, 'MMMM yyyy')}</span>
            <div className="month-nav-group">
              <button className="month-nav-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft size={18} />
              </button>
              <button className="month-nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="days-header prominent">
            {WEEK_DAYS.map(d => <div key={d} className="day-name">{d}</div>)}
          </div>

          <div className="calendar-grid prominent">
            {weeks.map((week, wi) => (
              <div className="calendar-row" key={wi}>
                {week.map((d, di) => {
                  const inMonth = isSameMonth(d, monthStart);
                  const selected = isSameDay(d, selectedDate);
                  const todayDate = isToday(d);
                  return (
                    <div
                      key={di}
                      className={`cal-day prominent ${!inMonth ? ' disabled' : ''}${selected ? ' selected' : todayDate ? ' today' : ''}`}
                      onClick={() => inMonth && setSelectedDate(d)}
                    >
                      {format(d, 'd')}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Column */}
        <div className="tasks-sidebar">
          <div className="tasks-section prominent">
            <div className="tasks-header">
              <div className="tasks-date-label">
                <div className="label-top">Upcoming Tasks</div>
                <div className="label-main">{format(selectedDate, 'EEEE, d MMM')}</div>
              </div>
            </div>

            <div className="task-list scrollable">
              {todaysTasks.length === 0 && <div className="empty-tasks">No tasks for this day</div>}
              {todaysTasks.map(task => (
                <div key={task.id} className="task-item" onClick={() => toggleTask(task.id)}>
                  <div className={`task-check-btn ${task.completed ? 'done' : ''}`}>
                    {task.completed && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <span className={`task-text ${task.completed ? 'done' : ''}`}>
                    {task.text}{task.time_str ? ` · ${task.time_str}` : ''}
                  </span>
                </div>
              ))}
            </div>

            <div className="quick-add-task">
              <input 
                type="text" 
                placeholder="+ Add a new task..." 
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <button onClick={addTask} className="add-task-btn">Add</button>
            </div>

            <button
              className="open-workspace-btn primary"
              onClick={() => navigate(`/workspace/${format(selectedDate, 'yyyy-MM-dd')}`)}
            >
              Open Daily Workspace <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Quick Widgets */}
          <div className="widgets-column">
            <div className="widget-card premium">
              <div className="widget-title">Quick Note</div>
              <textarea placeholder="Start typing thoughts..." className="quick-note-textarea"></textarea>
            </div>
            <div className="widget-card premium">
              <div className="widget-title">Active Template</div>
              <div className="template-card-mini">
                <LayoutTemplate size={16} />
                <span>Productivity System v2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;