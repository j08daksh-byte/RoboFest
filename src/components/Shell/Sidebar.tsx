"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MonitorDot, 
  Map, 
  Crosshair, 
  BrainCircuit, 
  Box, 
  Activity, 
  HeartPulse, 
  FileBadge, 
  Camera,
  AlertTriangle,
  CloudLightning,
  Power,
  BellRing,
  Ship,
  Scan,
  Anchor,
  MessageSquare,
  BarChart4,
  Gauge,
  LineChart,
  History,
  Wrench,
  BookOpen,
  Users,
  PlaySquare
} from 'lucide-react';

const navGroups = [
  {
    title: 'Operations',
    items: [
      { name: 'Command Center', path: '/command-center', icon: MonitorDot },
      { name: 'Missions', path: '/operations/missions', icon: Map },
      { name: 'Cutting Planner', path: '/operations/planner', icon: Crosshair },
      { name: 'AI Cut Strategy', path: '/operations/cut-strategy', icon: BrainCircuit },
    ]
  },
  {
    title: 'Robot',
    items: [
      { name: 'Digital Twin', path: '/robot/twin', icon: Box },
      { name: 'Sensors', path: '/robot/sensors', icon: Activity },
      { name: 'Robot Health', path: '/robot/health', icon: HeartPulse },
      { name: 'Robot Passport', path: '/robot/passport', icon: FileBadge },
      { name: 'Vision', path: '/robot/vision', icon: Camera },
    ]
  },
  {
    title: 'Safety',
    items: [
      { name: 'Safety & Hazards', path: '/safety/hazards', icon: AlertTriangle },
      { name: 'Weather / Site', path: '/safety/weather', icon: CloudLightning },
      { name: 'Emergency Control', path: '/safety/emergency', icon: Power },
      { name: 'Notifications', path: '/safety/notifications', icon: BellRing },
    ]
  },
  {
    title: 'Ship',
    items: [
      { name: 'Ship / Hull', path: '/ship/map', icon: Ship },
      { name: 'Internal Structure', path: '/ship/internal-structure', icon: Scan },
      { name: 'Digital Shipyard', path: '/ship/shipyard', icon: Anchor },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { name: 'ROBO-ASSIST', path: '/intelligence/robo-assist', icon: MessageSquare },
      { name: 'Analytics', path: '/intelligence/analytics', icon: BarChart4 },
      { name: 'Telemetry', path: '/intelligence/telemetry', icon: Gauge },
      { name: 'Performance', path: '/intelligence/performance', icon: LineChart },
    ]
  },
  {
    title: 'Records',
    items: [
      { name: 'Event History', path: '/records/history', icon: History },
      { name: 'Maintenance', path: '/records/maintenance', icon: Wrench },
      { name: 'Knowledge Base', path: '/records/knowledge-base', icon: BookOpen },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Users / Roles', path: '/system/users', icon: Users },
      { name: 'Guided Demo', path: '/system/demo', icon: PlaySquare },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        RF6 PLATFORM
      </div>
      <nav className="sidebar-nav">
        {navGroups.map((group, i) => (
          <div key={i} className="nav-group">
            <div className="nav-group-title">{group.title}</div>
            {group.items.map((item, j) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (pathname === '/' && item.path === '/command-center');
              return (
                <Link key={j} href={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
