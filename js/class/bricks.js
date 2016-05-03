// Only green, blue and white by the moment because
// they are the only with outline in black in the sprite
var brick_coords = {
  green:[15,7], 
  blue:[31,7],
  white:[47,7]
};

function Brick(x, y, color) {
  this.color = color;
  Element.apply(this, [x, y, new Sprite('img/sprites.png', brick_coords[color], [17,10])]);
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
