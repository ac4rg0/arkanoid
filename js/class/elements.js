function Element(x, y, sprite) {
  this.x = x;
  this.y = y;
  this.sprite = sprite;
}

Element.prototype.draw = function (ctx) {
  ctx.save();
  ctx.translate(this.x, this.y);
  this.sprite.render(ctx);
  ctx.restore();
}
