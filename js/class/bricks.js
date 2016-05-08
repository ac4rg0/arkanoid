var brick_coords = {
  red:    [0,0],
  yellow: [16,0],
  cyan:   [32,0],
  magenta:[48,0],
  orange: [0,8],
  green:  [16,8], 
  blue:   [32,8],
  white:  [48,8]
};

var brick_values = {
  red:    90,
  yellow: 120,
  cyan:   70,
  magenta:110,
  orange: 60,
  green:  80, 
  blue:   100,
  white:  50
};

function Brick(x, y, color) {
  this.color = color;
  this.value = brick_values[color];
  Element.apply(this, [x, y, new Sprite('img/sprites.png', brick_coords[color], [16,8])]);
}

Brick.prototype = new Element();
Brick.prototype.constructor = Brick;
