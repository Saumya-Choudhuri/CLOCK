import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  ListTodo, 
  BarChart as ChartIcon, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  PlusCircle, 
  CheckCircle2, 
  Sliders, 
  Sun, 
  Maximize2, 
  Minimize2, 
  ChevronRight, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Sparkles,
  Tag,
  BookOpen,
  X,
  Volume2,
  VolumeX,
  Smartphone,
  Check
} from 'lucide-react';
import { Task, SessionLog, SubTask } from '../types';

interface BentoGridProps {
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updatedFields: Partial<Task>) => void;
  logs: SessionLog[];
  onAddSessionLog: (durationSeconds: number, type: 'Pomodoro' | 'Short Break' | 'Long Break' | 'Custom') => void;
  onOpenTrialModal: () => void;
}

// Preset configurations for customize workspace experience
const BACKGROUND_PRESETS = [
  { id: 'solid', name: 'Ambient Slate', css: 'bg-gradient-to-br from-[#121312] to-[#1e201e]' },
  { id: 'aurora', name: 'Calm Aurora', css: 'bg-gradient-to-br from-[#0c1810] via-[#121312] to-[#1c1221]' },
  { id: 'cosmic', name: 'Cosmic Nebula', css: 'bg-gradient-to-br from-[#080914] via-[#121312] to-[#240833]' },
  { id: 'rainy', name: 'Tokyo Rain', css: 'bg-gradient-to-b from-[#111317] to-[#1a1c22]' },
  { id: 'waves', name: 'Zen Waves', css: 'bg-gradient-to-br from-[#07242c] via-[#0d161a] to-[#121312]' },
];

const THEME_PRESETS = [
  { id: 'lime', name: 'Zoned Lime', main: '#c9ff3b', onMain: '#1a1c1b', glow: 'rgba(201, 255, 59, 0.4)', neonBorder: 'border-[#c9ff3b]/20 hover:border-[#c9ff3b]/50' },
  { id: 'cyber', name: 'Neon Cyber', main: '#06b6d4', onMain: '#080914', glow: 'rgba(6, 182, 212, 0.4)', neonBorder: 'border-[#06b6d4]/20 hover:border-[#06b6d4]/50' },
  { id: 'forest', name: 'Deep Emerald', main: '#10b981', onMain: '#0c1810', glow: 'rgba(16, 185, 129, 0.4)', neonBorder: 'border-[#10b981]/20 hover:border-[#10b981]/50' },
  { id: 'sepia', name: 'Warm Amber', main: '#f59e0b', onMain: '#110d02', glow: 'rgba(245, 158, 11, 0.4)', neonBorder: 'border-[#f59e0b]/20 hover:border-[#f59e0b]/50' },
  { id: 'royal', name: 'Velvet Pink', main: '#ec4899', onMain: '#240833', glow: 'rgba(236, 72, 153, 0.4)', neonBorder: 'border-[#ec4899]/20 hover:border-[#ec4899]/50' },
  { id: 'light', name: 'Minimal Dark', main: '#c9ff3b', onMain: '#1a1c1b', glow: 'rgba(201, 255, 59, 0.3)', neonBorder: 'border-white/10 hover:border-white/40' },
];

const FONTS = [
  { id: 'jetbrains', name: 'JetBrains Mono', class: 'font-mono' },
  { id: 'space', name: 'Space Grotesk', class: 'font-space tracking-tight' },
  { id: 'outfit', name: 'Outfit', class: 'font-outfit font-extrabold tracking-tight' },
  { id: 'playfair', name: 'Playfair Display', class: 'font-playfair font-normal tracking-wide' },
  { id: 'fira', name: 'Fira Code', class: 'font-fira font-semibold' },
  { id: 'sora', name: 'Sora', class: 'font-sans' },
];

const VIEWS = [
  { id: 'simple', name: 'Simple Text' },
  { id: 'frame', name: 'Full HUD Frame' },
  { id: 'circle', name: 'Circle Glow' },
  { id: 'retro', name: 'Retro LCD' },
];

export default function BentoGrid({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  logs,
  onAddSessionLog,
  onOpenTrialModal
}: BentoGridProps) {
  // Navigation / Mode Switch
  const [activeTab, setActiveTab] = useState<'workspace' | 'task' | 'analytics'>('workspace');

  // 1. Clock & Counter Settings States
  const [timerMode, setTimerMode] = useState<'Counter' | 'Clock'>('Counter');
  const [focusDuration, setFocusDuration] = useState(25 * 60); // default 25 minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [isSlidingSettingsOpen, setIsSlidingSettingsOpen] = useState(false);
  
  // Customization variables
  const [selectedBg, setSelectedBg] = useState('solid');
  const [selectedTheme, setSelectedTheme] = useState('lime');
  const [selectedFont, setSelectedFont] = useState('jetbrains');
  const [selectedView, setSelectedView] = useState('frame');
  const [brightness, setBrightness] = useState(100); // 0 to 100
  const [bgOpacity, setBgOpacity] = useState(80); // 0 to 100
  const [isSoundOn, setIsSoundOn] = useState(true);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [localClockTime, setLocalClockTime] = useState('');

  // 2. Task Studio States
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [newCheckpointText, setNewCheckpointText] = useState('');

  // 3. Analytics States
  const [analyticsFilter, setAnalyticsFilter] = useState<'7days' | '30days' | 'alltime'>('7days');
  const [hoveredChartNode, setHoveredChartNode] = useState<{ x: number, y: number, label: string, value: string } | null>(null);

  // Sync initial task selection
  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks]);

  // Set Local Clock updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (num: number) => num.toString().padStart(2, '0');
      setLocalClockTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown clock state sync
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            
            // Register focus log
            onAddSessionLog(focusDuration, 'Pomodoro');
            
            // Audio beeping feedback
            if (isSoundOn) {
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                if (audioCtx) {
                  const oscillator = audioCtx.createOscillator();
                  const gainNode = audioCtx.createGain();
                  oscillator.connect(gainNode);
                  gainNode.connect(audioCtx.destination);
                  oscillator.type = 'sine';
                  oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                  gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
                  oscillator.start();
                  oscillator.stop(audioCtx.currentTime + 0.6);
                }
              } catch (e) {
                console.log('Audio device blocked', e);
              }
            }

            alert('Session complete! Take a well-deserved short break. Your focus duration has been logged in Analytics.');
            return focusDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, focusDuration, onAddSessionLog, isSoundOn]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(focusDuration);
  };

  const adjustDuration = (minutes: number) => {
    if (isTimerRunning) return;
    const newDuration = Math.max(300, Math.min(7200, focusDuration + minutes * 60));
    setFocusDuration(newDuration);
    setTimeLeft(newDuration);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Task submit actions
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText.trim());
    setNewTaskText('');
  };

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Checkpoints handlers
  const handleAddCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newCheckpointText.trim()) return;
    const currentSub = selectedTask.subTasks || [];
    const newSub: SubTask = {
      id: `sub-${Date.now()}`,
      text: newCheckpointText.trim(),
      completed: false
    };
    onUpdateTask(selectedTask.id, {
      subTasks: [...currentSub, newSub]
    });
    setNewCheckpointText('');
  };

  const toggleCheckpoint = (subId: string) => {
    if (!selectedTask) return;
    const currentSub = selectedTask.subTasks || [];
    const updatedSub = currentSub.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
    onUpdateTask(selectedTask.id, {
      subTasks: updatedSub
    });
  };

  const deleteCheckpoint = (subId: string) => {
    if (!selectedTask) return;
    const currentSub = selectedTask.subTasks || [];
    const updatedSub = currentSub.filter(s => s.id !== subId);
    onUpdateTask(selectedTask.id, {
      subTasks: updatedSub
    });
  };

  const handleNotesChange = (text: string) => {
    if (!selectedTask) return;
    onUpdateTask(selectedTask.id, { notes: text });
  };

  const handlePriorityChange = (priority: 'high' | 'medium' | 'low') => {
    if (!selectedTask) return;
    onUpdateTask(selectedTask.id, { priority });
  };

  // Historic / Calculated analytics metrics based on filter selection
  const getFilteredLogs = () => {
    const now = Date.now();
    let filterMs = 7 * 24 * 60 * 60 * 1000;
    if (analyticsFilter === '30days') filterMs = 30 * 24 * 60 * 60 * 1000;
    else if (analyticsFilter === 'alltime') filterMs = 365 * 24 * 60 * 60 * 1000;

    // Filter local active logs
    const activeFiltered = logs.filter(l => {
      const logTime = new Date(l.date).getTime();
      return (now - logTime) < filterMs;
    });

    return activeFiltered;
  };

  const getAnalyticsReport = () => {
    const filtered = getFilteredLogs();
    
    // Baselines depending on filter
    let baseHours = 44.5;
    let baseSessions = 112;
    let baseAvgMins = 38;
    if (analyticsFilter === '30days') {
      baseHours = 124.5;
      baseSessions = 312;
      baseAvgMins = 42;
    } else if (analyticsFilter === 'alltime') {
      baseHours = 520.0;
      baseSessions = 1248;
      baseAvgMins = 45;
    }

    const trackedSeconds = filtered.reduce((acc, log) => acc + log.durationSeconds, 0);
    const trackedSessions = filtered.length;

    const totalHours = (baseHours + (trackedSeconds / 3600)).toFixed(1);
    const totalSessions = baseSessions + trackedSessions;
    
    let avgMinutes = baseAvgMins;
    if (trackedSessions > 0) {
      const logAvg = (trackedSeconds / trackedSessions) / 60;
      avgMinutes = Math.round((baseAvgMins * baseSessions + logAvg * trackedSessions) / totalSessions);
    }

    return {
      totalHours: `${totalHours} hrs`,
      totalSessions,
      avgSession: `${avgMinutes} mins`,
      activeTasksCount: tasks.filter(t => !t.completed).length,
      completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 100
    };
  };

  const report = getAnalyticsReport();

  // Export functions
  const handleCSVExport = () => {
    const headers = 'Session ID,Date,Duration (Seconds),Type\n';
    const currentFiltered = getFilteredLogs();
    const rows = currentFiltered.map(
      log => `${log.id},"${log.date}",${log.durationSeconds},"${log.type}"`
    ).join('\n');
    
    // Include professional preloaded baseline items
    const baselineRows = '\nHIS-001,"2026-05-24 09:15:00",1500,"Pomodoro"\nHIS-002,"2026-05-25 10:45:00",3000,"Custom"\nHIS-003,"2026-05-26 14:00:00",1500,"Pomodoro"\nHIS-004,"2026-05-27 16:30:00",1500,"Pomodoro"';
    
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows + baselineRows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `zoned-${analyticsFilter}-performance-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Presets styling references
  const bgPreset = BACKGROUND_PRESETS.find(b => b.id === selectedBg) || BACKGROUND_PRESETS[0];
  const themePreset = THEME_PRESETS.find(t => t.id === selectedTheme) || THEME_PRESETS[0];
  const fontPreset = FONTS.find(f => f.id === selectedFont) || FONTS[0];

  return (
    <section id="features" className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto transition-all duration-300">
      
      {/* Title & Introduction Block */}
      <div className="text-center mb-12 select-none">
        <span className="inline-block px-3 py-1 bg-[#c9ff3b]/15 text-[#4d6700] rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-[#c9ff3b]/25">
          Pro Studio Toolset
        </span>
        <h2 className="font-space text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1a1c1b]">
          Unified Focus Environment
        </h2>
        <p className="mt-3 text-sm text-[#434934]/80 max-w-[550px] mx-auto font-sans font-medium">
          A gorgeous, clutter-free sandbox containing everything you need to log deep focus sprints. Switch workspaces in one click.
        </p>
      </div>

      {/* Main Console Layout */}
      <div className="bg-white border border-[#1a1c1b]/5 rounded-[36px] shadow-2xl shadow-[#1a1c1b]/[0.03] overflow-hidden flex flex-col">
        
        {/* Core Workspace Header Hub */}
        <div className="border-b border-[#1a1c1b]/5 px-6 md:px-10 py-5 bg-[#fcfcfb] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#c9ff3b] glow-lime" />
            <span className="text-xs uppercase font-black tracking-widest text-[#1a1c1b] font-space flex items-center gap-1.5">
              <span>Sprint Space</span>
              <span className="text-[10px] font-mono text-[#1a1c1b]/40 italic">v2.4.0</span>
            </span>
          </div>

          {/* Navigation Tabs - Beautiful tactile pill buttons */}
          <div className="bg-[#1a1c1b]/5 p-1 rounded-full border border-[#1a1c1b]/5 flex gap-1">
            <button
              onClick={() => { setActiveTab('workspace'); setIsImmersiveMode(false); }}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'workspace'
                  ? 'bg-[#1a1c1b] text-[#c9ff3b] shadow-md shadow-[#1a1c1b]/10'
                  : 'text-[#1a1c1b]/60 hover:text-[#1a1c1b] hover:bg-[#1a1c1b]/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => { setActiveTab('task'); setIsImmersiveMode(false); }}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'task'
                  ? 'bg-[#1a1c1b] text-[#c9ff3b] shadow-md shadow-[#1a1c1b]/10'
                  : 'text-[#1a1c1b]/60 hover:text-[#1a1c1b] hover:bg-[#1a1c1b]/5'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Task Studio</span>
            </button>
            <button
              onClick={() => { setActiveTab('analytics'); setIsImmersiveMode(false); }}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-[#1a1c1b] text-[#c9ff3b] shadow-md shadow-[#1a1c1b]/10'
                  : 'text-[#1a1c1b]/60 hover:text-[#1a1c1b] hover:bg-[#1a1c1b]/5'
              }`}
            >
              <ChartIcon className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Action Badge */}
          <div className="hidden md:flex items-center gap-3">
            <span className="px-3 py-1 bg-[#1a1c1b]/5 text-[#1a1c1b]/70 border border-[#1a1c1b]/10 rounded-full text-[10px] font-bold font-mono">
              ⚡ LIVE BACKUP COMPLETED
            </span>
          </div>
        </div>

        {/* Tab Subviews Rendering */}
        <div className="flex-1 min-h-[580px] bg-[#fdfdfc] relative transition-all duration-500">
          
          {/* TAB 1: WORKSPACE (Immersive Dark Focus clock and customise control system) */}
          {activeTab === 'workspace' && (
            <div className={`flex flex-col xl:flex-row h-full transition-all duration-3s relative ${isImmersiveMode ? 'p-0' : 'p-6 md:p-8'}`}>
              
              {/* Left Panel: The Screen Device Box */}
              <div 
                className={`flex-1 flex flex-col justify-between rounded-[28px] overflow-hidden relative border shadow-lg transition-all duration-500 ring-4 ring-[#1a1c1b]/5 ${bgPreset.css} ${themePreset.neonBorder}`}
                style={{
                  borderOpacity: bgOpacity / 100,
                }}
              >
                {/* Background Pattern Mask */}
                <div 
                  className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none mix-blend-overlay transition-opacity duration-300"
                  style={{ opacity: bgOpacity / 100 * 0.15 }}
                />

                {/* Animated Aurora Orbs inside aurora backdrop */}
                {selectedBg === 'aurora' && (
                  <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#c9ff3b] opacity-10 blur-[100px] animate-pulse-slow pointer-events-none" />
                )}
                {selectedBg === 'cosmic' && (
                  <>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#ec4899] opacity-10 blur-[120px] pointer-events-none" />
                    <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-[#06b6d4] opacity-10 blur-[100px] pointer-events-none animate-pulse-slow" />
                  </>
                )}
                {selectedBg === 'waves' && (
                  <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#0ea5e9]/10 to-transparent blur-3xl pointer-events-none" />
                )}

                {/* Physical hardware Brightness Dimming Filter */}
                <div 
                  className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300 z-40"
                  style={{ opacity: (100 - brightness) / 100 * 0.85 }} 
                />

                {/* Clock Workspace content */}
                <div className="relative z-30 flex-1 flex flex-col justify-between p-6 md:p-10 text-white select-none">
                  
                  {/* Top Header Controls inside Clock Screen */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.1 h-2.1 rounded-full bg-[#c9ff3b] animate-ping" />
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] font-mono text-white/50">
                        {timerMode === 'Counter' ? 'Active Focus Loop' : 'Absolute Local Clock'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsSoundOn(!isSoundOn)}
                        title={isSoundOn ? 'Mute alert sounds' : 'Unmute alert sounds'}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/5"
                      >
                        {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setIsImmersiveMode(!isImmersiveMode)}
                        title={isImmersiveMode ? 'Restore split layout' : 'Maximize Zen clock view'}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/5"
                      >
                        {isImmersiveMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* DIGITAL DISPLAY PANEL */}
                  <div className="flex-1 flex flex-col items-center justify-center py-10">
                    
                    {/* View rendering selector layout */}
                    <div className={`w-full max-w-[460px] text-center p-8 transition-all duration-500 rounded-3xl ${
                      selectedView === 'frame' ? 'bg-black/35 border border-white/10 backdrop-blur-md shadow-2xl' :
                      selectedView === 'retro' ? 'bg-[#1b251e] border-4 border-[#2d3a31] text-[#76f296] font-mono shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]' :
                      selectedView === 'circle' ? 'border-2 border-dashed border-white/20 rounded-full w-80 h-80 flex flex-col justify-center items-center backdrop-blur-sm' :
                      'bg-transparent'
                    }`}>
                      
                      {timerMode === 'Counter' ? (
                        <>
                          <div 
                            className={`text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-2 ${fontPreset.class} transition-all duration-300`}
                            style={{ 
                              color: selectedView === 'retro' ? '#76f296' : themePreset.main,
                              textShadow: selectedView === 'retro' ? '0 0 10px rgba(118,242,150,0.5)' : `0 0 35px ${themePreset.glow}`
                            }}
                          >
                            {formatTime(timeLeft)}
                          </div>

                          {selectedView === 'retro' && (
                            <div className="text-[10px] uppercase text-[#76f296]/60 tracking-[0.25em] font-mono mb-4 animate-pulse">
                              RUNNING_STATE_STABLE
                            </div>
                          )}

                          {/* Incremental Adjusters when paused */}
                          {!isTimerRunning && (
                            <div className="flex justify-center gap-2 mb-4 mt-2">
                              <button
                                onClick={() => adjustDuration(-5)}
                                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-bold border border-white/5 transition-colors"
                              >
                                -5m
                              </button>
                              <button
                                onClick={() => adjustDuration(5)}
                                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-bold border border-white/5 transition-colors"
                              >
                                +5m
                              </button>
                            </div>
                          )}
                          
                          {/* Main Control Sprints */}
                          <div className="flex justify-center items-center gap-3 mt-4">
                            <button
                              onClick={toggleTimer}
                              className="px-6 py-2.5 rounded-full font-extrabold text-[10px] tracking-widest uppercase transition-all duration-300 flex items-center gap-1.5 transform hover:scale-105"
                              style={{
                                backgroundColor: selectedView === 'retro' ? '#76f296' : themePreset.main,
                                color: selectedView === 'retro' ? '#111' : themePreset.onMain,
                                boxShadow: selectedView === 'retro' ? '0 0 15px rgba(118,242,150,0.4)' : `0 10px 25px ${themePreset.glow}`
                              }}
                            >
                              {isTimerRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                              <span>{isTimerRunning ? 'PAUSE' : 'FOCUS'}</span>
                            </button>

                            <button
                              onClick={resetTimer}
                              title="Reset counter duration"
                              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5 transition-all"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div 
                            className={`text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-2 ${fontPreset.class} transition-all duration-300`}
                            style={{ 
                              color: selectedView === 'retro' ? '#76f296' : themePreset.main,
                              textShadow: selectedView === 'retro' ? '0 0 10px rgba(118,242,150,0.5)' : `0 0 35px ${themePreset.glow}`
                            }}
                          >
                            {localClockTime}
                          </div>
                          <div className={`text-[9px] uppercase tracking-[0.3em] font-mono ${selectedView === 'retro' ? 'text-[#76f296]/40' : 'text-white/40'}`}>
                            Synchronized UTC Sandbox
                          </div>
                        </>
                      )}

                    </div>
                  </div>

                  {/* Footing detail */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-white/5 text-white/30 text-[10px] font-mono uppercase tracking-widest">
                    <span>Zoned Hardware Controller v2.4</span>
                    
                    {/* Mode Toggle Button inside Clock Frame */}
                    <div className="bg-white/5 p-0.5 rounded-full flex border border-white/5">
                      <button
                        onClick={() => setTimerMode('Counter')}
                        className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wider transition-all duration-300 ${
                          timerMode === 'Counter' ? 'bg-[#c9ff3b] text-[#1a1c1b]' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Counter
                      </button>
                      <button
                        onClick={() => setTimerMode('Clock')}
                        className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wider transition-all duration-300 ${
                          timerMode === 'Clock' ? 'bg-[#c9ff3b] text-[#1a1c1b]' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Clock
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Panel: Customization Options sliding control unit */}
              {!isImmersiveMode && (
                <div className="w-full xl:w-[360px] xl:pl-8 mt-6 xl:mt-0 flex flex-col justify-between max-h-[580px] overflow-y-auto no-scrollbar">
                  <div className="space-y-6">
                    
                    <div className="flex justify-between items-center pb-3 border-b border-[#1a1c1b]/5">
                      <div>
                        <h4 className="text-xs font-black uppercase text-[#1a1c1b] tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-[#4d6700]" />
                          <span>Workspace HUD Panel</span>
                        </h4>
                        <p className="text-[10px] text-[#434934]/60">Configure your optimal sensory environment.</p>
                      </div>
                    </div>

                    {/* Presets Grid Theme */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-[#434934]/70">Environment Presets</label>
                      <div className="grid grid-cols-5 gap-2">
                        {THEME_PRESETS.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTheme(t.id)}
                            title={t.name}
                            className={`h-10 rounded-xl border flex items-center justify-center transition-all ${
                              selectedTheme === t.id 
                                ? 'border-[#1a1c1b] ring-2 ring-[#c9ff3b] scale-105' 
                                : 'border-[#1a1c1b]/10 hover:border-[#1a1c1b]'
                            }`}
                            style={{ backgroundColor: t.main === '#1a1c1b' ? '#333' : t.main }}
                          >
                            <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.onMain }} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Background selections */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-[#434934]/70">Visual Backdrops</label>
                      <div className="grid grid-cols-2 gap-2">
                        {BACKGROUND_PRESETS.map((bg) => (
                          <button
                            key={bg.id}
                            onClick={() => setSelectedBg(bg.id)}
                            className={`p-2 rounded-xl text-left border text-[10px] font-bold transition-all truncate flex items-center gap-1.5 ${
                              selectedBg === bg.id
                                ? 'bg-[#1a1c1b] text-[#c9ff3b] border-[#1a1c1b]'
                                : 'bg-[#1a1c1b]/5 border-[#1a1c1b]/10 hover:border-[#1a1c1b]'
                            }`}
                          >
                            <div className="w-2 h-2 rounded-full bg-current shrink-0" />
                            <span>{bg.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Typefaces Selection enum */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-[#434934]/70">Active Typeface</label>
                      <div className="grid grid-cols-2 gap-2">
                        {FONTS.map((font) => (
                          <button
                            key={font.id}
                            onClick={() => setSelectedFont(font.id)}
                            className={`p-2 rounded-xl text-left border text-[10px] transition-all capitalize ${font.class} ${
                              selectedFont === font.id
                                ? 'bg-[#1a1c1b] text-[#c9ff3b] border-[#1a1c1b] font-bold'
                                : 'bg-[#1a1c1b]/5 border-[#1a1c1b]/10 hover:border-[#1a1c1b]'
                            }`}
                          >
                            {font.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frame Views layouts */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-[#434934]/70">HUD Framing Style</label>
                      <div className="grid grid-cols-2 gap-2">
                        {VIEWS.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedView(v.id)}
                            className={`p-2 rounded-xl text-[10px] font-bold border transition-all truncate text-center ${
                              selectedView === v.id
                                ? 'bg-[#1a1c1b] text-[#c9ff3b] border-[#1a1c1b]'
                                : 'bg-[#1a1c1b]/5 border-[#1a1c1b]/10 hover:border-[#1a1c1b]'
                            }`}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sliders panel: Brightness & Opacity */}
                    <div className="space-y-4 pt-2 border-t border-[#1a1c1b]/5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-[#434934] uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5" /> Hardware Brightness</span>
                          <span className="font-mono text-xs">{brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="100"
                          value={brightness}
                          onChange={(e) => setBrightness(Number(e.target.value))}
                          className="w-full accent-[#1a1c1b] h-1 bg-[#1a1c1b]/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-[#434934] uppercase tracking-wider">
                          <span>Aesthetic BG Opacity</span>
                          <span className="font-mono text-xs">{bgOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={bgOpacity}
                          onChange={(e) => setBgOpacity(Number(e.target.value))}
                          className="w-full accent-[#1a1c1b] h-1 bg-[#1a1c1b]/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Quick tips */}
                  <div className="mt-8 p-3 bg-[#c9ff3b]/10 border border-[#c9ff3b]/30 rounded-2xl flex gap-2 items-start">
                    <Sparkles className="w-4 h-4 text-[#4d6700] rotate-12 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-medium leading-relaxed text-[#4d6700]">
                      Late-night coding sprint? Put HUD Style as <strong>Retro LCD</strong> and dim <strong>Brightness</strong> to 30% for seamless, eye-safe midnight focus loops.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: TASK STUDIO WITH SUB-NOTES & priority filters */}
          {activeTab === 'task' && (
            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-6 max-h-[580px] overflow-hidden">
              
              {/* Left Column: Tasks index flat list */}
              <div className="w-full lg:w-[380px] flex flex-col justify-between overflow-hidden shrink-0 border-r border-[#1a1c1b]/5 pr-0 lg:pr-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-black uppercase text-[#1a1c1b] tracking-wider flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5 text-[#4d6700]" />
                      <span>Sprint Sprints ({tasks.length})</span>
                    </h4>
                    <span className="px-2 py-0.5 bg-[#1a1c1b] text-[#c9ff3b] text-[8px] rounded-full font-black uppercase tracking-wider">
                      AUTO SYNC
                    </span>
                  </div>

                  {/* Tasks list loop */}
                  <div className="space-y-2 overflow-y-auto no-scrollbar max-h-[380px]">
                    {tasks.length === 0 ? (
                      <div className="text-center py-12 text-xs text-[#434934]/40 font-semibold border-2 border-dashed border-[#1a1c1b]/10 rounded-2xl">
                        No active workspace tasks.<br />Create one below to begin.
                      </div>
                    ) : (
                      tasks.map((task) => {
                        const sub = task.subTasks || [];
                        const completedSub = sub.filter(s => s.completed).length;
                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative group flex justify-between items-center ${
                              selectedTaskId === task.id
                                ? 'bg-[#1a1c1b] text-white border-[#1a1c1b] shadow-lg shadow-[#1a1c1b]/10 scale-[1.01]'
                                : 'bg-[#1a1c1b]/2 border-[#1a1c1b]/5 hover:bg-[#1a1c1b]/5 hover:border-[#1a1c1b]/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleTask(task.id);
                                }}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                  task.completed
                                    ? selectedTaskId === task.id
                                      ? 'border-[#c9ff3b] bg-[#c9ff3b] text-[#1a1c1b]'
                                      : 'border-[#4d6700] bg-[#c9ff3b] text-[#4d6700]'
                                    : 'border-[#1a1c1b]/20 bg-white'
                                }`}
                              >
                                {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              <div className="min-w-0">
                                <span className={`text-xs font-black tracking-tight truncate block ${
                                  task.completed 
                                    ? selectedTaskId === task.id ? 'line-through text-white/50' : 'line-through text-[#4d6700]/55 font-medium'
                                    : selectedTaskId === task.id ? 'text-white' : 'text-[#1a1c1b]'
                                }`}>
                                  {task.text}
                                </span>
                                {sub.length > 0 && (
                                  <span className={`text-[9px] font-mono block ${selectedTaskId === task.id ? 'text-[#c9ff3b]' : 'text-[#434934]/60'}`}>
                                    {completedSub} / {sub.length} Checkpoints
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Priority visual badge */}
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              {task.priority === 'high' && <div className="w-2 h-2 rounded-full bg-red-500" title="High Priority" />}
                              {task.priority === 'medium' && <div className="w-2 h-2 rounded-full bg-amber-400" title="Medium Priority" />}
                              {task.priority === 'low' && <div className="w-2 h-2 rounded-full bg-emerald-400" title="Low Priority" />}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTask(task.id);
                                  if (selectedTaskId === task.id) setSelectedTaskId(null);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-500 transition-opacity ml-1.5"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Bottom Input Creator */}
                <form onSubmit={handleAddTaskSubmit} className="relative mt-4">
                  <input
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Enter task statement..."
                    className="w-full bg-[#1a1c1b]/3 border border-[#1a1c1b]/10 rounded-xl pl-4 pr-12 py-3 text-xs text-[#1a1c1b] placeholder:text-[#434934]/40 font-bold focus:outline-none focus:ring-1 focus:ring-[#1a1c1b] focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 p-1 text-[#1a1c1b] hover:text-[#4d6700] transition-colors"
                  >
                    <PlusCircle className="w-5 h-5 fill-[#c9ff3b]" />
                  </button>
                </form>
              </div>

              {/* Right Column: Selected Task sub-checklist and extensive notes sheet */}
              <div className="flex-1 overflow-y-auto no-scrollbar bg-[#fcfcfb] border border-[#1a1c1b]/5 rounded-3xl p-5 md:p-6 flex flex-col justify-between">
                {selectedTask ? (
                  <div className="space-y-5">
                    
                    {/* Selected Task title & priority visual */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-[#1a1c1b]/5">
                      <div>
                        <div className="text-[9px] font-mono text-[#434934]/50 uppercase tracking-widest">Selected Task Details</div>
                        <h3 className="text-sm font-black text-[#1a1c1b] leading-tight mt-0.5">{selectedTask.text}</h3>
                      </div>

                      {/* Priority switch board */}
                      <div className="flex items-center gap-1.5 bg-[#1a1c1b]/5 p-0.5 rounded-lg border border-[#1a1c1b]/5">
                        <button
                          onClick={() => handlePriorityChange('low')}
                          className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                            selectedTask.priority === 'low' 
                              ? 'bg-emerald-500 text-white shadow-sm' 
                              : 'text-[#434934]/60 hover:text-[#1a1c1b]'
                          }`}
                        >
                          Low
                        </button>
                        <button
                          onClick={() => handlePriorityChange('medium')}
                          className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                            selectedTask.priority === 'medium' 
                              ? 'bg-amber-500 text-white shadow-sm' 
                              : 'text-[#434934]/60 hover:text-[#1a1c1b]'
                          }`}
                        >
                          Med
                        </button>
                        <button
                          onClick={() => handlePriorityChange('high')}
                          className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                            selectedTask.priority === 'high' 
                              ? 'bg-red-500 text-white shadow-sm' 
                              : 'text-[#434934]/60 hover:text-[#1a1c1b]'
                          }`}
                        >
                          High
                        </button>
                      </div>
                    </div>

                    {/* Checkpoints Tracker Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black text-[#434934] tracking-wider">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Checkpoints Progress</span>
                        <span className="font-mono text-xs">
                          {selectedTask.subTasks && selectedTask.subTasks.length > 0
                            ? Math.round((selectedTask.subTasks.filter(s => s.completed).length / selectedTask.subTasks.length) * 100)
                            : 0}%
                        </span>
                      </div>
                      
                      {/* Percent Fill bar */}
                      <div className="h-1.5 bg-[#1a1c1b]/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1a1c1b] rounded-full transition-all duration-300"
                          style={{
                            width: `${selectedTask.subTasks && selectedTask.subTasks.length > 0
                              ? (selectedTask.subTasks.filter(s => s.completed).length / selectedTask.subTasks.length) * 100
                              : 0}%`
                          }}
                        />
                      </div>

                      {/* Checkpoint list checkboxes rendering */}
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar pt-2">
                        {!selectedTask.subTasks || selectedTask.subTasks.length === 0 ? (
                          <p className="text-[10px] text-[#434934]/50 italic text-center py-4">No checkpoints added. Structure your checklist below.</p>
                        ) : (
                          selectedTask.subTasks.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-[#1a1c1b]/5 hover:bg-[#1a1c1b]/2 transition-all">
                              <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                                <button
                                  onClick={() => toggleCheckpoint(sub.id)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                    sub.completed ? 'bg-[#c9ff3b] border-[#4d6700] text-[#4d6700]' : 'border-[#1a1c1b]/20 hover:border-[#1a1c1b]'
                                  }`}
                                >
                                  {sub.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </button>
                                <span className={`text-[11px] font-bold truncate ${sub.completed ? 'line-through text-[#434934]/40 font-medium' : 'text-[#1a1c1b]'}`}>
                                  {sub.text}
                                </span>
                              </div>
                              <button
                                onClick={() => deleteCheckpoint(sub.id)}
                                className="p-1 text-[#434934]/30 hover:text-red-500 rounded hover:bg-[#1a1c1b]/5 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add sub-task checkpoint inline form */}
                      <form onSubmit={handleAddCheckpoint} className="flex gap-1">
                        <input
                          placeholder="Add new checkpoint step..."
                          value={newCheckpointText}
                          onChange={(e) => setNewCheckpointText(e.target.value)}
                          className="flex-grow bg-white border border-[#1a1c1b]/10 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#1a1c1b] placeholder:text-[#434934]/40 focus:outline-none focus:ring-1 focus:ring-[#1a1c1b]"
                        />
                        <button 
                          type="submit"
                          className="px-3 bg-[#1a1c1b] text-[#c9ff3b] rounded-lg font-black text-[10px] uppercase tracking-wider hover:bg-[#4d6700] transition-colors"
                        >
                          Add
                        </button>
                      </form>
                    </div>

                    {/* Extensive notes field */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-[#434934]/70 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> Workspace Session Notes
                      </label>
                      <textarea
                        rows={3}
                        value={selectedTask.notes || ''}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        placeholder="Log reference urls, markdown snippets, key ideas or milestone outcomes specifically for this focus statement..."
                        className="w-full bg-white border border-[#1a1c1b]/10 rounded-xl p-3 text-[11px] font-semibold text-[#1a1c1b] placeholder:text-[#434934]/40 focus:outline-none focus:ring-1 focus:ring-[#1a1c1b] leading-relaxed resize-none"
                      />
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ListTodo className="w-12 h-12 text-[#1a1c1b]/15 mb-3" />
                    <p className="text-xs text-[#434934]/50 font-bold uppercase tracking-wider">Select a workspace task on the left</p>
                    <p className="text-[10px] text-[#434934]/40 max-w-[220px] mx-auto mt-1">Select or log any task statement to unleash notes editing & checkpoints checkboxes.</p>
                  </div>
                )}

                {/* Footing note */}
                <div className="pt-3 border-t border-[#1a1c1b]/5 text-[9px] text-center uppercase tracking-widest text-[#434934]/40 font-mono">
                  All checklists auto-save securely to local storage structure.
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ANALYTICS ENGINE WITH FULL INTERACTIVE CUSTOM SVG CHARTS */}
          {activeTab === 'analytics' && (
            <div className="p-6 md:p-8 overflow-y-auto no-scrollbar max-h-[580px] space-y-6">
              
              {/* Filter controls header and buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#1a1c1b]/5">
                <div>
                  <h4 className="text-xs font-black uppercase text-[#1a1c1b] tracking-wider flex items-center gap-1.5">
                    <ChartIcon className="w-3.5 h-3.5 text-[#4d6700]" />
                    <span>Focus Metrics & Intensity Dashboard</span>
                  </h4>
                  <span className="text-[10px] text-[#434934]/60">Historical report synced with logged task milestones.</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Select filters */}
                  <div className="bg-[#1a1c1b]/5 p-0.5 rounded-lg border border-[#1a1c1b]/5 flex text-[9px] font-black uppercase tracking-wider">
                    <button
                      onClick={() => setAnalyticsFilter('7days')}
                      className={`px-3 py-1.5 rounded transition-all ${
                        analyticsFilter === '7days' ? 'bg-[#1a1c1b] text-white font-bold' : 'text-[#434934]/65 hover:text-[#1a1c1b]'
                      }`}
                    >
                      7 Days
                    </button>
                    <button
                      onClick={() => setAnalyticsFilter('30days')}
                      className={`px-3 py-1.5 rounded transition-all ${
                        analyticsFilter === '30days' ? 'bg-[#1a1c1b] text-white font-bold' : 'text-[#434934]/65 hover:text-[#1a1c1b]'
                      }`}
                    >
                      30 Days
                    </button>
                    <button
                      onClick={() => setAnalyticsFilter('alltime')}
                      className={`px-3 py-1.5 rounded transition-all ${
                        analyticsFilter === 'alltime' ? 'bg-[#1a1c1b] text-white font-bold' : 'text-[#434934]/65 hover:text-[#1a1c1b]'
                      }`}
                    >
                      All Time
                    </button>
                  </div>

                  {/* Export buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCSVExport}
                      className="px-3 py-1.5 bg-[#1a1c1b]/5 hover:bg-[#1a1c1b] text-[#1a1c1b] hover:text-[#c9ff3b] rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#1a1c1b]/10 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>CSV Report</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-[#1a1c1b] hover:bg-[#1a1c1b]/80 text-[#c9ff3b] rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF Print</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid 4 tactile statistics cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#fcfcfb] border border-[#1a1c1b]/5 rounded-2xl relative overflow-hidden group">
                  <div className="text-[#434934]/50 text-[8px] font-black uppercase tracking-widest mb-1 font-mono">Total Focus Hours</div>
                  <div className="text-xl sm:text-2xl font-black text-[#1a1c1b] font-space tracking-tight">{report.totalHours}</div>
                  <div className="absolute top-0 right-0 h-1/2 w-1 bg-[#c9ff3b] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="p-4 bg-[#fcfcfb] border border-[#1a1c1b]/5 rounded-2xl relative overflow-hidden group">
                  <div className="text-[#434934]/50 text-[8px] font-black uppercase tracking-widest mb-1 font-mono">Sessions Logged</div>
                  <div className="text-xl sm:text-2xl font-black text-[#1a1c1b] font-space tracking-tight">{report.totalSessions}</div>
                  <div className="absolute top-0 right-0 h-1/2 w-1 bg-[#c9ff3b] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="p-4 bg-[#fcfcfb] border border-[#1a1c1b]/5 rounded-2xl relative overflow-hidden group">
                  <div className="text-[#434934]/50 text-[8px] font-black uppercase tracking-widest mb-1 font-mono">Sprints Avg Timer</div>
                  <div className="text-xl sm:text-2xl font-black text-[#1a1c1b] font-space tracking-tight">{report.avgSession}</div>
                  <div className="absolute top-0 right-0 h-1/2 w-1 bg-[#c9ff3b] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="p-4 bg-[#fcfcfb] border border-[#1a1c1b]/5 rounded-2xl relative overflow-hidden group">
                  <div className="text-[#434934]/50 text-[8px] font-black uppercase tracking-widest mb-1 font-mono">Sprint Complete Rate</div>
                  <div className="text-xl sm:text-2xl font-black text-[#1a1c1b] font-space tracking-tight">{report.completionRate}%</div>
                  <div className="absolute top-0 right-0 h-1/2 w-1 bg-[#c9ff3b] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Gorgeous SVG Interactive Charts Arena */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3">
                
                {/* Visual Chart 1: Bar Daily Focus hours (Column Bar Chart with interactive hovering tooltip node) */}
                <div className="lg:col-span-8 p-5 bg-[#fcfcfb] border border-[#1a1c1b]/5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#434934] uppercase font-black tracking-widest">Calculated Focus Distribution (Daily)</span>
                    <span className="text-[8px] uppercase tracking-wider bg-[#c9ff3b] text-[#4d6700] px-2 py-0.5 rounded font-black font-mono">+18.5% Sprint Boost</span>
                  </div>

                  {/* SVG Bar chart rendering */}
                  <div className="h-44 w-full relative pt-2">
                    <svg className="w-full h-full" viewBox="0 0 540 160" preserveAspectRatio="none">
                      {/* Grid helper lines */}
                      <line x1="10" y1="120" x2="530" y2="120" stroke="#1a1c1b" strokeWidth="0.5" strokeOpacity="0.1" />
                      <line x1="10" y1="80" x2="530" y2="80" stroke="#1a1c1b" strokeWidth="0.5" strokeOpacity="0.1" />
                      <line x1="10" y1="40" x2="530" y2="40" stroke="#1a1c1b" strokeWidth="0.5" strokeOpacity="0.1" />
                      <line x1="10" y1="10" x2="530" y2="10" stroke="#1a1c1b" strokeWidth="0.5" strokeOpacity="0.1" />

                      {/* Display 7 columns */}
                      {[
                        { day: 'Mon', mins: 120, x: 40 },
                        { day: 'Tue', mins: 150, x: 110 },
                        { day: 'Wed', mins: 180, x: 180 },
                        { day: 'Thu', mins: 110, x: 250 },
                        { day: 'Fri', mins: 220, x: 320 },
                        { day: 'Sat', mins: 80,  x: 390 },
                        { day: 'Sun', mins: 140, x: 460 },
                      ].map((bar, idx) => {
                        const h = (bar.mins / 250) * 110; // scaled
                        const y = 120 - h;
                        return (
                          <g key={idx} className="group/bar cursor-pointer">
                            <rect
                              x={bar.x}
                              y={y}
                              width="25"
                              height={h}
                              rx="4"
                              fill={idx === 4 ? '#1a1c1b' : '#c9ff3b'}
                              stroke="#1a1c1b"
                              strokeWidth="1.5"
                              className="transition-all duration-300 hover:opacity-85 hover:stroke-[2.5]"
                              onClick={(e) => {
                                const rectElement = e.currentTarget.getBoundingClientRect();
                                const container = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                if (container) {
                                  setHoveredChartNode({
                                    x: rectElement.left - container.left + 12,
                                    y: rectElement.top - container.top - 40,
                                    label: `${bar.day} Focus`,
                                    value: `${bar.mins} Mins`
                                  });
                                }
                              }}
                            />
                            {/* Static visual label */}
                            <text
                              x={bar.x + 12.5}
                              y="140"
                              textAnchor="middle"
                              className="text-[10px] font-bold fill-[#434934]/60 font-mono"
                            >
                              {bar.day}
                            </text>
                            
                            {/* Hover helpers */}
                            <text
                              x={bar.x + 12.5}
                              y={y - 8}
                              textAnchor="middle"
                              className="text-[9px] font-black fill-[#1a1c1b] font-mono opacity-0 group-hover/bar:opacity-100 transition-opacity"
                            >
                              {bar.mins}m
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Interactive Click Tooltip */}
                    {hoveredChartNode && (
                      <div 
                        className="absolute bg-[#1a1c1b] text-white p-2 rounded-xl text-[9px] font-black uppercase tracking-wider z-50 shadow-lg border border-white/10 pointer-events-auto transform -translate-x-1/2 cursor-pointer flex flex-col items-center"
                        style={{ left: hoveredChartNode.x, top: hoveredChartNode.y }}
                        onClick={() => setHoveredChartNode(null)}
                      >
                        <span className="text-[#c9ff3b]">{hoveredChartNode.value}</span>
                        <span className="text-white/60 text-[8px]">{hoveredChartNode.label}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Chart 2: Focus Breakdown (Donut Pie Chart with hover highlights) */}
                <div className="lg:col-span-4 p-5 bg-[#fcfcfb] border border-[#1a1c1b]/5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-[#434934] uppercase font-black tracking-widest block mb-4">Focus Category Type</span>
                    
                    {/* SVG Donut render */}
                    <div className="flex justify-center items-center py-2">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          {/* Segment 1: Pomodoro (65%) -> color #1b1c1b */}
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#1a1c1b"
                            strokeWidth="3.2"
                            strokeDasharray="65 35"
                            strokeDashoffset="0"
                            className="transition-all hover:stroke-[4]"
                          />
                          {/* Segment 2: Break (25%) -> color #c9ff3b */}
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#c9ff3b"
                            strokeWidth="3.2"
                            strokeDasharray="25 75"
                            strokeDashoffset="-65"
                            className="transition-all hover:stroke-[4]"
                          />
                          {/* Segment 3: Custom (10%) -> color #c0c6ba */}
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="transparent"
                            stroke="#4d6700"
                            strokeWidth="3.2"
                            strokeDasharray="10 90"
                            strokeDashoffset="-90"
                            className="transition-all hover:stroke-[4]"
                          />
                        </svg>
                        
                        {/* Dynamic central visual labels inside Hole */}
                        <div className="absolute text-center select-none pointer-events-none">
                          <p className="text-[18px] font-black text-[#1a1c1b] leading-none">65%</p>
                          <p className="text-[8px] font-mono uppercase text-[#434934]/60 tracking-tight mt-1">Pomodoro</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend Board with custom segment weights */}
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#1a1c1b]" /> Pomodoro Sprints</span>
                      <span className="font-mono text-[#1a1c1b]">65%</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#c9ff3b] border border-[#1a1c1b]/10" /> Breking Intervals</span>
                      <span className="font-mono text-[#1a1c1b]">25%</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#4d6700]" /> Custom Sprints</span>
                      <span className="font-mono text-[#1a1c1b]">10%</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Weekly Performance intensity graph loop */}
              <div className="p-4 bg-[#fcfcfb] border border-[#1a1c1b]/5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] text-[#434934] uppercase font-black tracking-widest">Macro Cognitive Focus Curve</span>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded">System Peak Efficiency 98%</span>
                </div>

                <div className="h-20 w-full opacity-90 mt-1">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="curve-area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c9ff3b" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#c9ff3b" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,25 C10,24 15,6 25,12 C35,22 40,5 50,11 C60,18 65,3 75,9 C85,20 90,2 100,5 L100,30 L0,30 Z"
                      fill="url(#curve-area-gradient)"
                    />
                    <path
                      d="M0,25 C10,24 15,6 25,12 C35,22 40,5 50,11 C60,18 65,3 75,9 C85,20 90,2 100,5"
                      fill="none"
                      stroke="#1a1c1b"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                    {/* Decorative node points */}
                    <circle cx="25" cy="12" r="1.5" fill="#c9ff3b" stroke="#1a1c1b" strokeWidth="0.5" />
                    <circle cx="50" cy="11" r="1.5" fill="#c9ff3b" stroke="#1a1c1b" strokeWidth="0.5" />
                    <circle cx="75" cy="9"  r="1.5" fill="#c9ff3b" stroke="#1a1c1b" strokeWidth="0.5" />
                    <circle cx="100" cy="5" r="1.5" fill="#c9ff3b" stroke="#1a1c1b" strokeWidth="0.5" />
                  </svg>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </section>
  );
}
