// server.js
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });
const clients = new Map();

function broadcast(payload, exceptId = null) {
  const s = JSON.stringify(payload);
  for (const [id, ws] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN && id !== exceptId) ws.send(s);
  }
}

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);
  ws.send(JSON.stringify({ t: 'init', id: clientId }));

  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch (e) { return; }
    if (!data || !data.t) return;
    if (data.t === 'join') {
      broadcast({ t: 'peer-join', id: clientId, name: data.name, color: data.color }, clientId);
    } else if (data.t === 'update') {
      broadcast({ t: 'peer-update', id: clientId, pos: data.pos, rot: data.rot }, clientId);
    } else if (data.t === 'chat') {
      broadcast({ t: 'chat', id: clientId, text: data.text, name: data.name }, null);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    broadcast({ t: 'peer-leave', id: clientId }, null);
  });
});
