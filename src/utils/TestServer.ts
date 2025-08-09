import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

export class TestServer {
    private app: express.Application;
    private server: http.Server;
    private wss: WebSocket.Server;
    private port: number;

    constructor(port: number = 9001) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.setupRoutes();
        this.setupWebSocket();
    }

    private setupRoutes() {
        this.app.use(express.static('public'));
        
        this.app.get('/', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>DrSplitz Test Server</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
                        .connected { background: #d4edda; color: #155724; }
                        .disconnected { background: #f8d7da; color: #721c24; }
                        button { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
                        .primary { background: #007bff; color: white; }
                        .success { background: #28a745; color: white; }
                        .danger { background: #dc3545; color: white; }
                    </style>
                </head>
                <body>
                    <h1>DrSplitz Test Server</h1>
                    <div id="status" class="status disconnected">Disconnected</div>
                    
                    <h2>Transport Controls</h2>
                    <button class="success" onclick="sendCommand('play')">Play</button>
                    <button class="danger" onclick="sendCommand('stop')">Stop</button>
                    <button class="primary" onclick="sendCommand('record')">Record</button>
                    
                    <h2>Test Data</h2>
                    <button class="primary" onclick="sendTracks()">Send Tracks</button>
                    <button class="primary" onclick="sendTransport()">Send Transport State</button>
                    
                    <h2>Logs</h2>
                    <div id="logs" style="background: #f8f9fa; padding: 10px; height: 200px; overflow-y: auto; font-family: monospace;"></div>

                    <script>
                        let ws = null;
                        
                        function connect() {
                            ws = new WebSocket('ws://localhost:${this.port}');
                            
                            ws.onopen = function() {
                                document.getElementById('status').textContent = 'Connected to DrSplitz Test Server';
                                document.getElementById('status').className = 'status connected';
                                log('Connected to WebSocket server');
                            };
                            
                            ws.onmessage = function(event) {
                                const data = JSON.parse(event.data);
                                log('Received: ' + JSON.stringify(data, null, 2));
                            };
                            
                            ws.onclose = function() {
                                document.getElementById('status').textContent = 'Disconnected';
                                document.getElementById('status').className = 'status disconnected';
                                log('Disconnected from WebSocket server');
                                setTimeout(connect, 3000); // Reconnect after 3 seconds
                            };
                            
                            ws.onerror = function(error) {
                                log('WebSocket error: ' + error);
                            };
                        }
                        
                        function sendCommand(action) {
                            if (ws && ws.readyState === WebSocket.OPEN) {
                                const message = { type: 'command', action: action };
                                ws.send(JSON.stringify(message));
                                log('Sent: ' + JSON.stringify(message));
                            }
                        }
                        
                        function sendTracks() {
                            if (ws && ws.readyState === WebSocket.OPEN) {
                                const message = {
                                    type: 'tracks',
                                    data: [
                                        { id: 1, name: 'Drums', volume: 0.8, pan: 0, muted: false, soloed: false, armed: false, devices: [] },
                                        { id: 2, name: 'Bass', volume: 0.7, pan: -0.2, muted: false, soloed: false, armed: false, devices: [] },
                                        { id: 3, name: 'Piano', volume: 0.6, pan: 0.1, muted: false, soloed: false, armed: true, devices: [] },
                                        { id: 4, name: 'Vocal', volume: 0.9, pan: 0, muted: false, soloed: false, armed: false, devices: [] }
                                    ]
                                };
                                ws.send(JSON.stringify(message));
                                log('Sent tracks data');
                            }
                        }
                        
                        function sendTransport() {
                            if (ws && ws.readyState === WebSocket.OPEN) {
                                const message = {
                                    type: 'transport',
                                    data: {
                                        is_playing: true,
                                        is_recording: false,
                                        current_time: Math.random() * 100
                                    }
                                };
                                ws.send(JSON.stringify(message));
                                log('Sent transport state');
                            }
                        }
                        
                        function log(message) {
                            const logs = document.getElementById('logs');
                            const timestamp = new Date().toLocaleTimeString();
                            logs.innerHTML += timestamp + ': ' + message + '\\n';
                            logs.scrollTop = logs.scrollHeight;
                        }
                        
                        // Connect on page load
                        connect();
                    </script>
                </body>
                </html>
            `);
        });

        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', port: this.port, timestamp: new Date().toISOString() });
        });
    }

    private setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('Client connected to test server');

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    console.log('Received from client:', data);
                    
                    // Echo back the message for testing
                    ws.send(JSON.stringify({
                        type: 'response',
                        original: data,
                        timestamp: Date.now()
                    }));
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected from test server');
            });

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                message: 'Connected to DrSplitz Test Server',
                timestamp: Date.now()
            }));
        });
    }

    start(): Promise<void> {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`DrSplitz Test Server running on http://localhost:${this.port}`);
                resolve();
            });
        });
    }

    stop(): Promise<void> {
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('DrSplitz Test Server stopped');
                resolve();
            });
        });
    }

    getPort(): number {
        return this.port;
    }
}
