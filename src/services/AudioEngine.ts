import { EventEmitter } from 'events';

export interface AudioDevice {
    id: string;
    name: string;
    type: 'input' | 'output';
    sampleRate: number;
    bufferSize: number;
}

export interface AudioEffect {
    id: string;
    name: string;
    type: string;
    parameters: { [key: string]: number };
    enabled: boolean;
}

export class AudioEngine extends EventEmitter {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private effects: Map<string, AudioEffect> = new Map();
    private devices: Map<string, AudioDevice> = new Map();
    private isInitialized: boolean = false;

    constructor() {
        super();
    }

    async initialize(): Promise<boolean> {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);

            // Set up default audio devices
            this.setupDefaultDevices();

            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('Audio Engine initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Audio Engine:', error);
            return false;
        }
    }

    private setupDefaultDevices() {
        const defaultDevices = [
            {
                id: 'default-input',
                name: 'Default Input',
                type: 'input' as const,
                sampleRate: 44100,
                bufferSize: 512
            },
            {
                id: 'default-output',
                name: 'Default Output',
                type: 'output' as const,
                sampleRate: 44100,
                bufferSize: 512
            }
        ];

        defaultDevices.forEach(device => {
            this.devices.set(device.id, device);
        });

        this.emit('devicesUpdated', Array.from(this.devices.values()));
    }

    getAudioContext(): AudioContext | null {
        return this.audioContext;
    }

    getMasterGain(): GainNode | null {
        return this.masterGain;
    }

    setMasterVolume(volume: number) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(volume, this.audioContext!.currentTime);
        }
    }

    createOscillator(frequency: number, type: OscillatorType = 'sine'): OscillatorNode | null {
        if (!this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        return oscillator;
    }

    createGain(value: number = 1): GainNode | null {
        if (!this.audioContext) return null;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(value, this.audioContext.currentTime);
        
        return gainNode;
    }

    createFilter(type: BiquadFilterType = 'lowpass', frequency: number = 1000): BiquadFilterNode | null {
        if (!this.audioContext) return null;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = type;
        filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        return filter;
    }

    createDelay(delayTime: number = 0.3): DelayNode | null {
        if (!this.audioContext) return null;

        const delay = this.audioContext.createDelay(1.0);
        delay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);
        
        return delay;
    }

    createReverb(roomSize: number = 0.5, decay: number = 2): ConvolverNode | null {
        if (!this.audioContext) return null;

        const convolver = this.audioContext.createConvolver();
        
        // Create impulse response for reverb
        const length = this.audioContext.sampleRate * decay;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, roomSize);
            }
        }
        
        convolver.buffer = impulse;
        return convolver;
    }

    addEffect(effect: AudioEffect) {
        this.effects.set(effect.id, effect);
        this.emit('effectAdded', effect);
    }

    removeEffect(effectId: string) {
        const effect = this.effects.get(effectId);
        if (effect) {
            this.effects.delete(effectId);
            this.emit('effectRemoved', effect);
        }
    }

    getEffects(): AudioEffect[] {
        return Array.from(this.effects.values());
    }

    updateEffectParameter(effectId: string, parameter: string, value: number) {
        const effect = this.effects.get(effectId);
        if (effect) {
            effect.parameters[parameter] = value;
            this.emit('effectParameterChanged', { effectId, parameter, value });
        }
    }

    playTone(frequency: number, duration: number = 1, gain: number = 0.3) {
        if (!this.audioContext || !this.masterGain) return;

        const oscillator = this.createOscillator(frequency, 'sine');
        const gainNode = this.createGain(gain);

        if (oscillator && gainNode) {
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            const now = this.audioContext.currentTime;
            oscillator.start(now);
            oscillator.stop(now + duration);

            // Fade out to prevent clicks
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        }
    }

    getDevices(): AudioDevice[] {
        return Array.from(this.devices.values());
    }

    isReady(): boolean {
        return this.isInitialized && this.audioContext !== null;
    }

    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.effects.clear();
        this.devices.clear();
        this.isInitialized = false;
    }
}
