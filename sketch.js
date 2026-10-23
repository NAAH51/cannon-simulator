let initialx, initialy;
let xv, yv_init;
let t;
let windInput, gravityInput, angleInput, velocityInput, myInput, targetInput;
let runButton, pauseButton, lineButton, resetTargetButton, moveTargetButton, toggleCastleButton, modelSelect, dragInput;
let simulatorCanvas;
let canvasScaleX = 1;
let canvasScaleY = 1;
let PLAYFIELD_START = 240;
let comparisonPath = [];
let selectedForecastPath = [];
let alternateRange = 0;
let shotWind = 0;
let shotGravity = 9.8;
let controlsLocked = null;
let uiMessage = "";
let barrel;
let angle;
let maxHeightH = 0;
let maxHeightX_canvas = 0;
let SCALE = 5;
let BASE_SCALE = 5;
let LAUNCH_PX = 335;
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

let CANNON_BASE_X = 285;
let CANNON_PIVOT_Y_M = 4;
let BARREL_LENGTH_M = 10;
let BARREL_THICKNESS_M = 2;
let LAUNCH_OFFSET_M = 1;
let CANNON_MAX_VISUAL_SCALE = 3.0;

function setup() {
  simulatorCanvas = createCanvas(1400, 700);
  frameRate(60);

  velocityInput = createInput("20");
  configureNumberInput(velocityInput, "Launch speed in meters per second", "0", "300", "0.1");

  angleInput = createInput("45");
  configureNumberInput(angleInput, "Launch angle in degrees", "0", "90", "1");

  windInput = createInput("0");
  configureNumberInput(windInput, "Horizontal wind acceleration in meters per second squared", "-100", "100", "0.1");

  gravityInput = createInput("9.8");
  configureNumberInput(gravityInput, "Gravity in meters per second squared", "0.1", "50", "0.1");

  dragInput = createInput("0.02");
  configureNumberInput(dragInput, "Air drag coefficient", "0", "1", "0.01");

  modelSelect = createSelect();
  modelSelect.attribute("aria-label", "Physics model");
  modelSelect.option("Ideal", "ideal");
  modelSelect.option("Air drag", "drag");

  myInput = createInput();
  myInput.attribute("aria-label", "Reference line coordinates in meters, x comma y");
  myInput.attribute("placeholder", "x,y");

  targetInput = createInput("50,0");
  targetInput.attribute("aria-label", "Castle target coordinates in meters, x comma y");

  lineButton = createButton("ADD LINE");
  lineButton.mousePressed(toggleLine);

  moveTargetButton = createButton("MOVE CASTLE");
  moveTargetButton.mousePressed(moveCastle);

  resetTargetButton = createButton("RESET CASTLE");
  resetTargetButton.mousePressed(resetCastle);

  toggleCastleButton = createButton("TOGGLE CASTLE");
  toggleCastleButton.mousePressed(toggleCastle);

  pauseButton = createButton("Pause");
  pauseButton.mousePressed(togglePause);

  runButton = createButton("Run");
  runButton.mousePressed(toggleRun);

  for (let control of [velocityInput, angleInput, windInput, gravityInput, dragInput, modelSelect]) {
    control.input(clearShotForNewSettings);
  }

  layoutControls();
  styleMenuControls();
  setFlightUi(false);
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

function positionControl(control, x, y) {
  let bounds = simulatorCanvas.elt.getBoundingClientRect();
  canvasScaleX = bounds.width / 1400;
  canvasScaleY = bounds.height / 700;
  control.position(
    window.scrollX + bounds.left + x * canvasScaleX,
    window.scrollY + bounds.top + y * canvasScaleY
  );
}

function sizeControl(control, w, h) {
  control.size(round(w * canvasScaleX), round(h * canvasScaleY));
}

function layoutControls() {
  let layout = [
    [velocityInput, 16, 150, 88, 24],
    [angleInput, 16, 184, 88, 24],
    [windInput, 16, 218, 88, 24],
    [gravityInput, 16, 252, 88, 24],
    [dragInput, 16, 286, 88, 24],
    [modelSelect, 112, 318, 112, 26],
    [myInput, 16, 400, 94, 24],
    [lineButton, 116, 400, 108, 24],
    [targetInput, 16, 476, 96, 24],
    [moveTargetButton, 118, 476, 106, 24],
    [resetTargetButton, 16, 508, 100, 24],
    [toggleCastleButton, 124, 508, 100, 24],
    [pauseButton, 16, 664, 98, 24],
    [runButton, 122, 664, 102, 24]
  ];
  let bounds = simulatorCanvas.elt.getBoundingClientRect();
  canvasScaleX = bounds.width / 1400;
  canvasScaleY = bounds.height / 700;
  for (let item of layout) {
    positionControl(item[0], item[1], item[2]);
    sizeControl(item[0], item[3], item[4]);
  }
}

function windowResized() {
  layoutControls();
  styleMenuControls();
}

function configureNumberInput(input, label, minimum, maximum, step) {
  input.attribute("type", "number");
  input.attribute("aria-label", label);
  input.attribute("min", minimum);
  input.attribute("max", maximum);
  input.attribute("step", step);
}

function setFlightUi(isFlying) {
  if (controlsLocked === isFlying) return;
  controlsLocked = isFlying;
  let controls = [velocityInput, angleInput, windInput, gravityInput, dragInput, modelSelect, myInput, targetInput, lineButton, moveTargetButton, resetTargetButton, toggleCastleButton];
  for (let control of controls) {
    control.elt.disabled = isFlying;
  }
  pauseButton.elt.disabled = !isFlying;
  runButton.elt.disabled = isFlying;
  runButton.style("opacity", isFlying ? "0.55" : "1");
  pauseButton.style("opacity", isFlying ? "1" : "0.55");
}

function clearShotForNewSettings() {
  if (shot !== "landed") return;
  shot = "no";
  paused = false;
  t = 0;
  x = 0;
  h = 0;
  trail = [];
  comparisonPath = [];
  selectedForecastPath = [];
  alternateRange = 0;
  predictedRange = 0;
  flightDuration = 0;
  maxHeightH = 0;
  explosions = [];
  castleHit = false;
  castlePieces = [];
  setFlightUi(false);
}

function styleMenuControls() {
  let uiScale = min(canvasScaleX, canvasScaleY);
  let inputs = [velocityInput, angleInput, windInput, gravityInput, myInput, targetInput, dragInput];

  for (let input of inputs) {
    input.style("box-sizing", "border-box");
    input.style("border", "1px solid #879487");
    input.style("border-radius", "4px");
    input.style("padding", "0 3px");
    input.style("font-size", round(12 * uiScale) + "px");
    input.style("height", round(22 * uiScale) + "px");
    input.style("background", "#ffffff");
    input.style("color", "#111");
  }

  modelSelect.style("font-size", round(12 * uiScale) + "px");
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
    button.style("font-size", round(10 * uiScale) + "px");
    button.style("font-weight", "700");
    button.style("line-height", round(24 * uiScale) + "px");
    button.style("cursor", "pointer");
  }

  resetTargetButton.style("background", "#2f6f48");
  lineButton.style("font-size", round(9 * uiScale) + "px");
  lineButton.style("line-height", round(24 * uiScale) + "px");
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
  return min(SCALE * 0.6, CANNON_MAX_VISUAL_SCALE);
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
  let playWidth = width - max(LAUNCH_PX, PLAYFIELD_START + 60) - 30;
  let playHeight = groundY() - 25;

  let neededX = max(landingX, castleX + 30, 10);
  let neededY = max(maxProjectileHeight, castleY + 40, 20);

  let scaleX = playWidth / neededX;
  let scaleY = playHeight / neededY;

  return min(BASE_SCALE, scaleX, scaleY);
}

function getGravity() {
  let g = float(gravityInput.value());
  if (isNaN(g)) {
    g = 9.8;
  }
  g = constrain(g, 0.1, 50);
  gravityInput.value(g);
  return g;
}

function getVelocity() {
  let v = float(velocityInput.value());
  if (isNaN(v)) {
    v = 0;
  }
  v = constrain(v, 0, 300);
  velocityInput.value(v);
  return v;
}

function getWindAcceleration() {
  let w = float(windInput.value());
  if (isNaN(w)) {
    w = 0;
  }
  w = constrain(w, -100, 100);
  windInput.value(w);
  return w;
}

function getDragCoefficient() {
  let d = float(dragInput.value());
  if (isNaN(d)) {
    d = 0.02;
  }
  d = constrain(d, 0, 1);
  dragInput.value(d);
  return d;
}

function getAngle() {
  let a = float(angleInput.value());
  if (isNaN(a)) {
    a = 0;
  }
  a = constrain(a, 0, 90);
  angleInput.value(a);
  return a;
}

function parsePair(inputText) {
  let parts = inputText.split(",");
  if (parts.length !== 2) return null;

  let px = parseFloat(parts[0].trim());
  let py = parseFloat(parts[1].trim());

  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
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
  clearShotForNewSettings();
  castleVisible = true;
  castleHit = false;
  castlePieces = [];
  uiMessage = "";
  if (toggleCastleButton) toggleCastleButton.html("HIDE CASTLE");

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
  if (coords == null || coords.x < 0 || coords.x > 2500 || coords.y < 0 || coords.y > 1000) {
    uiMessage = "Target: X 0-2500 m, Y 0-1000 m.";
    return;
  }

  clearShotForNewSettings();
  castleHit = false;
  castlePieces = [];

  castle.xMeters = coords.x;
  castle.yMeters = coords.y;
  castle.x = screenX(castle.xMeters);
  castle.baseY = screenY(castle.yMeters);
  uiMessage = "";
}

function updateCastleFromInput() {
  let coords = parsePair(targetInput.value());
  if (coords == null) return;

  castle.xMeters = constrain(coords.x, 0, 2500);
  castle.yMeters = constrain(coords.y, 0, 1000);
  castle.x = screenX(castle.xMeters);
  castle.baseY = screenY(castle.yMeters);
}

function getCastleVisualScale() {
  return SCALE;
}

function drawTerrain() {
  let castleW = castle.wMeters * getCastleVisualScale();

  fill(115, 155, 80);
  noStroke();

  beginShape();
  vertex(PLAYFIELD_START, groundY());
  vertex(castle.x - castleW * 1.2, groundY());

  if (castle.yMeters > 0) {
    vertex(castle.x - castleW * 0.55, castle.baseY);
    vertex(castle.x + castleW * 0.55, castle.baseY);
    vertex(castle.x + castleW * 1.2, groundY());
  }

  vertex(width, groundY());
  vertex(width, height);
  vertex(PLAYFIELD_START, height);
  endShape(CLOSE);

  stroke(70, 120, 55);
  strokeWeight(2);
  line(PLAYFIELD_START, groundY(), castle.x - castleW * 1.2, groundY());

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
  if (castleHit || !castleVisible) return false;

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
  if (coords == null || coords.x < 0 || coords.x > 2500 || coords.y < 0 || coords.y > 1000) {
    uiMessage = "Line: X 0-2500 m, Y 0-1000 m.";
    return;
  }

  lineX = coords.x;
  lineY = coords.y;
  makeline = true;
  uiMessage = "";
}

function togglePause() {
  if (shot == "aimed") {
    paused = !paused;
    pauseButton.html(paused ? "Resume" : "Pause");
  }
}

function toggleCastle() {
  castleVisible = !castleVisible;
  if (castleVisible) {
    castleHit = false;
    castlePieces = [];
  }
  toggleCastleButton.html(castleVisible ? "HIDE CASTLE" : "SHOW CASTLE");
}

function toggleRun() {
  let castleCoords = parsePair(targetInput.value());
  if (castleCoords == null || castleCoords.x < 0 || castleCoords.x > 2500 || castleCoords.y < 0 || castleCoords.y > 1000) {
    uiMessage = "Target: X 0-2500 m, Y 0-1000 m.";
    return;
  }

  safeStartAudio();

  trail = [];
  comparisonPath = [];
  selectedForecastPath = [];
  maxHeightH = 0;
  maxHeightX_canvas = 0;
  paused = false;
  pauseButton.html("Pause");
  shot = "aiming";
  t = 0;
  SCALE = BASE_SCALE;
  explosions = [];
  castleHit = false;
  castlePieces = [];
  uiMessage = "";

  let velocity = getVelocity();
  shotWind = getWindAcceleration();
  shotGravity = getGravity();
  let ang = getAngle();
  let configuredDrag = getDragCoefficient();
  dragCoefficient = modelSelect.value() === "drag" ? configuredDrag : 0;

  xv = velocity * cos(radians(ang));
  yv_init = velocity * sin(radians(ang));

  initialx = 0;

  let startGeo = getCannonGeometry(ang);
  initialy = (groundY() - startGeo.tipY) / SCALE;

  let forecast = simulateForecast(initialy, xv, yv_init, shotWind, shotGravity, dragCoefficient);
  let comparisonDrag = modelSelect.value() === "drag" ? 0 : configuredDrag;
  let alternateForecast = simulateForecast(initialy, xv, yv_init, shotWind, shotGravity, comparisonDrag);
  let landing_x_m = max(forecast.range, alternateForecast.range);
  predictedRange = forecast.range;
  flightDuration = forecast.time;
  let maxProjectileHeight = max(forecast.maxHeight, alternateForecast.maxHeight);

  let castleXForScale = castleCoords.x;
  let castleYForScale = castleCoords.y;

  SCALE = calculateAutoScale(landing_x_m, maxProjectileHeight, castleXForScale, castleYForScale);

  let finalGeo = getCannonGeometry(ang);
  LAUNCH_PX = finalGeo.tipX;
  initialy = (groundY() - finalGeo.tipY) / SCALE;
  forecast = simulateForecast(initialy, xv, yv_init, shotWind, shotGravity, dragCoefficient, true);
  predictedRange = forecast.range;
  flightDuration = forecast.time;
  selectedForecastPath = forecast.points;

  alternateForecast = simulateForecast(initialy, xv, yv_init, shotWind, shotGravity, comparisonDrag, true);
  alternateRange = alternateForecast.range;
  comparisonPath = alternateForecast.points;

  x = initialx;
  h = initialy;
  maxHeightH = initialy;
  maxHeightX_canvas = screenX(0);

  updateCastleFromInput();

  setFlightUi(true);
  barrelKick = 3.6;
  playFireSound();
}

function computePosition() {
  let dt = 1 / max(1, frameRate());
  let steps = max(1, ceil(dt / 0.005));
  let step = dt / steps;
  for (let i = 0; i < steps; i++) {
    let velocity = advanceVelocity(xv, yv_init, shotWind, shotGravity, dragCoefficient, step);
    xv = velocity.x;
    yv_init = velocity.y;
    x += xv * step;
    h += yv_init * step;
    t += step;
  }
}

function advanceVelocity(vx, vy, wind, gravity, drag, step) {
  vx += wind * step;
  vy -= gravity * step;
  if (drag > 0) {
    let speed = sqrt(vx * vx + vy * vy);
    let damping = 1 / (1 + drag * speed * step);
    vx *= damping;
    vy *= damping;
  }
  return { x: vx, y: vy };
}

function simulateForecast(startHeight, vx0, vy0, wind, gravity, drag, capturePoints) {
  let px = 0;
  let py = startHeight;
  let vx = vx0;
  let vy = vy0;
  let elapsed = 0;
  let highest = py;
  let step = 0.02;
  let timeLimit = 30000;
  let nextPoint = 0.08;
  let points = capturePoints ? [{ x: px, y: py }] : [];
  while (elapsed < timeLimit && py >= 0) {
    let velocity = advanceVelocity(vx, vy, wind, gravity, drag, step);
    vx = velocity.x;
    vy = velocity.y;
    px += vx * step;
    py += vy * step;
    elapsed += step;
    if (py > highest) highest = py;
    if (capturePoints && elapsed >= nextPoint) {
      points.push({ x: px, y: py });
      nextPoint = elapsed + max(0.08, elapsed * 0.01);
    }
  }
  if (capturePoints && (points.length === 0 || points[points.length - 1].y !== py)) {
    points.push({ x: px, y: py });
  }
  return { range: px, maxHeight: highest, time: elapsed, points: points };
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
  let rawStep = minPixels / SCALE;
  let magnitude = pow(10, floor(Math.log10(rawStep)));
  let leading = rawStep / magnitude;
  if (leading <= 1) return magnitude;
  if (leading <= 2) return 2 * magnitude;
  if (leading <= 5) return 5 * magnitude;
  return 10 * magnitude;
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
      textSize(10);
      text(formatAxisValue(meter), px - 3, groundY() + 10);
      stroke(0);
      strokeWeight(1);
    }
  }

  noStroke();
  fill(0);
  textSize(10);
  text("(m)", PLAYFIELD_START + 2, groundY() + 12);
}

function drawLabels() {
  noStroke();

  fill(198, 204, 198);
  rect(0, 0, PLAYFIELD_START, height);

  fill(232, 237, 230);
  rect(8, 10, 224, 90, 8);
  fill(35);
  textSize(18);
  textStyle(BOLD);
  text("Cannon Simulator", 18, 35);
  textStyle(NORMAL);
  textSize(11);
  text("Projectile motion lab", 18, 55);
  fill(65);
  textSize(10);
  text("Try Ideal at 45°, then compare drag.", 18, 73);
  text("Dashed = other model; blue arrow = velocity.", 18, 89);

  fill(220, 226, 218);
  rect(8, 108, 224, 252, 8);
  fill(45);
  textSize(12);
  textStyle(BOLD);
  text("SHOT SETTINGS", 16, 131);
  textStyle(NORMAL);
  textSize(11);
  text("Launch speed (m/s)", 112, 166);
  text("Launch angle (deg)", 112, 200);
  text("Wind (m/s²)", 112, 234);
  text("Gravity (m/s²)", 112, 268);
  text("Drag coefficient k", 112, 302);
  fill(45);
  textStyle(BOLD);
  text("MODEL", 16, 336);
  textStyle(NORMAL);

  fill(220, 226, 218);
  rect(8, 370, 224, 68, 8);
  fill(45);
  textSize(12);
  textStyle(BOLD);
  text("REFERENCE LINE", 16, 391);
  textStyle(NORMAL);
  textSize(10);
  text("Vertical marker at X,Y meters", 16, 434);

  fill(220, 226, 218);
  rect(8, 448, 224, 92, 8);
  fill(45);
  textSize(12);
  textStyle(BOLD);
  text("CASTLE TARGET", 16, 469);
  textStyle(NORMAL);

  fill(232, 237, 230);
  rect(8, 548, 224, 148, 8);
  fill(35);
  textSize(12);
  textStyle(BOLD);
  text("SHOT DATA", 16, 567);
  textStyle(NORMAL);
}

function drawHud() {
  fill(45);
  textSize(10);
  let active = shot !== "no";
  let speed = active ? sqrt(xv * xv + yv_init * yv_init) : 0;
  let status = shot === "no" ? "Ready" : paused ? "Paused" : shot === "landed" ? (castleHit ? "Castle hit" : "Landed") : "In flight";
  text("Status: " + status, 16, 585);
  text("Range / forecast: " + (active ? formatMeasure(x) + " / " + formatMeasure(predictedRange) + " m" : "--"), 16, 600);
  text("Height / peak: " + (active ? formatMeasure(h) + " / " + formatMeasure(maxHeightH) + " m" : "--"), 16, 615);
  text("Speed: " + (active ? speed.toFixed(1) + " m/s" : "--") + "   Time: " + (active ? formatMeasure(t) + " / " + formatMeasure(flightDuration) + " s" : "--"), 16, 630);
  if (uiMessage) {
    fill(145, 63, 35);
    text(uiMessage, 16, 645);
  } else {
    let difference = alternateRange - predictedRange;
    let signedDifference = difference >= 0 ? "+" : "";
    text("Other model: " + (active ? formatMeasure(alternateRange) + " m (" + signedDifference + formatMeasure(difference) + ")" : "--"), 16, 645);
  }
}

function formatMeasure(value) {
  if (abs(value) >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (abs(value) >= 10000) return (value / 1000).toFixed(1) + "k";
  return value.toFixed(1);
}

function formatAxisValue(value) {
  if (value >= 10000000) return (value / 1000000).toFixed(0) + "M";
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 100000) return (value / 1000).toFixed(0) + "k";
  if (value >= 10000) return (value / 1000).toFixed(1) + "k";
  return String(value);
}

function drawModelPaths() {
  if (selectedForecastPath.length > 1) {
    drawModelPath(selectedForecastPath, color(220, 55, 45, 105), false);
    drawModelPath(comparisonPath, color(25, 91, 155, 205), true);

    let legendX = PLAYFIELD_START + 18;
    let legendY = 22;
    push();
    stroke(220, 55, 45);
    strokeWeight(3);
    line(legendX, legendY, legendX + 24, legendY);
    noStroke();
    fill(35);
    textSize(10);
    text("Selected model", legendX + 31, legendY + 4);
    drawingContext.setLineDash([5, 4]);
    stroke(25, 91, 155);
    strokeWeight(2);
    line(legendX + 128, legendY, legendX + 152, legendY);
    drawingContext.setLineDash([]);
    noStroke();
    fill(35);
    text("Other model", legendX + 159, legendY + 4);
    pop();
  }
}

function drawModelPath(points, pathColor, dashed) {
  if (points.length < 2) return;
  push();
  noFill();
  stroke(pathColor);
  strokeWeight(2);
  if (dashed) drawingContext.setLineDash([6, 5]);
  beginShape();
  for (let point of points) {
    vertex(screenX(point.x), screenY(point.y));
  }
  endShape();
  if (dashed) drawingContext.setLineDash([]);
  pop();
}

function drawVelocityVector(px, py) {
  if (shot !== "aimed") return;
  let vx = xv;
  let vy = yv_init;
  let speed = sqrt(vx * vx + vy * vy);
  let factor = speed > 0 ? min(2.2, 75 / speed) : 0;
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
  angle = getAngle();
  if (shot === "no") LAUNCH_PX = getCannonGeometry(angle).tipX;

  drawLabels();

  drawTerrain();

  stroke(0);
  strokeWeight(2);
  line(PLAYFIELD_START, groundY(), width, groundY());
  createMarkers();
  drawModelPaths();

  if (castleVisible) {
    drawCastle();
  }
  updateCastlePieces();
  updateExplosions();

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

        if (xp > width || xp < PLAYFIELD_START) {
          makeExplosion(constrain(xp, PLAYFIELD_START, width), yp, 20, color(255, 140, 0));
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

  if (mouseX > PLAYFIELD_START && mouseX < width && mouseY > 0 && mouseY < groundY()) {
    let mx = (mouseX - LAUNCH_PX) / SCALE;
    let my = (groundY() - mouseY) / SCALE;

    push();
    fill(255);
    noStroke();
    rect(width - 222, 5, 210, 28);

    fill(0);
    textSize(10);
    text("X: " + mx.toFixed(1) + " m   Y: " + my.toFixed(1) + " m", width - 217, 22);
    pop();
  }

  drawHud();
  setFlightUi(shot === "aiming" || shot === "aimed");
}
