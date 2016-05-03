function MovElement(x, y, sprite, v) {
  this.v = v;
  Element.apply(this, [x, y, sprite]);
}

MovElement.prototype = new Element();
MovElement.prototype.constructor = MovElement;

MovElement.prototype.move = function() {
  this.sprite.update(delta);
  this.y += calcDistanceToMove(delta, this.v);
}
