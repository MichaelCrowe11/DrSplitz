# DrSplitz - Professional Music Production Control Panel

DrSplitz is a comprehensive VS Code extension that provides professional music production capabilities with seamless Ableton Live integration. It transforms VS Code into a powerful music production environment with intuitive controls, real-time monitoring, and advanced audio processing capabilities.

## 🎵 Features

### Core Features
- **Ableton Live Integration**: Real-time bidirectional communication with Ableton Live
- **Professional Control Panel**: Intuitive interface with transport controls, mixer, and effects
- **MIDI Controller Support**: Connect and control external MIDI devices
- **Audio Engine**: Built-in audio processing with Web Audio API
- **Real-time Monitoring**: Live feedback from your DAW and connected devices

### Control Panels
- **Transport Control**: Play, stop, record, and tempo control
- **Mixer Panel**: Multi-track volume, pan, mute, and solo controls
- **Virtual Piano**: Built-in piano keyboard for quick note input
- **Device Manager**: Monitor and manage connected MIDI and audio devices

### Professional Capabilities
- **Low-latency Audio**: Optimized for real-time audio processing
- **Multi-track Mixing**: Professional mixing capabilities
- **MIDI Sequencing**: Step sequencer and MIDI note input
- **Effects Processing**: Built-in audio effects and processing
- **Session Management**: Save and recall your production sessions

## 🚀 Installation

### Prerequisites
- Visual Studio Code 1.74.0 or higher
- Node.js 16.x or higher
- Ableton Live (for full integration)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sergikdropz/DrSplitz.git
   cd DrSplitz
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Compile the extension**:
   ```bash
   npm run compile
   ```

4. **Launch in development mode**:
   - Press `F5` in VS Code to open a new Extension Development Host window
   - Or run: `code --extensionDevelopmentPath=/path/to/DrSplitz`

### Package for Distribution
```bash
npm run package
```

## 🎛️ Usage

### Opening the Control Panel
1. Open VS Code
2. Click on the DrSplitz icon in the Activity Bar (🎵)
3. Or use the Command Palette: `Ctrl+Shift+P` → "DrSplitz: Open Control Panel"

### Connecting to Ableton Live
1. Ensure Ableton Live is running
2. Enable Max for Live integration in Ableton Live preferences
3. Click "Connect to Ableton" in the DrSplitz panel
4. The status indicator will turn green when connected

### Using the Mixer
- **Volume**: Use the faders to adjust track levels
- **Pan**: Use the pan knobs to position tracks in the stereo field
- **Mute/Solo**: Click the MUTE or SOLO buttons for each track
- **Real-time Updates**: Changes are reflected in both DrSplitz and Ableton Live

### MIDI Control
- Connect MIDI devices through the Device Manager
- Use the Virtual Piano for quick note input
- Monitor MIDI activity in real-time

### Transport Controls
- **Play/Pause**: Start or pause playback
- **Stop**: Stop playback and return to start
- **Record**: Enable recording mode
- **Tempo**: Adjust BPM with the tempo slider

## 🔧 Configuration

### Extension Settings
Configure DrSplitz through VS Code settings:

```json
{
  "drsplitz.abletonPort": 9001,
  "drsplitz.midiDevice": "",
  "drsplitz.audioSampleRate": 44100,
  "drsplitz.bufferSize": 512,
  "drsplitz.enableLowLatency": true
}
```

### Ableton Live Setup
1. **Enable Max for Live**: Preferences → Link MIDI → Max for Live
2. **Install M4L Device**: Load the DrSplitz Max for Live device in your Ableton set
3. **Configure Port**: Set the communication port to match DrSplitz settings (default: 9001)

### Port Forwarding for Testing
To test the extension with remote Ableton instances:

```bash
# Forward local port 9001 to remote Ableton instance
ssh -L 9001:localhost:9001 user@remote-host

# Or use the built-in test server
npm run test-server
```

## 🔌 API Reference

### AbletonConnection
```typescript
// Connect to Ableton Live
await abletonConnection.connect();

// Transport controls
abletonConnection.play();
abletonConnection.stop();
abletonConnection.record();

// Track controls
abletonConnection.setTrackVolume(trackId, volume);
abletonConnection.setTrackPan(trackId, pan);
abletonConnection.setTrackMute(trackId, muted);
```

### MIDIController
```typescript
// Initialize MIDI
await midiController.initialize();

// Send MIDI messages
midiController.sendNoteOn(deviceId, channel, note, velocity);
midiController.sendControlChange(deviceId, channel, controller, value);
```

### AudioEngine
```typescript
// Initialize audio engine
await audioEngine.initialize();

// Create audio nodes
const oscillator = audioEngine.createOscillator(440, 'sine');
const filter = audioEngine.createFilter('lowpass', 1000);
const reverb = audioEngine.createReverb(0.5, 2);
```

## 🛠️ Development

### Project Structure
```
DrSplitz/
├── src/
│   ├── extension.ts           # Main extension entry point
│   ├── services/              # Core services
│   │   ├── AbletonConnection.ts
│   │   ├── MIDIController.ts
│   │   └── AudioEngine.ts
│   ├── providers/             # VS Code providers
│   │   ├── ControlPanelProvider.ts
│   │   ├── MixerPanelProvider.ts
│   │   ├── TransportProvider.ts
│   │   └── TreeProvider.ts
│   └── utils/                 # Utility functions
│       └── TestServer.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Building and Testing
```bash
# Development build
npm run compile

# Watch mode for development
npm run watch

# Run tests
npm test

# Lint code
npm run lint

# Start test server
npm run test-server
```

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 🎼 Advanced Features

### Custom Effects
Create custom audio effects:
```typescript
const customEffect = {
    id: 'my-delay',
    name: 'Custom Delay',
    type: 'delay',
    parameters: { time: 0.3, feedback: 0.4, wet: 0.5 },
    enabled: true
};
audioEngine.addEffect(customEffect);
```

### MIDI Mapping
Map MIDI controllers to DrSplitz parameters:
```typescript
midiController.on('midiMessage', ({ device, message }) => {
    if (message.controller === 1) {
        // Map CC1 to master volume
        audioEngine.setMasterVolume(message.value / 127);
    }
});
```

### Session Templates
Save and load production templates:
```typescript
// Save current session
const session = {
    tracks: abletonConnection.getTracks(),
    tempo: abletonConnection.getPlayState().bpm,
    effects: audioEngine.getEffects()
};

// Load session template
abletonConnection.loadSession(session);
```

## 🌐 Remote Collaboration

### Network Setup
DrSplitz supports remote collaboration through network connectivity:

1. **Port Forwarding**: Forward ports for remote Ableton connections
2. **WebSocket Proxy**: Use WebSocket proxies for real-time communication
3. **Session Sharing**: Share production sessions across networks

### Cloud Integration
- **Session Backup**: Automatic backup to cloud storage
- **Collaborative Editing**: Real-time collaboration features
- **Version Control**: Track changes and version history

## 📱 Mobile Integration

### iOS/Android Apps
DrSplitz can be extended with mobile companion apps:
- **Remote Control**: Control DrSplitz from mobile devices
- **MIDI Input**: Use mobile devices as MIDI controllers
- **Audio Monitoring**: Monitor audio levels and transport state

## 🔒 Security

### Data Protection
- **Encrypted Communication**: All network communication is encrypted
- **Local Storage**: Sensitive data is stored locally and encrypted
- **Authentication**: Optional authentication for remote connections

### Privacy
- **No Telemetry**: DrSplitz doesn't collect usage data
- **Offline Mode**: Full functionality without internet connection
- **Open Source**: Transparent and auditable codebase

## 📞 Support

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive documentation and tutorials
- **Community**: Join the DrSplitz community forum

### Troubleshooting

#### Common Issues
1. **Connection Failed**: Check Ableton Live settings and port configuration
2. **Audio Dropouts**: Adjust buffer size and sample rate settings
3. **MIDI Not Working**: Verify MIDI device connections and permissions

#### Debug Mode
Enable debug mode for detailed logging:
```json
{
  "drsplitz.debug": true,
  "drsplitz.logLevel": "verbose"
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ableton Live**: For providing the foundation of modern music production
- **VS Code Team**: For creating an extensible and powerful editor
- **Web Audio API**: For enabling browser-based audio processing
- **Open Source Community**: For the tools and libraries that make this possible

## 🎯 Roadmap

### Version 1.1
- [ ] Advanced step sequencer
- [ ] Multi-effects rack
- [ ] Preset management system
- [ ] Performance monitoring

### Version 1.2
- [ ] Plugin host integration
- [ ] Advanced MIDI routing
- [ ] Cloud synchronization
- [ ] Mobile companion app

### Version 2.0
- [ ] AI-powered composition tools
- [ ] Advanced mixing algorithms
- [ ] Real-time collaboration
- [ ] Multi-platform support

---

**Made with ❤️ for music producers and developers**
