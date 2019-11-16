var Game = {
  display: null, 
  options: { forceSquareRatio: false },

  init: function() {
    this.display = new ROT.Display(this.options);
    document.body.appendChild(this.display.getContainer());
    this._generateMap();
    this._drawWholeMap();

    var scheduler = new ROT.Scheduler.Simple();
    scheduler.add(this.player, true);
    scheduler.add(this.pedro, true);
    this.engine = new ROT.Engine(scheduler);
    this.engine.start();
  }
}
Game.map = {};
Game.player = null;
Game.pedro = null;
Game.engine = null;
Game.bananas = null;

var Pedro = function(x, y) {
  this._x = x;
  this._y = y;
  this._draw();
}
Pedro.prototype._draw = function() {
  Game.display.draw(this._x, this._y, "敌", "red");
}
Pedro.prototype.act = function() {
  var x = Game.player.getX();
  var y = Game.player.getY();
  var passableCallback = function(x, y) {
    return (x+","+y in Game.map);
  }
  var astar = new ROT.Path.AStar(x, y, passableCallback, {topology:4});
  var path = [];
  var pathCallback = function(x, y) {
    path.push([x, y]);
  }
  astar.compute(this._x, this._y, pathCallback);

  path.shift();
  if (path.length <= 1) {
    Game.engine.lock();
    alert("Game over - you were caught!");
  } else {
    x = path[0][0]
    y = path[0][1]
    Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
    this._x = x;
    this._y = y;
    this._draw();
  }
}

var Player = function(x, y) {
  this._x = x;
  this._y = y;
  this._draw();
}
Player.prototype.getX = function() { return this._x; }
Player.prototype.getY = function() { return this._y; }
Player.prototype._draw = function() {
  Game.display.draw(this._x, this._y, "我", "#0f0");
}
Player.prototype.act = function() {
  Game.engine.lock();
  window.addEventListener("keydown", this);
}
Player.prototype.handleEvent = function(e) {
  var keyMap = {};
  keyMap[75] = 0;   //k
  keyMap[85] = 1;   //u
  keyMap[76] = 2;   //l
  keyMap[78] = 3;   //n
  keyMap[74] = 4;   //j
  keyMap[66] = 5;   //b
  keyMap[72] = 6;   //h
  keyMap[89] = 7;   //y

  var code = e.keyCode;
  if (code == 13 || code == 32) {
    this._checkBox();
  } else if (!(code in keyMap)) {
    return;
  } else {
    var diff = ROT.DIRS[8][keyMap[code]];
    var newX = this._x + diff[0];
    var newY = this._y + diff[1];
    var newKey = newX + "," + newY;
    if (!(newKey in Game.map)) { return; } // check if pathable
    Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
    this._x = newX;
    this._y = newY;
    this._draw();
  }
  window.removeEventListener("keydown", this);
  Game.engine.unlock();
}
Player.prototype._checkBox = function() {
  var key = this._x + "," + this._y;
  if (Game.map[key] == "想") {
    alert("You wish this box had something!");
  } else if (Game.map[key] != "箱") {
    alert("There is no box here!");
  } else if (key == Game.bananas) {
    alert("Hooray! You found the bananas and won this game.");
    Game.engine.lock();
    window.removeEventListener("keydown", this);
  } else {
    alert("This box is empty :-(");
    Game.map[key] = "想";
  }
}

Game._generateMap = function() {
  var digger = new ROT.Map.Digger();
  var freeCells = [];

  var digCallback = function(x, y, value) {
    var key = x+","+y;
    if (value) { 
      //this.map[key] = "░";
    } else {
      this.map[key] = "·";
      freeCells.push(key);
    }
  }
  digger.create(digCallback.bind(this));
  this._generateBoxes(freeCells);
  this.player = this._createBeing(Player, freeCells);
  this.pedro = this._createBeing(Pedro, freeCells);
}

Game._generateBoxes = function(freeCells) {
  for (var i=0;i<10;i++) {
    var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
    var key = freeCells.splice(index, 1)[0];
    this.map[key] = "箱";
    if (!i) {this.bananas = key; }
  }
}
Game._createBeing = function(what, freeCells) {
  var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
  var key = freeCells.splice(index, 1)[0];
  var parts = key.split(",");
  var x = parseInt(parts[0]);
  var y = parseInt(parts[1]);
  return new what(x, y);
}

Game._drawWholeMap = function() {
  for (var key in this.map) {
    var parts = key.split(",");
    var x = parseInt(parts[0]);
    var y = parseInt(parts[1]);
    this.display.draw(x, y, this.map[key]);
  }
}
