function Life(x, y, sprite) {
  Element.apply(this, [x, y, sprite]);  
}

Life.prototype = new Element();
Life.prototype.constructor = Life;
