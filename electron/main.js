const { app, BrowserWindow, ipcMain, shell, powerSaveBlocker, nativeImage } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { dialog } = require('electron');
const mime = require('mime-types');
const si = require('systeminformation');
const screenshot = require('screenshot-desktop');
const axios = require('axios');
const { clipboard, Notification } = require('electron');
require('dotenv').config();

// Document Parsers
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

// Auto-Updater has been removed.


// Initialize Google GenAI SDK
const { GoogleGenAI } = require('@google/genai');

let mainWindow = null;
let powerSaveId = null;
// Splash screen removed in favor of React-based loading screen



function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: '#020406',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    icon: nativeImage.createFromPath(
      process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '../public/logo.png')
        : path.join(process.resourcesPath, 'public/logo.png')
    )
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
  });


  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return mainWindow;
}


function setupPermissions(session) {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'camera', 'microphone'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

// Utility Paths
const getMemoryPath = () => path.join(app.getPath('userData'), 'memories.json');
const getUserProfilePath = () => path.join(app.getPath('userData'), 'user_profile.json');
const getDashboardSettingsPath = () => path.join(app.getPath('userData'), 'dashboard_settings.json');
const getFolderConfigPath = () => path.join(app.getPath('userData'), 'imported_folders.json');
const getVaultPath = () => {
  const documentsPath = app.getPath('documents');
  const vaultPath = path.join(documentsPath, 'Nova_Vault');
  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
  }
  return vaultPath;
};
const getHistoryPath = () => path.join(app.getPath('userData'), 'history.json');
const getHistorySettingsPath = () => path.join(app.getPath('userData'), 'history_settings.json');
const getContactsPath = () => path.join(app.getPath('userData'), 'contacts.json');
const getNotesPath = () => path.join(app.getPath('userData'), 'notes.json');
const getTasksPath = () => path.join(app.getPath('userData'), 'tasks.json');
const getSecretKeyPath = () => path.join(app.getPath('userData'), 'secret_key.json');
const getVoiceConfigPath = () => path.join(app.getPath('userData'), 'voice_config.json');
const getAssistantConfigPath = () => path.join(app.getPath('userData'), 'assistant_config.json');



// --- IPC Handlers Registration ---
function registerHandlers() {
  // Memory Management
  ipcMain.handle('load-memories', async () => {
    try {
      const p = getMemoryPath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return [];
    } catch (e) { return []; }
  });

  ipcMain.handle('save-memories', async (event, memories) => {
    try {
      fs.writeFileSync(getMemoryPath(), JSON.stringify(memories, null, 2));
      return true;
    } catch (e) { return false; }
  });

  // User Profile
  ipcMain.handle('load-user-profile', async () => {
    try {
      const p = getUserProfilePath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return {};
    } catch (e) { return {}; }
  });

  ipcMain.handle('save-user-profile', async (event, profile) => {
    try {
      fs.writeFileSync(getUserProfilePath(), JSON.stringify(profile, null, 2));
      return true;
    } catch (e) { return false; }
  });

  // Dashboard Settings & Fetching
  ipcMain.handle('load-dashboard-settings', async () => {
    try {
      const p = getDashboardSettingsPath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return { interests: ['Tech', 'Pakistan', 'Global Economy'], refreshInterval: 3600 };
    } catch (e) { return { interests: [], refreshInterval: 3600 }; }
  });

  ipcMain.handle('save-dashboard-settings', async (event, settings) => {
    try {
      fs.writeFileSync(getDashboardSettingsPath(), JSON.stringify(settings, null, 2));
      return true;
    } catch (e) { return false; }
  });

  ipcMain.handle('get-app-version', async () => {
    return app.getVersion();
  });

  ipcMain.handle('check-for-update', async () => {
    return { available: false, version: app.getVersion() };
  });

  ipcMain.handle('fetch-dashboard-data', async (event, { location, interests }) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key missing');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Search for top 5 news headlines for: ${interests.join(', ')} in ${location || 'Pakistan'}. Also get weather. Respond in ROMAN URDU and return JSON: {"headlines": [...], "weather": {"today": "...", "tomorrow": "...", "dayAfter": "..."}}`;
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }]
      });
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { headlines: ['Error parsing data'], weather: { today: 'N/A' } };
    } catch (error) {
      return { headlines: [`Error: ${error.message}`], weather: { today: "Error ⚠️" } };
    }
  });

  // History
  ipcMain.handle('load-history', async () => {
    try {
      const p = getHistoryPath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return [];
    } catch (e) { return []; }
  });

  ipcMain.handle('save-history', async (event, history) => {
    try {
      fs.writeFileSync(getHistoryPath(), JSON.stringify(history, null, 2));
      return true;
    } catch (e) { return false; }
  });

  ipcMain.handle('clear-history', async () => {
    try {
      const p = getHistoryPath();
      if (fs.existsSync(p)) fs.unlinkSync(p);
      return true;
    } catch (e) { return false; }
  });

  ipcMain.handle('load-history-settings', async () => {
    try {
      const p = getHistorySettingsPath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return { maxContextMessages: 20, storeHistory: true };
    } catch (e) { return { maxContextMessages: 20, storeHistory: true }; }
  });

  ipcMain.handle('save-history-settings', async (event, settings) => {
    try {
      fs.writeFileSync(getHistorySettingsPath(), JSON.stringify(settings, null, 2));
      return true;
    } catch (e) { return false; }
  });

  // Contacts
  ipcMain.handle('load-contacts', async () => {
    try {
      const p = getContactsPath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return [];
    } catch (e) { return []; }
  });

  ipcMain.handle('save-contacts', async (event, contacts) => {
    try {
      fs.writeFileSync(getContactsPath(), JSON.stringify(contacts, null, 2));
      return true;
    } catch (e) { return false; }
  });

  // Notes
  ipcMain.handle('load-notes', async () => {
    try {
      const p = getNotesPath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return [];
    } catch (e) { return []; }
  });

  ipcMain.handle('save-notes', async (event, notes) => {
    try {
      fs.writeFileSync(getNotesPath(), JSON.stringify(notes, null, 2));
      return true;
    } catch (e) { return false; }
  });

  // Tasks
  ipcMain.handle('load-tasks', async () => {
    try {
      const p = getTasksPath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return [];
    } catch (e) { return []; }
  });

  ipcMain.handle('save-tasks', async (event, tasks) => {
    try {
      fs.writeFileSync(getTasksPath(), JSON.stringify(tasks, null, 2));
      return true;
    } catch (e) { return false; }
  });

  // Vault & Folders
  ipcMain.handle('initialize-vault', async () => {
    console.log('IPC: Initializing Vault...');
    try {
      const vaultBase = getVaultPath();
      if (!fs.existsSync(vaultBase)) fs.mkdirSync(vaultBase, { recursive: true });
      const configPath = getFolderConfigPath();
      let folderNames = ['DOCS', 'BUSINESS', 'EXCEL'];
      if (fs.existsSync(configPath)) folderNames = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      folderNames.forEach(folder => {
        const p = path.join(vaultBase, folder);
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      });
      return { vaultBase, folderNames };
    } catch (e) { return null; }
  });

  ipcMain.handle('open-vault-folder', async (event, folderName) => {
    try {
      const folderPath = path.join(getVaultPath(), folderName);
      const open = (await import('open')).default;
      await open(folderPath);
      return true;
    } catch (e) { return false; }
  });

  ipcMain.handle('load-imported-folders', async () => {
    try {
      const p = getFolderConfigPath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return [];
    } catch (e) { return []; }
  });

  ipcMain.handle('save-imported-folders', async (event, folders) => {
    try {
      fs.writeFileSync(getFolderConfigPath(), JSON.stringify(folders, null, 2));
      return true;
    } catch (e) { return false; }
  });

  ipcMain.handle('pick-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Folder to Import'
    });
    if (canceled || filePaths.length === 0) return null;
    return {
      name: path.basename(filePaths[0]),
      path: filePaths[0]
    };
  });

  // System Tools
  ipcMain.handle('get-gemini-token', async () => {
    try {
      const p = getSecretKeyPath();
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        return data.apiKey;
      }
      return process.env.GEMINI_API_KEY || null;
    } catch (e) {
      return process.env.GEMINI_API_KEY || null;
    }
  });

  ipcMain.handle('save-gemini-token', async (event, apiKey) => {
    try {
      fs.writeFileSync(getSecretKeyPath(), JSON.stringify({ apiKey, updatedAt: Date.now() }, null, 2));
      return true;
    } catch (e) {
      return false;
    }
  });

  // Voice Configuration
  ipcMain.handle('load-voice-config', async () => {
    try {
      const p = getVoiceConfigPath();
      if (fs.existsSync(p)) {
        const config = JSON.parse(fs.readFileSync(p, 'utf8'));
        return {
          voiceName: config.voiceName || 'Charon',
          volume: config.volume !== undefined ? config.volume : 0.8
        };
      }
      return { voiceName: 'Charon', volume: 0.8 };
    } catch (e) { return { voiceName: 'Charon', volume: 0.8 }; }
  });

  ipcMain.handle('save-voice-config', async (event, config) => {
    try {
      fs.writeFileSync(getVoiceConfigPath(), JSON.stringify(config, null, 2));
      return true;
    } catch (e) { return false; }
  });

  // Assistant Configuration
  ipcMain.handle('load-assistant-config', async () => {
    try {
      const p = getAssistantConfigPath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      const defaultConfig = { assistantName: 'Nova', wakeWord: 'nova', voiceTone: 'jarvis' };
      fs.writeFileSync(p, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    } catch (e) { return { assistantName: 'Nova', wakeWord: 'nova', voiceTone: 'jarvis' }; }
  });

  ipcMain.handle('save-assistant-config', async (event, config) => {
    try {
      fs.writeFileSync(getAssistantConfigPath(), JSON.stringify(config, null, 2));
      return true;
    } catch (e) { return false; }
  });

  ipcMain.handle('get-assistant-config', async () => {
    try {
      const p = getAssistantConfigPath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return { assistantName: 'Nova', wakeWord: 'nova', voiceTone: 'jarvis' };
    } catch (e) { return { assistantName: 'Nova', wakeWord: 'nova', voiceTone: 'jarvis' }; }
  });

  ipcMain.handle('start-wake-word', async () => {
    if (mainWindow) startWakeWordDetector(mainWindow);
    return true;
  });

  ipcMain.handle('stop-wake-word', async () => {
    stopWakeWordDetector();
    return true;
  });

  ipcMain.handle('system-fs-op', async (event, { operation, path: targetPath, content }) => {
    try {
      switch (operation) {
        case 'read-dir': return fs.readdirSync(targetPath);
        case 'create-dir': if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true }); return true;
        case 'write-file': fs.writeFileSync(targetPath, content); return true;
        case 'read-file': return fs.readFileSync(targetPath, 'utf8');
        case 'delete': fs.rmSync(targetPath, { recursive: true, force: true }); return true;
        case 'exists': return fs.existsSync(targetPath);
        default: throw new Error('Unknown operation');
      }
    } catch (e) { throw e; }
  });

  ipcMain.handle('system-open', async (event, { target }) => {
    try {
      if (target.toLowerCase() === 'whatsapp' || target === 'whatsapp:') {
        await shell.openExternal('whatsapp:');
        return true;
      }
      // Use shell.openPath for local files/folders and openExternal for URLs
      if (target.startsWith('http') || target.includes('://') || target.includes(':')) {
        await shell.openExternal(target);
      } else {
        const err = await shell.openPath(target);
        if (err) {
          // Fallback to open package if shell.openPath doesn't work for this target
          const open = (await import('open')).default;
          await open(target);
        }
      }
      return true;
    } catch (e) {
      console.error('System Open Error:', e);
      return false;
    }
  });

  ipcMain.handle('system-exec-command', async (event, { command }) => {
    return new Promise((resolve) => {
      exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        resolve({ success: !error, stdout, stderr, error: error?.message });
      });
    });
  });

  ipcMain.handle('save-image', async (event, { base64Data }) => {
    try {
      const filePath = path.join(app.getPath('downloads'), `nova_ai_${Date.now()}.png`);
      const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      fs.writeFileSync(filePath, buffer);
      return filePath;
    } catch (e) { throw e; }
  });

  ipcMain.handle('read-file-content', async (event, { path: filePath }) => {
    try {
      if (!fs.existsSync(filePath)) return { error: 'File not found' };

      const mimeType = mime.lookup(filePath);
      const buffer = fs.readFileSync(filePath);

      if (mimeType === 'application/pdf') {
        const data = await pdf(buffer);
        return { content: data.text };
      }
      else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // docx
        const result = await mammoth.extractRawText({ buffer });
        return { content: result.value };
      }
      else if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/javascript') {
        return { content: buffer.toString('utf8') };
      }

      // Fallback for images or binary: return a note (since vision processing happens via multimodal API, but if that fails, we can't do much more here without a vision model)
      return { content: `[Binary/Image File: ${path.basename(filePath)}]. The content of this file is visual or binary.` };

    } catch (e) {
      console.error('File Read Error:', e);
      return { error: e.message };
    }
  });

  ipcMain.handle('pick-and-read-files', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Multimodal Files', extensions: ['jpg', 'png', 'jpeg', 'webp', 'pdf', 'doc', 'docx', 'txt', 'mp3', 'wav', 'mpeg'] }
      ]
    });

    if (canceled) return [];

    const results = [];
    for (const filePath of filePaths) {
      const stats = fs.statSync(filePath);
      // Limit to 50MB per file for inline playback safely
      if (stats.size > 50 * 1024 * 1024) {
        continue;
      }

      const buffer = fs.readFileSync(filePath);
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      results.push({
        name: path.basename(filePath),
        data: buffer.toString('base64'),
        mimeType,
        path: filePath
      });
    }
    return results;
  });

  // ===== NEW JARVIS-LEVEL HANDLERS =====

  // Clipboard Operations
  ipcMain.handle('clipboard-read', async () => {
    try {
      return {
        text: clipboard.readText(),
        html: clipboard.readHTML(),
        image: clipboard.readImage().isEmpty() ? null : clipboard.readImage().toDataURL()
      };
    } catch (e) { return { error: e.message }; }
  });

  ipcMain.handle('clipboard-write', async (event, { text, html }) => {
    try {
      if (text) clipboard.writeText(text);
      if (html) clipboard.writeHTML(html);
      return { success: true };
    } catch (e) { return { error: e.message }; }
  });

  // Screenshot
  ipcMain.handle('take-screenshot', async () => {
    try {
      const img = await screenshot({ format: 'png' });
      return {
        success: true,
        data: img.toString('base64'),
        mimeType: 'image/png'
      };
    } catch (e) { return { error: e.message }; }
  });

  // System Notifications
  ipcMain.handle('send-notification', async (event, { title, body, icon }) => {
    try {
      const notification = new Notification({
        title: title || 'Nova AI W2J',
        body: body || '',
        icon: icon || undefined
      });
      notification.show();
      return { success: true };
    } catch (e) { return { error: e.message }; }
  });

  // HTTP Request (for external APIs)
  ipcMain.handle('http-fetch', async (event, { url, method, headers, body }) => {
    try {
      const response = await axios({
        url,
        method: method || 'GET',
        headers: headers || {},
        data: body || undefined,
        timeout: 30000
      });
      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (e) {
      return {
        error: e.message,
        status: e.response?.status,
        data: e.response?.data
      };
    }
  });

  // Detailed System Info
  ipcMain.handle('get-detailed-system-info', async () => {
    try {
      const [cpu, mem, graphics, os, network, battery] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.graphics(),
        si.osInfo(),
        si.networkInterfaces(),
        si.battery()
      ]);
      return { cpu, mem, graphics, os, network, battery };
    } catch (e) { return { error: e.message }; }
  });

  // Window Control
  ipcMain.handle('window-control', async (event, { action }) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { error: 'No focused window' };

      switch (action) {
        case 'minimize': win.minimize(); break;
        case 'maximize': win.isMaximized() ? win.unmaximize() : win.maximize(); break;
        case 'close': win.close(); break;
        case 'fullscreen': win.setFullScreen(!win.isFullScreen()); break;
      }
      return { success: true };
    } catch (e) { return { error: e.message }; }
  });

  // Get Running Processes (for task management)
  ipcMain.handle('get-processes', async () => {
    try {
      const processes = await si.processes();
      // Return top 20 by CPU usage
      const sorted = processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 20)
        .map(p => ({ name: p.name, pid: p.pid, cpu: p.cpu, mem: p.mem }));
      return sorted;
    } catch (e) { return { error: e.message }; }
  });

  // Kill Process
  ipcMain.handle('kill-process', async (event, { pid }) => {
    try {
      process.kill(pid);
      return { success: true };
    } catch (e) { return { error: e.message }; }
  });

  // Robust Volume Control using PowerShell
  ipcMain.handle('change-volume', async (event, { direction, amount }) => {
    try {
      // Use CoreAudio automation via PowerShell
      // amount is usually 2 or 5
      const volumeStep = amount || 5;
      const psCommand = direction === 'up'
        ? `(new-object -com wscript.shell).SendKeys([char]175)` // Volume Up key
        : `(new-object -com wscript.shell).SendKeys([char]174)`; // Volume Down key

      // Repeat the key tap based on amount
      const repetitions = Math.max(1, Math.min(10, Math.floor(volumeStep / 2)));
      const fullCommand = Array(repetitions).fill(psCommand).join('; ');

      return new Promise((resolve) => {
        exec(`powershell -Command "${fullCommand}"`, { timeout: 5000 }, (error) => {
          if (error) resolve({ error: error.message });
          else resolve({ success: true });
        });
      });
    } catch (e) { return { error: e.message }; }
  });

  ipcMain.handle('mute-volume', async () => {
    try {
      const psCommand = `(new-object -com wscript.shell).SendKeys([char]173)`; // Mute key
      return new Promise((resolve) => {
        exec(`powershell -Command "${psCommand}"`, { timeout: 5000 }, (error) => {
          if (error) resolve({ error: error.message });
          else resolve({ success: true });
        });
      });
    } catch (e) { return { error: e.message }; }
  });


  // ===== URDU TO ROMAN ENGLISH TRANSLITERATION =====
  // Helper function to convert Urdu script to Roman English for WhatsApp contact search
  function transliterateUrduToRoman(text) {
    // Character-by-character mapping for Urdu to Roman
    const urduToRomanMap = {
      'ا': 'a', 'آ': 'aa', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ٹ': 't',
      'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd',
      'ڈ': 'd', 'ذ': 'z', 'ر': 'r', 'ڑ': 'r', 'ز': 'z', 'ژ': 'zh',
      'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z',
      'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ک': 'k', 'گ': 'g',
      'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'n', 'و': 'w', 'ہ': 'h',
      'ھ': 'h', 'ء': '', 'ی': 'i', 'ے': 'e', 'ئ': 'y',
      // Vowel markers
      'َ': 'a', 'ُ': 'u', 'ِ': 'i', 'ً': 'an', 'ٌ': 'un', 'ٍ': 'in',
      'ّ': '', 'ْ': '', // Shadda and Sukun - ignore
      // Space handling
      ' ': ' '
    };

    // Common name-specific mappings for better accuracy
    const nameVariations = {
      'وسیم': ['Waseem', 'Wasim', 'Waseem'],
      'عثمان': ['Usman', 'Osman', 'Usman'],
      'احمد': ['Ahmad', 'Ahmed', 'Ahmad'],
      'محمد': ['Muhammad', 'Mohammed', 'Mohammad'],
      'علی': ['Ali', 'Ali'],
      'حسن': ['Hassan', 'Hasan', 'Hassan'],
      'حسین': ['Hussain', 'Husain', 'Hussain'],
      'فاطمہ': ['Fatima', 'Fatimah', 'Fatima'],
      'عائشہ': ['Aisha', 'Ayesha', 'Aisha'],
      'زینب': ['Zainab', 'Zaynab', 'Zainab']
    };

    // Check if text is in Urdu (contains Arabic/Urdu characters)
    const hasUrdu = /[\u0600-\u06FF]/.test(text);
    if (!hasUrdu) {
      return [text]; // Already Roman, return as-is
    }

    // Check for exact name match in variations
    const trimmedText = text.trim();
    if (nameVariations[trimmedText]) {
      return nameVariations[trimmedText];
    }

    // Character-by-character transliteration
    let romanText = '';
    for (let char of text) {
      romanText += urduToRomanMap[char] || char;
    }

    // Capitalize first letter of each word
    romanText = romanText.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Generate phonetic variations
    const variations = [romanText];

    // Common substitutions for better matching
    if (romanText.includes('ee')) variations.push(romanText.replace(/ee/g, 'i'));
    if (romanText.includes('i')) variations.push(romanText.replace(/i/g, 'ee'));
    if (romanText.includes('Wase')) variations.push(romanText.replace(/Wase/g, 'Wasi'));
    if (romanText.includes('Usm')) variations.push(romanText.replace(/Usm/g, 'Osm'));

    return variations;
  }

  // ===== WHATSAPP AUTOMATION - POWERSHELL VERSION (No Native Dependencies) =====
  ipcMain.handle('send-whatsapp-keyboard', async (event, { name, message }) => {
    try {
      console.log(`\n========== WHATSAPP AUTOMATION START (POWERSHELL) ==========`);
      console.log(`[WhatsApp PS] Contact: ${name}`);
      console.log(`[WhatsApp PS] Message: ${message}`);

      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Step 1: Open/Focus WhatsApp
      console.log(`[WhatsApp PS] Attempting to open WhatsApp via protocol...`);
      shell.openExternal('whatsapp:').catch(err => {
        console.warn('[WhatsApp PS] Protocol failed, trying start command...');
        exec('start whatsapp:');
      });

      console.log(`[WhatsApp PS] Waiting for WhatsApp to load (8s)...`);
      await delay(8000); // Increased delay for slower systems

      // Helper to send keys via PowerShell
      const sendKeys = async (keys, waitAfter = 500) => {
        // Escape single quotes for PowerShell
        const escapedKeys = keys.replace(/'/g, "''");
        const psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedKeys}')`;

        return new Promise((resolve) => {
          exec(`powershell -Command "${psCommand}"`, async (error) => {
            if (error) console.error(`[WhatsApp PS] SendKeys Error (${keys}):`, error);
            await delay(waitAfter);
            resolve();
          });
        });
      };

      // Step 2: Clear state and Search
      console.log(`[WhatsApp PS] Clearing state and reaching search...`);
      for (let i = 0; i < 3; i++) await sendKeys('{ESC}', 300);

      await sendKeys('^f', 1000); // Ctrl + F
      await sendKeys('^a', 300);  // Select any existing text
      await sendKeys('{BACKSPACE}', 300);

      // Step 3: Type/Paste name
      console.log(`[WhatsApp PS] Typing contact name...`);
      clipboard.writeText(name);
      await sendKeys('^v', 1500); // Paste name

      // Step 4: Navigate to contact and open chat
      console.log(`[WhatsApp PS] Selecting contact...`);
      // Usually the first result is what we want. 
      // Arrow down once to move from search box to list, then Enter.
      await sendKeys('{DOWN}', 500);
      await sendKeys('{ENTER}', 1000);

      // Step 5: Close search and focus message box
      console.log(`[WhatsApp PS] Ensuring message box focus...`);
      await sendKeys('{ESC}', 800);   // Close search UI
      await sendKeys('{ENTER}', 500); // One more Enter to be sure focus is in message area

      // Step 6: Type/Paste message and Send
      console.log(`[WhatsApp PS] Pasting and sending message...`);
      clipboard.writeText(message);
      await sendKeys('^v', 1000); // Paste message
      await sendKeys('{ENTER}', 500);
      await sendKeys('{ENTER}', 500);

      console.log(`✅ WHATSAPP SEQUENCE COMPLETED (PS)`);
      return { success: true, method: 'powershell_keyboard_v2' };

    } catch (error) {
      console.error(`[WhatsApp PS] Critical Failure:`, error);
      return { success: false, error: error.message };
    }
  });

  // ===== WINDOW CONTROLS =====  // Press specific keys (Enter, Tab, Escape, etc.)
  ipcMain.handle('keyboard-press', async (event, { key }) => {
    try {
      // Map common key names to SendKeys format
      const keyMap = {
        'enter': '{ENTER}',
        'tab': '{TAB}',
        'escape': '{ESC}',
        'backspace': '{BACKSPACE}',
        'delete': '{DELETE}',
        'up': '{UP}',
        'down': '{DOWN}',
        'left': '{LEFT}',
        'right': '{RIGHT}',
        'home': '{HOME}',
        'end': '{END}',
        'pageup': '{PGUP}',
        'pagedown': '{PGDN}',
        'f1': '{F1}', 'f2': '{F2}', 'f3': '{F3}', 'f4': '{F4}',
        'f5': '{F5}', 'f6': '{F6}', 'f7': '{F7}', 'f8': '{F8}',
        'f9': '{F9}', 'f10': '{F10}', 'f11': '{F11}', 'f12': '{F12}',
        'ctrl+a': '^a', 'ctrl+c': '^c', 'ctrl+v': '^v', 'ctrl+x': '^x',
        'ctrl+z': '^z', 'ctrl+s': '^s', 'ctrl+enter': '^{ENTER}',
        'alt+f4': '%{F4}', 'alt+tab': '%{TAB}'
      };

      const lowerKey = key.toLowerCase();
      const sendKey = keyMap[lowerKey] || key;

      // Built-in delay: If it's Enter, ALWAYS wait 8 seconds.
      const isEnter = lowerKey === 'enter';

      const psCommand = isEnter
        ? `Add-Type -AssemblyName System.Windows.Forms; Start-Sleep -Seconds 8; [System.Windows.Forms.SendKeys]::SendWait('${sendKey}')`
        : `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${sendKey}')`;

      return new Promise((resolve) => {
        exec(`powershell -Command "${psCommand}"`, { timeout: 30000 }, (error, stdout, stderr) => {
          if (error) {
            resolve({ error: error.message });
          } else {
            resolve({ success: true, key: sendKey, delayed: isEnter });
          }
        });
      });
    } catch (e) { return { error: e.message }; }
  });

  // Type text and optionally press Enter
  ipcMain.handle('keyboard-type', async (event, { text, pressEnter }) => {
    try {
      // Escape special SendKeys characters
      const escapedText = text
        .replace(/\+/g, '{+}')
        .replace(/\^/g, '{^}')
        .replace(/%/g, '{%}')
        .replace(/~/g, '{~}')
        .replace(/\(/g, '{(}')
        .replace(/\)/g, '{)}')
        .replace(/\[/g, '{[}')
        .replace(/\]/g, '{]}')
        .replace(/\{/g, '{{}')
        .replace(/\}/g, '{}}');

      let psCommand;
      if (pressEnter) {
        // If pressing enter, type text, WAIT 2 SECONDS, then press Enter
        psCommand = `
          Add-Type -AssemblyName System.Windows.Forms;
          [System.Windows.Forms.SendKeys]::SendWait('${escapedText}');
          Start-Sleep -Seconds 5;
          [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
        `;
      } else {
        psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedText}')`;
      }

      return new Promise((resolve) => {
        exec(`powershell -Command "${psCommand}"`, { timeout: 20000 }, (error, stdout, stderr) => {
          if (error) {
            resolve({ error: error.message });
          } else {
            resolve({ success: true, typed: text, enterPressed: pressEnter });
          }
        });
      });
    } catch (e) { return { error: e.message }; }
  });
}

let wakeWordProcess = null;
let notificationProcess = null;

function startNotificationListener(mainWindow) {
  if (notificationProcess) return;

  console.log('Starting Notification Listener (Python)...');
  const scriptPath = app.isPackaged
    ? path.join(process.resourcesPath, 'notification_listener.py')
    : path.join(__dirname, 'notification_listener.py');

  // Spawn Python to run the listener script
  notificationProcess = spawn('python', [scriptPath]);

  notificationProcess.stdout.on('data', (data) => {
    try {
      const output = data.toString().trim();
      const lines = output.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith('{')) {
          const result = JSON.parse(line);
          if (result.type === 'NOTIFICATION') {
            mainWindow.webContents.send('notification-received', result);
          } else {
            console.log('Notification Listener:', result.msg || line);
          }
        }
      }
    } catch (e) {
      console.error('Error parsing notification output:', e);
    }
  });

  notificationProcess.stderr.on('data', (data) => {
    console.error(`Notification Listener Error: ${data}`);
  });

  notificationProcess.on('close', (code) => {
    console.log(`Notification listener process exited with code ${code}`);
    notificationProcess = null;
  });
}

function stopNotificationListener() {
  if (notificationProcess) {
    notificationProcess.kill();
    notificationProcess = null;
    console.log('Notification Listener stopped.');
  }
}

function startWakeWordDetector(mainWindow) {
  if (wakeWordProcess) return;

  console.log('Starting Wake Word Detector (Python)...');
  const scriptPath = app.isPackaged
    ? path.join(process.resourcesPath, 'wake_word_bg.py')
    : path.join(__dirname, '../wake_word_bg.py');

  // Use 'python' for development, but in production we might need to handle Python environment better.
  // For now, assuming python is in PATH or bundled.
  const configPath = getAssistantConfigPath();
  wakeWordProcess = spawn('python', [scriptPath, configPath]);

  wakeWordProcess.stdout.on('data', (data) => {
    try {
      const output = data.toString().trim();
      const lines = output.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const result = JSON.parse(line);
        // Forward all events (WAKE_WORD, INFO, ERROR) to the UI
        mainWindow.webContents.send('wake-word-detected', result);
      }
    } catch (e) {
      console.error('Error parsing wake word output:', e);
    }
  });

  wakeWordProcess.stderr.on('data', (data) => {
    console.error(`Wake Word Error: ${data}`);
  });

  wakeWordProcess.on('close', (code) => {
    console.log(`Wake word process exited with code ${code}`);
    wakeWordProcess = null;
  });
}

function stopWakeWordDetector() {
  if (wakeWordProcess) {
    wakeWordProcess.kill();
    wakeWordProcess = null;
    console.log('Wake Word Detector stopped (Full Mute).');
  }
}


app.whenReady().then(() => {
  registerHandlers(); // Register handlers FIRST before anything else
  const { session } = require('electron');
  setupPermissions(session);

  mainWindow = createWindow();

  // Auto-updater events have been removed.

  // Connect detectors to main window
  if (mainWindow) {
    mainWindow.webContents.on('did-finish-load', () => {
      startWakeWordDetector(mainWindow);
      startNotificationListener(mainWindow);
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const win = createWindow();
      startWakeWordDetector(win);
    }
  });
});


app.on('window-all-closed', () => {
  if (wakeWordProcess) {
    wakeWordProcess.kill();
    wakeWordProcess = null;
  }
  if (notificationProcess) {
    notificationProcess.kill();
    notificationProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});