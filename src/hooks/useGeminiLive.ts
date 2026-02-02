import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, StartSensitivity, EndSensitivity } from '@google/genai';
import { decode, decodeAudioData, createBlob } from '../lib/audio-helpers';
import { Message, ConnectionStatus } from '../types';
import type { SystemLog, UseGeminiLiveProps } from '../types/gemini-live';
import { tools, getSystemInstruction } from '../config/gemini-config';
import { handleToolCalls } from '../lib/gemini-tool-runner';

export type { SystemLog, UseGeminiLiveProps };

import { apiClient } from '../utils/api-client';

export const useGeminiLive = ({
  onSpeakingChanged,
  onImageGenerated,
  onMemoriesUpdated,
  userProfile,
  onDiagramGenerated,
  onVisualizingChanged,
  vaultInfo,
  initialHistory = [],
  onDashboardUpdated,
  onNotesUpdated,
  onTasksUpdated,
  onYouTubePlay,
  onNavigationRequested,
  attachedFiles = [],
  voiceName = 'Charon',
  assistantConfig,
  isHardMuted = false,
  voiceVolume = 0.8
}: UseGeminiLiveProps & { voiceName?: string } = {}) => {

  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [currentThought, setCurrentThought] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const thinkingEnabledRef = useRef(true);
  const [thinkingEnabled, setThinkingEnabledState] = useState(true);
  const currentTurnHasThinkingRef = useRef(false); // Track if current turn has received thinking
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isMicMuted, setIsMicMutedState] = useState(false);
  const isMicMutedRef = useRef(false);

  const setIsMicMuted = useCallback((muted: boolean) => {
    setIsMicMutedState(muted);
    isMicMutedRef.current = muted;
  }, []);

  // Use ref to always get latest attachedFiles value (avoid closure issues)
  const attachedFilesRef = useRef(attachedFiles);

  // Update ref whenever attachedFiles prop changes
  useEffect(() => {
    attachedFilesRef.current = attachedFiles;
  }, [attachedFiles]);

  const setThinkingEnabled = useCallback((enabled: boolean) => {
    setThinkingEnabledState(enabled);
    thinkingEnabledRef.current = enabled;
  }, []);

  // Note: Thinking config is set during session initialization (line 163-166)
  // No reconnection needed - budget is applied at connect time
  // Toggle state is checked via thinkingEnabledRef during runtime

  const addLog = useCallback((type: SystemLog['type'], message: string, details?: any) => {
    const newLog: SystemLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      message,
      details
    };
    setLogs(prev => [...prev.slice(-99), newLog]); // Keep last 100 logs

    // EXTREME LOGGING FOR DEBUGGING
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[NOVA-DEBUG ${timestamp}]`;
    if (type === 'error') console.error(`${prefix} ❌ ${message}`, details || '');
    else if (type === 'warning') console.warn(`${prefix} ⚠️ ${message}`, details || '');
    else if (type === 'tool') console.log(`%c${prefix} 🛠️ ${message}`, 'color: #00e5ff; font-weight: bold; border-left: 3px solid #00e5ff; padding-left: 5px;', details || '');
    else if (type === 'success') console.log(`%c${prefix} ✅ ${message}`, 'color: #00ff8f; font-weight: bold;', details || '');
    else console.log(`${prefix} ℹ️ ${message}`, details || '');
  }, []);


  // Refs for audio processing
  const audioContextInputRef = useRef<AudioContext | null>(null);
  const audioContextOutputRef = useRef<AudioContext | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const outputCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    console.log('Cleaning up session and audio...');
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextInputRef.current && audioContextInputRef.current.state !== 'closed') {
      audioContextInputRef.current.close();
    }
    if (audioContextOutputRef.current && audioContextOutputRef.current.state !== 'closed') {
      audioContextOutputRef.current.close();
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.warn('Error closing session:', e);
      }
    }

    micStreamRef.current = null;
    audioContextInputRef.current = null;
    audioContextOutputRef.current = null;
    sessionRef.current = null;
    nextStartTimeRef.current = 0;
    sourcesRef.current.clear();
    setStatus(ConnectionStatus.DISCONNECTED);
    onSpeakingChanged?.(false);
  }, [onSpeakingChanged]);

  const startAudioHardware = useCallback(async () => {
    if (isHardMuted || micStreamRef.current) return;

    try {
      console.log('[NOVA-AUDIO] Initializing hardware pipelines...');

      // 1. Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      await inputCtx.resume();
      await outputCtx.resume();

      audioContextInputRef.current = inputCtx;
      audioContextOutputRef.current = outputCtx;

      // 1.1 Output Chain: Compressor -> Gain -> Analyser -> Destination
      const compressor = outputCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, outputCtx.currentTime);
      compressor.knee.setValueAtTime(40, outputCtx.currentTime);
      compressor.ratio.setValueAtTime(12, outputCtx.currentTime);
      compressor.attack.setValueAtTime(0.003, outputCtx.currentTime);
      compressor.release.setValueAtTime(0.25, outputCtx.currentTime);
      outputCompressorRef.current = compressor;

      const gain = outputCtx.createGain();
      gain.gain.setValueAtTime(voiceVolume, outputCtx.currentTime);
      outputGainRef.current = gain;

      const outAnalyser = outputCtx.createAnalyser();
      outAnalyser.fftSize = 256;

      // Chain connection
      compressor.connect(gain);
      gain.connect(outAnalyser);
      outAnalyser.connect(outputCtx.destination);
      outputAnalyserRef.current = outAnalyser;

      const inAnalyser = inputCtx.createAnalyser();
      inAnalyser.fftSize = 256;
      inputAnalyserRef.current = inAnalyser;

      // 2. Get Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // 3. Link to Session
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(512, 1, 1);

      source.connect(inAnalyser);

      scriptProcessor.onaudioprocess = (e) => {
        if (isMicMutedRef.current || isHardMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        if (sessionRef.current) {
          try {
            sessionRef.current.sendRealtimeInput({ media: pcmBlob });
          } catch (err) { }
        }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

      addLog('success', 'Audio hardware operational');
    } catch (err) {
      console.error('[NOVA-AUDIO] Hardware failure:', err);
      addLog('error', 'Failed to initialize audio hardware');
    }
  }, [isHardMuted, addLog]);

  const stopAudioHardware = useCallback(() => {
    console.log('[NOVA-AUDIO] Releasing hardware resources...');
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextInputRef.current && audioContextInputRef.current.state !== 'closed') {
      audioContextInputRef.current.close();
      audioContextInputRef.current = null;
    }
    if (audioContextOutputRef.current && audioContextOutputRef.current.state !== 'closed') {
      audioContextOutputRef.current.close();
      audioContextOutputRef.current = null;
    }
    outputGainRef.current = null;
    outputCompressorRef.current = null;
    outputAnalyserRef.current = null;
    inputAnalyserRef.current = null;
    nextStartTimeRef.current = 0;
    sourcesRef.current.clear();
  }, []);

  // Sync Hardware with Hard Mute State
  useEffect(() => {
    if (status === ConnectionStatus.CONNECTED) {
      if (isHardMuted) {
        stopAudioHardware();
      } else {
        startAudioHardware();
      }
    } else {
      stopAudioHardware();
    }
  }, [isHardMuted, status, startAudioHardware, stopAudioHardware]);

  // Sync volume changes in real-time
  useEffect(() => {
    if (outputGainRef.current && audioContextOutputRef.current) {
      outputGainRef.current.gain.setTargetAtTime(voiceVolume, audioContextOutputRef.current.currentTime, 0.1);
    }
  }, [voiceVolume]);

  const connect = useCallback(async () => {
    try {
      setStatus(ConnectionStatus.CONNECTING);
      setError(null);

      // Get API Key securely
      const apiKey = await apiClient.invoke('get-gemini-token');
      if (!apiKey) {
        throw new Error('Could not retrieve API Key');
      }

      // Initialize AI
      const ai = new GoogleGenAI({ apiKey });

      console.log(`[NOVA-LIVE] Attempting connection with Voice: ${voiceName} and Model: gemini-2.5-flash-native-audio-preview-12-2025`);
      addLog('info', `Initializing neural core: ${voiceName}`);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
              silenceDurationMs: 1000,
            }
          },
          thinkingConfig: {
            includeThoughts: true, // Always request thoughts so we can see them if budget > 0
            thinkingBudget: thinkingEnabledRef.current ? 2048 : 0 // 2048 tokens when on, 0 when off
          },
          tools: tools as any,
          systemInstruction: getSystemInstruction(userProfile, vaultInfo, initialHistory, assistantConfig),

          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            addLog('success', `Nova Live engine connected (Voice: ${voiceName})`);
            setStatus(ConnectionStatus.CONNECTED);
            console.log('%c[NOVA-SESSION] Established @ ' + new Date().toLocaleTimeString(), 'background: #004411; color: white; padding: 2px 5px; border-radius: 3px;');

            // Note: Hardware sync is now handled by the useEffect watching isHardMuted
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio Output & Thoughts
            const modelTurnPart = message.serverContent?.modelTurn?.parts?.[0];

            // Capture Thinking Process from modelTurn if available (text parts usually handle thoughts/transcriptions)
            // But strict text responses should be handled via outputTranscription or regular modelTurn text logic
            // We do NOT want to treat model text as user input.


            // Capture Thinking Process

            const base64Audio = modelTurnPart?.inlineData?.data;
            if (base64Audio && audioContextOutputRef.current) {
              setIsThinking(false);
              onSpeakingChanged?.(true);
              const ctx = audioContextOutputRef.current;
              if (ctx.state === 'suspended') await ctx.resume();

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

              try {
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;

                // Connect to the start of our optimized output chain (the compressor)
                if (outputCompressorRef.current) {
                  source.connect(outputCompressorRef.current);
                } else {
                  source.connect(outputAnalyserRef.current!);
                }

                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) {
                    onSpeakingChanged?.(false);
                  }
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              } catch (err) {
                console.error("Error playing audio chunk:", err);
              }
            }

            // Interruption handling
            if (message.serverContent?.interrupted) {
              console.log('Model interrupted');
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) { }
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              onSpeakingChanged?.(false);
              setIsThinking(false);
              setCurrentThought('');
              setCurrentInput('');   // Clear input buffer on interruption
              setCurrentOutput('');  // Clear output buffer on interruption
            }

            // Text Parts (Potential Thoughts or Content)
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              parts.forEach(part => {
                // Deep Inspection of Thinking Data
                // API implementation: part.thought is a boolean, and if true, part.text is the thought.
                // ONLY show thinking if toggle is enabled (check ref for real-time value)
                if (part.thought && part.text && thinkingEnabledRef.current) {
                  // If this is the first thought of a new turn, clear previous thinking
                  if (!currentTurnHasThinkingRef.current) {
                    setCurrentThought(''); // Clear old thinking
                    currentTurnHasThinkingRef.current = true;
                  }

                  setIsThinking(true);
                  setCurrentThought(prev => {
                    // Avoid duplicate appends if chunks are resent (simple check)
                    if (prev.endsWith(part.text as string)) return prev;
                    return prev + (prev ? " " : "") + part.text;
                  });
                }
              });
            }

            // Transcriptions & Streaming Messages
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setCurrentInput(prev => prev + text);
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setCurrentOutput(prev => {
                const newOutput = prev + text;
                // Update the last assistant message in real-time if it exists, otherwise create it
                setMessages(msgs => {
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
                    const updated = [...msgs];
                    updated[updated.length - 1] = { ...lastMsg, text: newOutput };
                    return updated;
                  } else {
                    return [...msgs, {
                      id: `streaming-a-${Date.now()}`,
                      role: 'assistant',
                      text: newOutput,
                      timestamp: Date.now(),
                      isStreaming: true
                    }];
                  }
                });
                return newOutput;
              });
            }

            // Turn complete - Commit streaming messages
            if (message.serverContent?.turnComplete) {
              // Capture the thought but DON'T clear it yet - let it stay visible for user to scroll
              const finalThought = currentThought;
              setIsThinking(false); // Mark thinking as complete, but keep the text
              currentTurnHasThinkingRef.current = false; // Reset for next turn
              // Note: currentThought will be cleared when next turn's thinking arrives

              // Handle User Input Finalization
              setCurrentInput(val => {
                const cleanVal = val?.trim();
                // Only add user message if we valid text that DOESN'T look like a system echo
                if (cleanVal) {
                  setMessages(msgs => {
                    // Deduplication: Check if a similar user message was added recently
                    const exists = msgs.some(m => m.role === 'user' && m.text.trim() === cleanVal && (Date.now() - m.timestamp < 5000));
                    if (exists) return msgs;

                    const newUserMsg = {
                      id: `${Date.now()}-u`,
                      role: 'user' as const,
                      text: cleanVal,
                      timestamp: Date.now()
                    };

                    // Check if the last message is the Assistant's (streaming or just finished)
                    // If so, we want to insert the User message BEFORE it, because the User spoke first.
                    const lastMsg = msgs[msgs.length - 1];
                    if (lastMsg && lastMsg.role === 'assistant') {
                      const newMsgs = [...msgs];
                      newMsgs.splice(newMsgs.length - 1, 0, newUserMsg);
                      return newMsgs;
                    }

                    return [...msgs, newUserMsg];
                  });
                }
                return ''; // Clear input buffer
              });

              // Handle Assistant Output Finalization
              setCurrentOutput(val => {
                setMessages(msgs => {
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
                    const updated = [...msgs];
                    updated[updated.length - 1] = {
                      ...lastMsg,
                      id: `${Date.now()}-a`,
                      isStreaming: false,
                      thought: finalThought || undefined // Attach the thought!
                    };
                    return updated;
                  }
                  return msgs;
                });
                return ''; // Clear output buffer
              });
            }

            // Tool Calls Handling
            if (message.toolCall) {
              const calls = message.toolCall.functionCalls;
              if (calls) {
                sessionPromise.then(session => {
                  handleToolCalls(calls, session, {
                    addLog,
                    onVisualizingChanged,
                    onImageGenerated,
                    onDiagramGenerated,
                    onMemoriesUpdated,
                    onDashboardUpdated,
                    onNotesUpdated,
                    onTasksUpdated,
                    apiClient,
                    apiKey,
                    onYouTubePlay,
                    onNavigationRequested,
                    getAttachedFiles: () => attachedFilesRef.current,
                    cleanup
                  });
                });
              }
            }

          },
          onerror: (e) => {
            console.error('%c[NOVA-CRITICAL] WebSocket Connection Failed/Errored:', 'background: #440000; color: white;', e);

            // Extract meaningful error message if possible
            const errorMsg = e instanceof Error ? e.message : (e as any).reason || 'Unknown Protocol Error';
            addLog('error', `Neural link failure: ${errorMsg}`);

            setError(`Connection lost: ${errorMsg}`);
            cleanup();
          },
          onclose: (e) => {
            console.warn(`%c[NOVA-DISCONNECT] Closed | Code: ${e.code} | Reason: ${e.reason || 'No specific reason'}`, 'color: orange; font-weight: bold;');
            addLog('info', `Session closed (Code: ${e.code})`);
            cleanup();

          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error('Connection failed during setup:', err);
      setError(err.message || 'Failed to initialize session');
      setStatus(ConnectionStatus.ERROR);
      cleanup();
    }
  }, [voiceName, userProfile, vaultInfo, initialHistory, assistantConfig, onSpeakingChanged, onImageGenerated, onMemoriesUpdated, onDiagramGenerated, onVisualizingChanged, onDashboardUpdated, onNotesUpdated, onTasksUpdated, onYouTubePlay, addLog, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const sendVideoFrame = useCallback((base64Data: string) => {
    if (sessionRef.current && status === ConnectionStatus.CONNECTED) {
      try {
        sessionRef.current.sendRealtimeInput({
          media: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        });
      } catch (err) {
        console.error('Error sending video frame:', err);
      }
    }
  }, [status]);

  const sendTextMessage = useCallback((text: string, silent: boolean = false) => {
    if (sessionRef.current && status === ConnectionStatus.CONNECTED) {
      try {
        // Correct method for @google/genai LiveSession is sendClientContent
        // and it requires a turns-based structure
        sessionRef.current.sendClientContent({
          turns: [{
            role: 'user',
            parts: [{ text }]
          }],
          turnComplete: true
        });

        if (!silent) {
          // Add to messages immediately for responsiveness
          setMessages(prev => [...prev, {
            id: `${Date.now()}-u`,
            role: 'user',
            text,
            timestamp: Date.now()
          }]);
          addLog('info', `User sent message: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);
        } else {
          addLog('info', `Sent background system command`);
        }
      } catch (err) {


        console.error('Error sending text message:', err);
      }
    }
  }, [status, addLog]);

  const sendMultimodalMessage = useCallback((text: string, attachments: { name: string, data: string, mimeType: string }[]) => {
    if (sessionRef.current && status === ConnectionStatus.CONNECTED) {
      try {
        const fileNames = attachments.map(f => f.name).join(', ');
        addLog('info', `Sending ${attachments.length} files to Nova: ${fileNames}`);

        // Build parts array: FILES FIRST, then TEXT PROMPT
        // This ensures AI sees the file data before the question (proper context)
        const parts: any[] = [];

        // Add all file attachments as inlineData parts
        attachments.forEach(file => {
          const rawData = file.data.includes(',') ? file.data.split(',')[1] : file.data;
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: rawData
            }
          });
          addLog('tool', `📎 Prepared ${file.name} (${file.mimeType})`, {
            sizeKB: `${Math.round(rawData.length / 1024)} KB`
          });
        });

        // Add text prompt AFTER files (so AI analyzes files in context of the prompt)
        const finalPrompt = text && text.trim()
          ? text
          : `I've attached ${attachments.length} file(s) (${fileNames}). Please analyze them carefully and tell me what you find. Be specific and accurate.`;

        parts.push({
          text: finalPrompt
        });

        // Send as a SINGLE turn with all parts together
        sessionRef.current.sendClientContent({
          turns: [{
            role: 'user',
            parts: parts
          }],
          turnComplete: true
        });

        // UI Update
        const displayText = text || `[Attached ${attachments.length} files: ${fileNames}]`;
        setMessages(prev => [...prev, {
          id: `${Date.now()}-u`,
          role: 'user',
          text: displayText,
          timestamp: Date.now()
        }]);

        addLog('success', `✓ Multimodal message sent: ${attachments.length} files + prompt`);
      } catch (err: any) {
        console.error('Multimodal transmission failed:', err);
        addLog('error', `Transmission Error: ${err.message}`);
      }
    } else {
      addLog('warning', 'Connection unavailable. Establish session before sending files.');
    }
  }, [status, addLog]);

  // Track which files have already been pushed to the context to avoid duplicates
  const prevAttachedFilesRef = useRef<Set<string>>(new Set());

  // AUTO-UPLOAD ATTACHMENTS: 
  // Watch for new files and push them to the model context immediately.
  // This solves the issue where "Add File" items were not visible to the Vision model.
  useEffect(() => {
    // If not connected, just reset the tracker so we send them when we do connect
    if (status !== ConnectionStatus.CONNECTED) {
      prevAttachedFilesRef.current.clear();
      return;
    }

    // Identify files that haven't been sent to the AI yet
    const newFiles = attachedFiles.filter(f => !prevAttachedFilesRef.current.has(f.name));

    if (newFiles.length > 0 && sessionRef.current) {
      addLog('info', `🔄 Auto-syncing ${newFiles.length} new attachments to AI context...`);

      const parts: any[] = [];

      newFiles.forEach(file => {
        // Extract raw base64 (remove data:image/png;base64, prefix if present)
        const rawData = file.data.includes(',') ? file.data.split(',')[1] : file.data;

        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: rawData
          }
        });

        // Mark as sent
        prevAttachedFilesRef.current.add(file.name);
      });

      // Add a system note so the AI knows these are context files, not necessarily a prompt to answer immediately
      parts.push({
        text: `[SYSTEM_DATA_LOAD] User has attached these ${newFiles.length} file(s) for context. Analyze them silently. Wait for user's voice command or question about them.`
      });

      try {
        sessionRef.current.sendClientContent({
          turns: [{
            role: 'user',
            parts: parts
          }],
          turnComplete: true
        });
        addLog('success', `✓ ${newFiles.length} Files uploaded to AI Vision Context`);
      } catch (err: any) {
        console.error('Auto-upload failed:', err);
      }
    }

    // Cleanup: If a file was removed from the UI, remove it from our "sent" set
    // so if it's added again, we re-send it.
    const currentFileNames = new Set(attachedFiles.map(f => f.name));
    prevAttachedFilesRef.current.forEach(name => {
      if (!currentFileNames.has(name)) {
        prevAttachedFilesRef.current.delete(name);
      }
    });

  }, [attachedFiles, status, addLog]);

  const toggleMicMute = useCallback(() => {
    if (micStreamRef.current) {
      const newMutedState = !isMicMuted;
      micStreamRef.current.getTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
      setIsMicMuted(newMutedState);
      addLog('info', newMutedState ? 'Microphone Muted' : 'Microphone Unmuted');
    }
  }, [isMicMuted, addLog, setIsMicMuted]);

  return {
    connect,
    disconnect: cleanup,
    status,
    messages,
    currentInput,
    currentOutput,
    error,
    analyser: outputAnalyserRef.current,
    micAnalyser: inputAnalyserRef.current,
    sendVideoFrame,
    sendTextMessage,
    sendMultimodalMessage,
    currentThought,
    isThinking,
    thinkingEnabled,
    setThinkingEnabled,
    addLog,
    logs,
    isMicMuted,
    toggleMicMute
  };
};