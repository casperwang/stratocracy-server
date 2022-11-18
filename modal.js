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
  };
}

class Player {
  constructor(row, col, board, [i, j], player_id, team_id, time) {
    this.row = row;
    this.col = col;
    this.board = board;
    this.hometown = [i, j];
    this.id = player_id;
    this.team_id = team_id;
    this.flag = true;
    this.time = time;

    this.moves = [];
  }

  addMove = ([pi, pj], [di, dj], is_half) => {
    if (Math.abs(di) + Math.abs(dj) !== 1) return -1;
    this.moves.push({p: [pi, pj], d: [di, dj], is_half: is_half});
    return 1;
  }

  gameover = () => {
    this.flag = false;
    return 1;
  }
}

class Game {
  constructor(row, col, obstacle_rate, castle_rate, player_cnt) {
    this.row = row;
    this.col = col;
    this.board = new Array(this.row).fill().map(() => new Array(this.col));
    for (let i = 0; i < this.row; i++)
      for (let j = 0; j < this.col; j++)
        this.board[i][j] = BoardElement(BoardType.land, 0);
    this.players = [];
    this.time = 0;

    // obstacle initialization
    for (let _ = 0; _ < obstacle_rate * this.row * this.col; _++) {
      let [pi, pj] = this.pRandom();
      while (this.board[pi][pj].type !== BoardType.land || this.check_board_cut([pi, pj]))
        [pi, pj] = this.pRandom();
      this.board[pi][pj].type = BoardType.obstacle;
    }
    // castle initialization
    for (let _ = 0; _ < castle_rate * this.row * this.col; _++) {
      let [pi, pj] = this.pRandom();
      while (this.board[pi][pj].type !== BoardType.land)
        [pi, pj] = this.pRandom();
      this.board[pi][pj].type = BoardType.castle;
      this.board[pi][pj].val = 40 + Math.floor(Math.random() * 11);
    }
    // player initialization
    this.players = [];
    for (let player_id = 1; player_id <= player_cnt; player_id++) {
      let [pi, pj] = this.pRandom();
      while (this.board[pi][pj].type !== BoardType.land)
        [pi, pj] = this.pRandom();
      this.board[pi][pj].type = BoardType.hometown;
      this.board[pi][pj].owner = player_id;
      this.players.push(new Player(this.row, this.col, this.board_mask(player_id), [pi, pj], player_id, player_id, this.time));
    }
  }

  pRandom = () => {
    return [Math.floor(Math.random() * this.row), Math.floor(Math.random() * this.col)];
  };

  adj4([i, j]) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const res = [];
    for (const [di, dj] of dirs)
      if (0 <= i+di && i+di < this.row && 0 <= j+dj && j+dj < this.col)
        res.push([i+di, j+dj]);
    return res;
  }

  adj9([i, j]) {
    const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 0], [0, 1], [1, -1], [1, 0], [1, 1]];
    const res = [];
    for (const [di, dj] of dirs)
      if (0 <= i+di && i+di < this.row && 0 <= j+dj && j+dj < this.col)
        res.push([i+di, j+dj]);
    return res;
  }

  check_board_cut = ([pi, pj]) => {
    this.board[pi][pj].type = BoardType.obstacle;
    let visited = new Array(this.row).fill().map(() => new Array(this.col));
    let cnt_land = 0;
    for (let i = 0; i < this.row; i++) {
      for (let j = 0; j < this.col; j++) {
        visited[i][j] = false;
        cnt_land += (this.board[i][j].type === BoardType.land ? 1 : 0);
      }
    }
    let bfs_queue = [];
    for (const [ai, aj] of this.adj4([pi, pj])) {
      if (this.board[ai][aj].type !== BoardType.obstacle) {
        bfs_queue.push([ai, aj]);
        visited[ai][aj] = true;
        break;
      }
    }
    while (bfs_queue.length) {
      const [i, j] = bfs_queue.shift();
      cnt_land--;
      for (const [ai, aj] of this.adj4([i, j])) {
        if (this.board[ai][aj].type === BoardType.land && !visited[ai][aj]) {
          bfs_queue.push([ai, aj]);
          visited[ai][aj] = true;
        }
      }
    }
    this.board[pi][pj].type = BoardType.land;
    return cnt_land > 0;
  };

  board_mask = (player_id) => {
    return this.board.map((row, i) => {
      return row.map((cell, j) => {
        const visible = this.adj9([i, j]).some(([ai, aj]) => {
          return this.board[ai][aj].owner === player_id;
        });
        if (visible) return cell;
        let res = BoardElement(BoardType.invisible, 0);
        if (cell.type === BoardType.obstacle || cell.type === BoardType.castle)
          res.type = BoardType.invisible_obstacle;
        return res;
      })
    })
  }

  board_next_step = async () => {
    let dboard = new Array(this.row).fill().map(() => new Array(this.col));
    for (let i = 0; i < this.row; i++)
      for (let j = 0; j < this.col; j++)
        dboard[i][j] = { owner: 0, val: 0 };
    let moves = [];
    for (let player of this.players) {
      if (player.moves.length === 0) continue;
      let move = player.moves.shift();
      let [di, dj] = move.d;
      let [i1, j1] = move.p;
      let [i2, j2] = [i1 + di, j1 + dj];
      let flag = false;
      while (i2 < 0 || i2 >= this.row || j2 < 0 || j2 >= this.col || this.board[i1][j1].owner !== player.id || this.board[i1][j1].val === 0 || this.board[i2][j2].type === BoardType.obstacle) {
        if (player.moves.length === 0) {
          flag = true;
          break;
        }
        move = player.moves.shift();
        [di, dj] = move.d;
        [i1, j1] = move.p;
        [i2, j2] = [i1 + di, j1 + dj];
      }
      if (flag) continue;
      let m = {
        p1: [i1, j1],
        p2: [i2, j2],
        id: player.id, 
        dval: Math.ceil((this.board[i1][j1].val-1) / (move.is_half ? 2 : 1))
      };
      moves.push(m);
    }
    for (let m1 of moves) {
      for (let m2 of moves) {
        if (m1.p1 == m2.p2 && m1.p2 == m2.p1) {
          let mmin = Math.min(m1.dval, m2.dval);
          m1.dval -= mmin;
          m2.dval -= mmin;
        }
      }
      let [i1, j1] = m1.p1;
      let [i2, j2] = m1.p2;
      this.board[i1][j1].val -= m1.dval;
      dboard[i2][j2].val -= m1.dval;
      if (dboard[i2][j2].val < 0) {
        dboard[i2][j2].owner = m1.id;
        dboard[i2][j2].val = Math.abs(dboard[i2][j2].val);
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