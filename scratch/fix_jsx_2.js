const fs = require('fs');

// --- Sidebar.jsx ---
const sidebar = `import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Activity, ArrowLeft, Bot, Database, History, 
  Image, Layers, PieChart, Ship, ShieldAlert,
  Wrench, Zap, LayoutDashboard, Crosshair, 
  Thermometer, Settings, Users, Settings2, BarChart2
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const primaryNavGroups = [
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Live Dashboard', path: '/operations/live', icon: Activity, badge: 'Live', highlight: true },
        { label: 'Missions', path: '/operations/missions', icon: Crosshair },
        { label: 'Sensors & Telemetry', path: '/operations/sensors', icon: Zap },
      ]
    },
    {
      title: 'FLEET & ASSETS',
      items: [
        { label: 'Active Projects', path: '/ships', icon: Ship },
        { label: 'Materials Tracking', path: '/materials', icon: PieChart },
        { label: 'Part Tracking', path: '/parts', icon: Layers },
      ]
    },
    {
      title: 'MAINTENANCE & SAFETY',
      items: [
        { label: 'Robot Health', path: '/maintenance/health', icon: Wrench },
        { label: 'Safety Logs', path: '/maintenance/safety', icon: ShieldAlert },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { label: 'AI Assistant', path: '/intelligence/ai', icon: Bot, highlight: true },
        { label: 'Event History', path: '/intelligence/history', icon: History },
        { label: 'Analytics', path: '/intelligence/analytics', icon: BarChart2 },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { label: 'User Management', path: '/settings/users', icon: Users },
        { label: 'System Config', path: '/settings/config', icon: Settings2 },
      ]
    }
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={\`fixed top-0 bottom-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 \${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }\`}
      >
        <div className="h-16 px-5 border-b border-dark-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
              <Activity className="w-4 h-4 text-accent-cyan animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-white">TITAN-CUT</span>
              <span className="block text-[9px] font-mono text-neutral-400">CONTROL CENTER</span>
            </div>
          </Link>
          <Link
            to="/"
            title="Back to Public Site"
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-4 mx-3 my-3 rounded-lg bg-neutral-900/90 border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">Unit Alpha-01</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              ACTIVE
            </span>
          </div>
          <div className="text-xs font-semibold text-white truncate">MV Ocean Voyager</div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
          {primaryNavGroups.map((group, i) => (
            <div key={i}>
              <h3 className="px-3 text-[10px] font-mono font-semibold text-neutral-500 uppercase tracking-wider mb-2">{group.title}</h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        \`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group \${
                          isActive
                            ? 'bg-neutral-800 text-white border border-neutral-700 font-semibold'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-900/70 border border-transparent'
                        } \${item.highlight ? 'text-cyan-400 hover:text-cyan-300' : ''}\`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
`;
fs.writeFileSync('D:\\\\Webs\\\\ship-cutter\\\\client\\\\src\\\\components\\\\layout\\\\Sidebar.jsx', sidebar);

// --- DashboardLayout.jsx ---
const layout = `import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Wifi, Ship, User, ShieldAlert } from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/operations/live':
        return 'Live Operations Center';
      case '/operations/missions':
        return 'Mission Planner';
      case '/operations/sensors':
        return 'Sensors & Telemetry';
      case '/ships':
        return 'Vessel Fleet Management';
      case '/parts':
        return 'Part Tracking';
      case '/materials':
        return 'Materials Tracking';
      case '/maintenance/health':
        return 'Robot Health';
      case '/maintenance/safety':
        return 'Safety Logs';
      case '/intelligence/ai':
        return 'AI Assistant';
      case '/intelligence/history':
        return 'Event History';
      case '/intelligence/analytics':
        return 'Analytics Dashboard';
      case '/settings/users':
        return 'User Management';
      case '/settings/config':
        return 'System Configuration';
      default:
        return 'TITAN-CUT Platform';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-dark-card/90 backdrop-blur-md border-b border-dark-border px-4 sm:px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-white">
                {getPageTitle(location.pathname)}
              </h1>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Autonomous Ship Dismantling & Metallurgy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              className="flex items-center gap-2 py-1.5 px-4 rounded bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest text-xs uppercase shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
              onClick={() => alert('Global E-Stop Triggered (Placeholder)')}
            >
              <ShieldAlert className="w-4 h-4" />
              E-STOP
            </button>
            <div className="hidden md:flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-dark-border text-xs text-neutral-300">
              <Ship className="w-3.5 h-3.5 text-accent-cyan" />
              <span className="font-semibold text-white">MV Ocean Voyager</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900/60 px-2.5 py-1.5 rounded-lg border border-dark-border">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px] text-emerald-400 hidden sm:inline">99.8%</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-mono text-neutral-300">
              <User className="w-4 h-4" />
            </div>
          </div>
        </header>
        <main className={\`flex-1 flex flex-col bg-black \${location.pathname === '/operations/live' ? 'overflow-hidden' : 'overflow-y-auto'}\`}>
          {location.pathname === '/operations/live' ? (
            <Outlet />
          ) : (
            <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('D:\\\\Webs\\\\ship-cutter\\\\client\\\\src\\\\components\\\\layout\\\\DashboardLayout.jsx', layout);

// --- PlaceholderPage.jsx ---
const placeholder = `import React from 'react';

export default function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-neutral-900 border border-neutral-800 rounded-lg p-8">
      <div className="text-accent-cyan font-mono text-sm tracking-widest mb-4">
        {title.toUpperCase()}
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">
        FEATURE NOT YET INTEGRATED
      </h2>
      <p className="text-neutral-400 text-center max-w-md">
        This section is part of the final TITAN-CUT platform architecture, but its operational logic has not yet been merged from RoboFest.
      </p>
    </div>
  );
}
`;
fs.writeFileSync('D:\\\\Webs\\\\ship-cutter\\\\client\\\\src\\\\pages\\\\PlaceholderPage.jsx', placeholder);

// --- App.jsx ---
const appjsx = `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ScrollToHash from './components/common/ScrollToHash';
import ErrorBoundary from './components/common/ErrorBoundary';

import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';

import DashboardPage from './pages/DashboardPage';
import PartTrackingPage from './pages/PartTrackingPage';
import MaterialPage from './pages/MaterialPage';
import MaintenancePage from './pages/MaintenancePage';
import FeasibilityPage from './pages/FeasibilityPage';
import HistoryPage from './pages/HistoryPage';
import PhotosPage from './pages/PhotosPage';
import ShipsPage from './pages/ShipsPage';
import ChatbotPage from './pages/ChatbotPage';
import SensorsPage from './pages/SensorsPage';
import DatabaseViewerPage from './pages/DatabaseViewerPage';
import OperationsLivePage from './pages/OperationsLivePage';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToHash />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          <Route element={<DashboardLayout />}>
            <Route path="/operations/live" element={<OperationsLivePage />} />
            <Route path="/operations/missions" element={<PlaceholderPage title="Missions" />} />
            <Route path="/operations/sensors" element={<SensorsPage />} />
            <Route path="/ships" element={<ShipsPage />} />
            <Route path="/materials" element={<MaterialPage />} />
            <Route path="/parts" element={<PartTrackingPage />} />
            <Route path="/maintenance/health" element={<MaintenancePage />} />
            <Route path="/maintenance/safety" element={<PlaceholderPage title="Safety Logs" />} />
            <Route path="/intelligence/ai" element={<ChatbotPage />} />
            <Route path="/intelligence/history" element={<HistoryPage />} />
            <Route path="/intelligence/analytics" element={<DashboardPage />} />
            <Route path="/settings/users" element={<PlaceholderPage title="User Management" />} />
            <Route path="/settings/config" element={<PlaceholderPage title="System Configuration" />} />
            <Route path="/photos" element={<PhotosPage />} />
            <Route path="/feasibility" element={<FeasibilityPage />} />
            <Route path="/database" element={<DatabaseViewerPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
`;
fs.writeFileSync('D:\\\\Webs\\\\ship-cutter\\\\client\\\\src\\\\App.jsx', appjsx);
console.log('Fixed files');
