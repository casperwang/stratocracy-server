const config = require('./config.js');

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

const BFS_strategy = (player) => {
  for (let i = 0; i < player.row; i++) {
    for (let j = 0; j < player.col; j++) {
      if (player.board[i][j].owner !== player.id) continue;
      for (let [ai, aj] of shuffleArray(adj4([i, j], player.row, player.col))) {
        if (player.board[ai][aj].owner === player.id) continue;
        if (player.board[ai][aj].val >= player.board[i][j]-1) continue;
        let is_half = (Math.floor((player.board[i][j].val-1)/2) > player.board[ai][aj].val);
        player.addMove([i, j], [ai-i, aj-j], is_half);
        return;
      }
    }
  }
}

module.exports = BFS_strategy;