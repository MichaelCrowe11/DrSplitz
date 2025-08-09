import * as vscode from 'vscode';
import { AbletonConnection } from '../services/AbletonConnection';
import { MIDIController } from '../services/MIDIController';
import { AudioEngine } from '../services/AudioEngine';

export class DrSplitzControlPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'drsplitzControlPanel';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly abletonConnection: AbletonConnection,
        private readonly midiController: MIDIController,
        private readonly audioEngine: AudioEngine
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

        // Update webview when connection state changes
        this.abletonConnection.onConnectionChanged((connected) => {
            webviewView.webview.postMessage({
                type: 'connectionChanged',
                connected: connected
            });
        });
    }

    private handleWebviewMessage(message: any) {
        switch (message.type) {
            case 'connectAbleton':
                this.abletonConnection.connect();
                break;
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
            case 'playTone':
                this.audioEngine.playTone(message.frequency, message.duration);
                break;
            case 'setMasterVolume':
                this.audioEngine.setMasterVolume(message.volume);
                break;
        }
    }

    public showMixerPanel() {
        vscode.commands.executeCommand('workbench.view.extension.drsplitz');
    }

    public showSequencer() {
        // Implementation for sequencer panel
    }

    public showEffectsRack() {
        // Implementation for effects rack
    }

    public showSynthPanel() {
        // Implementation for synthesizer panel
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DrSplitz Control Panel</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    
                    .control-section {
                        margin-bottom: 20px;
                        padding: 15px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        background: var(--vscode-panel-background);
                    }
                    
                    .control-section h3 {
                        margin: 0 0 15px 0;
                        color: var(--vscode-panelTitle-activeForeground);
                        font-size: 14px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .transport-controls {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    
                    .btn {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 4px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        transition: all 0.2s;
                    }
                    
                    .btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    
                    .btn.primary {
                        background: var(--vscode-progressBar-background);
                    }
                    
                    .btn.danger {
                        background: var(--vscode-errorForeground);
                    }
                    
                    .slider-control {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                    
                    .slider-control label {
                        min-width: 60px;
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }
                    
                    .slider {
                        flex: 1;
                        -webkit-appearance: none;
                        height: 4px;
                        border-radius: 2px;
                        background: var(--vscode-scrollbarSlider-background);
                        outline: none;
                    }
                    
                    .slider::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: var(--vscode-progressBar-background);
                        cursor: pointer;
                    }
                    
                    .value-display {
                        min-width: 40px;
                        text-align: right;
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                    }
                    
                    .status-indicator {
                        display: inline-block;
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        margin-right: 8px;
                    }
                    
                    .status-connected {
                        background: #4CAF50;
                    }
                    
                    .status-disconnected {
                        background: #f44336;
                    }
                    
                    .connection-status {
                        display: flex;
                        align-items: center;
                        font-size: 12px;
                        margin-bottom: 15px;
                    }
                    
                    .piano-keys {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 2px;
                        margin-top: 15px;
                    }
                    
                    .piano-key {
                        height: 40px;
                        border: 1px solid var(--vscode-panel-border);
                        background: var(--vscode-input-background);
                        cursor: pointer;
                        display: flex;
                        align-items: end;
                        justify-content: center;
                        font-size: 10px;
                        color: var(--vscode-descriptionForeground);
                        padding-bottom: 5px;
                        transition: background 0.1s;
                    }
                    
                    .piano-key:hover {
                        background: var(--vscode-list-hoverBackground);
                    }
                    
                    .piano-key:active {
                        background: var(--vscode-progressBar-background);
                    }
                </style>
            </head>
            <body>
                <div class="control-section">
                    <h3>Connection</h3>
                    <div class="connection-status">
                        <span class="status-indicator status-disconnected" id="connectionStatus"></span>
                        <span id="connectionText">Disconnected</span>
                    </div>
                    <button class="btn primary" onclick="connectAbleton()">Connect to Ableton</button>
                </div>

                <div class="control-section">
                    <h3>Transport</h3>
                    <div class="transport-controls">
                        <button class="btn" onclick="play()">▶ Play</button>
                        <button class="btn" onclick="stop()">⏹ Stop</button>
                        <button class="btn danger" onclick="record()">● Record</button>
                    </div>
                    
                    <div class="slider-control">
                        <label>BPM:</label>
                        <input type="range" class="slider" min="60" max="200" value="120" id="bpmSlider" oninput="updateBPM(this.value)">
                        <span class="value-display" id="bpmValue">120</span>
                    </div>
                </div>

                <div class="control-section">
                    <h3>Master Volume</h3>
                    <div class="slider-control">
                        <label>Level:</label>
                        <input type="range" class="slider" min="0" max="1" step="0.01" value="0.8" id="volumeSlider" oninput="updateVolume(this.value)">
                        <span class="value-display" id="volumeValue">80%</span>
                    </div>
                </div>

                <div class="control-section">
                    <h3>Virtual Piano</h3>
                    <div class="piano-keys">
                        <div class="piano-key" onclick="playNote(261.63)" data-note="C">C</div>
                        <div class="piano-key" onclick="playNote(293.66)" data-note="D">D</div>
                        <div class="piano-key" onclick="playNote(329.63)" data-note="E">E</div>
                        <div class="piano-key" onclick="playNote(349.23)" data-note="F">F</div>
                        <div class="piano-key" onclick="playNote(392.00)" data-note="G">G</div>
                        <div class="piano-key" onclick="playNote(440.00)" data-note="A">A</div>
                        <div class="piano-key" onclick="playNote(493.88)" data-note="B">B</div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function connectAbleton() {
                        vscode.postMessage({ type: 'connectAbleton' });
                    }
                    
                    function play() {
                        vscode.postMessage({ type: 'play' });
                    }
                    
                    function stop() {
                        vscode.postMessage({ type: 'stop' });
                    }
                    
                    function record() {
                        vscode.postMessage({ type: 'record' });
                    }
                    
                    function updateBPM(value) {
                        document.getElementById('bpmValue').textContent = value;
                        vscode.postMessage({ type: 'setBPM', bpm: parseInt(value) });
                    }
                    
                    function updateVolume(value) {
                        const percentage = Math.round(value * 100);
                        document.getElementById('volumeValue').textContent = percentage + '%';
                        vscode.postMessage({ type: 'setMasterVolume', volume: parseFloat(value) });
                    }
                    
                    function playNote(frequency) {
                        vscode.postMessage({ 
                            type: 'playTone', 
                            frequency: frequency, 
                            duration: 0.5 
                        });
                    }
                    
                    // Listen for messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'connectionChanged':
                                updateConnectionStatus(message.connected);
                                break;
                        }
                    });
                    
                    function updateConnectionStatus(connected) {
                        const statusIndicator = document.getElementById('connectionStatus');
                        const statusText = document.getElementById('connectionText');
                        
                        if (connected) {
                            statusIndicator.className = 'status-indicator status-connected';
                            statusText.textContent = 'Connected to Ableton Live';
                        } else {
                            statusIndicator.className = 'status-indicator status-disconnected';
                            statusText.textContent = 'Disconnected';
                        }
                    }
                </script>
            </body>
            </html>
        `;
    }
}
