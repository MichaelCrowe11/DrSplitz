import * as vscode from 'vscode';
import * as WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface AbletonTrack {
    id: number;
    name: string;
    volume: number;
    pan: number;
    muted: boolean;
    soloed: boolean;
    armed: boolean;
    devices: AbletonDevice[];
}

export interface AbletonDevice {
    id: number;
    name: string;
    type: string;
    parameters: AbletonParameter[];
}

export interface AbletonParameter {
    id: number;
    name: string;
    value: number;
    min: number;
    max: number;
}

export interface AbletonClip {
    id: number;
    name: string;
    length: number;
    playing: boolean;
    color: number;
}

export class AbletonConnection extends EventEmitter {
    private ws: WebSocket | null = null;
    private connected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 3000;

    private tracks: AbletonTrack[] = [];
    private masterTrack: AbletonTrack | null = null;
    private isPlaying: boolean = false;
    private isRecording: boolean = false;
    private bpm: number = 120;
    private currentTime: number = 0;

    constructor() {
        super();
    }

    async connect(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('drsplitz');
        const port = config.get<number>('abletonPort', 9001);
        
        try {
            this.ws = new WebSocket(`ws://localhost:${port}`);
            
            this.ws.on('open', () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                console.log('Connected to Ableton Live');
                this.emit('connectionChanged', true);
                this.requestInitialData();
            });

            this.ws.on('message', (data) => {
                this.handleMessage(JSON.parse(data.toString()));
            });

            this.ws.on('close', () => {
                this.connected = false;
                this.emit('connectionChanged', false);
                console.log('Disconnected from Ableton Live');
                this.attemptReconnect();
            });

            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                vscode.window.showErrorMessage(`Ableton connection error: ${error.message}`);
            });

            return true;
        } catch (error) {
            console.error('Failed to connect to Ableton:', error);
            return false;
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Attempting to reconnect to Ableton (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect();
            }, this.reconnectDelay);
        }
    }

    private requestInitialData() {
        this.sendMessage({
            type: 'request',
            target: 'song',
            property: 'tracks'
        });

        this.sendMessage({
            type: 'request',
            target: 'song',
            property: 'master_track'
        });

        this.sendMessage({
            type: 'request',
            target: 'song',
            property: 'is_playing'
        });

        this.sendMessage({
            type: 'request',
            target: 'song',
            property: 'tempo'
        });
    }

    private handleMessage(message: any) {
        switch (message.type) {
            case 'tracks':
                this.tracks = message.data;
                this.emit('tracksUpdated', this.tracks);
                break;
            case 'master_track':
                this.masterTrack = message.data;
                this.emit('masterTrackUpdated', this.masterTrack);
                break;
            case 'transport':
                this.isPlaying = message.data.is_playing;
                this.isRecording = message.data.is_recording;
                this.currentTime = message.data.current_time;
                this.emit('transportUpdated', {
                    isPlaying: this.isPlaying,
                    isRecording: this.isRecording,
                    currentTime: this.currentTime
                });
                break;
            case 'tempo':
                this.bpm = message.data;
                this.emit('tempoUpdated', this.bpm);
                break;
            case 'track_volume':
                this.updateTrackProperty(message.track_id, 'volume', message.value);
                break;
            case 'track_pan':
                this.updateTrackProperty(message.track_id, 'pan', message.value);
                break;
            case 'track_mute':
                this.updateTrackProperty(message.track_id, 'muted', message.value);
                break;
            case 'track_solo':
                this.updateTrackProperty(message.track_id, 'soloed', message.value);
                break;
        }
    }

    private updateTrackProperty(trackId: number, property: string, value: any) {
        const track = this.tracks.find(t => t.id === trackId);
        if (track) {
            (track as any)[property] = value;
            this.emit('trackUpdated', track);
        }
    }

    private sendMessage(message: any) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify(message));
        }
    }

    // Public API methods
    play() {
        this.sendMessage({ type: 'command', action: 'play' });
    }

    stop() {
        this.sendMessage({ type: 'command', action: 'stop' });
    }

    record() {
        this.sendMessage({ type: 'command', action: 'record' });
    }

    setTrackVolume(trackId: number, volume: number) {
        this.sendMessage({
            type: 'set',
            target: 'track',
            track_id: trackId,
            property: 'volume',
            value: volume
        });
    }

    setTrackPan(trackId: number, pan: number) {
        this.sendMessage({
            type: 'set',
            target: 'track',
            track_id: trackId,
            property: 'pan',
            value: pan
        });
    }

    setTrackMute(trackId: number, muted: boolean) {
        this.sendMessage({
            type: 'set',
            target: 'track',
            track_id: trackId,
            property: 'mute',
            value: muted
        });
    }

    setTrackSolo(trackId: number, soloed: boolean) {
        this.sendMessage({
            type: 'set',
            target: 'track',
            track_id: trackId,
            property: 'solo',
            value: soloed
        });
    }

    setBPM(bpm: number) {
        this.sendMessage({
            type: 'set',
            target: 'song',
            property: 'tempo',
            value: bpm
        });
    }

    triggerClip(trackId: number, clipIndex: number) {
        this.sendMessage({
            type: 'command',
            action: 'fire_clip',
            track_id: trackId,
            clip_index: clipIndex
        });
    }

    stopClip(trackId: number, clipIndex: number) {
        this.sendMessage({
            type: 'command',
            action: 'stop_clip',
            track_id: trackId,
            clip_index: clipIndex
        });
    }

    // Getters
    getTracks(): AbletonTrack[] {
        return this.tracks;
    }

    getMasterTrack(): AbletonTrack | null {
        return this.masterTrack;
    }

    isConnected(): boolean {
        return this.connected;
    }

    getPlayState() {
        return {
            isPlaying: this.isPlaying,
            isRecording: this.isRecording,
            currentTime: this.currentTime,
            bpm: this.bpm
        };
    }

    onConnectionChanged(callback: (connected: boolean) => void) {
        this.on('connectionChanged', callback);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }
}
