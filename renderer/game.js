// =============================================================================
// renderer/game.js — 数独游戏核心逻辑
// SudokuGame class manages board state, puzzle loading, input, conflict
// detection, completion checking, and keyboard navigation.
// =============================================================================
(function() {

// ---------------------------------------------------------------------------
// 12 道预设题目，按难度分组（0 = 空格，非 0 = 预设数字）
// easy: 3 题 (~45-49 空格), medium: 3 题 (~51-53 空格)
// hard: 3 题 (~55-57 空格), expert: 3 题 (~60 空格)
// 题目 0、1 来自 Project Euler #96 已验证题库，其余为从已验证解中删格生成。
// ---------------------------------------------------------------------------
var PUZZLES_BY_DIFFICULTY = {
  // --- easy: 3 题 ---
  easy: [
    [ [0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],[8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],[0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0] ],
    [ [0,0,3,0,2,0,6,0,0],[9,0,0,3,0,5,0,0,1],[0,0,1,8,0,6,4,0,0],[0,0,8,1,0,2,9,0,0],[7,0,0,0,0,0,0,0,8],[0,0,6,7,0,8,2,0,0],[0,0,2,6,0,9,5,0,0],[8,0,0,2,0,3,0,0,9],[0,0,5,0,1,0,3,0,0] ],
    [ [5,3,4,0,0,0,9,0,2],[0,0,0,1,0,5,0,4,0],[1,0,8,3,0,2,5,0,0],[0,5,9,0,6,0,0,0,0],[0,0,6,0,5,0,7,0,1],[0,1,0,9,0,0,0,0,6],[9,0,1,5,0,0,0,8,0],[0,8,0,0,0,9,6,0,0],[3,0,0,0,0,6,0,0,0] ]
  ],
  medium: [
    [ [5,0,0,0,7,0,0,0,2],[0,7,0,1,0,0,3,0,0],[1,0,8,0,0,2,0,6,0],[0,5,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,0],[7,0,0,0,2,0,0,5,0],[0,6,0,5,0,0,2,0,0],[0,0,7,0,0,9,0,3,0],[3,0,0,0,8,0,0,0,9] ],
    [ [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9] ],
    [ [2,9,0,7,0,0,0,0,0],[0,0,1,0,6,0,9,0,0],[8,0,0,0,0,2,0,4,3],[0,8,0,4,0,0,2,0,0],[0,0,2,0,8,0,0,0,5],[5,0,0,0,0,6,0,3,0],[0,6,0,0,2,0,1,0,0],[0,0,8,0,0,1,0,0,4],[1,0,0,9,0,0,0,7,0] ]
  ],
  hard: [
    [ [0,2,0,6,0,8,0,0,0],[5,8,0,0,0,9,7,0,0],[0,0,0,0,4,0,0,0,0],[3,7,0,0,0,0,5,0,0],[6,0,0,0,0,0,0,0,4],[0,0,8,0,0,0,0,1,3],[0,0,0,0,2,0,0,0,0],[0,0,9,8,0,0,0,3,6],[0,0,0,3,0,6,0,9,0] ],
    [ [0,4,0,2,0,0,0,9,0],[6,0,0,0,8,0,3,0,0],[0,0,3,0,0,4,0,0,7],[0,1,0,0,7,0,0,5,0],[3,0,0,9,0,0,0,0,2],[0,0,9,0,0,6,0,7,0],[0,5,0,0,0,0,7,0,0],[0,0,2,0,0,3,0,0,4],[7,0,0,6,0,0,0,1,0] ],
    [ [5,0,0,6,0,0,0,1,0],[0,7,0,0,9,0,3,0,0],[0,0,8,0,0,2,0,0,7],[0,5,0,0,6,0,0,2,0],[4,0,0,8,0,0,7,0,0],[0,0,3,0,0,4,0,0,6],[0,6,0,0,0,0,2,0,0],[0,0,0,4,0,0,0,3,0],[3,0,0,0,8,0,0,0,9] ]
  ],
  expert: [
    [ [0,9,0,0,4,0,0,0,0],[4,0,0,8,0,0,9,0,0],[0,0,6,0,0,0,0,4,0],[0,8,0,0,0,9,0,0,0],[6,0,0,0,8,0,0,0,5],[0,0,0,2,0,0,7,0,0],[0,0,3,0,0,0,0,8,0],[0,2,0,0,7,0,0,0,4],[1,0,0,0,0,8,0,0,0] ],
    [ [1,0,0,0,3,0,0,0,8],[0,0,7,0,0,0,3,0,0],[0,9,0,0,0,4,0,2,0],[0,0,0,4,0,0,0,0,3],[3,0,0,0,5,0,0,0,0],[0,0,0,0,0,6,0,7,0],[0,5,0,0,0,0,7,0,0],[0,0,2,0,0,3,0,8,0],[0,0,0,6,0,0,0,0,9] ],
    [ [0,0,4,0,0,8,0,0,0],[6,0,0,0,9,0,0,0,8],[0,9,0,0,0,0,5,0,0],[0,0,0,7,0,0,0,2,0],[0,2,6,0,0,0,7,0,0],[0,1,0,0,0,4,0,0,0],[9,0,0,0,3,0,0,0,4],[0,0,0,4,0,0,0,3,0],[0,0,5,0,0,0,1,0,0] ]
  ]
};

var MAX_ERRORS_BY_DIFFICULTY = {
  easy: 5,
  medium: 4,
  hard: 3,
  expert: 3
};

// ---------------------------------------------------------------------------
// 数独求解器（回溯算法）
// ---------------------------------------------------------------------------

function solveSudoku(board) {
  var grid = board.map(function (row) { return row.slice(); });

  function isValid(grid, row, col, num) {
    // Check row
    for (var c = 0; c < 9; c++) {
      if (grid[row][c] === num) return false;
    }
    // Check column
    for (var r = 0; r < 9; r++) {
      if (grid[r][col] === num) return false;
    }
    // Check 3x3 box
    var boxRow = Math.floor(row / 3) * 3;
    var boxCol = Math.floor(col / 3) * 3;
    for (var br = boxRow; br < boxRow + 3; br++) {
      for (var bc = boxCol; bc < boxCol + 3; bc++) {
        if (grid[br][bc] === num) return false;
      }
    }
    return true;
  }

  function backtrack() {
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (var n = 1; n <= 9; n++) {
            if (isValid(grid, r, c, n)) {
              grid[r][c] = n;
              if (backtrack()) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  backtrack();
  return grid;
}

// ---------------------------------------------------------------------------
// SudokuGame 类
// ---------------------------------------------------------------------------

function SudokuGame(difficulty, puzzleIndex, savedState) {
  // Restore from saved state if provided
  if (savedState) {
    this.difficulty = savedState.difficulty;
    this.board = savedState.board.map(function (row) { return row.slice(); });
    this.initialPuzzle = savedState.initialPuzzle.map(function (row) { return row.slice(); });
    this.selectedCell = null;
    this.conflicts = new Set();
    this.notesMode = savedState.notesMode;
    this.notes = savedState.notes.map(function (row) { return row.slice(); });
    this.errorCount = savedState.errorCount;
    this.maxErrors = MAX_ERRORS_BY_DIFFICULTY[this.difficulty];
    this.isGameOver = savedState.isGameOver;
    this.isComplete = savedState.isComplete;
    this.elapsedSeconds = savedState.elapsedSeconds || 0;
    this.timerInterval = null;
    this.timerRunning = false;
    this.highlightedNumber = null;
    this.solution = savedState.solution
      ? savedState.solution.map(function (row) { return row.slice(); })
      : solveSudoku(savedState.initialPuzzle);
    this._bindKeyboard();
    this._updateConflicts();
    if (!this.isGameOver && !this.isComplete) {
      this.startTimer();
    }
    return;
  }

  var diff = difficulty || 'medium';
  if (!PUZZLES_BY_DIFFICULTY[diff]) {
    diff = 'medium';
  }
  this.difficulty = diff;

  var puzzles = PUZZLES_BY_DIFFICULTY[diff];
  var idx;
  if (puzzleIndex !== undefined && puzzleIndex !== null) {
    idx = puzzleIndex % puzzles.length;
  } else {
    idx = Math.floor(Math.random() * puzzles.length);
  }
  var puzzle = puzzles[idx];

  this.board = puzzle.map(function (row) { return row.slice(); });
  this.initialPuzzle = puzzle.map(function (row) { return row.slice(); });
  this.solution = solveSudoku(puzzle);
  this.selectedCell = null;
  this.conflicts = new Set();

  // Notes mode
  this.notesMode = false;
  this.notes = [];
  for (var nr = 0; nr < 9; nr++) {
    this.notes[nr] = [];
    for (var nc = 0; nc < 9; nc++) {
      this.notes[nr][nc] = 0;
    }
  }

  // Error counting
  this.errorCount = 0;
  this.maxErrors = MAX_ERRORS_BY_DIFFICULTY[diff];
  this.isGameOver = false;

  this.isComplete = false;

  // Timer
  this.elapsedSeconds = 0;
  this.timerInterval = null;
  this.timerRunning = false;

  // Highlight
  this.highlightedNumber = null;

  this._bindKeyboard();
  this._updateConflicts();
  this.checkComplete();
  this.startTimer();
}

// ---------------------------------------------------------------------------
// 公开方法
// ---------------------------------------------------------------------------

SudokuGame.prototype.selectCell = function (row, col) {
  if (row >= 0 && row < 9 && col >= 0 && col < 9) {
    this.selectedCell = { row: row, col: col };
    this.clearHighlight();
  }
};

SudokuGame.prototype.isGiven = function (row, col) {
  return this.initialPuzzle[row][col] !== 0;
};

// ---------------------------------------------------------------------------
// 笔记模式
// ---------------------------------------------------------------------------

SudokuGame.prototype.toggleNotesMode = function () {
  this.notesMode = !this.notesMode;
};

SudokuGame.prototype.hasNote = function (row, col, n) {
  return (this.notes[row][col] & (1 << (n - 1))) !== 0;
};

SudokuGame.prototype.getNotes = function (row, col) {
  var result = [];
  var mask = this.notes[row][col];
  for (var i = 0; i < 9; i++) {
    if (mask & (1 << i)) {
      result.push(i + 1);
    }
  }
  return result;
};

SudokuGame.prototype.toggleNote = function (n) {
  if (!this.selectedCell) return;
  if (this.isGameOver) return;
  if (this.isComplete) return;

  var row = this.selectedCell.row;
  var col = this.selectedCell.col;

  if (this.isGiven(row, col)) return;

  // If the cell has a number, clear it first
  if (this.board[row][col] !== 0) {
    this.board[row][col] = 0;
    this._updateConflicts();
  }

  var bit = 1 << (n - 1);
  if (this.notes[row][col] & bit) {
    this.notes[row][col] &= ~bit;
  } else {
    this.notes[row][col] |= bit;
  }

  this.checkComplete();
  this.saveGame();
};

// ---------------------------------------------------------------------------
// 错误计数
// ---------------------------------------------------------------------------

SudokuGame.prototype.remainingErrors = function () {
  return this.maxErrors - this.errorCount;
};

// ---------------------------------------------------------------------------
// 核心操作
// ---------------------------------------------------------------------------

SudokuGame.prototype.inputNumber = function (n) {
  if (!this.selectedCell) return;
  if (this.isGameOver) return;
  if (this.isComplete) return;

  var row = this.selectedCell.row;
  var col = this.selectedCell.col;

  // Notes mode: toggle note instead
  if (this.notesMode) {
    this.toggleNote(n);
    return;
  }

  if (this.isGiven(row, col)) return;

  if (this.board[row][col] === n) {
    // Same number → clear it (not an error)
    this.board[row][col] = 0;
    this._updateConflicts();
    this.checkComplete();
    this.saveGame();
    return;
  }

  this.board[row][col] = n;

  // Check against solution
  if (n !== this.solution[row][col]) {
    this.errorCount += 1;
    this.wrongAnswerFlash = true;
    if (this.errorCount >= this.maxErrors) {
      this.isGameOver = true;
    }
  }
  this.notes[row][col] = 0; // Clear notes when placing a number

  this._updateConflicts();

  if (this.isGameOver) {
    this.isComplete = false;
    this.pauseTimer();
  } else {
    this.checkComplete();
  }

  this.saveGame();
};

SudokuGame.prototype.consumeWrongAnswerFlash = function () {
  var val = this.wrongAnswerFlash === true;
  this.wrongAnswerFlash = false;
  return val;
};

SudokuGame.prototype.clearCell = function () {
  if (!this.selectedCell) return;
  if (this.isGameOver) return;
  if (this.isComplete) return;

  var row = this.selectedCell.row;
  var col = this.selectedCell.col;

  // Notes mode: clear notes, not number
  if (this.notesMode) {
    this.notes[row][col] = 0;
    this.saveGame();
    return;
  }

  if (this.isGiven(row, col)) return;

  this.board[row][col] = 0;
  this._updateConflicts();
  this.checkComplete();
  this.saveGame();
};

// ---------------------------------------------------------------------------
// 冲突检测
// ---------------------------------------------------------------------------

SudokuGame.prototype.checkConflict = function (row, col, num) {
  var conflicts = [];

  if (num === 0) return conflicts;

  // Check row
  for (var c = 0; c < 9; c++) {
    if (c !== col && this.board[row][c] === num) {
      conflicts.push({ row: row, col: c });
    }
  }

  // Check column
  for (var r = 0; r < 9; r++) {
    if (r !== row && this.board[r][col] === num) {
      conflicts.push({ row: r, col: col });
    }
  }

  // Check box
  var boxRow = Math.floor(row / 3) * 3;
  var boxCol = Math.floor(col / 3) * 3;
  for (var br = boxRow; br < boxRow + 3; br++) {
    for (var bc = boxCol; bc < boxCol + 3; bc++) {
      if ((br !== row || bc !== col) && this.board[br][bc] === num) {
        var dup = false;
        for (var k = 0; k < conflicts.length; k++) {
          if (conflicts[k].row === br && conflicts[k].col === bc) {
            dup = true;
            break;
          }
        }
        if (!dup) {
          conflicts.push({ row: br, col: bc });
        }
      }
    }
  }

  return conflicts;
};

SudokuGame.prototype.checkComplete = function () {
  // Game already over → cannot complete
  if (this.isGameOver) return;

  // Check all cells filled
  for (var r = 0; r < 9; r++) {
    for (var c = 0; c < 9; c++) {
      if (this.board[r][c] === 0) {
        this.isComplete = false;
        return;
      }
    }
  }

  // Verify against solution
  for (var r2 = 0; r2 < 9; r2++) {
    for (var c2 = 0; c2 < 9; c2++) {
      if (this.board[r2][c2] !== this.solution[r2][c2]) {
        this.isComplete = false;
        return;
      }
    }
  }

  this.isComplete = true;
  this.pauseTimer();
};

SudokuGame.prototype.getSameNumberCells = function (row, col) {
  var num = this.board[row][col];
  var cells = [];

  if (num === 0) return cells;

  for (var r = 0; r < 9; r++) {
    for (var c = 0; c < 9; c++) {
      if ((r !== row || c !== col) && this.board[r][c] === num) {
        cells.push([r, c]);
      }
    }
  }

  return cells;
};


// ---------------------------------------------------------------------------
// 错误显示 (功能 1)
// ---------------------------------------------------------------------------

SudokuGame.prototype.errorStatus = function () {
  return this.errorCount + '/' + this.maxErrors;
};

// ---------------------------------------------------------------------------
// 计时器 (功能 2)
// ---------------------------------------------------------------------------

SudokuGame.prototype.startTimer = function () {
  if (this.timerRunning) return;
  var self = this;
  this.timerRunning = true;
  this.timerInterval = setInterval(function () {
    self.elapsedSeconds += 1;
  }, 1000);
};

SudokuGame.prototype.pauseTimer = function () {
  if (!this.timerRunning) return;
  this.timerRunning = false;
  clearInterval(this.timerInterval);
  this.timerInterval = null;
};

SudokuGame.prototype.resetTimer = function () {
  this.pauseTimer();
  this.elapsedSeconds = 0;
};

SudokuGame.prototype.getTimeString = function () {
  var mins = Math.floor(this.elapsedSeconds / 60);
  var secs = this.elapsedSeconds % 60;
  return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
};

// ---------------------------------------------------------------------------
// 智能数字键盘 (功能 3)
// ---------------------------------------------------------------------------

SudokuGame.prototype.getValidNumbers = function (row, col) {
  // Preset cells have no valid numbers
  if (this.isGiven(row, col)) return [];

  // Empty cell: collect numbers missing from row, column, box
  var seen = {};
  var r, c;

  // Row
  for (c = 0; c < 9; c++) {
    if (this.board[row][c] !== 0) seen[this.board[row][c]] = true;
  }
  // Column
  for (r = 0; r < 9; r++) {
    if (this.board[r][col] !== 0) seen[this.board[r][col]] = true;
  }
  // Box
  var boxRow = Math.floor(row / 3) * 3;
  var boxCol = Math.floor(col / 3) * 3;
  for (r = boxRow; r < boxRow + 3; r++) {
    for (c = boxCol; c < boxCol + 3; c++) {
      if (this.board[r][c] !== 0) seen[this.board[r][c]] = true;
    }
  }

  var valid = [];
  for (var n = 1; n <= 9; n++) {
    if (!seen[n]) valid.push(n);
  }
  return valid;
};

// ---------------------------------------------------------------------------
// 数字高亮 (功能 4)
// ---------------------------------------------------------------------------

SudokuGame.prototype.highlightNumber = function (n) {
  // Only set highlight when no cell is selected
  if (this.selectedCell) return;
  this.highlightedNumber = n;
};

SudokuGame.prototype.clearHighlight = function () {
  this.highlightedNumber = null;
};

SudokuGame.prototype.getNumberCells = function (n) {
  var cells = [];
  for (var r = 0; r < 9; r++) {
    for (var c = 0; c < 9; c++) {
      if (this.board[r][c] === n) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
};

// ---------------------------------------------------------------------------
// 自动存档/读档 (功能 5)
// ---------------------------------------------------------------------------

SudokuGame.prototype.saveGame = function () {
  var data = {
    difficulty: this.difficulty,
    board: this.board,
    notes: this.notes,
    errorCount: this.errorCount,
    elapsedSeconds: this.elapsedSeconds,
    notesMode: this.notesMode,
    isComplete: this.isComplete,
    isGameOver: this.isGameOver,
    initialPuzzle: this.initialPuzzle,
    solution: this.solution
  };
  try {
    localStorage.setItem('sudoku_save_' + this.difficulty, JSON.stringify(data));
  } catch (e) {
    // localStorage may be full or unavailable
  }
};

SudokuGame.loadGame = function (difficulty) {
  try {
    var raw = localStorage.getItem('sudoku_save_' + difficulty);
    if (!raw) return null;
    var data = JSON.parse(raw);
    return new SudokuGame(difficulty, 0, data);
  } catch (e) {
    return null;
  }
};

SudokuGame.clearSave = function (difficulty) {
  try {
    localStorage.removeItem('sudoku_save_' + difficulty);
  } catch (e) {
    // ignore
  }
};

SudokuGame.hasSave = function (difficulty) {
  try {
    return localStorage.getItem('sudoku_save_' + difficulty) !== null;
  } catch (e) {
    return false;
  }
};

// ---------------------------------------------------------------------------
// 内部辅助方法
// ---------------------------------------------------------------------------

SudokuGame.prototype._updateConflicts = function () {
  this.conflicts.clear();

  for (var r = 0; r < 9; r++) {
    for (var c = 0; c < 9; c++) {
      var num = this.board[r][c];
      if (num === 0) continue;

      var cellConflicts = this.checkConflict(r, c, num);
      if (cellConflicts.length > 0) {
        this.conflicts.add(r + '-' + c);
        for (var i = 0; i < cellConflicts.length; i++) {
          this.conflicts.add(cellConflicts[i].row + '-' + cellConflicts[i].col);
        }
      }
    }
  }
};

SudokuGame.prototype._bindKeyboard = function () {
  var self = this;

  document.addEventListener('keydown', function (e) {
    if (self.isGameOver) return;
    if (self.isComplete) return;

    var key = e.key;
    var sel = self.selectedCell;

    // Arrow keys
    if (key === 'ArrowUp' || key === 'ArrowDown' ||
        key === 'ArrowLeft' || key === 'ArrowRight') {
      e.preventDefault();

      if (!sel) {
        self.selectCell(0, 0);
        if (typeof render === 'function') render();
        return;
      }

      var newRow = sel.row;
      var newCol = sel.col;

      if (key === 'ArrowUp')    newRow = Math.max(0, sel.row - 1);
      if (key === 'ArrowDown')  newRow = Math.min(8, sel.row + 1);
      if (key === 'ArrowLeft')  newCol = Math.max(0, sel.col - 1);
      if (key === 'ArrowRight') newCol = Math.min(8, sel.col + 1);

      self.selectCell(newRow, newCol);
      if (typeof render === 'function') render();
      return;
    }

    // Number keys 1-9
    if (key >= '1' && key <= '9') {
      e.preventDefault();
      if (self.notesMode) {
        self.toggleNote(parseInt(key, 10));
      } else {
        self.inputNumber(parseInt(key, 10));
      }
      if (typeof render === 'function') render();
      return;
    }

    // N key: toggle notes mode
    if (key === 'n' || key === 'N') {
      e.preventDefault();
      self.toggleNotesMode();
      if (typeof render === 'function') render();
      return;
    }

    // Delete / Backspace
    if (key === 'Delete' || key === 'Backspace') {
      e.preventDefault();
      self.clearCell();
      if (typeof render === 'function') render();
      return;
    }
  });
};

// ---------------------------------------------------------------------------
// 暴露到全局 window
// ---------------------------------------------------------------------------

window.game = new SudokuGame('medium');
window.SudokuGame = SudokuGame;

window.selectCell = function (row, col) {
  window.game.selectCell(row, col);
  if (typeof render === 'function') render();
};

window.inputNumber = function (n) {
  var game = window.game;
  if (game.notesMode) {
    game.toggleNote(n);
  } else {
    game.inputNumber(n);
  }
  if (typeof render === 'function') render();
};

window.clearCell = function () {
  window.game.clearCell();
  if (typeof render === 'function') render();
};

window.newGame = function (difficulty) {
  var diff = difficulty || 'medium';
  if (!PUZZLES_BY_DIFFICULTY[diff]) diff = 'medium';
  var puzzles = PUZZLES_BY_DIFFICULTY[diff];
  var idx = Math.floor(Math.random() * puzzles.length);
  window.game = new SudokuGame(diff, idx);
  window.game.saveGame();
  if (typeof render === 'function') render();
};

window.toggleNotesMode = function () {
  window.game.toggleNotesMode();
  if (typeof render === 'function') render();
};

// ---------------------------------------------------------------------------
})();
// render() 占位函数 — HTML 加载后会重新定义此函数来更新 UI
// ---------------------------------------------------------------------------
function render() {}
