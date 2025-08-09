import * as vscode from 'vscode';
import { DrSplitzControlPanelProvider } from './providers/ControlPanelProvider';
import { AbletonConnection } from './services/AbletonConnection';
import { MIDIController } from './services/MIDIController';
import { AudioEngine } from './services/AudioEngine';
import { DrSplitzTreeProvider } from './providers/TreeProvider';
import { MixerPanelProvider } from './providers/MixerPanelProvider';
import { TransportProvider } from './providers/TransportProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('DrSplitz Music Production Extension is now active!');

    // Initialize core services
    const abletonConnection = new AbletonConnection();
    const midiController = new MIDIController();
    const audioEngine = new AudioEngine();

    // Initialize providers
    const controlPanelProvider = new DrSplitzControlPanelProvider(context.extensionUri, abletonConnection, midiController, audioEngine);
    const mixerPanelProvider = new MixerPanelProvider(context.extensionUri, abletonConnection);
    const transportProvider = new TransportProvider(context.extensionUri, abletonConnection);
    const treeProvider = new DrSplitzTreeProvider(abletonConnection, midiController);

    // Register webview providers
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('drsplitzControlPanel', controlPanelProvider)
    );
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('drsplitzMixer', mixerPanelProvider)
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('drsplitzTransport', transportProvider)
    );

    // Register tree data provider
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('drsplitzDevices', treeProvider)
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('drsplitz.openControlPanel', () => {
            vscode.commands.executeCommand('workbench.view.extension.drsplitz');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('drsplitz.connectAbleton', async () => {
            const success = await abletonConnection.connect();
            if (success) {
                vscode.window.showInformationMessage('Connected to Ableton Live successfully!');
                treeProvider.refresh();
            } else {
                vscode.window.showErrorMessage('Failed to connect to Ableton Live. Make sure Live is running and Max for Live integration is enabled.');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('drsplitz.openMixerPanel', () => {
            controlPanelProvider.showMixerPanel();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('drsplitz.openSequencer', () => {
            controlPanelProvider.showSequencer();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('drsplitz.openEffectsRack', () => {
            controlPanelProvider.showEffectsRack();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('drsplitz.openSynthPanel', () => {
            controlPanelProvider.showSynthPanel();
        })
    );

    // Initialize MIDI and audio systems
    midiController.initialize();
    audioEngine.initialize();

    // Auto-connect to Ableton if configured
    const config = vscode.workspace.getConfiguration('drsplitz');
    if (config.get('autoConnectAbleton', false)) {
        setTimeout(() => {
            abletonConnection.connect();
        }, 2000);
    }

    // Status bar items
    const abletonStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    abletonStatusBar.text = "$(music) DrSplitz";
    abletonStatusBar.command = 'drsplitz.openControlPanel';
    abletonStatusBar.tooltip = 'Open DrSplitz Control Panel';
    abletonStatusBar.show();
    context.subscriptions.push(abletonStatusBar);

    // Update status based on connection
    abletonConnection.onConnectionChanged((connected) => {
        abletonStatusBar.text = connected ? "$(music) DrSplitz: Connected" : "$(music) DrSplitz: Disconnected";
        abletonStatusBar.backgroundColor = connected ? undefined : new vscode.ThemeColor('statusBarItem.warningBackground');
    });
}

export function deactivate() {
    console.log('DrSplitz Extension deactivated');
}
