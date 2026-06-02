import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BentoGrid from './components/BentoGrid';
import SimplicityProcess from './components/SimplicityProcess';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import InteractiveModal from './components/InteractiveModal';
import { Task, SessionLog } from './types';

export default function App() {
  // Global States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [userTier, setUserTier] = useState<'free' | 'premium'>('free');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'trial' | 'pro' | null>(null);

  // Initialize status on mount
  useEffect(() => {
    // Initial standard tasks as seen in the mockup screenshot to look perfect out of the box
    const initialTasks: Task[] = [
      {
        id: 'task-1',
        text: 'Design System Update',
        completed: true,
        createdAt: Date.now() - 3600000
      },
      {
        id: 'task-2',
        text: 'Final Prototype Review',
        completed: false,
        createdAt: Date.now()
      }
    ];

    // LocalStorage loading
    const savedTasks = localStorage.getItem('zoned_tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        setTasks(initialTasks);
      }
    } else {
      setTasks(initialTasks);
    }

    const savedLogs = localStorage.getItem('zoned_logs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        setLogs([]);
      }
    }

    const savedTier = localStorage.getItem('zoned_tier');
    if (savedTier === 'premium') {
      setUserTier('premium');
    }
  }, []);

  // Sync to database simulated via localStorage
  const handleAddTask = (text: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      text,
      completed: false,
      createdAt: Date.now()
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    localStorage.setItem('zoned_tasks', JSON.stringify(updated));
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    localStorage.setItem('zoned_tasks', JSON.stringify(updated));
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem('zoned_tasks', JSON.stringify(updated));
  };

  const handleUpdateTask = (id: string, updatedFields: Partial<Task>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updatedFields } : t);
    setTasks(updated);
    localStorage.setItem('zoned_tasks', JSON.stringify(updated));
  };

  const handleAddSessionLog = (durationSeconds: number, type: 'Pomodoro' | 'Short Break' | 'Long Break' | 'Custom') => {
    const newLog: SessionLog = {
      id: `log-${Date.now()}`,
      durationSeconds,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      taskCount: tasks.filter(t => t.completed).length,
      type
    };
    const updated = [...logs, newLog];
    setLogs(updated);
    localStorage.setItem('zoned_logs', JSON.stringify(updated));
  };

  const handleActivatePremium = () => {
    setUserTier('premium');
    localStorage.setItem('zoned_tier', 'premium');
  };

  const handleSetObjectives = (target: string) => {
    // Customize starting tasks based on major objective selection
    const customizedTasks: Task[] = [
      {
        id: `task-custom-1`,
        text: `Setup Zoned workspace for ${target}`,
        completed: true,
        createdAt: Date.now()
      },
      {
        id: `task-custom-2`,
        text: `Complete first deep focus sprint session`,
        completed: false,
        createdAt: Date.now() + 1000
      }
    ];
    setTasks(customizedTasks);
    localStorage.setItem('zoned_tasks', JSON.stringify(customizedTasks));
  };

  const openTrialModal = () => {
    setModalType('trial');
    setModalOpen(true);
  };

  const openUpgradeModal = () => {
    setModalType('pro');
    setModalOpen(true);
  };

  return (
    <div className="bg-[#f9f9f7] text-[#1a1c1b] font-sans antialiased min-h-screen relative overflow-x-hidden selection:bg-[#c9ff3b] selection:text-[#4d6700]">
      
      {/* 1. Header Navigation */}
      <Navbar 
        onOpenTrialModal={openTrialModal} 
        onOpenUpgradeModal={openUpgradeModal} 
        userTier={userTier} 
      />

      {/* Main Sections */}
      <main className="pt-20">
        {/* 2. Hero Section */}
        <Hero 
          onOpenTrialModal={openTrialModal} 
          onOpenUpgradeModal={openUpgradeModal} 
          userTier={userTier} 
        />

        {/* 3. Capabilities Deck (Bento Grid) */}
        <BentoGrid 
          tasks={tasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleUpdateTask}
          logs={logs}
          onAddSessionLog={handleAddSessionLog}
          onOpenTrialModal={openTrialModal}
        />

        {/* 4. Process (Simplicity focus flow) */}
        <SimplicityProcess />

        {/* 5. Testimonials Review Block */}
        <Testimonials />

        {/* 6. Premium Tiers (Pricing cards) */}
        <Pricing 
          onOpenTrialModal={openTrialModal} 
          onOpenUpgradeModal={openUpgradeModal} 
          userTier={userTier} 
        />

        {/* 7. Collapsible Q&A Grid */}
        <FAQ />
      </main>

      {/* 8. Footer Block */}
      <Footer />

      {/* 9. Portal Level Modals (Subscribe checkout & Trial configurations) */}
      <InteractiveModal 
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalType(null);
        }}
        type={modalType}
        onActivatePremium={handleActivatePremium}
        onSetObjectives={handleSetObjectives}
      />

    </div>
  );
}
