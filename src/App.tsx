import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Settings } from 'lucide-react';

import { useGeminiLive } from './hooks/useGeminiLive';
import { useZoom } from './hooks/useZoom';
import { useAudio } from './hooks/useAudio';
import { useAudioGate } from './contexts/AudioGateContext';
import { ConnectionStatus } from './types';


// Modals
import MemoryModal from './components/modals/MemoryModal';
import UserProfileModal from './components/modals/UserProfileModal';
import DashboardSettingsModal from './components/modals/DashboardSettingsModal';
import HistoryModal from './components/modals/HistoryModal';
import SecretKeyModal from './components/modals/SecretKeyModal';
import SettingsModal from './components/modals/SettingsModal';
import VoiceSettingsModal from './components/modals/VoiceSettingsModal';
import AssistantInfoModal from './components/modals/AssistantInfoModal';
import { Mic2 } from 'lucide-react';
import { AssistantConfig, DEFAULT_ASSISTANT_CONFIG } from './config/assistantConfig';


// Modules
import LoadingScreen from './components/modules/LoadingScreen';
import SidebarLeft from './components/modules/SidebarLeft';
import SidebarRight from './components/modules/SidebarRight';
import VisualHub from './components/modules/VisualHub';
import SystemConnections from './components/modules/SystemConnections';
import FolderExplorer from './components/modules/FolderExplorer';
import SystemControls from './components/modules/SystemControls';
import AIGlobePortal from './components/modules/AIGlobePortal';
import NotesSection from './components/modules/NotesSection';
import TasksSection from './components/modules/TasksSection';
import UpdateNotification from './components/modules/UpdateNotification';
import YouTubePlayer from './components/modules/YouTubePlayer';
import NavigationModule from './components/modules/NavigationModule';


import { apiClient } from './utils/api-client';

function App() {
  useZoom(); // Initialize zoom shortcuts
  const { playClick, playSound } = useAudio();
  const { enableAudio } = useAudioGate();
  const [activeTab, setActiveTab] = useState('intelligence');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isDiagramRendering, setIsDiagramRendering] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'chat' | 'terminal'>('chat');


  // Visual Hub Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Internal loading removed (Handled by native splash screen)
  const [isVisualHubExpanded, setIsVisualHubExpanded] = useState(false);


  // Memory & User State
  const [memories, setMemories] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>({
    name: '',
    location: '',
    profession: '',
    bio: ''
  });
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [dashboardSettings, setDashboardSettings] = useState<any>({
    interests: ['Tech', 'Pakistan', 'Global Economy'],
    refreshInterval: 3600
  });
  const [history, setHistory] = useState<any[]>([]);
  const [historySettings, setHistorySettings] = useState<any>({
    maxContextMessages: 20,
    storeHistory: true
  });


  const [importedFolders, setImportedFolders] = useState<{ name: string, path: string }[]>([]);
  const [vaultPath, setVaultPath] = useState<string>('');
  const [editingFolderIdx, setEditingFolderIdx] = useState<number | null>(null);
  const [tempFolderName, setTempFolderName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string, data: string, mimeType: string, path?: string }[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [navigationDestination, setNavigationDestination] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Load data on mount
  useEffect(() => {
    apiClient.invoke('load-memories').then(setMemories);
    apiClient.invoke('load-user-profile').then((profile: any) => {
      if (profile && Object.keys(profile).length > 0) setUserProfile(profile);
    });
    apiClient.invoke('load-dashboard-settings').then(setDashboardSettings);

    // Load Imported Folders
    apiClient.invoke('load-imported-folders').then((folders: any[]) => {
      if (folders) setImportedFolders(folders);
    });

    // Initialize Vault
    apiClient.invoke('initialize-vault').then((data: any) => {
      if (data && data.vaultBase) setVaultPath(data.vaultBase);
    });

    // Load History & Settings
    apiClient.invoke('load-history').then(setHistory);
    apiClient.invoke('load-history-settings').then(setHistorySettings);



    // Load Notes & Tasks
    apiClient.invoke('load-notes').then(setNotes);
    apiClient.invoke('load-tasks').then(setTasks);

    // Verify API Key
    apiClient.invoke('get-gemini-token')
      .then((key: string) => {
        setHasCheckedKey(true);
        if (!key) {
          setIsSecretKeyModalOpen(true);
        }
      })
      .catch((err) => {
        console.warn("[NOVA-SAFE] Token check skipped or failed in browser:", err);
        setHasCheckedKey(true); // Don't block mounting
      });

    // Load Voice Config
    apiClient.invoke('load-voice-config').then((config: any) => {
      if (config) {
        if (config.voiceName) setSelectedVoice(config.voiceName);
        if (config.volume !== undefined) setSelectedVolume(config.volume);
      }
    });

    // Load Assistant Config
    apiClient.invoke('load-assistant-config').then((config: any) => {
      if (config) setAssistantConfig(config);
    });

  }, []);


  const handleUpdateDashboardSettings = async (settings: any) => {
    setDashboardSettings(settings);
    await apiClient.invoke('save-dashboard-settings', settings);
  };

  const handleUpdateProfile = async (field: string, value: string) => {
    const updated = { ...userProfile, [field]: value };
    setUserProfile(updated);
    await apiClient.invoke('save-user-profile', updated);
  };


  const handleAddMemory = async () => {
    if (!newMemoryInput.trim()) return;
    const newMemo = {
      id: Date.now().toString(),
      content: newMemoryInput.trim(),
      category: 'personal',
      timestamp: Date.now()
    };
    const updated = [newMemo, ...memories];
    setMemories(updated);
    await apiClient.invoke('save-memories', updated);
    setNewMemoryInput('');
  };

  const handleDeleteMemory = async (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    await apiClient.invoke('save-memories', updated);
  };

  const handleImportFolder = async () => {
    const result = await apiClient.invoke('pick-folder');
    if (result) {
      const newFolders = [...importedFolders, result];
      setImportedFolders(newFolders);
      apiClient.invoke('save-imported-folders', newFolders);
    }
  };

  const handleOpenFolder = async (folderPath: string) => {
    await apiClient.invoke('system-open', { target: folderPath });
  };

  const handleRemoveFolder = (idx: number) => {
    const newFolders = importedFolders.filter((_, i) => i !== idx);
    setImportedFolders(newFolders);
    apiClient.invoke('save-imported-folders', newFolders);
  };

  const handleStartRename = (idx: number, name: string) => {
    setEditingFolderIdx(idx);
    setTempFolderName(name);
  };

  const handleFinishRename = () => {
    if (editingFolderIdx !== null && tempFolderName.trim()) {
      const newFolders = [...importedFolders];
      newFolders[editingFolderIdx].name = tempFolderName;
      setImportedFolders(newFolders);
      apiClient.invoke('save-imported-folders', newFolders);
    }
    setEditingFolderIdx(null);
  };





  const handleSaveNote = async (note: any) => {
    const updated = notes.find(n => n.id === note.id)
      ? notes.map(n => n.id === note.id ? note : n)
      : [note, ...notes];
    setNotes(updated);
    await apiClient.invoke('save-notes', updated);
  };

  const handleDeleteNote = async (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await apiClient.invoke('save-notes', updated);
  };

  const handleSaveTasks = async (updatedTasks: any[]) => {
    setTasks(updatedTasks);
    await apiClient.invoke('save-tasks', updatedTasks);
  };

  const handleImageGenerated = useCallback((url: string) => {
    setGeneratedImage(url);
    setIsVisualHubExpanded(true);
  }, []);

  const handleDiagramGenerated = useCallback((html: string) => {
    setGeneratedDiagram(html);
    setIsVisualHubExpanded(true);
  }, []);

  const handleMemoriesUpdated = useCallback(async (updatedMemories: any[]) => {
    setMemories(updatedMemories);
    await apiClient.invoke('save-memories', updatedMemories);
  }, []);

  const handleDashboardUpdate = useCallback((data: any) => {
    setDashboardData(data);
    setIsDashboardLoading(false);
  }, []);

  const handleYouTubePlay = useCallback((videoId: string) => {
    setActiveVideoId(videoId);
  }, []);

  // Tone & Personality State
  const [inputMode, setInputMode] = useState('voice');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedDiagram, setGeneratedDiagram] = useState<string | null>(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAssistantInfoModalOpen, setIsAssistantInfoModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig>(DEFAULT_ASSISTANT_CONFIG);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSecretKeyModalOpen, setIsSecretKeyModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Charon');
  const [selectedVolume, setSelectedVolume] = useState(0.8);
  const [hasCheckedKey, setHasCheckedKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Construct vault info for AI context
  const vaultInfo = {
    path: vaultPath || 'Documents/Nova_Vault',
    folders: importedFolders
  };

  // Use history as initial history for AI context
  const initialHistory = history;

  const [isMuted, setIsMuted] = useState(false);

  // Integrate Gemini Voice AI
  const {
    connect,
    disconnect,
    status,
    messages,
    analyser,
    micAnalyser,
    currentOutput,
    isThinking,
    currentThought,
    thinkingEnabled,
    setThinkingEnabled,
    addLog,
    logs,
    sendTextMessage,
    sendMultimodalMessage,
    sendVideoFrame,
    isMicMuted,
    toggleMicMute
  } = useGeminiLive({
    onSpeakingChanged: setIsAISpeaking,
    userProfile,
    onVisualizingChanged: setIsVisualizing,
    onImageGenerated: handleImageGenerated,
    onDiagramGenerated: handleDiagramGenerated,
    onMemoriesUpdated: handleMemoriesUpdated,
    vaultInfo,
    initialHistory,
    onDashboardUpdated: handleDashboardUpdate,
    onNotesUpdated: setNotes,
    onTasksUpdated: setTasks,
    onYouTubePlay: handleYouTubePlay,
    onNavigationRequested: (dest) => setNavigationDestination(dest),
    attachedFiles,
    voiceName: selectedVoice,
    assistantConfig,
    isHardMuted: isMuted,
    voiceVolume: selectedVolume
  });



  const toggleMute = useCallback(async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (newMutedState) {
      // Full Hardware Lockdown
      await apiClient.invoke('stop-wake-word');
      playSound('audio/access_denied.wav');
      addLog('warning', 'HARD MUTE ACTIVE: All audio hardware powered down.');
    } else {
      // Restore System
      await apiClient.invoke('start-wake-word');
      playSound('audio/access_granted.wav');
      addLog('success', 'SYSTEM UNMUTED: Audio hardware initialized.');
    }
  }, [isMuted, status, playSound, addLog]);


  useEffect(() => {
    if (status === ConnectionStatus.DISCONNECTED && !isMuted) {
      // Auto-restart wake word if disconnected and not muted
      apiClient.invoke('start-wake-word');
    }
  }, [status, isMuted]);

  // Synchronize refs with latest useGeminiLive functions to avoid closure traps in async handlers
  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);
  useEffect(() => { connectRef.current = connect; }, [connect]);
  useEffect(() => { disconnectRef.current = disconnect; }, [disconnect]);

  const handleUpdateAssistantConfig = async (field: keyof AssistantConfig, value: string) => {
    const updated = { ...assistantConfig, [field]: value };
    setAssistantConfig(updated);
    await apiClient.invoke('save-assistant-config', updated);

    // If connected, we must reconnect to apply new identity/tone prompts
    if (status === ConnectionStatus.CONNECTED && (field === 'voiceTone' || field === 'assistantName')) {
      addLog('info', `Reconfiguring personality to ${updated.voiceTone}...`);
      disconnectRef.current();

      setTimeout(() => {
        connectRef.current();
      }, 1000);
    }
  };


  const handleUpdateVoice = async (voiceName: string) => {
    console.log(`[NOVA] Neural reconfiguration requested: ${voiceName}`);
    setSelectedVoice(voiceName);
    await apiClient.invoke('save-voice-config', { voiceName, volume: selectedVolume });

    if (status === ConnectionStatus.CONNECTED) {
      addLog('info', `Reconfiguring neural core for ${voiceName}...`);
      disconnectRef.current(); // Use latest disconnect

      // Delay to allow full cleanup before reconnecting with new voice
      setTimeout(() => {
        console.log(`[NOVA] Applying new voice archetype...`);
        connectRef.current(); // Use latest connect (which has the new voiceName)
      }, 1000);
    }
  };

  const handleUpdateVolume = async (volume: number) => {
    console.log(`[NOVA] Audio volume updated to ${Math.round(volume * 100)}%`);
    setSelectedVolume(volume);
    await apiClient.invoke('save-voice-config', { voiceName: selectedVoice, volume });
  };

  // Wake Word & Greeting State
  const pendingWakeWordCommand = useRef<string | null>(null);
  const hasAnnouncedStartupRef = useRef(false);

  // Handle Wake Word Detection
  useEffect(() => {
    if (!apiClient.isElectron) return;

    const unsubscribe = apiClient.on('wake-word-detected', (data: any) => {
      console.log('Wake word event:', data);

      // Handle INFO logs from Python
      if (data.type === 'INFO') {
        addLog('info', `WakeWord Engine: ${data.msg}`);
        return;
      }

      // Handle ERROR logs from Python
      if (data.type === 'ERROR') {
        addLog('error', `WakeWord Engine Error: ${data.msg}`);
        return;
      }

      // Handle actual WAKE_WORD detection
      if (data.type === 'WAKE_WORD') {
        if (isMuted) return; // Ignore if hard muted

        playSound('audio/access_granted.wav');
        addLog('success', `Wake Word Detected: "${data.text}"`);

        if (data.command) {
          pendingWakeWordCommand.current = data.command;
        }

        if (status === ConnectionStatus.DISCONNECTED) {
          connect();
        } else if (status === ConnectionStatus.CONNECTED) {
          if (data.command) {
            sendTextMessage(data.command);
            pendingWakeWordCommand.current = null;
          } else {
            // Already online, provide a short "I'm awake" confirmation
            const shortResponses = ["I’m awake.", "Ready.", "Yes?"];
            const randomResponse = shortResponses[Math.floor(Math.random() * shortResponses.length)];
            sendTextMessage(`[SYSTEM_INVOCATION] I just woke up via wake word. Please respond with a very short confirmation like: "${randomResponse}"`, true);
          }
        }
      }
    });

    // Handle WhatsApp Notifications
    const unsubscribeNotifications = apiClient.on('notification-received', (data: any) => {
      if (isMuted) return;

      console.log('WhatsApp Notification received:', data);
      addLog('info', `Notification from ${data.contact}`);

      const announcementPrompt = `[SYSTEM_NOTIFICATION] New WhatsApp message from "${data.contact}". 
      CONTENT: "${data.content}"
      
      ACTION: Immediately say to the user: "Sir, you have received a WhatsApp message from ${data.contact}. Would you like me to read it to you?"
      
      STRICT RULES:
      1. Wait for user response.
      2. If they say "Yes", "Tell me", or similar, read the content exactly.
      3. Do not mention the content until asked.`;

      if (status === ConnectionStatus.CONNECTED) {
        sendTextMessage(announcementPrompt, true);
      } else {
        // If disconnected, connect and the startup logic or a pending flag should handle it
        // For simplicity, let's just connect. The user can then ask "What was that notification?" 
        // Or we can set a pending notification ref.
        pendingWakeWordCommand.current = announcementPrompt;
        connect();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeNotifications();
    };
  }, [isMuted, status, connect, sendTextMessage, addLog, playSound]);

  // Execute pending command once connected
  useEffect(() => {
    if (status === ConnectionStatus.CONNECTED) {
      if (pendingWakeWordCommand.current) {
        sendTextMessage(pendingWakeWordCommand.current);
        pendingWakeWordCommand.current = null;
        hasAnnouncedStartupRef.current = true; // Mark startup as completed
      } else if (!hasAnnouncedStartupRef.current) {
        // Initial session startup greeting
        sendTextMessage("[SYSTEM_INVOCATION] I have just started up for the first time this session. Please greet me with exactly: 'I’m online and fully operational. How may I assist you?'", true);
        hasAnnouncedStartupRef.current = true;
      }
    }
  }, [status, sendTextMessage]);

  const refreshDashboard = useCallback(() => {
    if (status === ConnectionStatus.CONNECTED) {
      setIsDashboardLoading(true);
      const prompt = `[SYSTEM_INIT_FETCH] Search for today's top 5 headlines and weather in ${userProfile.location || 'my area'} based on my interests: ${dashboardSettings.interests.join(', ')}. 
      Use the update_dashboard tool to provide the information. Do not respond verbally unless I ask.`;
      sendTextMessage(prompt, true);
    }
  }, [status, userProfile.location, dashboardSettings.interests, sendTextMessage]);



  // Persist history when it changes in useGeminiLive
  useEffect(() => {
    if (messages.length > 0 && historySettings.storeHistory) {
      setHistory(messages);
      apiClient.invoke('save-history', messages);
    }
  }, [messages, historySettings.storeHistory]);

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear all conversation history?")) {
      setHistory([]);
      await apiClient.invoke('clear-history');
      setIsHistoryModalOpen(false);
    }
  };

  const handleUpdateHistorySettings = async (settings: any) => {
    setHistorySettings(settings);
    await apiClient.invoke('save-history-settings', settings);
  };

  const handleSendChat = useCallback(() => {
    if ((!chatInput.trim() && attachedFiles.length === 0) || status !== ConnectionStatus.CONNECTED) return;

    if (attachedFiles.length > 0) {
      sendMultimodalMessage(chatInput.trim(), attachedFiles);
      setAttachedFiles([]);
    } else {
      sendTextMessage(chatInput.trim());
    }

    setChatInput('');
  }, [chatInput, attachedFiles, status, sendTextMessage, sendMultimodalMessage]);

  const handleNativeFileSelect = async () => {
    if (attachedFiles.length >= 5) {
      alert("You can only attach up to 5 files at a time.");
      return;
    }

    try {
      const results = await apiClient.invoke('pick-and-read-files');
      if (results && results.length > 0) {
        const spaceLeft = 5 - attachedFiles.length;
        const newFiles = results.slice(0, spaceLeft);
        setAttachedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.error("Failed to pick files:", err);
    }
  };

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Scroll to bottom of transcription
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Camera State & Refs
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const memoryInputRef = useRef<HTMLInputElement>(null);

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
      setIsCameraOn(false);
      setIsCameraLoading(false);
    } else {
      try {
        setIsCameraLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });
        setCameraStream(stream);
        setIsCameraOn(true);
        setIsCameraLoading(false);
      } catch (err) {
        console.error("Camera access denied:", err);
        setIsCameraLoading(false);
        alert("Please allow camera access to use visual AI features.");
      }
    }
  };

  // 1 FPS Frame Capture Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isCameraOn && status === ConnectionStatus.CONNECTED && cameraStream) {
      interval = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const context = canvas.getContext('2d');
          if (context) {
            context.drawImage(video, 0, 0, 320, 240);
            const base64Image = canvas.toDataURL('image/jpeg', 0.5);
            const rawBase64 = base64Image.split(',')[1];
            sendVideoFrame(rawBase64);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCameraOn, status, cameraStream, sendVideoFrame]);

  useEffect(() => {
    if (isCameraOn && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOn, cameraStream]);

  // Reset visual hub view when content changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [generatedImage, generatedDiagram]);

  const [leftWidth, setLeftWidth] = useState(400);
  const [rightWidth, setRightWidth] = useState(520);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // --- Sidebar Compression Logic ---
  const CENTER_MIN_WIDTH = 900;
  const SIDEBAR_MIN_WIDTH = 200;

  const currentRightWidth = useMemo(() => {
    if (isResizingRight) return rightWidth;
    const totalRequired = leftWidth + CENTER_MIN_WIDTH + rightWidth;
    const shortfall = totalRequired - windowWidth;
    if (shortfall <= 0) return rightWidth;
    const compressedWidth = rightWidth - shortfall;
    if (compressedWidth < SIDEBAR_MIN_WIDTH) return 0;
    return compressedWidth;
  }, [windowWidth, leftWidth, rightWidth, isResizingRight]);

  const currentLeftWidth = useMemo(() => {
    if (isResizingLeft) return leftWidth;
    const totalRequired = leftWidth + CENTER_MIN_WIDTH + currentRightWidth;
    const shortfall = totalRequired - windowWidth;
    if (shortfall <= 0) return leftWidth;
    const compressedWidth = leftWidth - shortfall;
    if (compressedWidth < SIDEBAR_MIN_WIDTH) return 0;
    return compressedWidth;
  }, [windowWidth, leftWidth, currentRightWidth, isResizingLeft]);

  const startResizingLeft = useCallback(() => setIsResizingLeft(true), []);
  const startResizingRight = useCallback(() => setIsResizingRight(true), []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) setLeftWidth(newWidth);
    } else if (isResizingRight) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 200 && newWidth < 800) setRightWidth(newWidth);
    }
  }, [isResizingLeft, isResizingRight]);

  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      const stopResizing = () => {
        setIsResizingLeft(false);
        setIsResizingRight(false);
      };
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = '';
      };
    }
  }, [isResizingLeft, isResizingRight, resize]);

  const handleStartStop = () => {
    if (status === ConnectionStatus.CONNECTED) disconnect();
    else connect();
  };

  // --- Dynamic SVG Line Calculation ---
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const addFilesRef = useRef<HTMLDivElement>(null);
  const memoryRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const centerNodeRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  const [paths, setPaths] = useState({
    addFiles: '',
    memory: '',
    history: '',
    user: '',
    centerToCircle: '',
    centerNode: { cx: 0, cy: 0 }
  });

  const updatePaths = useCallback(() => {
    if (!svgContainerRef.current || !centerNodeRef.current || !circleRef.current) return;

    const containerRect = svgContainerRef.current.getBoundingClientRect();
    const getRelPos = (element: HTMLElement, anchor: 'left' | 'right' | 'center') => {
      const rect = element.getBoundingClientRect();
      let x = 0;
      if (anchor === 'left') x = rect.left + rect.width / 2 - containerRect.left;
      else if (anchor === 'right') x = rect.right - containerRect.left;
      else x = rect.left + rect.width / 2 - containerRect.left;
      const y = rect.top + rect.height / 2 - containerRect.top;
      return { x, y };
    };

    const centerPos = getRelPos(centerNodeRef.current, 'center');
    const circlePos = getRelPos(circleRef.current, 'left');

    const generatePath = (startRef: React.RefObject<HTMLDivElement | null>) => {
      if (!startRef.current) return '';
      const start = getRelPos(startRef.current, 'right');
      const end = centerPos;
      const cp1 = { x: start.x + (end.x - start.x) * 0.5, y: start.y };
      const cp2 = { x: end.x - (end.x - start.x) * 0.5, y: end.y };
      return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    };

    setPaths({
      addFiles: generatePath(addFilesRef),
      memory: generatePath(memoryRef),
      history: generatePath(historyRef),
      user: generatePath(userRef),
      centerToCircle: `M ${centerPos.x} ${centerPos.y} L ${circlePos.x} ${circlePos.y}`,
      centerNode: { cx: centerPos.x, cy: centerPos.y }
    });
  }, []);

  useEffect(() => {
    updatePaths();
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      updatePaths();
    };
    window.addEventListener('resize', handleResize);
    const interval = setInterval(updatePaths, 500);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [updatePaths]);


  // Hard Mounting: Only block render in Electron; browser should mount immediately to avoid black screen.
  if (!hasCheckedKey && apiClient.isElectron) return <div className="h-screen w-screen bg-j-void" />;

  // Responsive Tab Support
  const [mobileTab, setMobileTab] = useState<'intelligence' | 'chat' | 'dashboard'>('intelligence');

  // PRIORITY 1: Show loading screens first - never interrupt these with modals
  if (isInitialLoading) return <LoadingScreen onFinished={() => setIsInitialLoading(false)} assistantName={assistantConfig.assistantName} />;
  if (isLoading) return <LoadingScreen assistantName={assistantConfig.assistantName} />;

  // PRIORITY 2: After loading completes, show SecretKeyModal as full-screen gate if needed
  if (isSecretKeyModalOpen) {
    return (
      <div className="h-screen w-screen bg-j-void flex items-center justify-center">
        <SecretKeyModal
          isOpen={isSecretKeyModalOpen}
          onClose={(key) => {
            if (key) {
              setIsSecretKeyModalOpen(false);
              // After key is saved, initialization continues...
            }
          }}
        />
      </div>
    );
  }


  return (
    <div onClick={enableAudio} className="h-screen w-screen bg-j-void text-j-text-primary font-sans overflow-hidden selection:bg-j-cyan/20 flex flex-col pb-[env(safe-area-inset-bottom)]">
      <div className="absolute inset-0 bg-hex-grid opacity-[0.05] pointer-events-none z-0"></div>

      <div className="w-full h-full flex flex-col relative z-10 bg-gradient-to-b from-transparent to-j-void/90">

        {/* Header */}
        <header className="h-16 border-b border-white/[0.05] flex items-center justify-between px-6 shrink-0 z-10 bg-j-panel/60 backdrop-blur-xl shadow-2xl">

          {/* Logo Section */}
          <div className="flex items-center gap-4 mr-8">
            <img src="/logo.jpg" alt="Logo" className="w-12 h-12 object-contain rounded-lg" />
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-lg md:text-xl font-bold tracking-widest text-white neon-glow">{assistantConfig.assistantName.toUpperCase()}</span>
              <span className="hidden xs:inline-block text-[10px] sm:text-lg md:text-xl font-bold tracking-widest text-[#00E5FF] neon-glow ml-2 sm:ml-4 whitespace-nowrap">
                SECOND BRAIN 🧠 𝓦2𝓙
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex border border-white/[0.1] rounded-lg overflow-hidden bg-j-surface/50">
              {['Intelligence', 'Notes', 'Tasks'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    playClick();
                    setActiveTab(item.toLowerCase());
                  }}

                  className={`px-2 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-medium transition-all border-r border-white/[0.1] ${activeTab === item.toLowerCase() || (item === 'Intelligence' && activeTab === 'notes_placeholder')
                    ? 'bg-j-cyan/10 text-j-cyan shadow-[inset_0_0_15px_rgba(0,229,255,0.15)]'
                    : 'text-j-text-secondary hover:text-j-text-primary hover:bg-white/5'
                    } last:border-r-0`}
                >
                  <span className="hidden xs:inline">{item}</span>
                  <span className="xs:hidden">{item.charAt(0)}</span>
                </button>
              ))}
            </div>
          </div>


          {/* Update Notification Badge */}
          <div className="flex items-center gap-3">
            <UpdateNotification />
            <button
              onClick={() => { playClick(); setIsVoiceModalOpen(true); }}
              title="Voice Settings"
              className="p-2 text-j-text-secondary hover:text-j-magenta hover:scale-110 transition-all duration-300"
            >
              <Mic2 size={24} />
            </button>
            <button
              onClick={() => { playClick(); setIsSettingsModalOpen(true); }}
              title="Main Settings"
              className="p-2 text-j-text-secondary hover:text-j-cyan hover:rotate-90 transition-all duration-500"
            >
              <Settings size={24} />
            </button>
          </div>

        </header>


        {/* Modals */}
        <MemoryModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
          memories={memories}
          newMemoryInput={newMemoryInput}
          setNewMemoryInput={setNewMemoryInput}
          handleAddMemory={handleAddMemory}
          handleDeleteMemory={handleDeleteMemory}
          memoryInputRef={memoryInputRef}
        />
        <UserProfileModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          userProfile={userProfile}
          handleUpdateProfile={handleUpdateProfile}
        />
        <AssistantInfoModal
          isOpen={isAssistantInfoModalOpen}
          onClose={() => setIsAssistantInfoModalOpen(false)}
          assistantConfig={assistantConfig}
          handleUpdateAssistantConfig={handleUpdateAssistantConfig}
        />
        <DashboardSettingsModal
          isOpen={isDashboardModalOpen}
          onClose={() => setIsDashboardModalOpen(false)}
          dashboardSettings={dashboardSettings}
          handleUpdateDashboardSettings={handleUpdateDashboardSettings}
        />
        <HistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          history={history}
          historySettings={historySettings}
          handleUpdateHistorySettings={handleUpdateHistorySettings}
          handleClearHistory={handleClearHistory}
        />

        <SecretKeyModal
          isOpen={isSecretKeyModalOpen}
          onClose={(key) => {
            if (key) {
              setIsSecretKeyModalOpen(false);
              // Force reconnect if key was missing
              if (status === ConnectionStatus.DISCONNECTED) connect();
            }
          }}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
        <VoiceSettingsModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          selectedVoice={selectedVoice}
          onVoiceSelect={handleUpdateVoice}
          volume={selectedVolume}
          onVolumeChange={handleUpdateVolume}
        />


        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden z-10 relative bg-black/10">

          {/* SidebarLeft - only show on desktop (lg+) or when dashboard tab is active on mobile */}
          <div className={`${windowWidth < 1024 && mobileTab !== 'dashboard' ? 'hidden' : 'block'} h-full shrink-0`}>
            <SidebarLeft
              currentWidth={currentLeftWidth}
              isResizing={isResizingLeft}
              isCameraOn={isCameraOn}
              isCameraLoading={isCameraLoading}
              videoRef={videoRef}
              canvasRef={canvasRef}
              toggleCamera={toggleCamera}
              onStartResizing={startResizingLeft}
              dashboardData={dashboardData}
              isDashboardLoading={isDashboardLoading}
              setIsUserModalOpen={setIsUserModalOpen}
              setIsDashboardModalOpen={setIsDashboardModalOpen}
              refreshDashboard={refreshDashboard}
            />
          </div>

          <section className={`flex-1 flex flex-col min-w-0 relative bg-gradient-to-b from-j-void/50 to-j-void ${windowWidth < 1024 && mobileTab !== 'intelligence' ? 'hidden' : 'flex'}`}>
            <div className={`flex-1 flex p-4 lg:p-6 gap-6 lg:gap-10 relative items-center justify-center ${windowWidth < 640 ? 'overflow-y-auto' : 'overflow-hidden'}`} ref={svgContainerRef}>

              {activeTab === 'intelligence' ? (
                <>
                  <SystemConnections paths={paths} windowWidth={windowWidth} />

                  <div className="flex flex-col sm:flex-row items-center z-10 py-4 h-full gap-4 sm:gap-10 overflow-y-auto no-scrollbar sm:overflow-visible">
                    <FolderExplorer
                      importedFolders={importedFolders}
                      handleImportFolder={handleImportFolder}
                      handleRemoveFolder={handleRemoveFolder}
                      handleOpenFolder={handleOpenFolder}
                      editingFolderIdx={editingFolderIdx}
                      tempFolderName={tempFolderName}
                      setTempFolderName={setTempFolderName}
                      handleFinishRename={handleFinishRename}
                      handleStartRename={handleStartRename}
                    />

                    <SystemControls
                      handleNativeFileSelect={handleNativeFileSelect}
                      attachedFiles={attachedFiles}
                      removeFile={removeFile}
                      setIsMemoryModalOpen={setIsMemoryModalOpen}
                      setIsHistoryModalOpen={setIsHistoryModalOpen}
                      setIsUserModalOpen={setIsUserModalOpen}
                      setIsAssistantInfoModalOpen={setIsAssistantInfoModalOpen}
                      memoryInputRef={memoryInputRef}
                      addFilesRef={addFilesRef}
                      memoryRef={memoryRef}
                      historyRef={historyRef}
                      userRef={userRef}
                    />
                  </div>


                  {windowWidth >= 800 && (
                    <div className="flex-1 flex items-center justify-center pointer-events-none">
                      <div ref={centerNodeRef} className="w-1 h-1"></div>
                    </div>
                  )}

                  <AIGlobePortal
                    status={status}
                    isAISpeaking={isAISpeaking}
                    analyser={analyser}
                    micAnalyser={micAnalyser}
                    handleStartStop={handleStartStop}
                    portalRef={circleRef}
                    windowWidth={windowWidth}
                    isMicMuted={isMuted}
                    toggleMicMute={toggleMute}
                  />

                </>
              ) : activeTab === 'notes' ? (
                <div className="w-full h-full max-w-6xl z-10 overflow-hidden">
                  <NotesSection
                    notes={notes}
                    onSaveNote={handleSaveNote}
                    onDeleteNote={handleDeleteNote}
                  />
                </div>
              ) : (
                <div className="w-full h-full max-w-4xl z-10 overflow-hidden">
                  <TasksSection
                    tasks={tasks}
                    onSaveTasks={handleSaveTasks}
                  />
                </div>
              )}
            </div>

            {activeTab === 'intelligence' && (
              <VisualHub
                isExpanded={isVisualHubExpanded}
                onToggleExpand={() => setIsVisualHubExpanded(!isVisualHubExpanded)}
                generatedImage={generatedImage}
                generatedDiagram={generatedDiagram}
                isVisualizing={isVisualizing}
                isDiagramRendering={isDiagramRendering}
                onReset={() => { setGeneratedImage(null); setGeneratedDiagram(null); }}
                zoom={zoom}
                setZoom={setZoom}
                pan={pan}
                setPan={setPan}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                dragStart={dragStart}
                setDragStart={setDragStart}
              />
            )}
          </section>

          {/* SidebarRight - only show on desktop (lg+) or when chat tab is active on mobile */}
          <div className={`${windowWidth < 1024 && mobileTab !== 'chat' ? 'hidden' : 'block'} h-full shrink-0`}>
            <SidebarRight
              currentWidth={currentRightWidth}
              isResizing={isResizingLeft || isResizingRight}
              rightPanelMode={rightPanelMode}
              setRightPanelMode={setRightPanelMode}
              messages={messages}
              logs={logs}
              status={status}
              attachedFiles={attachedFiles}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendChat={handleSendChat}
              handleNativeFileSelect={handleNativeFileSelect}
              removeFile={removeFile}
              messagesEndRef={messagesEndRef}
              onStartResizing={startResizingRight}
              isThinking={isThinking}
              currentThought={currentThought}
              thinkingEnabled={thinkingEnabled}
              setThinkingEnabled={setThinkingEnabled}
              currentOutput={currentOutput}
              assistantName={assistantConfig.assistantName}
            />
          </div>

        </main>

        {/* Mobile Navigation */}
        <nav className="lg:hidden flex items-center justify-around h-20 border-t border-white/[0.05] bg-j-panel/80 backdrop-blur-xl z-50 px-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setMobileTab('dashboard')}
            className={`mobile-nav-item ${mobileTab === 'dashboard' ? 'active' : ''}`}
          >
            <div className={`p-2 rounded-xl transition-all ${mobileTab === 'dashboard' ? 'bg-j-cyan/10 ring-1 ring-j-cyan/30 text-j-cyan scale-110 shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'text-j-text-muted opacity-60'}`}>
              <Mic2 size={24} />
            </div>
            <span className="mt-1 font-bold">DASH</span>
          </button>
          <button
            onClick={() => setMobileTab('intelligence')}
            className={`mobile-nav-item ${mobileTab === 'intelligence' ? 'active' : ''}`}
          >
            <div className={`p-2 rounded-xl transition-all ${mobileTab === 'intelligence' ? 'bg-j-cyan/10 ring-1 ring-j-cyan/30 text-j-cyan scale-125 -mt-6 shadow-[0_0_20px_rgba(0,229,255,0.3)]' : 'text-j-text-muted opacity-60'}`}>
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.jpg" alt="Home" className="w-full h-full object-contain rounded-lg" />
              </div>
            </div>
            <span className="mt-1 font-bold">NOVA</span>
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`mobile-nav-item ${mobileTab === 'chat' ? 'active' : ''}`}
          >
            <div className={`p-2 rounded-xl transition-all ${mobileTab === 'chat' ? 'bg-j-cyan/10 ring-1 ring-j-cyan/30 text-j-cyan scale-110 shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'text-j-text-muted opacity-60'}`}>
              <div className="w-6 h-6 flex items-center justify-center text-xl">💬</div>
            </div>
            <span className="mt-1 font-bold">CHAT</span>
          </button>
        </nav>

        {activeVideoId && (
          <YouTubePlayer
            videoId={activeVideoId}
            onClose={() => setActiveVideoId(null)}
          />
        )}
        {navigationDestination && (
          <NavigationModule
            destination={navigationDestination}
            onClose={() => setNavigationDestination(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
