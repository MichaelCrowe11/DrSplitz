import * as vscode from 'vscode';
import { AbletonConnection, AbletonTrack } from '../services/AbletonConnection';

export class MixerPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'drsplitzMixer';

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

        // Update webview when tracks change
        this.abletonConnection.on('tracksUpdated', (tracks: AbletonTrack[]) => {
            webviewView.webview.postMessage({
                type: 'tracksUpdated',
                tracks: tracks
            });
        });

        this.abletonConnection.on('trackUpdated', (track: AbletonTrack) => {
            webviewView.webview.postMessage({
                type: 'trackUpdated',
                track: track
            });
        });
    }

    private handleWebviewMessage(message: any) {
        switch (message.type) {
            case 'setTrackVolume':
                this.abletonConnection.setTrackVolume(message.trackId, message.volume);
                break;
            case 'setTrackPan':
                this.abletonConnection.setTrackPan(message.trackId, message.pan);
                break;
            case 'setTrackMute':
                this.abletonConnection.setTrackMute(message.trackId, message.muted);
                break;
            case 'setTrackSolo':
                this.abletonConnection.setTrackSolo(message.trackId, message.soloed);
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
                <title>DrSplitz Mixer</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 10px;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    
                    .mixer-container {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .track-strip {
                        display: flex;
                        flex-direction: column;
                        padding: 10px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        background: var(--vscode-panel-background);
                        min-height: 200px;
                    }
                    
                    .track-name {
                        font-size: 11px;
                        font-weight: 600;
                        text-align: center;
                        margin-bottom: 10px;
                        padding: 4px;
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        border-radius: 3px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    
                    .fader-container {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin: 10px 0;
                    }
                    
                    .fader {
                        writing-mode: bt-lr;
                        -webkit-appearance: slider-vertical;
                        width: 30px;
                        height: 120px;
                        background: var(--vscode-scrollbarSlider-background);
                        outline: none;
                        cursor: pointer;
                    }
                    
                    .volume-label {
                        font-size: 10px;
                        margin-top: 5px;
                        color: var(--vscode-descriptionForeground);
                    }
                    
                    .pan-container {
                        margin: 5px 0;
                    }
                    
                    .pan-knob {
                        width: 40px;
                        height: 20px;
                        -webkit-appearance: none;
                        background: var(--vscode-scrollbarSlider-background);
                        border-radius: 10px;
                        outline: none;
                        cursor: pointer;
                    }
                    
                    .pan-label {
                        font-size: 9px;
                        text-align: center;
                        color: var(--vscode-descriptionForeground);
                        margin-top: 2px;
                    }
                    
                    .buttons-container {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                        margin-top: 10px;
                    }
                    
                    .track-button {
                        padding: 4px 8px;
                        border: none;
                        border-radius: 3px;
                        font-size: 10px;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-weight: 500;
                    }
                    
                    .mute-btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    
                    .mute-btn.active {
                        background: #f44336;
                        color: white;
                    }
                    
                    .solo-btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    
                    .solo-btn.active {
                        background: #ff9800;
                        color: white;
                    }
                    
                    .track-button:hover {
                        opacity: 0.8;
                    }
                    
                    .no-tracks {
                        text-align: center;
                        color: var(--vscode-descriptionForeground);
                        font-style: italic;
                        padding: 40px 20px;
                    }
                </style>
            </head>
            <body>
                <div class="mixer-container" id="mixerContainer">
                    <div class="no-tracks">
                        Connect to Ableton Live to see tracks
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let tracks = [];

                    function createTrackStrip(track) {
                        return \`
                            <div class="track-strip">
                                <div class="track-name">\${track.name}</div>
                                
                                <div class="fader-container">
                                    <input type="range" 
                                           class="fader" 
                                           min="0" 
                                           max="1" 
                                           step="0.01" 
                                           value="\${track.volume}"
                                           oninput="setTrackVolume(\${track.id}, this.value)"
                                           orient="vertical">
                                    <div class="volume-label">\${Math.round(track.volume * 100)}%</div>
                                </div>
                                
                                <div class="pan-container">
                                    <input type="range" 
                                           class="pan-knob" 
                                           min="-1" 
                                           max="1" 
                                           step="0.01" 
                                           value="\${track.pan}"
                                           oninput="setTrackPan(\${track.id}, this.value)">
                                    <div class="pan-label">Pan</div>
                                </div>
                                
                                <div class="buttons-container">
                                    <button class="track-button mute-btn \${track.muted ? 'active' : ''}" 
                                            onclick="toggleMute(\${track.id}, \${!track.muted})">
                                        MUTE
                                    </button>
                                    <button class="track-button solo-btn \${track.soloed ? 'active' : ''}" 
                                            onclick="toggleSolo(\${track.id}, \${!track.soloed})">
                                        SOLO
                                    </button>
                                </div>
                            </div>
                        \`;
                    }

                    function updateMixer() {
                        const container = document.getElementById('mixerContainer');
                        
                        if (tracks.length === 0) {
                            container.innerHTML = '<div class="no-tracks">Connect to Ableton Live to see tracks</div>';
                            return;
                        }

                        container.innerHTML = tracks.map(track => createTrackStrip(track)).join('');
                    }

                    function setTrackVolume(trackId, volume) {
                        vscode.postMessage({ 
                            type: 'setTrackVolume', 
                            trackId: trackId, 
                            volume: parseFloat(volume) 
                        });
                    }

                    function setTrackPan(trackId, pan) {
                        vscode.postMessage({ 
                            type: 'setTrackPan', 
                            trackId: trackId, 
                            pan: parseFloat(pan) 
                        });
                    }

                    function toggleMute(trackId, muted) {
                        vscode.postMessage({ 
                            type: 'setTrackMute', 
                            trackId: trackId, 
                            muted: muted 
                        });
                    }

                    function toggleSolo(trackId, soloed) {
                        vscode.postMessage({ 
                            type: 'setTrackSolo', 
                            trackId: trackId, 
                            soloed: soloed 
                        });
                    }

                    // Listen for messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'tracksUpdated':
                                tracks = message.tracks;
                                updateMixer();
                                break;
                            case 'trackUpdated':
                                const trackIndex = tracks.findIndex(t => t.id === message.track.id);
                                if (trackIndex >= 0) {
                                    tracks[trackIndex] = message.track;
                                    updateMixer();
                                }
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
