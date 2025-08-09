import * as vscode from 'vscode';
import { AbletonConnection } from '../services/AbletonConnection';

export class TransportProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'drsplitzTransport';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly abletonConnection: AbletonConnection
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(message => {
            this.handleWebviewMessage(message);
        });

        // Update webview when transport state changes
        this.abletonConnection.on('transportUpdated', (state: any) => {
            webviewView.webview.postMessage({
                type: 'transportUpdated',
                state: state
            });
        });

        this.abletonConnection.on('tempoUpdated', (bpm: number) => {
            webviewView.webview.postMessage({
                type: 'tempoUpdated',
                bpm: bpm
            });
        });
    }

    private handleWebviewMessage(message: any) {
        switch (message.type) {
            case 'play':
                this.abletonConnection.play();
                break;
            case 'stop':
                this.abletonConnection.stop();
                break;
            case 'record':
                this.abletonConnection.record();
                break;
            case 'setBPM':
                this.abletonConnection.setBPM(message.bpm);
                break;
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DrSplitz Transport</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 15px;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    
                    .transport-panel {
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                    }
                    
                    .transport-controls {
                        display: flex;
                        justify-content: center;
                        gap: 8px;
                        margin-bottom: 20px;
                    }
                    
                    .transport-btn {
                        width: 50px;
                        height: 50px;
                        border: none;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 18px;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .play-btn {
                        background: var(--vscode-progressBar-background);
                        color: white;
                    }
                    
                    .play-btn:hover {
                        background: #45a049;
                        transform: scale(1.05);
                    }
                    
                    .play-btn.playing {
                        background: #ff9800;
                    }
                    
                    .stop-btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    
                    .stop-btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    
                    .record-btn {
                        background: #f44336;
                        color: white;
                    }
                    
                    .record-btn:hover {
                        background: #d32f2f;
                        transform: scale(1.05);
                    }
                    
                    .record-btn.recording {
                        animation: pulse 1s infinite;
                    }
                    
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.5; }
                        100% { opacity: 1; }
                    }
                    
                    .tempo-section {
                        text-align: center;
                    }
                    
                    .tempo-display {
                        font-size: 24px;
                        font-weight: bold;
                        color: var(--vscode-progressBar-background);
                        margin-bottom: 10px;
                    }
                    
                    .tempo-slider {
                        width: 100%;
                        margin: 10px 0;
                    }
                    
                    .time-display {
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
                        text-align: center;
                        background: var(--vscode-input-background);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        padding: 10px;
                        margin: 10px 0;
                    }
                    
                    .status-indicators {
                        display: flex;
                        justify-content: space-around;
                        margin-top: 15px;
                    }
                    
                    .status-indicator {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                    }
                    
                    .indicator-light {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        margin-bottom: 4px;
                        background: var(--vscode-panel-border);
                    }
                    
                    .indicator-light.active {
                        background: var(--vscode-progressBar-background);
                        box-shadow: 0 0 8px var(--vscode-progressBar-background);
                    }
                </style>
            </head>
            <body>
                <div class="transport-panel">
                    <div class="transport-controls">
                        <button class="transport-btn play-btn" id="playBtn" onclick="togglePlay()">▶</button>
                        <button class="transport-btn stop-btn" onclick="stop()">⏹</button>
                        <button class="transport-btn record-btn" id="recordBtn" onclick="toggleRecord()">●</button>
                    </div>
                    
                    <div class="time-display" id="timeDisplay">00:00:00</div>
                    
                    <div class="tempo-section">
                        <div class="tempo-display" id="tempoDisplay">120</div>
                        <input type="range" 
                               class="tempo-slider" 
                               min="60" 
                               max="200" 
                               value="120" 
                               id="tempoSlider"
                               oninput="updateTempo(this.value)">
                        <div style="font-size: 12px; color: var(--vscode-descriptionForeground);">BPM</div>
                    </div>
                    
                    <div class="status-indicators">
                        <div class="status-indicator">
                            <div class="indicator-light" id="playIndicator"></div>
                            <span>PLAY</span>
                        </div>
                        <div class="status-indicator">
                            <div class="indicator-light" id="recordIndicator"></div>
                            <span>REC</span>
                        </div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let isPlaying = false;
                    let isRecording = false;
                    let currentTime = 0;

                    function togglePlay() {
                        if (isPlaying) {
                            vscode.postMessage({ type: 'stop' });
                        } else {
                            vscode.postMessage({ type: 'play' });
                        }
                    }

                    function stop() {
                        vscode.postMessage({ type: 'stop' });
                    }

                    function toggleRecord() {
                        vscode.postMessage({ type: 'record' });
                    }

                    function updateTempo(value) {
                        document.getElementById('tempoDisplay').textContent = value;
                        vscode.postMessage({ type: 'setBPM', bpm: parseInt(value) });
                    }

                    function updateTransportState(state) {
                        isPlaying = state.isPlaying;
                        isRecording = state.isRecording;
                        currentTime = state.currentTime;

                        // Update play button
                        const playBtn = document.getElementById('playBtn');
                        const playIndicator = document.getElementById('playIndicator');
                        if (isPlaying) {
                            playBtn.textContent = '⏸';
                            playBtn.classList.add('playing');
                            playIndicator.classList.add('active');
                        } else {
                            playBtn.textContent = '▶';
                            playBtn.classList.remove('playing');
                            playIndicator.classList.remove('active');
                        }

                        // Update record button
                        const recordBtn = document.getElementById('recordBtn');
                        const recordIndicator = document.getElementById('recordIndicator');
                        if (isRecording) {
                            recordBtn.classList.add('recording');
                            recordIndicator.classList.add('active');
                        } else {
                            recordBtn.classList.remove('recording');
                            recordIndicator.classList.remove('active');
                        }

                        // Update time display
                        updateTimeDisplay(currentTime);
                    }

                    function updateTimeDisplay(timeInSeconds) {
                        const minutes = Math.floor(timeInSeconds / 60);
                        const seconds = Math.floor(timeInSeconds % 60);
                        const centiseconds = Math.floor((timeInSeconds % 1) * 100);
                        
                        const timeString = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}:\${centiseconds.toString().padStart(2, '0')}\`;
                        document.getElementById('timeDisplay').textContent = timeString;
                    }

                    // Listen for messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'transportUpdated':
                                updateTransportState(message.state);
                                break;
                            case 'tempoUpdated':
                                document.getElementById('tempoDisplay').textContent = message.bpm;
                                document.getElementById('tempoSlider').value = message.bpm;
                                break;
                        }
                    });

                    // Simulate time updates when playing
                    setInterval(() => {
                        if (isPlaying) {
                            currentTime += 0.01;
                            updateTimeDisplay(currentTime);
                        }
                    }, 10);
                </script>
            </body>
            </html>
        `;
    }
}
