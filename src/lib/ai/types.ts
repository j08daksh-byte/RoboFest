export type RecommendationType = 
  | 'SAFETY_WARNING' 
  | 'CUT_RECOMMENDATION' 
  | 'MAINTENANCE_RECOMMENDATION' 
  | 'MISSION_RECOMMENDATION' 
  | 'DIAGNOSTIC_EXPLANATION';

export interface AIRecommendation {
  id: string;
  type: RecommendationType;
  reason: string;
  evidence: Record<string, any>;
  confidence: number | 'UNKNOWN';
  status: 'ADVISORY' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  isDeterministic: boolean; // Differentiates AI vs Hard rule
}

export interface VisionCandidate {
  id: string;
  source: string;
  timestamp: string;
  detectedRegion: string;
  confidence: number;
  isSimulated: boolean;
  proposedCut?: {
    startPoint: { x: number; y: number; z: number };
    endPoint: { x: number; y: number; z: number };
  };
}

export interface RoboAssistResponse {
  answer: string;
  groundingSources: string[];
  recommendations?: AIRecommendation[];
}
