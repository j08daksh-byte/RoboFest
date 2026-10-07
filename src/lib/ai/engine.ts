import { AIRecommendation, RoboAssistResponse, VisionCandidate } from './types';
import { prisma } from '@/lib/prisma';
import { evaluateServerSafety } from '../safety/serverSafety';



export async function processRoboAssistQuery(query: string, userId: string): Promise<RoboAssistResponse> {
  // Real grounding based on backend state
  const q = query.toLowerCase();
  
  if (q.includes('safety') || q.includes('emergency')) {
    const state = await prisma.runtimeState.findUnique({ where: { id: 'singleton' } });
    if (!state) return { answer: 'System state uninitialized.', groundingSources: [] };
    
    if (state.emergencyActive) {
      return {
        answer: 'The Emergency Stop is currently ACTIVE.',
        groundingSources: ['RuntimeState']
      };
    } else {
      return {
        answer: 'Safety systems are nominal. E-Stop is inactive.',
        groundingSources: ['RuntimeState']
      };
    }
  }

  if (q.includes('health') || q.includes('maintenance')) {
    const component = await prisma.componentHealth.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    
    if (component && (component.status === 'CRITICAL' || component.status === 'FAULT')) {
      return {
        answer: `CRITICAL issue detected in component ${component.componentId}: Status is ${component.status}`,
        groundingSources: ['ComponentHealth']
      };
    } else {
      return {
        answer: 'All systems appear healthy based on recent events.',
        groundingSources: ['ComponentHealth']
      };
    }
  }
  
  if (q.includes('mission') || q.includes('cut')) {
    const missions = await prisma.mission.findMany({
      where: { status: 'RUNNING' },
      include: { cutRecords: true }
    });
    if (missions.length > 0) {
      const active = missions[0];
      return {
        answer: `Mission ${active.shipName} is currently RUNNING with ${active.cutRecords.length} planned cuts.`,
        groundingSources: ['Mission', 'CutRecord']
      };
    } else {
      return {
        answer: 'There are no currently running missions.',
        groundingSources: ['Mission']
      };
    }
  }

  return {
    answer: 'I cannot answer this query based on currently available operational data. No live AI hallucination permitted.',
    groundingSources: []
  };
}

export function simulateVisionCandidate(): VisionCandidate {
  // A completely deterministic, safely simulated vision candidate
  return {
    id: 'VIS-' + Date.now(),
    source: 'SIMULATED_CAMERA_1',
    timestamp: new Date().toISOString(),
    detectedRegion: 'HULL_SECTION_A',
    confidence: 0.85,
    isSimulated: true,
    proposedCut: {
      startPoint: { x: 10, y: 0, z: 5 },
      endPoint: { x: 50, y: 0, z: 5 }
    }
  };
}
