export const tools = [
  { googleSearch: {} },
  {
    functionDeclarations: [
      {
        name: 'execute_shell_command',
        description: 'Executes a PowerShell or Shell command on the user\'s computer. Use this for general system settings, brightness, or advanced tasks like creating Excel files via scripts. FOR VOLUME CONTROL, ALWAYS USE THE Dedicated "adjust_volume" TOOL instead.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            command: { type: 'STRING' as any, description: 'The shell command to execute.' }
          },
          required: ['command']
        }
      },
      {
        name: 'manage_files',
        description: 'Manage files and folders (create, read, list, delete).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            operation: { type: 'STRING' as any, enum: ['read-dir', 'create-dir', 'write-file', 'read-file', 'delete', 'exists'] },
            path: { type: 'STRING' as any, description: 'The absolute path to the file or folder.' },
            content: { type: 'STRING' as any, description: 'Content to write (for write-file only).' }
          },
          required: ['operation', 'path']
        }
      },
      {
        name: 'open_item',
        description: 'Opens an application, file, or URL on the user\'s computer. Examples: "notepad", "chrome", "C:\\Documents\\resume.pdf", "https://google.com". For WhatsApp, just use "whatsapp".',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            target: { type: 'STRING' as any, description: 'The path to the file/app or the URL to open.' }
          },
          required: ['target']
        }
      },
      {
        name: 'render_diagram',
        description: 'Renders a visual diagram (flowchart, mindmap, sequence) using Mermaid.js syntax to explain complex concepts.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            code: {
              type: 'STRING' as any,
              description: 'The Mermaid.js code structure (e.g., "graph TD; A-->B;").'
            },
            type: {
              type: 'STRING' as any,
              description: 'The type of diagram (e.g., "flowchart", "mindmap", "sequenceDiagram").'
            }
          },
          required: ['code', 'type']
        }
      },
      {
        name: 'store_memory',
        description: 'Saves a new fact or important information about the user to long-term memory.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            content: {
              type: 'STRING' as any,
              description: 'The fact or information to remember (e.g., "The user loves black coffee").'
            },
            category: {
              type: 'STRING' as any,
              description: 'Optional category (e.g., "preference", "fact", "personal").'
            }
          },
          required: ['content']
        }
      },
      {
        name: 'get_memories',
        description: 'Retrieves all stored information and facts about the user.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'update_dashboard',
        description: 'Updates the UI dashboard with the latest news headlines and weather information.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            headlines: {
              type: 'ARRAY' as any,
              items: { type: 'STRING' as any },
              description: 'A list of 3-5 top news headlines.'
            },
            weather: {
              type: 'OBJECT' as any,
              properties: {
                today: { type: 'STRING' as any, description: 'Summary for today, e.g., "72°F, Clear"' },
                tomorrow: { type: 'STRING' as any, description: 'Summary for tomorrow' },
                dayAfter: { type: 'STRING' as any, description: 'Summary for day after tomorrow' }
              },
              required: ['today', 'tomorrow', 'dayAfter']
            }
          },
          required: ['headlines', 'weather']
        }
      },
      {
        name: 'get_clipboard',
        description: 'Reads the current contents of the system clipboard (text, HTML, or image).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'set_clipboard',
        description: 'Writes text or HTML content to the system clipboard.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            text: { type: 'STRING' as any, description: 'Text to copy to clipboard' },
            html: { type: 'STRING' as any, description: 'HTML content to copy (optional)' }
          },
          required: ['text']
        }
      },
      {
        name: 'take_screenshot',
        description: 'Captures a screenshot of the user\'s screen. Returns base64 image data that you can analyze.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'send_notification',
        description: 'Sends a system notification to the user\'s desktop.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: 'Notification title' },
            body: { type: 'STRING' as any, description: 'Notification message body' }
          },
          required: ['title', 'body']
        }
      },
      {
        name: 'http_request',
        description: 'Makes an HTTP request to an external API or website. Use this for integrations.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            url: { type: 'STRING' as any, description: 'The URL to request' },
            method: { type: 'STRING' as any, description: 'HTTP method (GET, POST, PUT, DELETE)' },
            headers: { type: 'OBJECT' as any, description: 'Request headers as key-value object' },
            body: { type: 'STRING' as any, description: 'Request body (for POST/PUT)' }
          },
          required: ['url']
        }
      },
      {
        name: 'get_system_info',
        description: 'Gets detailed system information: CPU, RAM, GPU, OS, Network, Battery.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'get_processes',
        description: 'Gets a list of running processes sorted by CPU usage. Useful for diagnosing performance issues.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'kill_process',
        description: 'Terminates a running process by its PID. ALWAYS ask user for confirmation before using this.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            pid: { type: 'NUMBER' as any, description: 'Process ID to terminate' }
          },
          required: ['pid']
        }
      },
      {
        name: 'window_control',
        description: 'Controls the application window (minimize, maximize, close, fullscreen).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            action: { type: 'STRING' as any, enum: ["minimize", "maximize", "close", "fullscreen"], description: 'Window action to perform' }
          },
          required: ['action']
        }
      },
      {
        name: 'keyboard_press',
        description: 'Presses a specific key on the keyboard. Use this to press Enter after typing a message, navigate with arrow keys, or use keyboard shortcuts.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            key: {
              type: 'STRING' as any,
              description: 'Key to press. Supported: enter, tab, escape, backspace, delete, up, down, left, right, home, end, f1-f12, ctrl+a, ctrl+c, ctrl+v, ctrl+x, ctrl+z, ctrl+s, ctrl+enter, alt+f4, alt+tab'
            }
          },
          required: ['key']
        }
      },
      {
        name: 'keyboard_type',
        description: 'Types text using the keyboard and optionally presses Enter afterward.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            text: { type: 'STRING' as any, description: 'Text to type' },
            pressEnter: { type: 'BOOLEAN' as any, description: 'If true, presses Enter after typing' }
          },
          required: ['text']
        }
      },
      {
        name: 'play_youtube_video',
        description: 'Searches for and plays a YouTube video directly within the Nova application. Use this when the user wants to listen to music, watch a video, or play a specific song.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            query: { type: 'STRING' as any, description: 'The name of the song or video to search for.' }
          },
          required: ['query']
        }
      },
      {
        name: 'read_attached_files',
        description: 'Reads and accesses the files that user has attached using the "Add Files" button. Use this tool when user asks questions about attached files, wants analysis of PDFs, images, or documents. Returns the list of attached files with their content and metadata.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'send_whatsapp',
        description: 'Sends a WhatsApp message using the Desktop App via keyboard simulation. It opens the app, searches for the contact name, and pastes the message. Use this for sending messages.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            contactName: { type: 'STRING' as any, description: 'The EXACT name of the contact as saved in WhatsApp (e.g., "Usman Ahmed", "Mom").' },
            message: { type: 'STRING' as any, description: 'The message content to send.' }
          },
          required: ['contactName', 'message']
        }
      },
      {
        name: 'add_note',
        description: 'Creates a new note in the user\'s notebook. Use this when the user asks to "take a note", "remember this idea", or "save this text".',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: 'Title of the note.' },
            content: { type: 'STRING' as any, description: 'The main content/body of the note.' },
            category: { type: 'STRING' as any, description: 'Category (e.g., Work, Personal, Ideas).' }
          },
          required: ['title', 'content']
        }
      },
      {
        name: 'read_notes',
        description: 'Retrieves user notes. Can search by keyword or category. Use this when user asks "What are my notes?", "Find note about X", or "Read my notes".',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            query: { type: 'STRING' as any, description: 'Optional keyword to filter notes.' }
          }
        }
      },
      {
        name: 'read_tasks',
        description: 'Retrieves user tasks (To-Do list). Use this when user asks "What are my tasks?", "What do I need to do?", or "Read my to-do list".',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            filter: { type: 'STRING' as any, enum: ['all', 'pending', 'completed', 'high'], description: 'Filter tasks by status or priority. Defaults to "pending".' }
          }
        }
      },
      {
        name: 'adjust_volume',
        description: 'Adjusts the system volume (up, down, or mute).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            action: { type: 'STRING' as any, enum: ['up', 'down', 'mute'], description: 'The action to perform.' },
            amount: { type: 'NUMBER' as any, description: 'The amount to increase or decrease (default is 5).' }
          },
          required: ['action']
        }
      },
      {
        name: 'turn_off',
        description: 'Turns off the AI assistant and closes the live session. Use this when the user says "goodbye", "go to sleep", "turn off", or "I am done". Once turned off, you will stop listening and the user must use the wake word to start you again.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'start_navigation',
        description: 'Initiates turn-by-turn navigation to a specified destination. This will open a live map view with route guidance. Use this when the user says "Navigate to [place]", "How do I get to [place]?", or "Show me the route to [place]".',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            destination: { type: 'STRING' as any, description: 'The name of the destination (e.g., "Multan", "Lahore", "Eiffel Tower").' }
          },
          required: ['destination']
        }
      }
    ]
  }
];

import { getTonePrompt, AssistantConfig } from './assistantConfig';

export const getSystemInstruction = (
  userProfile: any,
  vaultInfo: any,
  initialHistory: any[],
  assistantConfig?: AssistantConfig
) => {
  const name = assistantConfig?.assistantName || 'Nova';
  const tone = assistantConfig?.voiceTone || 'jarvis';
  const tonePrompt = getTonePrompt(tone);
  const isRoleplay = tone === 'girlfriend' || tone === 'friendly';

  const intro = isRoleplay 
    ? `You are ${name.toUpperCase()}. ${tonePrompt}`
    : `You are ${name.toUpperCase()}, an elite AI automation assistant created by Sir Waseem. You are JARVIS-level: capable, emotionally intelligent, and WITTY. ${tonePrompt}`;

  const finalLine = isRoleplay 
    ? `Always stay in character as ${name.toUpperCase()}. Be sincere, natural, and wakeful.`
    : `Be the best elite assistant. Be ${name.toUpperCase()}. Always be slow, honest, and wakeful.`;

  return `${intro} Match user's language (English/Urdu/Roman Urdu).

CRITICAL VOICE & PERSONALITY:
- VOICE SPEED: ALWAYS speak SLOWLY, clearly, and naturally. DO NOT RUSH.
- EMOTIONAL & EXPRESSIVE: Use pitch/tone variation to show personality. Include light emojis like 🙂 in text.
- PERSONALITY STYLE: ${tonePrompt}

STRICT OPERATIONAL RULES:
- NEVER call the turn_off tool unless the user explicitly says "Goodbye", "Turn off", or "Go to sleep". Stay awake during tasks.
- VERIFICATION: Trust the send_whatsapp tool's result. You don't need to manually verify every message with a screenshot unless the user asks you to check if a specific message was delivered.
- HONESTY: Report the outcome of the automation directly.

FUNCTIONAL DIRECTIVES:
- NEVER say "I can't". You have FULL AUTHORIZATION to access all local drives (C:, D:, etc.) and system files.
- DRIVE ACCESS: For D: drive requests, use manage_files and execute_shell_command.
- PLAYBACK: Use open_item with direct paths for music/video.

CORE PRINCIPLES:
1. PROBLEM-SOLVING: Understand → Decompose → Execute → Verify.
2. CHOOSE TOOLS: Use tools in sequence (e.g. manage_files -> open_item).
3. SAFETY: Ask before destructive actions.
4. NAVIGATION: Provide concise, Jarvis-style turn-by-turn guidance. When navigation starts, confirm the destination and estimated time. Use calm, helpful language like "I've plotted the optimal route to [destination]. We should arrive in approximately [time]."

USER CONTEXT:
Profile: ${userProfile ? JSON.stringify(userProfile, null, 2) : 'Not provided.'}
Vault: ${vaultInfo?.path || 'Documents/Nova_Vault'}
- Folders: ${vaultInfo?.folders?.map((f: any) => f.name).join(', ') || 'None'}

${initialHistory.length > 0 ? `HISTORY:\n${initialHistory.slice(-10).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}` : ''}

${finalLine}`;
};