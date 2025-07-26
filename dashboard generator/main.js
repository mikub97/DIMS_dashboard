// main.js
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // optional, safe to omit if unused
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Dialog for file selection
ipcMain.handle('select-file', async (_, filters) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters
  });
  return result.filePaths;
});

// Run optional_step_RQA.py
ipcMain.handle('run-rqa', async (_, configPath) => {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', ['optional_step_RQA.py', '--config', configPath, '--output-dir', 'assets/rqa']);

    let output = '';
    proc.stdout.on('data', data => output += data.toString());
    proc.stderr.on('data', data => output += data.toString());

    proc.on('close', code => {
      if (code === 0) resolve(output);
      else reject(`RQA script exited with code ${code}\n${output}`);
    });
  });
});

// Generate config.json based on grouped CSVs
ipcMain.handle('generate-config', async (_, groupedCsvs) => {
  try {
    const videoIDs = Object.keys(groupedCsvs);
    const config = {
      videoIDs,
      dataTypes: {},
      include_RQA: [],
      defaultWindowSize: 5,
      title: "DIMS Dashboard",
      subtitle: "Multimodal Synchrony Exploration Visualization",
      authors: "Your team's Name",
      contacts: "contacts: Your team's contacts"
    };

    videoIDs.forEach(id => {
      const files = groupedCsvs[id];
      const types = files.map(filePath => {
        const name = path.basename(filePath, '.csv');
        return name.replace(id + '_', '');
      });
      config.dataTypes[id] = types;
      config.include_RQA.push(...types);
    });

    // remove duplicates in include_RQA
    config.include_RQA = [...new Set(config.include_RQA)];

    const configPath = path.join(__dirname, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return `Config written to ${configPath}`;
  } catch (err) {
    throw new Error(`Failed to generate config: ${err.message}`);
  }
});