let initialx, initialy;
let xv, yv_init;
let t;
let windInput, gravityInput, angleInput, velocityInput, myInput, targetInput;
let runButton, pauseButton, lineButton, resetTargetButton, moveTargetButton, toggleCastleButton, modelSelect, dragInput;
let barrel;
let angle;
let maxHeightH = 0;
let maxHeightX_canvas = 0;
let SCALE = 5;
let BASE_SCALE = 5;
let LAUNCH_PX = 245;
let makeline = false;
let lineX = 0, lineY = 0;
let shot = "no";
let paused = false;
let x = 0, h = 0;
let trail = [];

let barrelKick = 0;
let explosions = [];
let castlePieces = [];
let castle;
let castleHit = false;
let castleVisible = true;
let dragCoefficient = 0;
let predictedRange = 0;
let flightDuration = 0;
let previousX = 0;
let previousH = 0;

let CANNON_BASE_X = 195;
let CANNON_PIVOT_Y_M = 4;
let BARREL_LENGTH_M = 10;
let BARREL_THICKNESS_M = 2;
let LAUNCH_OFFSET_M = 1;
let CANNON_MIN_VISUAL_SCALE = 1.1;
let CANNON_MAX_VISUAL_SCALE = 3.0;

function setup() {
  createCanvas(1400, 700);
  frameRate(240);

  velocityInput = createInput("20");
  velocityInput.position(10, 118);
  velocityInput.size(44, 18);

  angleInput = createInput("35");
  angleInput.position(10, 146);
  angleInput.size(44, 18);

  windInput = createInput("0");
  windInput.position(10, 174);
  windInput.size(44, 18);

  gravityInput = createInput("9.8");
  gravityInput.position(10, 202);
  gravityInput.size(44, 18);

  dragInput = createInput("0.02");
  dragInput.position(10, 230);
  dragInput.size(44, 18);

  modelSelect = createSelect();
  modelSelect.position(62, 254);
  modelSelect.size(76, 20);
  modelSelect.option("Ideal", "ideal");
  modelSelect.option("Air drag", "drag");

  myInput = createInput();
  myInput.position(10, 294);
  myInput.size(44, 18);

  targetInput = createInput("50,0");
  targetInput.position(10, 357);
  targetInput.size(44, 18);

  lineButton = createButton("ADD LINE");
  lineButton.position(62, 294);
  lineButton.size(70, 20);
  lineButton.mousePressed(toggleLine);

  moveTargetButton = createButton("MOVE CASTLE");
  moveTargetButton.position(10, 386);
  moveTargetButton.size(103, 22);
  moveTargetButton.mousePressed(moveCastle);

  resetTargetButton = createButton("RESET CASTLE");
  resetTargetButton.position(10, 411);
  resetTargetButton.size(108, 22);
  resetTargetButton.mousePressed(resetCastle);

  toggleCastleButton = createButton("TOGGLE CASTLE");
  toggleCastleButton.position(10, 436);
  toggleCastleButton.size(112, 22);
  toggleCastleButton.mousePressed(toggleCastle);

  pauseButton = createButton("Pause");
  pauseButton.position(8, height - 42);
  pauseButton.size(82, 22);
  pauseButton.mousePressed(togglePause);

  runButton = createButton("Run");
  runButton.position(98, height - 42);
  runButton.size(42, 22);
  runButton.mousePressed(toggleRun);

  styleMenuControls();
  resetCastle();

  barrel = {
    angle: 0,

    draw: function () {
      let g = getCannonGeometry(this.angle);
      let a = g.angle;
      let s = g.visualScale;

      let kickX = -barrelKick * cos(radians(a)) * s;
      let kickY = barrelKick * sin(radians(a)) * s;

      let baseY = groundY() - 2.4 * s;
      let wheelR = 0.85 * s;

      fill(82);
      noStroke();
      rect(g.pivotX - 2.4 * s, baseY, 8.6 * s, 1.8 * s, 1);

      fill(95);
      triangle(
        g.pivotX - 1.3 * s,
        baseY,
        g.pivotX + 2.4 * s,
        baseY,
        g.pivotX,
        g.pivotY + 0.2 * s
      );

      stroke(55);
      strokeWeight(max(1, 0.3 * s));
      line(g.pivotX, g.pivotY, g.pivotX + 1.3 * s, baseY);
      noStroke();

      fill(0);
      circle(g.pivotX - 0.3 * s, groundY() - wheelR, wheelR * 2);
      circle(g.pivotX + 5.0 * s, groundY() - wheelR, wheelR * 2);

      fill(170);
      circle(g.pivotX - 0.3 * s, groundY() - wheelR, wheelR * 0.75);
      circle(g.pivotX + 5.0 * s, groundY() - wheelR, wheelR * 0.75);

      push();
      translate(g.pivotX + kickX, g.pivotY + kickY);
      rotate(radians(-a));
      fill(125);
      noStroke();
      rect(
        0,
        -BARREL_THICKNESS_M * s,
        BARREL_LENGTH_M * s,
        BARREL_THICKNESS_M * s,
        1
      );
      pop();

      fill(255, 215, 0);
      noStroke();
      circle(g.pivotX + kickX, g.pivotY + kickY, max(4, 0.8 * s));

      barrelKick *= 0.88;
      if (barrelKick < 0.02) barrelKick = 0;
    }
  };
}

function styleMenuControls() {
  let inputs = [velocityInput, angleInput, windInput, gravityInput, myInput, targetInput, dragInput];

  for (let input of inputs) {
    input.style("box-sizing", "border-box");
    input.style("border", "1px solid #879487");
    input.style("border-radius", "4px");
    input.style("padding", "0 3px");
    input.style("font-size", "10px");
    input.style("height", "18px");
    input.style("background", "#ffffff");
    input.style("color", "#111");
  }

  modelSelect.style("font-size", "10px");
  modelSelect.style("background", "#fff");
  modelSelect.style("border", "1px solid #879487");
  modelSelect.style("border-radius", "4px");

  let buttons = [lineButton, moveTargetButton, resetTargetButton, toggleCastleButton, pauseButton, runButton];

  for (let button of buttons) {
    button.style("box-sizing", "border-box");
    button.style("background", "#3f8f55");
    button.style("color", "#fff");
    button.style("border", "0");
    button.style("border-radius", "4px");
    button.style("padding", "0");
    button.style("font-size", "10px");
    button.style("font-weight", "700");
    button.style("line-height", "22px");
    button.style("cursor", "pointer");
  }

  resetTargetButton.style("background", "#2f6f48");
  lineButton.style("font-size", "8px");
  lineButton.style("line-height", "20px");
  pauseButton.style("background", "#4d7fbb");
  runButton.style("background", "#2b9b4b");
}

function groundY() {
  return height - 15;
}

function screenX(meters) {
  return LAUNCH_PX + meters * SCALE;
}

function screenY(meters) {
  return groundY() - meters * SCALE;
}

function getCannonVisualScale() {
  return constrain(SCALE, CANNON_MIN_VISUAL_SCALE, CANNON_MAX_VISUAL_SCALE);
}

function getCannonGeometry(a) {
  a = constrain(a, 0, 90);

  let visualScale = getCannonVisualScale();
  let pivotX = CANNON_BASE_X;
  let pivotY = groundY() - CANNON_PIVOT_Y_M * visualScale;

  let tipX = pivotX + BARREL_LENGTH_M * visualScale * cos(radians(a));
  let tipY =
    pivotY -
    BARREL_LENGTH_M * visualScale * sin(radians(a)) -
    LAUNCH_OFFSET_M * visualScale;

  return {
    angle: a,
    visualScale: visualScale,
    pivotX: pivotX,
    pivotY: pivotY,
    tipX: tipX,
    tipY: tipY
  };
}

function calculateAutoScale(landingX, maxProjectileHeight, castleX, castleY) {
  let playWidth = width - 260 - 30;
  let playHeight = groundY() - 25;

  let neededX = max(landingX, castleX + 30, 10);
  let neededY = max(maxProjectileHeight, castleY + 40, 20);

  let scaleX = playWidth / neededX;
  let scaleY = playHeight / neededY;

  return min(BASE_SCALE, scaleX, scaleY);
}

function getGravity() {
  let g = float(gravityInput.value());
  if (isNaN(g) || g <= 0) {
    g = 9.8;
    gravityInput.value("9.8");
  }
  return g;
}

function getVelocity() {
  let v = float(velocityInput.value());
  if (isNaN(v)) {
    v = 0;
    velocityInput.value("0");
  }
  return v;
}

function getWindAcceleration() {
  let w = float(windInput.value());
  if (isNaN(w)) {
    w = 0;
    windInput.value("0");
  }
  return w;
}

function getDragCoefficient() {
  let d = float(dragInput.value());
  if (isNaN(d) || d < 0) {
    d = 0.02;
    dragInput.value("0.02");
  }
  return d;
}

function getAngle() {
  let a = float(angleInput.value());
  if (isNaN(a)) {
    a = 0;
    angleInput.value("0");
  }
  a = constrain(a, 0, 90);
  angleInput.value(a);
  return a;
}

function parsePair(inputText) {
  let parts = inputText.split(",");
  if (parts.length < 2) return null;

  let px = parseFloat(parts[0].trim());
  let py = parseFloat(parts[1].trim());

  if (isNaN(px) || isNaN(py)) return null;
  return { x: px, y: py };
}

function safeStartAudio() {
  if (typeof userStartAudio === "function") {
    userStartAudio();
  }
}

function playTone(freq, dur, type, volume) {
  if (typeof p5 === "undefined" || typeof p5.Oscillator === "undefined") return;

  let osc = new p5.Oscillator(type || "sine");
  osc.freq(freq);
  osc.amp(volume || 0.15);
  osc.start();

  setTimeout(function () {
    osc.amp(0, 0.05);
    setTimeout(function () {
      osc.stop();
    }, 60);
  }, dur || 120);
}

function playFireSound() {
  playTone(80, 90, "sawtooth", 0.25);
  setTimeout(function () {
    playTone(45, 140, "triangle", 0.18);
  }, 50);
}

function playExplosionSound() {
  playTone(55, 160, "square", 0.2);
  setTimeout(function () {
    playTone(110, 90, "sawtooth", 0.12);
  }, 60);
}

function resetCastle() {
  castleVisible = true;
  castleHit = false;
  castlePieces = [];

  castle = {
    xMeters: 50,
    yMeters: 0,
    x: screenX(50),
    baseY: groundY(),
    wMeters: 18,
    hMeters: 19
  };

  targetInput.value("50,0");
}

function moveCastle() {
  let coords = parsePair(targetInput.value());
  if (coords == null) return;

  castleHit = false;
  castlePieces = [];

  castle.xMeters = coords.x;
  castle.yMeters = max(0, coords.y);
  castle.x = screenX(castle.xMeters);
  castle.baseY = screenY(castle.yMeters);
}

function updateCastleFromInput() {
  let coords = parsePair(targetInput.value());
  if (coords == null) return;

  castle.xMeters = coords.x;
  castle.yMeters = max(0, coords.y);
  castle.x = screenX(castle.xMeters);
  castle.baseY = screenY(castle.yMeters);
}

function getCastleVisualScale() {
  return max(SCALE, 2.5);
}

function drawTerrain() {
  let castleW = castle.wMeters * getCastleVisualScale();

  fill(115, 155, 80);
  noStroke();

  beginShape();
  vertex(150, groundY());
  vertex(castle.x - castleW * 1.2, groundY());

  if (castle.yMeters > 0) {
    vertex(castle.x - castleW * 0.55, castle.baseY);
    vertex(castle.x + castleW * 0.55, castle.baseY);
    vertex(castle.x + castleW * 1.2, groundY());
  }

  vertex(width, groundY());
  vertex(width, height);
  vertex(150, height);
  endShape(CLOSE);

  stroke(70, 120, 55);
  strokeWeight(2);
  line(150, groundY(), castle.x - castleW * 1.2, groundY());

  if (castle.yMeters > 0) {
    line(castle.x - castleW * 1.2, groundY(), castle.x - castleW * 0.55, castle.baseY);
    line(castle.x - castleW * 0.55, castle.baseY, castle.x + castleW * 0.55, castle.baseY);
    line(castle.x + castleW * 0.55, castle.baseY, castle.x + castleW * 1.2, groundY());
  }

  line(castle.x + castleW * 1.2, groundY(), width, groundY());
}

function drawCastle() {
  if (castleHit) return;

  let castleVisualScale = getCastleVisualScale();
  let x = castle.x;
  let y = castle.baseY;
  let w = castle.wMeters * castleVisualScale;
  let h = castle.hMeters * castleVisualScale;

  let towerW = 0.26 * w;
  let towerH = 1.18 * h;
  let roofH = 0.32 * h;

  let mainLeft = x - w / 2;
  let mainTop = y - h;

  let leftTowerLeft = mainLeft - towerW * 0.35;
  let rightTowerLeft = x + w / 2 - towerW * 0.65;

  push();
  rectMode(CORNER);
  noStroke();

  fill(120);
  rect(mainLeft, mainTop, w, h);

  fill(95);
  rect(leftTowerLeft, y - towerH, towerW, towerH);
  rect(rightTowerLeft, y - towerH, towerW, towerH);

  fill(80);
  triangle(leftTowerLeft - 0.08 * w, y - towerH, leftTowerLeft + towerW / 2, y - towerH - roofH, leftTowerLeft + towerW + 0.08 * w, y - towerH);
  triangle(rightTowerLeft - 0.08 * w, y - towerH, rightTowerLeft + towerW / 2, y - towerH - roofH, rightTowerLeft + towerW + 0.08 * w, y - towerH);

  fill(70);
  rect(x - 0.14 * w, y - 0.38 * h, 0.28 * w, 0.38 * h, 8, 8, 0, 0);

  fill(45);
  rect(x - 0.34 * w, y - 0.65 * h, 0.12 * w, 0.18 * h);
  rect(x + 0.22 * w, y - 0.65 * h, 0.12 * w, 0.18 * h);
  rect(leftTowerLeft + 0.32 * towerW, y - 0.78 * h, 0.36 * towerW, 0.16 * h);
  rect(rightTowerLeft + 0.32 * towerW, y - 0.78 * h, 0.36 * towerW, 0.16 * h);

  fill(150);
  for (let i = -2; i <= 2; i++) {
    rect(x + i * 0.2 * w - 0.065 * w, y - h - 0.12 * h, 0.13 * w, 0.12 * h);
  }

  pop();
}

function breakCastle() {
  if (castleHit) return;

  castleHit = true;

  let castleVisualScale = getCastleVisualScale();

  for (let i = 0; i < 32; i++) {
    castlePieces.push({
      x: castle.x + random(-castle.wMeters * castleVisualScale / 2, castle.wMeters * castleVisualScale / 2),
      y: castle.baseY - random(10, castle.hMeters * castleVisualScale),
      vx: random(-4.5, 4.5),
      vy: random(-8, -1),
      size: random(1.6, 4) * castleVisualScale,
      rot: random(TWO_PI),
      spin: random(-0.18, 0.18),
      life: random(90, 170)
    });
  }
}

function updateCastlePieces() {
  for (let i = castlePieces.length - 1; i >= 0; i--) {
    let p = castlePieces[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.13;
    p.rot += p.spin;
    p.life--;

    if (p.y > groundY()) {
      p.y = groundY();
      p.vy *= -0.25;
      p.vx *= 0.85;
    }

    push();
    translate(p.x, p.y);
    rotate(p.rot);
    rectMode(CENTER);
    noStroke();
    fill(105, 105, 105, map(p.life, 0, 170, 0, 255));
    rect(0, 0, p.size, p.size * 0.7);
    pop();

    if (p.life <= 0) {
      castlePieces.splice(i, 1);
    }
  }
}

function checkCastleHit(px, py) {
  if (castleHit) return false;

  let castleVisualScale = getCastleVisualScale();
  let w = castle.wMeters * castleVisualScale;
  let h = castle.hMeters * castleVisualScale;

  let towerW = 0.26 * w;
  let towerH = 1.18 * h;
  let roofH = 0.32 * h;

  let left = castle.x - w / 2 - towerW * 0.45;
  let right = castle.x + w / 2 + towerW * 0.45;
  let top = castle.baseY - towerH - roofH;
  let bottom = castle.baseY;

  return px >= left && px <= right && py >= top && py <= bottom;
}

function toggleLine() {
  let coords = parsePair(myInput.value());
  if (coords == null) return;

  lineX = coords.x;
  lineY = coords.y;
  makeline = true;
}

function togglePause() {
  if (shot == "aimed") {
    paused = !paused;
    pauseButton.html(paused ? "Resume" : "Pause");
  }
}

function toggleCastle() {
  castleVisible = !castleVisible;
}

function toggleRun() {
  safeStartAudio();

  trail = [];
  maxHeightH = 0;
  maxHeightX_canvas = 0;
  paused = false;
  pauseButton.html("Pause");
  shot = "aiming";
  t = 0;
  SCALE = BASE_SCALE;
  explosions = [];

  let velocity = getVelocity();
  let w = getWindAcceleration();
  let g = getGravity();
  let ang = getAngle();
  dragCoefficient = modelSelect.value() === "drag" ? getDragCoefficient() : 0;

  xv = velocity * cos(radians(ang));
  yv_init = velocity * sin(radians(ang));

  initialx = 0;

  let startGeo = getCannonGeometry(ang);
  initialy = (groundY() - startGeo.tipY) / SCALE;

  let forecast = simulateForecast(initialy, xv, yv_init, w, g, dragCoefficient);
  let landing_x_m = forecast.range;
  predictedRange = forecast.range;
  flightDuration = forecast.time;
  let maxProjectileHeight = forecast.maxHeight;

  let castleCoords = parsePair(targetInput.value());
  let castleXForScale = 50;
  let castleYForScale = 0;

  if (castleCoords != null) {
    castleXForScale = castleCoords.x;
    castleYForScale = max(0, castleCoords.y);
  }

  SCALE = calculateAutoScale(landing_x_m, maxProjectileHeight, castleXForScale, castleYForScale);

  let finalGeo = getCannonGeometry(ang);
  LAUNCH_PX = finalGeo.tipX;
  initialy = (groundY() - finalGeo.tipY) / SCALE;
  forecast = simulateForecast(initialy, xv, yv_init, w, g, dragCoefficient);
  predictedRange = forecast.range;
  flightDuration = forecast.time;

  x = initialx;
  h = initialy;
  maxHeightH = initialy;
  maxHeightX_canvas = screenX(0);

  updateCastleFromInput();

  barrelKick = 3.6;
  playFireSound();
}

function computePosition() {
  let w = getWindAcceleration();
  let g = getGravity();
  let dt = 1 / frameRate();
  let steps = max(1, ceil(dt / 0.005));
  let step = dt / steps;
  for (let i = 0; i < steps; i++) {
    let speed = sqrt(xv * xv + yv_init * yv_init);
    xv += (w - dragCoefficient * speed * xv) * step;
    yv_init += (-g - dragCoefficient * speed * yv_init) * step;
    x += xv * step;
    h += yv_init * step;
    t += step;
  }
}

function simulateForecast(startHeight, vx0, vy0, wind, gravity, drag) {
  let px = 0;
  let py = startHeight;
  let vx = vx0;
  let vy = vy0;
  let elapsed = 0;
  let highest = py;
  let step = 0.005;
  while (elapsed < 300 && py >= 0) {
    let speed = sqrt(vx * vx + vy * vy);
    vx += (wind - drag * speed * vx) * step;
    vy += (-gravity - drag * speed * vy) * step;
    px += vx * step;
    py += vy * step;
    elapsed += step;
    if (py > highest) highest = py;
  }
  return { range: px, maxHeight: highest, time: elapsed };
}

function snapToGroundIfNeeded() {
  if (h >= 0) return;
  let span = previousH - h;
  if (span > 0) {
    let progress = constrain(previousH / span, 0, 1);
    x = previousX + (x - previousX) * progress;
  }
  h = 0;
}

function makeExplosion(px, py, amount, baseColor) {
  for (let i = 0; i < amount; i++) {
    explosions.push({
      x: px,
      y: py,
      vx: random(-3.5, 3.5),
      vy: random(-6, 1),
      size: random(3, 8),
      life: random(35, 70),
      color: baseColor || color(255, random(80, 180), 0)
    });
  }

  playExplosionSound();
}

function niceInterval(minPixels) {
  let steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 2000, 5000];

  for (let s of steps) {
    if (s * SCALE >= minPixels) return s;
  }

  return 5000;
}

function createMarkers() {
  let tickStep = niceInterval(4);
  let labelStep = niceInterval(30);
  let maxMeters = Math.ceil((width - LAUNCH_PX) / SCALE);

  stroke(0);
  strokeWeight(1);

  for (let meter = 0; meter <= maxMeters; meter += tickStep) {
    let px = screenX(meter);
    if (px > width) break;

    let isLabel = meter % labelStep === 0;
    line(px, groundY(), px, groundY() - (isLabel ? 5 : 3));

    if (isLabel) {
      noStroke();
      fill(0);
      textSize(8);
      text(meter, px - 3, groundY() + 10);
      stroke(0);
      strokeWeight(1);
    }
  }

  noStroke();
  fill(0);
  textSize(8);
  text("(m)", 152, groundY() + 10);
}

function drawLabels() {
  noStroke();

  fill(198, 204, 198);
  rect(0, 0, 150, height);

  fill(226, 232, 224);
  rect(7, 8, 136, 68, 6);
  fill(35);
  textSize(12);
  textStyle(BOLD);
  text("Cannon Lab", 15, 27);
  textStyle(NORMAL);
  textSize(8);
  text("Compare ideal and air drag. Blue arrow shows velocity.", 15, 43, 120, 28);

  fill(220, 226, 218);
  rect(7, 88, 136, 234, 6);
  fill(45);
  textSize(8);
  textStyle(BOLD);
  text("SHOT SETTINGS", 15, 104);
  textStyle(NORMAL);
  text("Velocity (m/s)", 56, 132);
  text("Angle (deg)", 56, 160);
  text("Wind (m/s²)", 56, 188);
  text("Gravity (m/s²)", 56, 216);
  text("Drag k", 56, 244);
  text("Model", 15, 270);
  text("Reference line X,Y (m)", 15, 287);

  fill(220, 226, 218);
  rect(7, 332, 136, 140, 6);
  fill(45);
  textStyle(BOLD);
  text("CASTLE", 15, 348);
  textStyle(NORMAL);
  text("Castle X,Y (m)", 56, 371);

  fill(226, 232, 224);
  rect(7, 482, 136, 148, 6);
  fill(35);
  textStyle(BOLD);
  text("SHOT DATA", 15, 498);
}

function drawHud() {
  fill(45);
  textSize(8);
  let active = shot !== "no";
  let speed = active ? sqrt(xv * xv + yv_init * yv_init) : 0;
  let status = shot === "no" ? "Ready" : paused ? "Paused" : shot === "landed" ? (castleHit ? "Castle hit" : "Landed") : "In flight";
  text("Status: " + status, 15, 514);
  text("Range: " + (active ? x.toFixed(1) + " m" : "--"), 15, 530);
  text("Height: " + (active ? h.toFixed(1) + " m" : "--"), 15, 546);
  text("Peak: " + (active ? maxHeightH.toFixed(1) + " m" : "--"), 15, 562);
  text("Forecast: " + (active ? predictedRange.toFixed(1) + " m" : "--"), 15, 578);
  text("Speed: " + (active ? speed.toFixed(1) + " m/s" : "--"), 15, 594);
  text("Time: " + (active ? t.toFixed(1) + " s (est. " + flightDuration.toFixed(1) + ")" : "--"), 15, 610);
}

function drawVelocityVector(px, py) {
  if (shot !== "aimed") return;
  let vx = xv;
  let vy = yv_init;
  let factor = 2.2;
  let endX = px + vx * factor;
  let endY = py - vy * factor;
  let direction = atan2(-vy, vx);
  push();
  stroke(25, 80, 180);
  strokeWeight(2);
  line(px, py, endX, endY);
  line(endX, endY, endX - 7 * cos(direction - 0.5), endY - 7 * sin(direction - 0.5));
  line(endX, endY, endX - 7 * cos(direction + 0.5), endY - 7 * sin(direction + 0.5));
  noStroke();
  fill(25, 80, 180);
  textSize(9);
  text("v", endX + 4, endY - 4);
  pop();
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    let p = explosions[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life--;

    let alpha = map(p.life, 0, 70, 0, 255);

    push();
    noStroke();
    fill(red(p.color), green(p.color), blue(p.color), alpha);
    circle(p.x, p.y, p.size);
    pop();

    if (p.life <= 0) {
      explosions.splice(i, 1);
    }
  }
}

function draw() {
  background(173, 216, 230);

  drawLabels();

  drawTerrain();

  stroke(0);
  strokeWeight(2);
  line(150, groundY(), width, groundY());
  createMarkers();

  if (castleVisible) {
    drawCastle();
  }
  updateCastlePieces();
  updateExplosions();

  angle = getAngle();

  if (shot == "no" || shot == "landed" || shot == "aimed") {
    barrel.angle = angle;
    barrel.draw();
  }

  if (shot == "aiming") {
    barrel.angle = angle;
    barrel.draw();
    shot = "aimed";
  }

  if (shot == "aimed") {
    if (!paused) {
      previousX = x;
      previousH = h;
      computePosition();
      snapToGroundIfNeeded();
    }

    let xp = screenX(x);
    let yp = screenY(h);
    drawVelocityVector(xp, yp);

    if (!paused) {
      trail.push({ xc: xp, yc: yp });

      if (h > maxHeightH) {
        maxHeightH = h;
        maxHeightX_canvas = xp;
      }

      if (checkCastleHit(xp, yp)) {
        breakCastle();
        makeExplosion(xp, yp, 55, color(255, 120, 0));
        shot = "landed";
      } else {
        if (h <= 0 && t > 0.1) {
          makeExplosion(xp, groundY(), 35, color(255, 90, 0));
          shot = "landed";
        }

        if (xp > width || xp < 150) {
          makeExplosion(constrain(xp, 150, width), yp, 20, color(255, 140, 0));
          shot = "landed";
        }
      }
    }
  }

  if (trail.length > 1) {
    push();
    stroke("red");
    strokeWeight(2);
    noFill();
    beginShape();
    curveVertex(trail[0].xc, trail[0].yc);

    for (let i = 0; i < trail.length; i++) {
      curveVertex(trail[i].xc, trail[i].yc);
    }

    curveVertex(trail[trail.length - 1].xc, trail[trail.length - 1].yc);
    endShape();
    pop();

    if (shot != "landed") {
      let last = trail[trail.length - 1];

      push();
      fill("red");
      noStroke();
      circle(last.xc, last.yc, max(4, 1.4 * getCannonVisualScale()));
      pop();
    }
  }

  if (shot == "landed" && trail.length > 0) {
    push();
    stroke("blue");
    strokeWeight(2);
    line(maxHeightX_canvas, groundY(), maxHeightX_canvas, screenY(maxHeightH));
    pop();

  }

  if (makeline) {
    push();
    stroke("green");
    strokeWeight(2);
    line(screenX(lineX), groundY(), screenX(lineX), screenY(lineY));
    pop();
  }

  if (mouseX > 150 && mouseX < width && mouseY > 0 && mouseY < groundY()) {
    let mx = (mouseX - LAUNCH_PX) / SCALE;
    let my = (groundY() - mouseY) / SCALE;

    push();
    fill(255);
    noStroke();
    rect(152, 5, 210, 28);

    fill(0);
    textSize(10);
    text("X: " + mx.toFixed(1) + " m   Y: " + my.toFixed(1) + " m", 157, 22);
    pop();
  }

  drawHud();
}
