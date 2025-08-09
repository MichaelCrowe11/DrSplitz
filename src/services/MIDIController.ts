import { EventEmitter } from 'events';

export interface MIDIDevice {
    id: string;
    name: string;
    type: 'input' | 'output';
    connected: boolean;
}

export interface MIDIMessage {
    command: number;
    channel: number;
    note?: number;
    velocity?: number;
    controller?: number;
    value?: number;
    timestamp: number;
}

export class MIDIController extends EventEmitter {
    private devices: Map<string, MIDIDevice> = new Map();
    private activeInputs: Map<string, any> = new Map();
    private activeOutputs: Map<string, any> = new Map();
    private midiAccess: any = null;

    constructor() {
        super();
    }

    async initialize(): Promise<boolean> {
        try {
            // For now, we'll simulate MIDI devices since easymidi requires native compilation
            this.simulateMIDIDevices();
            return true;
        } catch (error) {
            console.error('Failed to initialize MIDI:', error);
            return false;
        }
    }

    private simulateMIDIDevices() {
        // Simulate common MIDI devices for development
        const simulatedDevices = [
            { id: 'virtual-keyboard', name: 'Virtual Keyboard', type: 'input' as const },
            { id: 'virtual-controller', name: 'Virtual MIDI Controller', type: 'input' as const },
            { id: 'virtual-output', name: 'Virtual MIDI Output', type: 'output' as const }
        ];

        simulatedDevices.forEach(device => {
            const midiDevice: MIDIDevice = {
                ...device,
                connected: true
            };
            this.devices.set(device.id, midiDevice);
        });

        this.emit('devicesUpdated', Array.from(this.devices.values()));
    }

    getDevices(): MIDIDevice[] {
        return Array.from(this.devices.values());
    }

    connectDevice(deviceId: string): boolean {
        const device = this.devices.get(deviceId);
        if (!device) {
            return false;
        }

        try {
            if (device.type === 'input') {
                // Simulate MIDI input connection
                console.log(`Connected to MIDI input: ${device.name}`);
                this.emit('deviceConnected', device);
            } else {
                // Simulate MIDI output connection
                console.log(`Connected to MIDI output: ${device.name}`);
                this.emit('deviceConnected', device);
            }
            return true;
        } catch (error) {
            console.error(`Failed to connect to device ${deviceId}:`, error);
            return false;
        }
    }

    disconnectDevice(deviceId: string): boolean {
        const device = this.devices.get(deviceId);
        if (!device) {
            return false;
        }

        try {
            if (this.activeInputs.has(deviceId)) {
                this.activeInputs.delete(deviceId);
            }
            if (this.activeOutputs.has(deviceId)) {
                this.activeOutputs.delete(deviceId);
            }

            console.log(`Disconnected from device: ${device.name}`);
            this.emit('deviceDisconnected', device);
            return true;
        } catch (error) {
            console.error(`Failed to disconnect device ${deviceId}:`, error);
            return false;
        }
    }

    sendMIDIMessage(deviceId: string, message: MIDIMessage): boolean {
        const device = this.devices.get(deviceId);
        if (!device || device.type !== 'output') {
            return false;
        }

        try {
            console.log(`Sending MIDI message to ${device.name}:`, message);
            return true;
        } catch (error) {
            console.error(`Failed to send MIDI message:`, error);
            return false;
        }
    }

    // Convenience methods for common MIDI messages
    sendNoteOn(deviceId: string, channel: number, note: number, velocity: number): boolean {
        return this.sendMIDIMessage(deviceId, {
            command: 0x90,
            channel,
            note,
            velocity,
            timestamp: Date.now()
        });
    }

    sendNoteOff(deviceId: string, channel: number, note: number): boolean {
        return this.sendMIDIMessage(deviceId, {
            command: 0x80,
            channel,
            note,
            velocity: 0,
            timestamp: Date.now()
        });
    }

    sendControlChange(deviceId: string, channel: number, controller: number, value: number): boolean {
        return this.sendMIDIMessage(deviceId, {
            command: 0xB0,
            channel,
            controller,
            value,
            timestamp: Date.now()
        });
    }

    // Simulate receiving MIDI messages for testing
    simulateMIDIInput(deviceId: string, message: MIDIMessage) {
        const device = this.devices.get(deviceId);
        if (device && device.type === 'input') {
            this.emit('midiMessage', { device, message });
        }
    }

    dispose() {
        this.activeInputs.clear();
        this.activeOutputs.clear();
        this.devices.clear();
    }
}
