// Variables globales de utilidad
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var w = canvas.width;
var h = canvas.height;

var delta;

var NUM_LIVES = 3;
var TIME_CATCH = 60000; //60 sec bonus catch

/*
 * Check if the ball intersects with some brick
 * This function returns associative array [intersected, side_intersected]
 */
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

/*
 * Check if ball colides with Vaus
 */
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

/*
 * Check if two rectangles intersect among themselves
 */
function intersectRectangles(x0, y0, w0, h0, x1, y1, w1, h1){
  if (x0 + w0 < x1 || x1 + w1 < x0 || y0 + h0 < y1 || y1 + h1 < y0)
    return false;
  else
    return true;
}

/*
 * Check if ball colides with the walls and it changes the angle at which collided wall
 * Also return true if the ball colides in bottom wall otherwise false
 */
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

/* Calculate the distance to move according delta */
var calcDistanceToMove = function(delta, speed) {
  return speed * delta / 1000;
};

/* 
 * On load init the gameframework and start the game 
 */
window.onload = function init() {
  var game = new GF();
  game.start();
};

/*****************************************
*       GAME FRAMEWORK STARTS HERE       *
*****************************************/
var GF = function() {

  // vars for counting frames/s, used by the measureFPS function
  var frameCount = 0;
  var lastTime;
  var fpsContainer;
  var fps, oldTime = 0;

  var balls = [];
  var bricks = [];
  var bricksLeft;

  var lives = [];

  var highScore = 0;

  // vars for handling inputs
  var inputStates = {};

  // game states
  var gameStates = {
    gameRunning: 1,
    gameOver: 2,
    gameFinish: 3
  };

  var currentGameState = gameStates.gameRunning;

  // init Vaus (I think don't need a class for it)
  var paddle = {
    dead: false,
    x: 20,
    y: h - 30,
    width: 32,
    height: 8,
    sprite: new Sprite('img/sprites.png', [224,40], [32,8], 16, [0,1]),
    speed: 250, // pixels/s 
    sticky: true,
    shoot: false
  };

  var bonuses = [];
  var bonusCatch = false;
  var timeInitBonusCatch = 0;

  var lvls = [
    {
      bricks: brickslvl1, 
      life: new Sprite('img/sprites.png', [152,48], [16,8]),
      terrain: new Sprite('img/sprites.png', [0,80], [24,32])
    },
    {
      bricks: brickslvl2,
      life: new Sprite('img/sprites.png', [152,56], [16,8]),
      terrain: new Sprite('img/sprites.png', [48,80], [32,32])
    }
  ];

  var next_lvl = 0;

  /*
   * Load the next lvl if any, otherwise change the game state to finish
   */
  var load_lvl = function() {
    // Reset balls and bonuses
    balls = [];
    bonuses = [];
    bricks = [];

    // Check if the game is finished
    if (next_lvl < lvls.length) // there are still levels
      draw_lvl(lvls[next_lvl]);
    else // the end
      currentGameState = gameStates.gameFinish;
  }

  /*
   * Create bricks, terrain and life sprite needed for the level got by parameter
   * and draw background
   */
  function draw_lvl(next_lvl) {
    
    initTerrain(next_lvl['terrain']);
    initLives(next_lvl['life']);
    
    // Crea el array de ladrillos
    var manyBricks = next_lvl['bricks'];
    for (b in manyBricks) {
      bricks.push(new Brick(manyBricks[b].x, manyBricks[b].y, manyBricks[b].c));
    }
    //bricks.push(new Brick(manyBricks[4].x, manyBricks[4].y, manyBricks[4].c));
    //bricks.push(new Brick(manyBricks[6].x, manyBricks[6].y, manyBricks[6].c));
    //bricks.push(new Brick(manyBricks[5].x, manyBricks[5].y, manyBricks[5].c));

    // update bricksLeft
    bricksLeft = bricks.length;
  }

  /*
   * Draw all bricks needed for the first level
   */
  var drawBricks = function() {
    for (b in bricks) {
      bricks[b].draw(ctx);
    }
  };

  /*
   * Measures FPS and display it in the fpsContainer
   */
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

  /*
   * Clear the canvas
   */
  function clearCanvas() {
    ctx.rect(0,0,w,h);
    ctx.fillStyle = terrainPattern;
    ctx.fill();
  }

  /*
   * Bonus types
   */
  var bonusType = [
    {
      type: 'C', 
      sprite: new Sprite('img/sprites.png', [224,0], [16,8], 0.5, [0,1,2,3])
    },
    {
      type: 'P',
      sprite: new Sprite('img/sprites.png', [544,0], [16,8], 0.5, [0,1,2,3])
    }
  ]

  /*
   * Manage bonus (probability and so)
   */
  function dropBonus(x,y) {
    if (Math.random() * 100 < 5){ // 5%
      if (x + 16 > w) x = w - 16; // Fit right
      else if (x - 16 < 0) x = 0; // Fit left

      var bType = bonusType[Math.floor(Math.random() * 2)];
      
      bonuses.push(new Bonus(x, y, bType.type, bType.sprite, 16, 8));
    }
  }

  /* 
   * Check if the ball colides with a brick
   */
  function testBrickCollision(ball) {
    var inter;
    for (var b = bricks.length - 1; b >= 0; b--) {
      inter = intersects(bricks[b].x, bricks[b].y, bricks[b].x + ANCHURA_LADRILLO, bricks[b].y + ALTURA_LADRILLO, ball.x, ball.y, ball.diameter / 2);
      if (inter.c) {
        //console.log('Intersect: ' + inter.c);
        //console.log('Side: ' + inter.d);
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
        ball.v += 0.5; // 120 ladrillos por nivel

        // add score
        //console.log(bricks[b].value);
        highScore += bricks[b].value;
        
        // remove brick
        bricks.splice(b, 1);
        bricksLeft--;
        
        dropBonus(ball.x,ball.y);

        // play sound "touch brick"
        sound.play('brick');
      }
    }
    // devuelve el número de ladrillos que quedan
    return bricksLeft;
  }

  /*
   * Draw the Vaus
   */
  function drawVaus(x, y) {
    ctx.save();
    ctx.translate(x,y);
    paddle.sprite.render(ctx);
    ctx.restore();
  }

  /*
   * Display remaining lives
   */
  function displayLives() {
    for(var i = 0; i < lives.length; i++){
      lives[i].draw(ctx);
    }
  }

  /*
   * Display current level
   */
  function displayLevel() {
    ctx.font = "bold 10pt calibri";
    ctx.fillStyle = '#ff0000';
    ctx.fillText("LEVEL", w/12, 10);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(next_lvl + 1, w/12 + 40, 10);
  }

  /*
   * Display highscore
   */
  function displayHighscore() {
    ctx.font = "bold 10pt calibri";
    ctx.fillStyle = "#ff0000";
    ctx.fillText("HIGH SCORE", w/3, 10);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(highScore, w - w/3, 10);
  }

  /*
   * Update the position of the Vaus
   */
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
      else 
        paddle.sticky = false;
    }
  };
  
  // Distance between Vaus and ball (allow move Vaus and ball at the same time)
  var ballVausXDistance;

  /*
   * Update the move of the ball
   * check if the ball loss
   * apply effect if necessary
   * and draw the ball
   * (It also takes into aware whether the bonus is activated)
   */
  function updateBalls() {
    //console.log("Distance init: " + ballVausXDistance);
    for (var i = balls.length - 1; i >= 0; i--) {
      var ball = balls[i];
      if (ball.sticky) {
        if (!paddle.sticky ) {
          ball.sticky = false;
          ball.move();
        } else
          ball.move(paddle.x + ballVausXDistance, paddle.y - paddle.height/2 + 1);
      }

      // Test if the paddle collides
      if (circRectsOverlap(paddle.x, paddle.y, paddle.width, paddle.height, ball.x, ball.y, ball.diameter / 2)){
        
        // If bonus catch is active
        if (bonusCatch) {
          ball.sticky = true;
          ballVausXDistance = ball.x - paddle.x;
          //console.log("Paddle: " + paddle.x);
          //console.log("Ball: " + ball.x);
          //console.log("Difference: " + ballVausXDistance);
        } else {
          ball.sticky = false;
        }
        
        // If ball isn't sticky
        if (!ball.sticky) {
          // Play sound "touch vaus"
          sound.play('vaus'); 
          // Spin effect
          if (inputStates.right)
            ball.angle = ball.angle * (ball.angle < 0 ? 0.5 : 1.5);
          else if (inputStates.left)
            ball.angle = ball.angle * (ball.angle > 0 ? 0.5 : 1.5);
          else
            ball.angle = -ball.angle;
          ball.move();
        } else {
          // Play sound "touch vaus"
          sound.play('vaus'); 

          ball.angle = -ball.angle;
          ball.move(ball.x, ball.y);
        }
        //console.log("collision");
      } else {

        // test if ball collides with any brick
        bricksLeft = testBrickCollision(ball);

        // if ball falls bottom
        var die = testCollisionWithWalls(ball, w, h);

        // Loss ball
        if (die) {
          balls.splice(i, 1);
          if (balls.length == 0) {
            lives.pop();
          }
          paddle.dead = true;
        }

        ball.move();
        //console.log("no collision");
      }
        //console.log("Bonus Catch: " + bonusCatch);
        //console.log("Paddle sticky: " + paddle.sticky);
    }
    ball.draw(ctx);
  }

  /*
   * Move and draw bonus if any
   * Also check if the effect of a bonus has already finished
   */
  function updateBonus() {
    for (var i = bonuses.length - 1; i >= 0; i--) {
      var bonus = bonuses[i];
      bonus.move();
      if (intersectRectangles(paddle.x, paddle.y, paddle.width, paddle.height, bonus.x, bonus.y, bonus.w, bonus.h)){
        //console.log("Bonus activo");
        applyEffectBonus(bonus.type);
        bonuses.splice(i,1);
      } else{
        bonus.draw(ctx);
      }
    }

    // Check bonus Catch has finished
    if (timerCatch(new Date().getTime())) {
      bonusCatch = false;
    } else {
      paddle.sticky = true;
    }
  }
  
  /*
   * Apply the bonus effect
   */
  function applyEffectBonus(bonusType) {
    switch(bonusType) {
      case 'C': // Catch: Catch ability
        paddle.sticky = true;
        /*for (var i = balls.length - 1; i >= 0; i--)
          balls[i].sticky = true;*/
        bonusCatch = true;
        // Save initial time to count time effect
        timeInitBonusCatch = new Date().getTime();
        // Play sound bonus effect
        sound.play('bCatch');
        break;
      case 'P': // Player: extra Vaus (7 lives max)
        if (lives.length < 7) {
          // Get the last life in array
          var lifeModel = lives[lives.length - 1];
          // Create a new life mofifying the measures the lifeModel
          lives[lives.length] = new Life(lifeModel.x + lifeModel.sprite.size[0] + 1, lifeModel.y, lifeModel.sprite);
          // Play sound bonus effect
          sound.play('extraLife');
        }
        break;
      case 'D': // Disruption: ball split into three instances of itself
        // TODO
        break;
      case 'B': // Break: Advance to the next stage and earn 10000 points
        // TODO
        break;
    }
  }

  /*
   * Calculate the ms between frames
   */
  function timer(currentTime) {
    var aux = currentTime - oldTime;
    oldTime = currentTime;
    return aux;

  }

  /*
   * Calculate elapsed ms for the bonusCatch
   * return true if TIME_CATCH elapsed
   */
  function timerCatch(currentTime) {
    //console.log(currentTime - timeInitBonusCatch);
    return TIME_CATCH <= (currentTime - timeInitBonusCatch);
  }

  /*
   * Manage the loss of a life in the game
   */
  var manageLives = function(){
    if (paddle.dead) {
      if (lives.length > 0) {
        ballVausXDistance = paddle.width / 2;
        var b = new Ball(paddle.x + ballVausXDistance, paddle.y - paddle.height/2 + 1, Math.PI / 3, 100, 6, true);
        balls.push(b);
        paddle.dead = false;
        paddle.sticky = true;
        // Remove bonus effects
        bonusCatch = false;
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

      // move and draw bonus if any
      updateBonus();

      // draw Vaus
      drawVaus(paddle.x, paddle.y);

      // dibujar ladrillos
      drawBricks();

      displayLives();

      displayHighscore();

      displayLevel();

      // load new lvl if there are no longer bricks
      if (bricksLeft === 0) {
        clearCanvas();
        next_lvl++;
        load_lvl();
        balls.push(new Ball(paddle.x + paddle.width/2, paddle.y - paddle.height/2 + 1, Math.PI / 3, 100, 6, true));
        paddle.sticky = true;
        //startNewGame(); // Reset balls, bonuses and so
      }

      // call the animation loop every 1/60th of second
      requestAnimationFrame(mainLoop);
    } else if (currentGameState === gameStates.gameOver) { // Game over
      clearCanvas();
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h);
      ctx.font = "25px Helvetica";
      ctx.fillStyle = '#ffffff';
      ctx.fillText("Game Over", w / 5, h / 2);
    } else if (currentGameState === gameStates.gameFinish) {
      clearCanvas();
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h);
      ctx.font = "25px Helvetica";
      ctx.fillStyle = '#ffffff';
      ctx.fillText("YOUR", w / 2 - 40, h / 6);
      ctx.fillText("HIGHSCORE", w / 2 - 75, h / 3);
      ctx.fillText(highScore, w / 3, h / 2 + 20);
    }
  }

  /*
   * Main loop of the game
   */
  var mainLoop = function(time) {
    //main function, called each frame 
    measureFPS(time);

    // number of ms since last frame draw
    delta = timer(time);

    // Clear the canvas
    clearCanvas();

    // Manage lives
    manageLives();

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
    music.play();
  }

  /*
   * Initialize image background game
   */
  function initTerrain(terrain){
    terrainPattern = ctx.createPattern(terrain.image(), 'repeat');
  }

  /*
   * Initialize lives and load their sprite according to the level
   */
  function initLives(lifeSprite) {
    if (lives.length > 0) { // Load sprite lives in the rest of levels
      for(var i = 0; i < lives.length; i++) {
        lives[i].sprite = lifeSprite;
      }
    } else { // Load sprite lives in the lvl 1
      for(var i = 0; i < NUM_LIVES; i++) {
        if (i === 0)
          lives[i] = new Life(5, h - 10, lifeSprite);
        else
          lives[i] = new Life(5 + 16 * i + 1 * i, h - 10, lifeSprite);
      }
    }
  }

  /*
   * Initialize the game elements (ball, bricks)
   */
  function startNewGame(){
    ballVausXDistance = paddle.width / 2;
    load_lvl();
    balls.push(new Ball(paddle.x + paddle.width/2, paddle.y - paddle.height/2 + 1, Math.PI / 3, 100, 6, true));
    music.play();
    //highScore = 0;
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
        brick: [20500,1500],
        bCatch: [1000, 2000],
        extraLife: [21900, 2000]
      },
    });
  }

  /*
   * Prepare low layer of the game
   */
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
