const express = require('express');
const server = require('http').createServer();
const app = express();

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: __dirname });
});

server.on('request', app);

server.listen(3000, function () {
  console.log('Listening on 3000');
});

process.on('SIGINT', () => {
  wss.clients.forEach(client => {
    client.close();
  });
  server.close(() => {
    shutdownDB();
  });
});

/** Begin WebSocket */
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ server: server });

wss.on('connection', function connection(ws) {
  const numClients = wss.clients.size;

  console.log('clients connected: ', numClients);

  wss.broadcast(`Current visitors: ${numClients}`);

  if (ws.readyState === ws.OPEN) {
    ws.send('welcome!');
  }

  db.run(`INSERT INTO visitors (count,time)
      VALUES (${numClients}, datetime('now'))
    `);

  ws.on('close', function close() {
    wss.broadcast(`Current visitors: ${wss.clients.size}`);
    console.log('A client has disconnected');
  });

  ws.on('error', function error() {
    //
  });
});

/**
 * Broadcast data to all connected clients
 * @param  {Object} data
 * @void
 */
wss.broadcast = function broadcast(data) {
  console.log('Broadcasting: ', data);
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};
/** End Websocket **/

/** Begin Database */
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`
      CREATE TABLE visitors (
        count INTEGER,
        time TEXT
      )
    `);
});

function getCounts() {
  db.each('SELECT * FROM visitors', (error, row) => {
    console.log(row);
  });
}

function shutdownDB() {
  getCounts();
  console.log('Shutting down db');
  db.close();
}
