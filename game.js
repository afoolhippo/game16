function setAppHeight(){

  const h =
    window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;

  document.documentElement
    .style
    .setProperty(
      "--app-height",
      `${h}px`
    );
}

setAppHeight();

window.addEventListener(
  "resize",
  setAppHeight
);

if(window.visualViewport){

  window.visualViewport
    .addEventListener(
      "resize",
      setAppHeight
    );
}

const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const shareBtn = document.getElementById("shareBtn");
const homeBtn = document.getElementById("homeBtn");
const backBtn = document.getElementById("backBtn");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

const depthText = document.getElementById("depthText");
const coalText = document.getElementById("coalText");
const timeText = document.getElementById("timeText");

const resultTitle = document.getElementById("resultTitle");
const resultScore = document.getElementById("resultScore");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bgm = document.getElementById("bgm");

const idleImg = new Image();
idleImg.src = "player_idle.png";

const swingImg = new Image();
swingImg.src = "player_swing.png";

const TILE = 24;
const COLS = 15;
const MAP_ROWS = 320;

let map = [];

let player = {
  x: 7,
  y: 0
};

let cameraY = 0;

let coal = 0;
let depth = 0;
let time = 60;

let running = false;

let leftPressed = false;
let rightPressed = false;

let shake = 0;
let autoDigTimer = 0;
let moveCooldown = 0;

let swing = false;

function showScreen(screen){

  titleScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  resultScreen.classList.remove("active");

  screen.classList.add("active");
}

function generateMap(){

  map = [];

  for(let y = 0; y < MAP_ROWS; y++){

    const row = [];

    for(let x = 0; x < COLS; x++){

      if(y < 2){
        row.push(0);
        continue;
      }

      const r = Math.random();

      let coalRate = 0.14 + y * 0.0005;
      if(coalRate > 0.28) coalRate = 0.28;

      let rockRate = 0.08 + y * 0.00035;
      if(rockRate > 0.18) rockRate = 0.18;

      if(r < coalRate){
        row.push(2);
      }else if(r < coalRate + rockRate){
        row.push(3);
      }else{
        row.push(1);
      }
    }

    map.push(row);
  }
}

function updateHud(){

  depthText.textContent = depth;
  coalText.textContent = coal;
  timeText.textContent = Math.ceil(time);
}

function startGame(){

  generateMap();

  player.x = 7;
  player.y = 0;

  cameraY = 0;

  coal = 0;
  depth = 0;
  time = 60;

  leftPressed = false;
  rightPressed = false;

  shake = 0;
  autoDigTimer = 0;
  moveCooldown = 0;
  swing = false;

  running = true;

  updateHud();
  showScreen(gameScreen);

  bgm.currentTime = 0;
  bgm.volume = 0.5;
  bgm.play().catch(()=>{});

  requestAnimationFrame(loop);
}

function endGame(){

  if(!running) return;

  running = false;

  bgm.pause();

  let title = "見習い炭鉱夫";

  if(depth >= 300){
    title = "石炭職人";
  }

  if(depth >= 600){
    title = "地底のカバ";
  }

  if(depth >= 900){
    title = "黒いダイヤの王";
  }

  resultTitle.textContent = title;

  resultScore.innerHTML =
    `深度 ${depth}m<br>` +
    `石炭 ${coal}個`;

  showScreen(resultScreen);
}

function getColor(y){

  if(y < 40){
    return "#5a3a22";
  }

  if(y < 80){
    return "#453020";
  }

  if(y < 140){
    return "#30231d";
  }

  if(y < 220){
    return "#2a1d1b";
  }

  return "#211716";
}

function getBlock(x,y){

  if(!map[y]) return 0;
  return map[y][x];
}

function setBlock(x,y,value){

  if(!map[y]) return;
  map[y][x] = value;
}

function digCurrentCell(){

  const block = getBlock(
    player.x,
    player.y
  );

  if(block === 1){
    setBlock(player.x, player.y, 0);
  }

  if(block === 2){
    setBlock(player.x, player.y, 0);
    coal++;
  }
}

function digStep(){

  const belowY = player.y + 1;
  const belowX = player.x;

  const block = getBlock(
    belowX,
    belowY
  );

  if(block === 3){
    shake = 2;
    return;
  }

  if(block === 1){
    setBlock(belowX, belowY, 0);
  }

  if(block === 2){
    setBlock(belowX, belowY, 0);
    coal++;
  }

  player.y++;

  depth = Math.max(
    depth,
    player.y * 2
  );

  swing = !swing;
  shake = 4;

  updateHud();

  if(player.y >= MAP_ROWS - 5){
    endGame();
  }
}

function move(dx){

  if(moveCooldown > 0){
    return;
  }

  const nx = player.x + dx;
  const ny = player.y;

  if(nx < 0) return;
  if(nx >= COLS) return;

  const block = getBlock(nx, ny);

  if(block === 3){
    shake = 2;
    moveCooldown = 5;
    return;
  }

  if(block === 1){
    setBlock(nx, ny, 0);
  }

  if(block === 2){
    setBlock(nx, ny, 0);
    coal++;
  }

  player.x = nx;

  swing = !swing;
  shake = 2;
  moveCooldown = 7;

  updateHud();
}

function drawTile(x,y,type){

  const px = x * TILE;
  const py = y * TILE - cameraY;

  if(
    py < -TILE ||
    py > canvas.height + TILE
  ){
    return;
  }

  if(type === 0){

    ctx.fillStyle = "#080604";

    ctx.fillRect(
      px,
      py,
      TILE,
      TILE
    );

    return;
  }

  ctx.fillStyle = getColor(y);

  ctx.fillRect(
    px,
    py,
    TILE,
    TILE
  );

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(
    px,
    py + TILE - 4,
    TILE,
    4
  );

  ctx.fillRect(
    px + TILE - 3,
    py,
    3,
    TILE
  );

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(
    px + 3,
    py + 3,
    6,
    3
  );

  if(type === 2){

    ctx.fillStyle = "#0b0b0b";

    ctx.fillRect(
      px + 6,
      py + 6,
      10,
      8
    );

    ctx.fillRect(
      px + 10,
      py + 13,
      7,
      5
    );

    ctx.fillStyle = "#2d2d2d";

    ctx.fillRect(
      px + 8,
      py + 8,
      4,
      3
    );
  }

  if(type === 3){

    ctx.fillStyle = "#555";

    ctx.fillRect(
      px + 3,
      py + 3,
      18,
      18
    );

    ctx.fillStyle = "#888";

    ctx.fillRect(
      px + 5,
      py + 5,
      5,
      5
    );

    ctx.fillStyle = "#333";

    ctx.fillRect(
      px + 13,
      py + 12,
      6,
      6
    );
  }
}

function drawBackground(){

  ctx.fillStyle = "#060403";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  for(let i = 0; i < 18; i++){

    ctx.fillStyle =
      i % 2 === 0
        ? "#100b08"
        : "#0c0806";

    ctx.fillRect(
      0,
      i * 48 - (cameraY % 48),
      canvas.width,
      24
    );
  }
}

function drawDepthLines(){

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.font = "12px monospace";

  for(let y = 0; y < map.length; y += 25){

    const py = y * TILE - cameraY;

    if(py < 0 || py > canvas.height){
      continue;
    }

    ctx.fillRect(
      0,
      py,
      canvas.width,
      1
    );

    ctx.fillText(
      `${y * 2}m`,
      6,
      py - 4
    );
  }
}

function drawPlayer(){

  const img =
    swing
      ? swingImg
      : idleImg;

  const px =
    player.x * TILE - 34;

  const py =
    player.y * TILE
    - cameraY
    - 70;

  ctx.drawImage(
    img,
    px,
    py,
    96,
    96
  );
}

function loop(){

  if(!running){
    return;
  }

  time -= 1 / 60;

  if(time <= 0){
    endGame();
    return;
  }

  if(moveCooldown > 0){
    moveCooldown--;
  }

  if(leftPressed){
    move(-1);
  }

  if(rightPressed){
    move(1);
  }

  autoDigTimer++;

  const digInterval =
    depth < 300
      ? 10
      : depth < 700
        ? 9
        : 8;

  if(autoDigTimer >= digInterval){

    autoDigTimer = 0;
    digStep();
  }

  const targetCameraY =
    player.y * TILE
    - canvas.height * 0.35;

  cameraY +=
    (targetCameraY - cameraY)
    * 0.1;

  if(cameraY < 0){
    cameraY = 0;
  }

  ctx.save();

  if(shake > 0){

    ctx.translate(
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake
    );

    shake *= 0.8;
  }

  drawBackground();

  for(let y = 0; y < map.length; y++){

    for(let x = 0; x < COLS; x++){

      drawTile(
        x,
        y,
        map[y][x]
      );
    }
  }

  drawDepthLines();
  drawPlayer();

  ctx.restore();

  updateHud();

  requestAnimationFrame(loop);
}

function holdButton(btn,onStart,onEnd){

  btn.addEventListener(
    "touchstart",
    e=>{
      e.preventDefault();
      onStart();
    }
  );

  btn.addEventListener(
    "touchend",
    e=>{
      e.preventDefault();
      onEnd();
    }
  );

  btn.addEventListener(
    "touchcancel",
    e=>{
      e.preventDefault();
      onEnd();
    }
  );

  btn.addEventListener(
    "mousedown",
    e=>{
      e.preventDefault();
      onStart();
    }
  );

  btn.addEventListener(
    "mouseup",
    e=>{
      e.preventDefault();
      onEnd();
    }
  );

  btn.addEventListener(
    "mouseleave",
    e=>{
      e.preventDefault();
      onEnd();
    }
  );
}

holdButton(
  leftBtn,
  ()=> leftPressed = true,
  ()=> leftPressed = false
);

holdButton(
  rightBtn,
  ()=> rightPressed = true,
  ()=> rightPressed = false
);

window.addEventListener(
  "keydown",
  e=>{

    if(e.key === "ArrowLeft"){
      leftPressed = true;
    }

    if(e.key === "ArrowRight"){
      rightPressed = true;
    }
  }
);

window.addEventListener(
  "keyup",
  e=>{

    if(e.key === "ArrowLeft"){
      leftPressed = false;
    }

    if(e.key === "ArrowRight"){
      rightPressed = false;
    }
  }
);

startBtn.addEventListener(
  "click",
  startGame
);

retryBtn.addEventListener(
  "click",
  startGame
);

backBtn.addEventListener(
  "click",
  ()=>{

    running = false;
    bgm.pause();
    showScreen(titleScreen);
  }
);

homeBtn.addEventListener(
  "click",
  ()=>{

    location.href =
      "https://afoolhippo.github.io/home/?skipTitle=1";
  }
);

shareBtn.addEventListener(
  "click",
  ()=>{

    const text =
      `石炭掘って！⛏️\n` +
      `深度${depth}m\n` +
      `石炭${coal}個掘りました！\n` +
      `#カバゲーセン`;

    const url = location.href;

    window.open(
      "https://twitter.com/intent/tweet?text="
      + encodeURIComponent(text)
      + "&url="
      + encodeURIComponent(url),
      "_blank"
    );
  }
);