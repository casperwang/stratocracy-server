const BoardType = {
  obstacle: "obstacle",
  hometown: "hometown",
  land: "land",
  castle: "castle",
  invisible: "invisible",
  invisible_obstacle: "invisible_obstacle"
};

const shuffleArray = (array) => {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}
  

const adj4 = ([i, j], row, col) => {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const res = [];
  for (const [di, dj] of dirs)
    if (0 <= i+di && i+di < row && 0 <= j+dj && j+dj < col)
      res.push([i+di, j+dj]);
  return res;
}

var hometowns = new Array(8).fill({i: -1, j: -1});

const s1 = (player) => {
  for (let i = 0; i < player.row; i++) {
    for (let j = 0; j < player.col; j++) {
      if (player.board[i][j].type === BoardType.hometown) {
        hometowns[player.board[i][j].owner] = {i: i, j: j};
      }
    }
  }
  for (let p of hometowns) {
    if (p.i === -1) continue;
    if (player.board[p.i][p.j].type === BoardType.invisible) continue;
    if (player.board[p.i][p.j].type === BoardType.hometown) continue;
    p = {i: -1, j: -1};
  }

  for (let i = 0; i < player.row; i++) {
    for (let j = 0; j < player.col; j++) {
      if (player.board[i][j].owner !== player.id) continue;
      for (let [ai, aj] of shuffleArray(adj4([i, j], player.row, player.col))) {
        if (player.board[ai][aj].type !== BoardType.hometown) continue;
        if (player.board[ai][aj].owner === player.id) continue;
        if (player.board[ai][aj].val >= player.board[i][j]-1) continue;
        let is_half = (Math.floor((player.board[i][j].val-1)/2) > player.board[ai][aj].val);
        player.addMove({i: i, j: j}, {i: ai-i, j: aj-j}, is_half);
        return;
      }
    }
  }

  if (Math.random() > 0.5) {
    for (let i of Array.from(Array(player.row).keys()).sort(() => 0.5 - Math.random())) {
      for (let j of Array.from(Array(player.col).keys()).sort(() => 0.5 - Math.random())) {
        if (player.board[i][j].owner !== player.id) continue;
        if (player.board[i][j].val <= 1) continue;
        for (let [ai, aj] of shuffleArray(adj4([i, j], player.row, player.col))) {
          if (player.board[ai][aj].type === BoardType.obstacle) continue;
          if (player.board[ai][aj].owner === player.id) continue;
          if (player.board[ai][aj].val >= player.board[i][j].val-1) continue;
          let is_half = (Math.floor((player.board[i][j].val-1)/2) > player.board[ai][aj].val);
          player.addMove({i: i, j: j}, {i: ai-i, j: aj-j}, is_half);
          return;
        }
      }
    }
  }
  let mx = {i: -1, j: -1, val: 0};
  for (let i = 0; i < player.row; i++) {
    for (let j = 0; j < player.col; j++) {
      if (player.board[i][j].owner !== player.id) continue;
      if (player.board[i][j].val > mx.val) {
        mx.i = i;
        mx.j = j;
        mx.val = player.board[i][j].val;
      }
    }
  }
  for (let [ai, aj] of shuffleArray(adj4([mx.i, mx.j], player.row, player.col))) {
    if (player.board[ai][aj].type === BoardType.obstacle) continue;
    if (player.board[ai][aj].owner === player.id) continue;
    if (player.board[ai][aj].val >= player.board[mx.i][mx.j]-1) continue;
    let is_half = (Math.floor((player.board[mx.i][mx.j].val-1)/2) > player.board[ai][aj].val);
    player.addMove({i: mx.i, j: mx.j}, {i: ai-mx.i, j: aj-mx.j}, is_half);
    return;
  }
  let mmx = {i: -1, j: -1, val: -1};
  for (let [ai, aj] of shuffleArray(adj4([mx.i, mx.j], player.row, player.col))) {
    if (player.board[ai][aj].type === BoardType.obstacle) continue;
    if (Math.abs(player.board[ai][aj].val - 1) > mmx.val) {
      mmx.i = ai;
      mmx.j = aj;
      mmx.val = Math.abs(player.board[ai][aj].val - 1);
    }
  }
  if (mmx.i !== -1) {
    player.addMove({i: mx.i, j: mx.j}, {i: mmx.i-mx.i, j: mmx.j-mx.j}, false);
    return;
  }
}

module.exports = s1;