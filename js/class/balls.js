function Ball(x, y, angle, v, diameter, sticky) {
  this.angle = angle;
  this.diameter = diameter;
  this.sticky = sticky;
  MovElement.apply(this, [x, y, null, v]);

  this.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.diameter / 2, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fillStyle = 'gray';
    ctx.fill();
  };

  this.move = function (x,y) {
    if (x === undefined || y === undefined) {
      incX = this.v * Math.cos(this.angle);
      incX = calcDistanceToMove(delta, incX);
      incY = this.v * Math.sin(this.angle);
      incY = calcDistanceToMove(delta, incY);
      this.x += incX;
      this.y -= incY;
    } else {
      this.x = x;
      this.y = y;
    }
  }
}

Ball.prototype = new MovElement();
Ball.prototype.constructor = Ball;
