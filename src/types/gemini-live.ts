import { Message } from '../types';
import { AssistantConfig } from '../config/assistantConfig';

export interface SystemLog {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning' | 'tool';
  message: string;
  details?: any;
}

export interface UseGeminiLiveProps {
  onSpeakingChanged?: (isSpeaking: boolean) => void;
  onImageGenerated?: (imageUrl: string) => void;
  memories?: any[];
  onMemoriesUpdated?: (memories: any[]) => void;
  userProfile?: any;
  onDiagramGenerated?: (code: string) => void;
  onVisualizingChanged?: (isVisualizing: boolean) => void;
  vaultInfo?: any;
  initialHistory?: any[];
  onDashboardUpdated?: (data: { headlines: string[], weather: any }) => void;
  onNotesUpdated?: (notes: any[]) => void;
  onTasksUpdated?: (tasks: any[]) => void;
  onYouTubePlay?: (videoId: string) => void;
  onNavigationRequested?: (destination: string) => void;
  attachedFiles?: { name: string, data: string, mimeType: string }[];
  assistantConfig?: AssistantConfig;
  isHardMuted?: boolean;
  voiceVolume?: number;
}
