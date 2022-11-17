const BoardType = {
  obstacle: "obstacle",
  hometown: "hometown",
  land: "land",
  castle: "castle",
  invisible: "invisible",
  invisible_obstacle: "invisible_obstacle"
};

const BoardElement = (type, owner) => {
  return {
    type: type,
    owner: owner,
    val: 0
  }
}

class Player {
  constructor(row, col, board, hometown, player_id, team_id, time) {
    this.row = row;
    this.col = col;
    this.board = board;
    this.hometown = hometown;
    this.id = player_id;
    this.team_id = team_id;
    this.flag = true;
    this.time = time;

    this.moves = [];
  }

  addMove = (p, d, is_half) => {
    if (Math.abs(d.i) + Math.abs(d.j) !== 1) return -1;
    this.moves.push({p: p, d: d, is_half: is_half});
    return 1;
  }

  gameover = () => {
    this.flag = false;
  }
}

class Game {
  constructor(row, col, obstacle_rate, castle_rate, player_cnt) {
    this.row = row;
    this.col = col;
    this.board = new Array(this.row);
    for (let i = 0; i < this.row; i++) {
      this.board[i] = new Array(this.col);
      for (let j = 0; j < this.col; j++)
        this.board[i][j] = BoardElement(BoardType.land, 0);
    }
    this.players = [];
    this.time = 0;

    // board generation
    for (let _ = 0; _ < obstacle_rate * this.row * this.col; _++) {
      let p = this.prandom();
      while (this.board[p.i][p.j].type !== BoardType.land || this.check_board_cut(p)) {
        p = this.prandom();
      }
      this.board[p.i][p.j].type = BoardType.obstacle;
    }
    for (let _ = 0; _ < castle_rate * this.row * this.col; _++) {
      let p = this.prandom();
      while (this.board[p.i][p.j].type !== BoardType.land) {
        p = this.prandom();
      }
      this.board[p.i][p.j].type = BoardType.castle;
      this.board[p.i][p.j].val = 40 + Math.floor(Math.random() * 11);
    }

    // player initialization
    this.players = [];
    for (let player_id = 1; player_id <= player_cnt; player_id++) {
      let p = this.prandom();
      while (this.board[p.i][p.j].type !== BoardType.land) {
        p = this.prandom();
      }
      this.board[p.i][p.j].type = BoardType.hometown;
      this.board[p.i][p.j].owner = player_id;
      this.players.push(new Player(this.row, this.col, this.board_mask(player_id), p, player_id, player_id, this.time));
    }
  }

  prandom = () => {
    return {
      i: Math.floor(Math.random() * this.row),
      j: Math.floor(Math.random() * this.col)
    };
  };

  adj4(p) {
    const res = [];
    for (let di = -1; di <= 1; di++)
      for (let dj = -1; dj <= 1; dj++)
        if (Math.abs(di + dj) === 1 && 0 <= p.i + di && p.i + di < this.row && 0 <= p.j + dj && p.j + dj < this.col)
          res.push({i: p.i + di, j: p.j + dj});
    return res;
  }

  adj9(p) {
    const res = [];
    for (let di = -1; di <= 1; di++)
      for (let dj = -1; dj <= 1; dj++)
        if (0 <= p.i + di && p.i + di < this.row && 0 <= p.j + dj && p.j + dj < this.col)
          res.push({i: p.i + di, j: p.j + dj});
    return res;
  }

  check_board_cut = (p) => {
    this.board[p.i][p.j].type = BoardType.obstacle;
    let visited = new Array(this.row);
    let cnt_land = 0;
    for (let i = 0; i < this.row; i++) {
      visited[i] = new Array(this.col);
      for (let j = 0; j < this.col; j++) {
        visited[i][j] = false;
        cnt_land += (this.board[i][j].type === BoardType.land ? 1 : 0);
      }
    }
    let bfs_queue = [];
    for (let adjp of this.adj4(p)) {
      if (this.board[adjp.i][adjp.j].type !== BoardType.obstacle) {
        bfs_queue.push({i: adjp.i, j: adjp.j});
        visited[adjp.i][adjp.j] = true;
        break;
      }
    }
    while (bfs_queue.length) {
      let curp = bfs_queue.shift();
      cnt_land--;
      for (let nxtp of this.adj4(curp)) {
        if (this.board[nxtp.i][nxtp.j].type === BoardType.land && !visited[nxtp.i][nxtp.j]) {
          bfs_queue.push(nxtp);
          visited[nxtp.i][nxtp.j] = true;
        }
      }
    }
    this.board[p.i][p.j].type = BoardType.land;
    return cnt_land > 0;
  };

  board_mask = (player_id) => {
    return this.board.map((row, i) => {
      return row.map((cell, j) => {
        let visible = this.adj9({i: i, j: j}).some((p) => {
          return this.board[p.i][p.j].owner === player_id;
        });
        if (visible) return cell;
        const res = BoardElement(BoardType.invisible, 0);
        if (cell.type === BoardType.obstacle || cell.type === BoardType.castle) {
          res.type = BoardType.invisible_obstacle;
        }
        return res;
      })
    })
  }

  board_next_step = async () => {
    let dboard = new Array(this.row);
    for (let i = 0; i < this.row; i++) {
      dboard[i] = new Array(this.col);
      for (let j = 0; j < this.col; j++)
        dboard[i][j] = { owner: 0, val: 0 };
    }
    let moves = [];
    for (let player of this.players) {
      if (player.moves.length === 0) continue;
      let move = player.moves.shift();
      let p1 = move.p, p2 = {i: move.p.i + move.d.i, j: move.p.j + move.d.j};
      let flag = false;
      while (p2.i < 0 || p2.i >= this.row || p2.j < 0 || p2.j >= this.col || this.board[p1.i][p1.j].owner !== player.id || this.board[p1.i][p1.j].val === 0 || this.board[p2.i][p2.j].type === BoardType.obstacle) {
        if (player.moves.length === 0) {
          flag = true;
          break;
        }
        move = player.moves.shift();
        p1 = move.p, p2 = {i: move.p.i + move.d.i, j: move.p.j + move.d.j};
      }
      if (flag) continue;
      let m = {
        p1: p1, 
        p2: p2, 
        id: player.id, 
        dval: Math.ceil((this.board[p1.i][p1.j].val-1) / (move.is_half ? 2 : 1)) };
      moves.push(m);
    }
    for (let m1 of moves) {
      for (let m2 of moves) {
        if (m1.p1 == m2.p2 && m1.p2 == m2.p1) {
          console.log("www");
          let mmin = Math.min(m1.dval, m2.dval);
          m1.dval -= mmin;
          m2.dval -= mmin;
        }
      }
      this.board[m1.p1.i][m1.p1.j].val -= m1.dval;
      dboard[m1.p2.i][m1.p2.j].val -= m1.dval;
      if (dboard[m1.p2.i][m1.p2.j].val < 0) {
        dboard[m1.p2.i][m1.p2.j].owner = m1.id;
        dboard[m1.p2.i][m1.p2.j].val = Math.abs(dboard[m1.p2.i][m1.p2.j].val);
      }
    }
    let inherit_players = [];
    for (let i = 0; i < this.row; i++) {
      for (let j = 0; j < this.col; j++) {
        if (dboard[i][j].val === 0) continue;
        if (dboard[i][j].owner === 0) continue;
        if (this.board[i][j].owner === dboard[i][j].owner) {
          this.board[i][j].val += dboard[i][j].val;
        } else {
          this.board[i][j].val -= dboard[i][j].val;
          if (this.board[i][j].val < 0) {
            if (this.board[i][j].type === BoardType.hometown) {
              this.players[this.board[i][j].owner-1].gameover(dboard[i][j].owner);
              this.board[i][j].type = BoardType.castle;
              inherit_players.push({old: this.board[i][j].owner, new: dboard[i][j].owner});
            }
            this.board[i][j].owner = dboard[i][j].owner;
            this.board[i][j].val = Math.abs(this.board[i][j].val);
          }
        }
      }
    }

    for (let inherit_pair of inherit_players) {
      for (let i = 0; i < this.row; i++) {
        for (let j = 0; j < this.col; j++) {
          if (this.board[i][j].owner === inherit_pair.old) {
            this.board[i][j].val = Math.ceil(this.board[i][j].val / 2);
            this.board[i][j].owner = inherit_pair.new;
          }
        }
      }
    }

    for (let i = 0; i < this.row; i++) {
      for (let j = 0; j < this.col; j++) {
        if (this.board[i][j].owner === 0) continue;
        if (this.board[i][j].type === BoardType.land) {
          if (this.time % 50 === 0) {
            this.board[i][j].val++;
          }
        } else if (this.board[i][j].type === BoardType.castle || this.board[i][j].type === BoardType.hometown) {
          if (this.time % 2 === 0) {
            this.board[i][j].val++;
          }
        }
      }
    }

    for (let player of this.players) {
      this.players[player.id-1].board = this.board_mask(player.id);
      this.players[player.id-1].time = this.time;
    }
    this.time++;
  }

  get_army_sum = (player_id) => {
    let sum = 0;
    for (let i = 0; i < this.row; i++) {
      for (let j = 0; j < this.col; j++) {
        if (this.board[i][j].owner !== player_id) continue;
        sum += this.board[i][j].val;
      }
    }
    return sum;
  }
}

module.exports = Game;