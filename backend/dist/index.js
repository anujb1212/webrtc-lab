import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', function connection(ws) {
    console.log('New client connected');
    ws.on('message', function message(data) {
        const message = JSON.parse(data.toString());
        console.log('Received message:', message);
    });
    ws.send('Welcome to the WebSocket server!');
});
//# sourceMappingURL=index.js.map