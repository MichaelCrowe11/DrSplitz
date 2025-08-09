import * as vscode from 'vscode';
import { AbletonConnection, AbletonDevice } from '../services/AbletonConnection';
import { MIDIController, MIDIDevice } from '../services/MIDIController';

export class DrSplitzTreeProvider implements vscode.TreeDataProvider<DeviceItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DeviceItem | undefined | null | void> = new vscode.EventEmitter<DeviceItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DeviceItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private abletonConnection: AbletonConnection,
        private midiController: MIDIController
    ) {
        // Listen for device changes
        this.abletonConnection.onConnectionChanged(() => {
            this.refresh();
        });

        this.midiController.on('devicesUpdated', () => {
            this.refresh();
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DeviceItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: DeviceItem): Thenable<DeviceItem[]> {
        if (!element) {
            // Root level - show categories
            return Promise.resolve([
                new DeviceItem('Ableton Live', vscode.TreeItemCollapsibleState.Expanded, 'category'),
                new DeviceItem('MIDI Devices', vscode.TreeItemCollapsibleState.Expanded, 'category')
            ]);
        } else {
            // Show devices under categories
            if (element.label === 'Ableton Live') {
                return Promise.resolve(this.getAbletonDevices());
            } else if (element.label === 'MIDI Devices') {
                return Promise.resolve(this.getMidiDevices());
            }
        }
        return Promise.resolve([]);
    }

    private getAbletonDevices(): DeviceItem[] {
        const items: DeviceItem[] = [];
        
        if (this.abletonConnection.isConnected()) {
            items.push(new DeviceItem(
                'Connected to Ableton Live',
                vscode.TreeItemCollapsibleState.None,
                'ableton-connected',
                {
                    command: 'drsplitz.openControlPanel',
                    title: 'Open Control Panel'
                }
            ));

            const tracks = this.abletonConnection.getTracks();
            tracks.forEach(track => {
                items.push(new DeviceItem(
                    `Track: ${track.name}`,
                    vscode.TreeItemCollapsibleState.None,
                    'track'
                ));
            });
        } else {
            items.push(new DeviceItem(
                'Not Connected',
                vscode.TreeItemCollapsibleState.None,
                'ableton-disconnected',
                {
                    command: 'drsplitz.connectAbleton',
                    title: 'Connect to Ableton'
                }
            ));
        }

        return items;
    }

    private getMidiDevices(): DeviceItem[] {
        const devices = this.midiController.getDevices();
        return devices.map(device => new DeviceItem(
            `${device.name} (${device.type})`,
            vscode.TreeItemCollapsibleState.None,
            device.connected ? 'midi-connected' : 'midi-disconnected'
        ));
    }
}

export class DeviceItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);

        this.tooltip = this.label;
        this.contextValue = contextValue;

        // Set icons based on context
        switch (contextValue) {
            case 'category':
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'ableton-connected':
                this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
                break;
            case 'ableton-disconnected':
                this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
                break;
            case 'track':
                this.iconPath = new vscode.ThemeIcon('music');
                break;
            case 'midi-connected':
                this.iconPath = new vscode.ThemeIcon('plug', new vscode.ThemeColor('charts.green'));
                break;
            case 'midi-disconnected':
                this.iconPath = new vscode.ThemeIcon('plug', new vscode.ThemeColor('charts.red'));
                break;
        }
    }
}
