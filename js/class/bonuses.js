//function Bonus(x, y, sprite, v, type, width, height) {
function Bonus(x,y, type, sprite ,width, height) {
  this.type = type;
  this.sprite = sprite;
  this.w = width;
  this.h = height;
  MovElement.apply(this, [x, y, sprite, 80]);
}

Bonus.prototype = new MovElement();
Bonus.prototype.constructor = Bonus;

