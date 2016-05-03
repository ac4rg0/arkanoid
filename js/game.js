// Variables globales de utilidad
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var w = canvas.width;
var h = canvas.height;
// var x = 130,
//  y = 135; // posición inicial de Vaus
var delta;
var ANCHURA_LADRILLO = 20, 
    ALTURA_LADRILLO = 10;

// var frames = 30;

function intersects(left, up, right, bottom, cx, cy, radius) {
  var closestX = (cx < left ? left : (cx > right ? right : cx));
  var closestY = (cy < up ? up : (cy > bottom ? bottom : cy));
  var dx = closestX - cx;
  var dy = closestY - cy;
  var side;

  var dt = Math.abs(up - cy);
  var db = Math.abs(bottom - cy);
  var dr = Math.abs(right - cx);
  var dl = Math.abs(left - cx);
  var dm = Math.min(dt, db, dr, dl);
  switch (dm) {
    case dt:
      side = "top";
      break;
    case db:
      side = "bottom";
      break;
    case dr:
      side = "right";
      break;
    case dl:
      side = "left";
      break;
  }

  return result = {
    c: (dx * dx + dy * dy) <= radius * radius,
    d: side
  };
}

// Collisions between rectangle and circle
function circRectsOverlap(x0, y0, w0, h0, cx, cy, r) {
  var testX = cx;
  var testY = cy;

  if (testX < x0)
    testX = x0;
  if (testX > (x0 + w0))
    testX = (x0 + w0);
  if (testY < y0)
    testY = y0;
  if (testY > (y0 + h0))
    testY = (y0 + h0);

  return (((cx - testX) * (cx - testX) + (cy - testY) * (cy - testY)) < r * r);
}

function testCollisionWithWalls(ball, w, h) {
  if (ball.x - ball.diameter / 2 <= 0 || ball.x + ball.diameter / 2 >= w) {
    ball.angle = -ball.angle + Math.PI;
    return false;
  } else if (ball.y - ball.diameter / 2 <= 0) {
    ball.angle = -ball.angle;
    return false;
  } else if (ball.y + ball.diameter / 2 >= h) {
    return true;
  }
}

// función auxiliar
var calcDistanceToMove = function(delta, speed) {
  return speed * delta / 1000;
};

function Ball(x, y, angle, v, diameter, sticky) {
  this.x = x;
  this.y = y;
  this.angle = angle;
  this.v = v;
  this.diameter = diameter;
  this.sticky = sticky;
  this.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.diameter / 2, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fillStyle = 'gray';
    ctx.fill();
  };

  this.move = function(x, y) {
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
      this.angle = angle;
      this.v = v;
      this.diameter = diameter;
      this.sticky = sticky;
    }
  };
}

function Bonus () {
  // Hard-coded
  this.type = 'C'; 
  this.x = 50;
  this.y = 50;
  this.width = 16;
  this.height = 8;
  this.speed = 80;
  this.sprite = new Sprite('img/sprites.png', [224,0], [16,8], 0.5, [0,1,2,3]);
}

Bonus.prototype = {
  draw: function(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    this.sprite.render(ctx);
    ctx.restore();
  },
  move: function() {
    this.sprite.update(delta);
    this.y += calcDistanceToMove(delta, this.speed);
  }
};

// Inits
window.onload = function init() {
  var game = new GF();
  game.start();
};


// GAME FRAMEWORK STARTS HERE
var GF = function() {

  // vars for counting frames/s, used by the measureFPS function
  var frameCount = 0;
  var lastTime;
  var fpsContainer;
  var fps, oldTime = 0;

  //  var speed = 300; // px/s 
  //  var vausWidth = 30,   vausHeight = 10;

  var balls = [];
  var bricks = [];
  var bricksLeft;

  var lifes = 3;

  // vars for handling inputs
  var inputStates = {};

  // game states
  var gameStates = {
    gameRunning: 1,
    gameOver: 2
  };

  var currentGameState = gameStates.gameRunning;

  // VAUS en objeto literal 
  var paddle = {
    dead: false,
    x: 10,
    y: 130,
    width: 32,
    height: 8,
    sprite: new Sprite('img/sprites.png', [224,40], [32,8], 16, [0,1]),
    speed: 250, // pixels/s 
    sticky: true,
    shoot: false
  };

  var ladrillos = [
    // grey
    {
      x: 20,
      y: 20,
      c: 'green'
    }, {
      x: (20 * 2 + ANCHURA_LADRILLO),
      y: 20,
      c: 'blue'
    }, {
      x: 20 * 3 + ANCHURA_LADRILLO * 2,
      y: 20,
      c: 'white'
    }, {
      x: 20 * 4 + ANCHURA_LADRILLO * 3,
      y: 20,
      c: 'blue'
    }, {
      x: 20 * 5 + ANCHURA_LADRILLO * 4,
      y: 20,
      c: 'green'
    },
    // red
    {
      x: 20,
      y: 42,
      c: 'green'
    }, {
      x: 20 * 2 + ANCHURA_LADRILLO,
      y: 42,
      c: 'white'
    }, {
      x: 20 * 3 + ANCHURA_LADRILLO * 2,
      y: 42,
      c: 'blue'
    }, {
      x: 20 * 4 + ANCHURA_LADRILLO * 3,
      y: 42,
      c: 'white'
    }, {
      x: 20 * 5 + ANCHURA_LADRILLO * 4,
      y: 42,
      c: 'green'
    }
  ];

  var bonuses = [];

  var createBricks = function() {
    // Crea el array de ladrillos
    for (b in ladrillos) {
      bricks.push(new Brick(ladrillos[b].x, ladrillos[b].y, ladrillos[b].c));
    }
    // actualiza bricksLeft
    bricksLeft = bricks.length;
  }

  var drawBricks = function() {
    for (b in bricks) {
      bricks[b].draw(ctx);
    }
  };

  var measureFPS = function(newTime) {
    // test for the very first invocation
    if (lastTime === undefined) {
      lastTime = newTime;
      return;
    }

    //calculate the difference between last & current frame
    var diffTime = newTime - lastTime;

    if (diffTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = newTime;
    }

    //and display it in an element we appended to the 
    // document in the start() function
    fpsContainer.innerHTML = 'FPS: ' + fps;
    frameCount++;
  };

  // clears the canvas content
  function clearCanvas() {
    ctx.rect(0,0,w,h);
    ctx.fillStyle = terrainPattern;
    ctx.fill();
  }

  function testBrickCollision(ball) {
    var inter;
    for (var b = bricks.length - 1; b >= 0; b--) {
      inter = intersects(bricks[b].x, bricks[b].y, bricks[b].x + ANCHURA_LADRILLO, bricks[b].y + ALTURA_LADRILLO, ball.x, ball.y, ball.diameter / 2);
      if (inter.c) {
        switch (inter.d) {
          case 'top':
            ball.angle = -ball.angle;
            break;
          case 'left':
            ball.angle = -ball.angle + Math.PI;
            break;
          case 'right':
            ball.angle = -ball.angle + Math.PI;
            break;
          case 'bottom':
            ball.angle = -ball.angle;
            break;
        }
        // increse speed
        ball.v += 1/bricksLeft * ball.v;
        // remove brick
        bricks.splice(b, 1);
        bricksLeft--;
        // play sound "touch brick"
        sound.play('brick');
      }
    }
    // devuelve el número de ladrillos que quedan
    return bricksLeft;
  }

  // Función para pintar la raqueta Vaus
  function drawVaus(x, y) {

    //ctx.fillStyle = "#000000";
    //ctx.strokeStyle = "#000000";
    //ctx.rect(x, y, paddle.width, paddle.height);
    ctx.save();
    ctx.translate(x,y);
    paddle.sprite.render(ctx);
    ctx.restore();
  }

  function displayLifes() {
    ctx.font = "15px Arial";
    //ctx.textAlign = "right";
    ctx.fillStyle = '#ff0000';
    ctx.fillText(lifes, w - 12, 15);
  }

  var updatePaddlePosition = function() {

    paddle.sprite.update(delta);
    var incX = Math.ceil(calcDistanceToMove(delta, paddle.speed));
    if (inputStates.left) {
      paddle.x = paddle.x - incX;
      if (paddle.x <= 0)
        paddle.x = 0;
    } else if (inputStates.right) {
      paddle.x = paddle.x + incX;
      if ((paddle.x + paddle.width) >= w)
        paddle.x = w - paddle.width;
    } else if (inputStates.space) {
      if (paddle.shoot) 
        console.log("Pew pew");
      else{
        paddle.sticky = false;
      }
    }
  };


  function updateBalls() {
    for (var i = balls.length - 1; i >= 0; i--) {
      var ball = balls[i];
      if (!ball.sticky){
        ball.move();

        var die = testCollisionWithWalls(ball, w, h);

        // Loss ball
        if (die) {
          balls.splice(i, 1);
          if (balls.length == 0) {
            lifes--;
          }
          paddle.dead = true;
        }

        // test if ball collides with any brick
        bricksLeft = testBrickCollision(ball);

        // Test if the paddle collides
        if (circRectsOverlap(paddle.x, paddle.y, paddle.width, paddle.height, ball.x, ball.y, ball.diameter / 2)){
          // Play sound "touch vaus"
          sound.play('vaus');
          // Spin effect
          if (inputStates.right)
            ball.angle = ball.angle * (ball.angle < 0 ? 0.5 : 1.5);
          else if (inputStates.left)
            ball.angle = ball.angle * (ball.angle > 0 ? 0.5 : 1.5);
          else
            ball.angle = -ball.angle;
        }
      } else {
        if (!paddle.sticky) {
          ball.sticky = false;
        } else {
          ball.move(paddle.x + paddle.width/2, paddle.y - paddle.height/2 + 1);
        }
      }
      ball.draw(ctx);
    }
  }

  /*
   * move and draw bonus if any
   */
  function updateBonus() {
    for (var i = bonuses.length - 1; i >= 0; i--) {
      var bonus = bonuses[i];
      bonus.move();
      bonus.draw(ctx);
    }
  }
    
  function timer(currentTime) {
    var aux = currentTime - oldTime;
    oldTime = currentTime;
    return aux;

  }

  /*
   * Manage the loss of a life in the game
   */
  var manageLifes = function(){
    if (paddle.dead) {
      if (lifes > 0) {
        var b = new Ball(paddle.x + paddle.width/2, paddle.y - paddle.height/2 + 1, Math.PI / 3, 100, 6, true);
        balls.push(b);
        paddle.dead = false;
        paddle.sticky = true;
        music.play();
      } else {
        currentGameState = gameStates.gameOver;
      }
    }
  }

  /*
   * Manage the game cycle
   */
  var manageGameCycle = function(){
    if (currentGameState === gameStates.gameRunning) {

      // Mover Vaus de izquierda a derecha
      updatePaddlePosition();

      updateBalls();

      // draw Vaus
      drawVaus(paddle.x, paddle.y);

      // dibujar ladrillos
      drawBricks();

      displayLifes();

      // move and draw bonus if any
      updateBonus();

      // call the animation loop every 1/60th of second
      requestAnimationFrame(mainLoop);
    } else if (currentGameState === gameStates.gameOver) { // Game over
      clearCanvas();
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h);
      ctx.font = "25px Helvetica";
      ctx.fillStyle = '#ffffff';
      ctx.fillText("Game Over", w / 5, h / 2);
    }
  }

  var mainLoop = function(time) {
    //main function, called each frame 
    measureFPS(time);

    // number of ms since last frame draw
    delta = timer(time);

    // Clear the canvas
    clearCanvas();

    // Manage lifes
    manageLifes();

    // Manage if the game is over, if not go on
    manageGameCycle();

  };

  /* 
   * Init listeners to manage key events for space, left and right.
   * This update inputStates var.
   */
  var inicializarGestorTeclado = function(){

    function keyDownFunction(e) {
      if (e.keyCode == 37) {
        inputStates.left = true;
      } else if (e.keyCode == 39) {
        inputStates.right = true;
      } else if (e.keyCode == 32) {
        inputStates.space = true;
      }
    }

    function keyUpFunction(e) {
      if (e.keyCode == 37) {
        inputStates.left = false;
      } else if (e.keyCode == 39) {
        inputStates.right = false;
      } else if (e.keyCode == 32) {
        inputStates.space = false;
      }
    }
    
    document.addEventListener("keydown", keyDownFunction, false);
    document.addEventListener("keyup", keyUpFunction, false);
  }

  /*
   * Initialize a new game
   */
  function init() {
    loadAssets(startNewGame);
    //startNewGame();
    music.play();
  }

  /*
   * Initialize image backgroud game
   */
  function initTerrain(){
    terrain = new Sprite('img/sprites.png', [0,80], [24,32]);
    terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
  }

  /*
   * Initialize the game elements (ball, bricks)
   */
  function startNewGame(){
    initTerrain();
    balls.push(new Ball(paddle.x + paddle.width/2, paddle.y - paddle.height/2 + 1, Math.PI / 3, 100, 6, true));
    createBricks();
    bonuses.push(new Bonus());
  }
  
  /*
   * Load pieces of sound, start new game and start animation
   */
  function loadAssets(callback) {
    // Load sound asynchronously using howler.js
    music = new Howl({
      urls: ['audio/game_start.ogg'],
      volume: 1,
      onload: function() {
        callback();
        // Start the animation
        requestAnimationFrame(mainLoop);
      }
    }); //new Howl

    sound = new Howl({
      urls: ['audio/sounds.mp3'],
      volume: 1,
      sprite: {
        vaus: [16600,1650],
        brick: [20500,1500]
      },
    });
  }

  var start = function() {
    // adds a div for displaying the fps value
    fpsContainer = document.createElement('div');
    document.body.appendChild(fpsContainer);

    inicializarGestorTeclado();

    // Load sprites file
    resources.load([
      'img/sprites.png'
    ]);
    // callback to init when the load finishes
    resources.onReady(init);
  };

  //our GameFramework returns a public API visible from outside its scope
  return {
    start: start
  };
};
