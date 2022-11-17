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
  
const adj4 = (p, row, col) => {
  const res = [];
  for (let di = -1; di <= 1; di++)
    for (let dj = -1; dj <= 1; dj++)
      if (Math.abs(di + dj) === 1 && 0 <= p.i + di && p.i + di < row && 0 <= p.j + dj && p.j + dj < col)
        res.push({i: p.i + di, j: p.j + dj});
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
      for (let p of shuffleArray(adj4({i: i, j: j}, player.row, player.col))) {
        if (player.board[p.i][p.j].type !== BoardType.hometown) continue;
        if (player.board[p.i][p.j].owner === player.id) continue;
        if (player.board[p.i][p.j].val >= player.board[i][j]-1) continue;
        let is_half = (Math.floor((player.board[i][j].val-1)/2) > player.board[p.i][p.j].val);
        player.addMove({i: i, j: j}, {i: p.i-i, j: p.j-j}, is_half);
        return;
      }
    }
  }

  if (Math.random() > 0.5) {
    for (let i of Array.from(Array(player.row).keys()).sort(() => 0.5 - Math.random())) {
      for (let j of Array.from(Array(player.col).keys()).sort(() => 0.5 - Math.random())) {
        if (player.board[i][j].owner !== player.id) continue;
        if (player.board[i][j].val <= 1) continue;
        for (let p of shuffleArray(adj4({i: i, j: j}, player.row, player.col))) {
          if (player.board[p.i][p.j].type === BoardType.obstacle) continue;
          if (player.board[p.i][p.j].owner === player.id) continue;
          if (player.board[p.i][p.j].val >= player.board[i][j].val-1) continue;
          let is_half = (Math.floor((player.board[i][j].val-1)/2) > player.board[p.i][p.j].val);
          player.addMove({i: i, j: j}, {i: p.i-i, j: p.j-j}, is_half);
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
  for (let p of shuffleArray(adj4({i: mx.i, j: mx.j}, player.row, player.col))) {
    if (player.board[p.i][p.j].type === BoardType.obstacle) continue;
    if (player.board[p.i][p.j].owner === player.id) continue;
    if (player.board[p.i][p.j].val >= player.board[mx.i][mx.j]-1) continue;
    let is_half = (Math.floor((player.board[mx.i][mx.j].val-1)/2) > player.board[p.i][p.j].val);
    player.addMove({i: mx.i, j: mx.j}, {i: p.i-mx.i, j: p.j-mx.j}, is_half);
    return;
  }
  let mmx = {i: -1, j: -1, val: -1};
  for (let p of shuffleArray(adj4({i: mx.i, j: mx.j}, player.row, player.col))) {
    if (player.board[p.i][p.j].type === BoardType.obstacle) continue;
    if (player.board[p.i][p.j].val >= player.board[mx.i][mx.j]-1) continue;
    if (Math.abs(player.board[p.i][p.j].val - 1) > mmx.val) {
      mmx.i = p.i;
      mmx.j = p.j;
      mmx.val = Math.abs(player.board[p.i][p.j].val - 1);
    }
  }
  if (mmx.i === -1) return;
  player.addMove({i: mx.i, j: mx.j}, {i: mmx.i-mx.i, j: mmx.j-mx.j}, false);
  return;
}

module.exports = s1;