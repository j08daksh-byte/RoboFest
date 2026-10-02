import { create } from 'zustand';
import { CutDefinition, CutGeometry, CutMaterial, CutApprovalState } from './domain';
import { validateCut, estimateCut } from './validation';
import { usePlatformStore } from '../platformStore';

export interface PlannerState {
  plannedCuts: CutDefinition[];
  currentCutId: string | null;
  
  createCut: (geometry: CutGeometry, material: CutMaterial, missionId?: string) => string;
  updateCut: (id: string, updates: Partial<CutDefinition>) => void;
  validateCut: (id: string) => void;
  approveCut: (id: string) => boolean;
  cancelCut: (id: string) => void;
  setCurrentCut: (id: string | null) => void;
  clearPlanner: () => void;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  plannedCuts: [],
  currentCutId: null,

  createCut: (geometry, material, missionId) => {
    const id = `CUT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const newCut: CutDefinition = {
      id,
      missionId,
      sequenceNumber: get().plannedCuts.length + 1,
      geometry,
      material,
      estimate: estimateCut(geometry, material),
      validation: null,
      approvalState: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    set(state => ({ plannedCuts: [...state.plannedCuts, newCut] }));
    return id;
  },

  updateCut: (id, updates) => {
    set(state => ({
      plannedCuts: state.plannedCuts.map(cut => {
        if (cut.id !== id) return cut;
        // If geometry or material changed, drop validation and revert to DRAFT
        let needsRevalidation = false;
        if ((updates.geometry && updates.geometry !== cut.geometry) || 
            (updates.material && updates.material !== cut.material)) {
          needsRevalidation = true;
        }

        const newCut = { ...cut, ...updates, updatedAt: new Date().toISOString() };
        
        if (needsRevalidation) {
          newCut.validation = null;
          newCut.approvalState = 'DRAFT';
          if (newCut.geometry && newCut.material) {
            newCut.estimate = estimateCut(newCut.geometry, newCut.material);
          }
        }
        return newCut;
      })
    }));
  },

  validateCut: (id) => {
    const cut = get().plannedCuts.find(c => c.id === id);
    if (!cut) return;

    const safetyState = usePlatformStore.getState().safety;
    const validationResult = validateCut(cut.geometry, safetyState);

    let nextState: CutApprovalState = 'VALID';
    if (validationResult.overallRisk === 'BLOCKED') nextState = 'BLOCKED';
    else if (validationResult.overallRisk === 'MEDIUM' || validationResult.overallRisk === 'HIGH') nextState = 'WARNING';

    set(state => ({
      plannedCuts: state.plannedCuts.map(c => 
        c.id === id ? { ...c, validation: validationResult, approvalState: nextState, updatedAt: new Date().toISOString() } : c
      )
    }));
  },

  approveCut: (id) => {
    const cut = get().plannedCuts.find(c => c.id === id);
    if (!cut || !cut.validation) return false;

    if (cut.approvalState === 'BLOCKED' || cut.validation.overallRisk === 'BLOCKED') return false;

    set(state => ({
      plannedCuts: state.plannedCuts.map(c =>
        c.id === id ? { ...c, approvalState: 'APPROVED', updatedAt: new Date().toISOString() } : c
      )
    }));
    return true;
  },

  cancelCut: (id) => {
    set(state => ({
      plannedCuts: state.plannedCuts.map(c =>
        c.id === id ? { ...c, approvalState: 'CANCELLED', updatedAt: new Date().toISOString() } : c
      )
    }));
  },

  setCurrentCut: (id) => set({ currentCutId: id }),
  clearPlanner: () => set({ plannedCuts: [], currentCutId: null })
}));
