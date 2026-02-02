import { generateImage } from './genai';
import { SystemLog } from '../types/gemini-live';

export interface ToolExecutionContext {
  addLog: (type: SystemLog['type'], message: string, details?: any) => void;
  onVisualizingChanged?: (isVisualizing: boolean) => void;
  onImageGenerated?: (imageUrl: string) => void;
  onDiagramGenerated?: (code: string) => void;
  onMemoriesUpdated?: (memories: any[]) => void;
  onDashboardUpdated?: (data: { headlines: string[], weather: any }) => void;
  onNotesUpdated?: (notes: any[]) => void;
  onTasksUpdated?: (tasks: any[]) => void;
  apiClient: any;
  apiKey: string;
  onYouTubePlay?: (videoId: string) => void;
  onNavigationRequested?: (destination: string) => void;
  getAttachedFiles?: () => any[];
  cleanup: () => void;
}

export const handleToolCalls = async (
  toolCalls: any[],
  session: any,
  context: ToolExecutionContext
) => {
  const {
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
    cleanup
  } = context;

  for (const call of toolCalls) {
    if (call.name === 'generate_image') {
      const { prompt } = call.args as any;
      addLog('tool', `Invoking Image Generation`, { prompt });

      onVisualizingChanged?.(true);
      try {
        const imageUrl = await generateImage(prompt, apiKey);
        if (imageUrl) {
          addLog('success', 'Image generated successfully');
          onImageGenerated?.(imageUrl);

          onVisualizingChanged?.(false);
          await apiClient.invoke('save-image', {
            base64Data: imageUrl,
            mimeType: 'image/png'
          });

          session.sendToolResponse({
            functionResponses: [{
              name: 'generate_image',
              id: call.id,
              response: { result: 'Image generated and auto-saved to Downloads folder.' }
            }]
          });
        }
      } catch (err: any) {
        console.error('Image generation/save failed:', err);
        onVisualizingChanged?.(false);
      }
    } else if (call.name === 'render_diagram') {
      const { code, type } = call.args as any;
      addLog('tool', `Rendering ${type} Diagram`, { codeLength: code.length });
      onVisualizingChanged?.(true);

      onDiagramGenerated?.(code);
      onVisualizingChanged?.(false);

      session.sendToolResponse({
        functionResponses: [{
          name: 'render_diagram',
          id: call.id,
          response: { result: 'Diagram rendered successfully in the Visual Intelligence Hub.' }
        }]
      });
    } else if (call.name === 'store_memory') {
      const { content, category } = call.args as any;
      addLog('tool', 'Storing information to memory', { category });

      const newMemory = {
        id: Date.now().toString(),
        content,
        category: category || 'personal',
        timestamp: Date.now()
      };

      // Load existing, add new, and save
      try {
        const currentMemories = await apiClient.invoke('load-memories');
        const updated = [newMemory, ...currentMemories];
        await apiClient.invoke('save-memories', updated);
        onMemoriesUpdated?.(updated);
        session.sendToolResponse({
          functionResponses: [{
            name: 'store_memory',
            id: call.id,
            response: { result: 'Memory stored successfully.' }
          }]
        });
      } catch (err) {
        console.error('Store memory failed:', err);
      }
    } else if (call.name === 'get_memories') {
      addLog('tool', 'Retrieving stored memories');

      try {
        const currentMemories = await apiClient.invoke('load-memories');
        session.sendToolResponse({
          functionResponses: [{
            name: 'get_memories',
            id: call.id,
            response: { memories: currentMemories }
          }]
        });
      } catch (err) {
        console.error('Get memories failed:', err);
      }
    } else if (call.name === 'send_whatsapp') {
      const { contactName, message } = call.args as any;
      addLog('tool', `🚀 Initiating WhatsApp Automation`, {
        contact: contactName,
        messageLength: message.length
      });

      try {
        // Execute the keyboard automation
        addLog('info', `⏳ Opening WhatsApp and simulating keyboard inputs...`);
        const result = await apiClient.invoke('send-whatsapp-keyboard', {
          name: contactName,
          message
        });

        if (result.success) {
          addLog('success', `✅ WhatsApp message sent to ${contactName}`);

          // Show PowerShell output in console for debugging
          if (result.output) {
            console.log('[WhatsApp Automation] PowerShell Output:', result.output);
          }

          session.sendToolResponse({
            functionResponses: [{
              name: 'send_whatsapp',
              id: call.id,
              response: {
                result: `The WhatsApp message automation for ${contactName} has been executed successfully.`,
                status: 'success',
                method: result.method || 'keyboard_simulation'
              }
            }]
          });
        } else {
          addLog('error', `❌ WhatsApp automation failed: ${result.error || 'Unknown error'}`);

          // Show detailed error output
          if (result.stdout || result.stderr) {
            console.error('[WhatsApp Automation] PowerShell STDOUT:', result.stdout);
            console.error('[WhatsApp Automation] PowerShell STDERR:', result.stderr);
          }

          session.sendToolResponse({
            functionResponses: [{
              name: 'send_whatsapp',
              id: call.id,
              response: {
                error: `Failed to send message to ${contactName}. ${result.error || 'Unknown automation error'}. Please make sure WhatsApp Desktop is installed and the contact name matches exactly.`,
                diagnostics: {
                  stdout: result.stdout,
                  stderr: result.stderr
                }
              }
            }]
          });
        }
      } catch (err) {
        console.error('Store memory failed:', err);
      }
    } else if (call.name === 'add_note') {
      const { title, content, category } = call.args as any;
      addLog('tool', `Creating new note: ${title}`);

      try {
        const currentNotes = await apiClient.invoke('load-notes') || [];
        const newNote = {
          id: Date.now().toString(),
          title,
          content,
          category: category || 'General',
          date: new Date().toLocaleDateString(),
          timestamp: Date.now()
        };

        const updatedNotes = [newNote, ...currentNotes];
        await apiClient.invoke('save-notes', updatedNotes);

        // Update UI immediately
        onNotesUpdated?.(updatedNotes);

        session.sendToolResponse({
          functionResponses: [{
            name: 'add_note',
            id: call.id,
            response: { result: 'Note created successfully.' }
          }]
        });
      } catch (err: any) {
        addLog('error', `Failed to create note: ${err.message}`);
      }
    } else if (call.name === 'add_task') {
      const { text, priority } = call.args as any;
      addLog('tool', `Adding new task`, { priority });

      try {
        const currentTasks = await apiClient.invoke('load-tasks') || [];
        const newTask = {
          id: Date.now().toString(),
          text,
          completed: false,
          priority: priority || 'medium',
          timestamp: Date.now()
        };

        // Add to top
        const updatedTasks = [newTask, ...currentTasks];
        await apiClient.invoke('save-tasks', updatedTasks);

        // Update UI immediately
        onTasksUpdated?.(updatedTasks);

        session.sendToolResponse({
          functionResponses: [{
            name: 'add_task',
            id: call.id,
            response: { result: 'Task added to your list.' }
          }]
        });
      } catch (err: any) {
        addLog('error', `Failed to add task: ${err.message}`);
      }
    } else if (call.name === 'read_notes') {
      const { query } = call.args as any;
      addLog('tool', `Reading notes`, { query: query || 'All' });

      try {
        const notes = await apiClient.invoke('load-notes') || [];

        let filteredNotes = notes;
        if (query) {
          const lowerQ = query.toLowerCase();
          filteredNotes = notes.filter((n: any) =>
            n.title.toLowerCase().includes(lowerQ) ||
            n.content.toLowerCase().includes(lowerQ) ||
            n.category.toLowerCase().includes(lowerQ)
          );
        }

        // Limit to recent 10 if no query to save tokens
        const finalNotes = query ? filteredNotes : filteredNotes.slice(0, 10);

        session.sendToolResponse({
          functionResponses: [{
            name: 'read_notes',
            id: call.id,
            response: {
              count: finalNotes.length,
              notes: finalNotes
            }
          }]
        });
      } catch (err: any) {
        addLog('error', `Failed to read notes: ${err.message}`);
      }
    } else if (call.name === 'read_tasks') {
      const { filter } = call.args as any;
      addLog('tool', `Reading tasks`, { filter: filter || 'pending' });

      try {
        const tasks = await apiClient.invoke('load-tasks') || [];

        let filteredTasks = tasks;
        if (filter === 'pending') {
          filteredTasks = tasks.filter((t: any) => !t.completed);
        } else if (filter === 'completed') {
          filteredTasks = tasks.filter((t: any) => t.completed);
        } else if (filter === 'high') {
          filteredTasks = tasks.filter((t: any) => !t.completed && t.priority === 'high');
        }

        session.sendToolResponse({
          functionResponses: [{
            name: 'read_tasks',
            id: call.id,
            response: {
              filter: filter || 'all',
              count: filteredTasks.length,
              tasks: filteredTasks
            }
          }]
        });
      } catch (err: any) {
        addLog('error', `Failed to read tasks: ${err.message}`);
      }
    } else if (call.name === 'read_attached_files') {
      addLog('tool', `📎 Reading attached files`);

      try {
        // Get attached files from context (passed via callback)
        const attachedFiles = context.getAttachedFiles ? context.getAttachedFiles() : [];

        if (attachedFiles.length === 0) {
          addLog('info', 'No files currently attached');
          session.sendToolResponse({
            functionResponses: [{
              name: 'read_attached_files',
              id: call.id,
              response: {
                result: 'No files are currently attached. User needs to click "Add Files" button to attach files first.',
                fileCount: 0
              }
            }]
          });
        } else {
          addLog('success', `Found ${attachedFiles.length} attached file(s). Reading content...`);

          // Read content for each file using Main Process (for PDFs/Docs) or Base64 decode (fallback)
          const filesContent = await Promise.all(attachedFiles.map(async (file: any, idx: number) => {
            let content = "";

            if (file.path) {
              // Use the new main process handler which supports PDF, Docx, Text
              try {
                const readResult = await apiClient.invoke('read-file-content', { path: file.path });
                content = readResult.content || `Error: ${readResult.error}` || "Unable to read content";
              } catch (e: any) {
                content = `Error reading file: ${e.message}`;
              }
            } else {
              // Fallback for drag-and-drop or missing path (try to decode base64 if text)
              // Note: 'data' is base64 encoded content
              if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json' || file.mimeType.includes('xml')) {
                try {
                  content = atob(file.data);
                } catch (e) { content = "Unable to decode text content from memory."; }
              } else {
                content = "[Binary/Image File - Content not available via text tool. Please analyze the visual attachment directly.]";
              }
            }

            return {
              index: idx + 1,
              name: file.name,
              type: file.mimeType,
              // Limit content size per file to avoid context overflow (e.g. 30k chars)
              content: content.length > 30000 ? content.substring(0, 30000) + "...[TRUNCATED]" : content
            };
          }));

          session.sendToolResponse({
            functionResponses: [{
              name: 'read_attached_files',
              id: call.id,
              response: {
                result: `Successfully read ${attachedFiles.length} attached file(s). Use this content to answer the user's request.`,
                files: filesContent
              }
            }]
          });
        }
      } catch (err: any) {
        addLog('error', `Failed to read attached files: ${err.message}`);
        session.sendToolResponse({
          functionResponses: [{
            name: 'read_attached_files',
            id: call.id,
            response: {
              error: `Failed to access attached files: ${err.message}`
            }
          }]
        });
      }
    } else if (call.name === 'turn_off') {
      addLog('warning', 'AI initiating self-shutdown sequence...');
      // Small delay to let the AI finish its 'Goodbye' if it's speaking
      setTimeout(() => {
        cleanup();
      }, 2000);

      session.sendToolResponse({
        functionResponses: [{
          name: 'turn_off',
          id: call.id,
          response: { success: true, message: 'Shutdown initiated.' }
        }]
      });
    } else if (call.name === 'execute_shell_command') {
      const { command } = call.args as any;
      addLog('tool', 'Executing system command', { command });

      const result = await apiClient.invoke('system-exec-command', { command });
      session.sendToolResponse({
        functionResponses: [{
          name: 'execute_shell_command',
          id: call.id,
          response: { result }
        }]
      });
    } else if (call.name === 'manage_files') {
      const { operation, path, content } = call.args as any;
      addLog('tool', `File System Operation: ${operation}`, { path });

      try {
        const result = await apiClient.invoke('system-fs-op', { operation, path, content });
        session.sendToolResponse({
          functionResponses: [{
            name: 'manage_files',
            id: call.id,
            response: { result }
          }]
        });
      } catch (err: any) {
        session.sendToolResponse({
          functionResponses: [{
            name: 'manage_files',
            id: call.id,
            response: { error: err.message }
          }]
        });
      }
    } else if (call.name === 'open_item') {
      const { target } = call.args as any;
      addLog('tool', `Opening System Item`, { target });

      await apiClient.invoke('system-open', { target });
      session.sendToolResponse({
        functionResponses: [{
          name: 'open_item',
          id: call.id,
          response: { result: 'Opened successfully' }
        }]
      });
    } else if (call.name === 'update_dashboard') {
      const { headlines, weather } = call.args as any;
      addLog('success', 'AI updated the dashboard with new headlines & weather');

      // Notify the app through a callback
      onDashboardUpdated?.({ headlines, weather });


      session.sendToolResponse({
        functionResponses: [{
          name: 'update_dashboard',
          id: call.id,
          response: { result: 'Dashboard updated successfully.' }
        }]
      });
    } else if (call.name === 'get_clipboard') {
      addLog('tool', 'Reading clipboard contents');
      const result = await apiClient.invoke('clipboard-read');
      session.sendToolResponse({
        functionResponses: [{
          name: 'get_clipboard',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'set_clipboard') {
      const { text, html } = call.args as any;
      addLog('tool', 'Writing to clipboard', { textLength: text?.length });
      const result = await apiClient.invoke('clipboard-write', { text, html });
      session.sendToolResponse({
        functionResponses: [{
          name: 'set_clipboard',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'take_screenshot') {
      addLog('tool', 'Capturing screenshot');
      const result = await apiClient.invoke('take-screenshot');

      if (result.success) {
        addLog('success', 'Screenshot captured successfully');
        onImageGenerated?.(`data:${result.mimeType};base64,${result.data}`);

        // Return a brief success to the session to avoid WebSocket payload size limits
        session.sendToolResponse({
          functionResponses: [{
            name: 'take_screenshot',
            id: call.id,
            response: { result: 'Screenshot captured and added to my visual context. I am processing it now.' }
          }]
        });

        // Immediately follow up with the actual image data in a separate turn (supported multimodal format)
        // This keeps the session stable while providing the visual data
        setTimeout(() => {
          try {
            session.sendClientContent({
              turns: [{
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: result.data,
                      mimeType: result.mimeType
                    }
                  },
                  { text: "[SYSTEM_VISUAL_CONTEXT] This is the screenshot I just captured. Please analyze what you see to answer my previous request." }
                ]
              }],
              turnComplete: true
            });
            addLog('info', 'Screen context synced to AI core');
          } catch (e: any) {
            console.error('Failed to send screenshot turn:', e);
            addLog('error', `Failed to sync visual context: ${e.message}`);
          }
        }, 100);

      } else {
        addLog('error', `Screenshot failed: ${result.error}`);
        session.sendToolResponse({
          functionResponses: [{
            name: 'take_screenshot',
            id: call.id,
            response: { error: result.error }
          }]
        });
      }
    } else if (call.name === 'adjust_volume') {
      const { action, amount } = call.args as any;
      addLog('tool', `Adjusting system volume: ${action}`, { amount: amount || 5 });

      try {
        let result;
        if (action === 'mute') {
          result = await apiClient.invoke('mute-volume');
        } else {
          result = await apiClient.invoke('change-volume', { direction: action, amount: amount || 5 });
        }

        session.sendToolResponse({
          functionResponses: [{
            name: 'adjust_volume',
            id: call.id,
            response: result.success ? { result: `Volume adjusted successfully.` } : { error: result.error }
          }]
        });
      } catch (err: any) {
        addLog('error', `Volume adjustment failed: ${err.message}`);
      }
    } else if (call.name === 'send_notification') {
      const { title, body } = call.args as any;
      addLog('tool', 'Sending system notification', { title });
      const result = await apiClient.invoke('send-notification', { title, body });
      session.sendToolResponse({
        functionResponses: [{
          name: 'send_notification',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'http_request') {
      const { url, method, headers, body } = call.args as any;
      addLog('tool', `Making HTTP ${method || 'GET'} request`, { url });
      const result = await apiClient.invoke('http-fetch', { url, method, headers, body });
      session.sendToolResponse({
        functionResponses: [{
          name: 'http_request',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'get_system_info') {
      addLog('tool', 'Fetching detailed system information');
      const result = await apiClient.invoke('get-detailed-system-info');
      session.sendToolResponse({
        functionResponses: [{
          name: 'get_system_info',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'get_processes') {
      addLog('tool', 'Getting running processes');
      const result = await apiClient.invoke('get-processes');
      session.sendToolResponse({
        functionResponses: [{
          name: 'get_processes',
          id: call.id,
          response: { processes: result }
        }]
      });
    } else if (call.name === 'kill_process') {
      const { pid } = call.args as any;
      addLog('warning', `Terminating process PID: ${pid}`);
      const result = await apiClient.invoke('kill-process', { pid });
      session.sendToolResponse({
        functionResponses: [{
          name: 'kill_process',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'window_control') {
      const { action } = call.args as any;
      addLog('tool', `Window control: ${action}`);
      const result = await apiClient.invoke('window-control', { action });
      session.sendToolResponse({
        functionResponses: [{
          name: 'window_control',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'keyboard_press') {
      const { key } = call.args as any;
      addLog('tool', `Pressing keyboard key: ${key}`);
      const result = await apiClient.invoke('keyboard-press', { key });
      session.sendToolResponse({
        functionResponses: [{
          name: 'keyboard_press',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'keyboard_type') {
      const { text, pressEnter } = call.args as any;
      addLog('tool', `Typing text${pressEnter ? ' and pressing Enter' : ''}`, { textLength: text?.length });
      const result = await apiClient.invoke('keyboard-type', { text, pressEnter: pressEnter || false });
      session.sendToolResponse({
        functionResponses: [{
          name: 'keyboard_type',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'play_youtube_video') {
      const { query } = call.args as any;
      addLog('tool', `Searching YouTube for: ${query}`);

      try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const response = await apiClient.invoke('http-fetch', { url: searchUrl });

        if (response.success) {
          const matches = response.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
          if (matches && matches[1]) {
            const videoId = matches[1];
            addLog('success', `Found video. Playing now...`);
            onYouTubePlay?.(videoId);

            session.sendToolResponse({
              functionResponses: [{
                name: 'play_youtube_video',
                id: call.id,
                response: { result: 'Video found and playing in the app player.', videoId }
              }]
            });
          } else {
            throw new Error('Could not find a valid video in search results.');
          }
        } else {
          throw new Error('Failed to search YouTube.');
        }
      } catch (err: any) {
        addLog('error', `YouTube search failed: ${err.message}`);
        session.sendToolResponse({
          functionResponses: [{
            name: 'play_youtube_video',
            id: call.id,
            response: { error: err.message }
          }]
        });
      }
    } else if (call.name === 'start_navigation') {
      const { destination } = call.args as any;
      addLog('tool', `📍 Initiating Navigation to ${destination}`);

      if (onNavigationRequested) {
        onNavigationRequested(destination);
        session.sendToolResponse({
          functionResponses: [{
            name: 'start_navigation',
            id: call.id,
            response: { result: `Navigation to ${destination} started. The map is now visible on screen.` }
          }]
        });
      } else {
        session.sendToolResponse({
          functionResponses: [{
            name: 'start_navigation',
            id: call.id,
            response: { error: 'Navigation module is not available in the current context.' }
          }]
        });
      }
    }
  }
};