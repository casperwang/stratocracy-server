var Game = require('./modal');
var s1 = require('./strategy1');

const express = require('express');
const app = express();

class Meta {
  constructor(row, col, real_player_cnt, ai_player_cnt) {
    this.row = row;
    this.col = col;
    this.player_cnt = real_player_cnt + ai_player_cnt;

    this.G = new Game(this.row, this.col, 0.2, 0.02, this.player_cnt);

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

var M;
var intervalId;

let addMove = (move) => {
  if (M == null) return;
  M.G.players[move.player_id-1].addMove(move.p, move.d, move.is_half);
}

io.on('connection', socket => {
  socket.on('addMove', move => {
    addMove(move);
  });
  socket.on('ready', setting => {
    M = new Meta(setting.row, setting.col, setting.real_player_cnt, setting.ai_player_cnt);
    io.emit('gameStart');
    clearInterval(intervalId);
    intervalId = setInterval(async () => {
      if (M == null) return;
      await M.G.board_next_step();
      for (let player_id = 1; player_id <= M.player_cnt; player_id++) {
        if (M.players[player_id].flag === false) continue;
        if (M.players[player_id].type === 'ai')
          s1(M.G.players[player_id-1]);
      }
      io.emit('gameState', M.G);
    }, 100);
  });
});
