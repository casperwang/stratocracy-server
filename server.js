const Game = require('./modal'); // Game Modal
const strategy1 = require('./strategy1'); // AI with greedy algorithm
// TODO: AI with A* algorithm

const express = require('express');
const app = express();

const config = require('./config.js');

class Meta { // control the whole game
  constructor(row, col, real_player_cnt, ai_player_cnt) {
    this.row = row;
    this.col = col;
    this.player_cnt = real_player_cnt + ai_player_cnt;

    this.G = new Game(this.row, this.col, config.OBSTACLE_RATE, config.CASTLE_RATE, this.player_cnt);

    this.players = new Array(this.player_cnt+1);
    const get_player_type = (player_id) => {
      if (player_id === 0) return 'admin';
      if (player_id <= real_player_cnt) return 'real';
      return 'ai';
    }
    for (let player_id = 0; player_id <= this.player_cnt; player_id++) {
      this.players[player_id] = {
        team: player_id,
        type: get_player_type(player_id)
      };
    }
  }
}

let server = require('http').Server(app).listen(5000, () => {
  console.log('open server');
});
let io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  }
});

let meta;
let intervalId;
let current_players = new Set()
let realPlayerCount = 0;

const new_random_id = () => {
  random_id = Math.floor(Math.random() * 10000);
  while (current_players.has(random_id))
}

io.on('connection', socket => {
  socket.on('newGame', () => {
    socket.emit('playerId', 0);
  });
  socket.on('newPlayer', () => {
    socket.emit('playerId', ++realPlayerCount);
  });
  socket.on('addMove', move => {
    if (meta == null) return;
    meta.G.players[move.player_id-1].addMove(move.p, move.d, move.is_half);
  });
  socket.on('createGame', setting => {
    meta = new Meta(setting.row, setting.col, setting.real_player_cnt, setting.ai_player_cnt);
    socket.removeAllListeners('newGame');
    socket.removeAllListeners('newPlayer');
    io.emit('gameStart', meta.G);
    clearInterval(intervalId);
    intervalId = setInterval(async () => {
      if (meta == null) return;
      await meta.G.board_next_step();
      for (let player_id = 1; player_id <= meta.player_cnt; player_id++) {
        if (meta.players[player_id].flag === false) continue;
        if (meta.players[player_id].type === 'ai')
          strategy1(meta.G.players[player_id-1]);
      }
      io.emit('gameState', meta.G);
    }, 300);
  });
});
