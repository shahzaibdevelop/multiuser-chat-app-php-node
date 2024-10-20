const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = new Map();

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'register':
        users.set(data.username, ws);
        ws.username = data.username;
        break;
      case 'search':
        const foundUser = Array.from(users.keys()).find(username => 
          username.toLowerCase().includes(data.query.toLowerCase())
        );
        ws.send(JSON.stringify({ type: 'searchResult', result: foundUser || null }));
        break;
      case 'message':
        const recipient = users.get(data.to);
        if (recipient) {
          recipient.send(JSON.stringify({
            type: 'message',
            from: ws.username,
            content: data.content
          }));
        }
        break;
    }
  });

  ws.on('close', () => {
    users.delete(ws.username);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
