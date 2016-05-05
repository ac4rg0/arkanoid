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

function Brick(x, y, color) {
  this.color = color;
  Element.apply(this, [x, y, new Sprite('img/sprites.png', brick_coords[color], [16,8])]);
}

Brick.prototype = new Element();
Brick.prototype.constructor = Brick;

/*Brick.prototype = {
  draw: function(ctx) {
    //ctx.fillStyle = this.color;
    //ctx.strokeStyle = "#000000";
    //ctx.fillRect(this.x, this.y, ANCHURA_LADRILLO, ALTURA_LADRILLO);
    ctx.save();
    ctx.translate(this.x, this.y);
    this.sprite.render(ctx);
    ctx.restore();
  }
};*/
