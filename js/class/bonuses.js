//function Bonus(x, y, sprite, v, type, width, height) {
function Bonus() {
  /*this.type = type;
  this.w = width;
  this.h = height;
  Element.apply(this, [x, y, sprite, v]);*/

  this.type = 'C';
  this.w = 16;
  this.h = 8;
  sprite = new Sprite('img/sprites.png', [224,0], [16,8], 0.5, [0,1,2,3]);
  MovElement.apply(this, [50, 50, sprite, 80]);
}

Bonus.prototype = new MovElement();
Bonus.prototype.constructor = Bonus;

