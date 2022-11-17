var Game = require('./modal');
var s1 = require('./strategy1');

const express = require('express');
const { SocketAddress } = require('net');
const app = express();

class Meta {
  constructor(row, col, player_cnt) {
    this.row = row;
    this.col = col;
    this.player_cnt = player_cnt;

    this.G = new Game(this.row, this.col, 0.2, 0.02, player_cnt);

    this.players = new Array(this.player_cnt+1);
    for (let player_id = 0; player_id <= this.player_cnt; player_id++) {
      this.players[player_id] = {
        team: player_id,
        type: 'ai'
      };
    }
    this.players[0].type = 'admin';
    this.players[1].type = 'human';

    this.servers = new Array(this.player_cnt+1);
    this.ios = new Array(this.player_cnt+1);
  }
}

let M = new Meta(25, 50, 8);

for (let i = 0; i <= M.player_cnt; i++) {
  if (M.players[i].type === 'ai') continue;
  M.servers[i] = require('http').Server(app).listen(5000 + i, () => {
    console.log('open server ' + (5000+i) + '!');
  });
  M.ios[i] = require('socket.io')(M.servers[i], {
    cors: {
      origin: "http://localhost:" + (3000+i),
      methods: ["GET", "POST"]
    }
  });
  M.ios[i].on('connection', socket => {
    console.log('success connect with ' + (3000+i));
    socket.on('addMove', move => {
      M.G.players[move.player_id-1].addMove(move.p, move.d, move.is_half);
    });
    socket.emit('initialization', M.G);
  });
}

setInterval(async () => {
  await M.G.board_next_step();
  for (let player_id = 0; player_id <= M.player_cnt; player_id++) {
    if (M.players[player_id].flag === false) continue;
    if (M.players[player_id].type === 'ai') {
      s1(M.G.players[player_id-1]);
    } else {
      M.ios[player_id].emit('gameState', M.G);
    }
  }
}, 10);
