const GAME_ID = "game16";
const GAME_TITLE = "石炭掘って";

const SUPABASE_URL =
  "https://gmncxnybsovlallxgnkd.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_ly3h5OhL8HDSHhYdmJq_Fw_9pG3mhla";

const kabaDb = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

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

const titleScreen =
  document.getElementById("titleScreen");

const gameScreen =
  document.getElementById("gameScreen");

const resultScreen =
  document.getElementById("resultScreen");

const startBtn =
  document.getElementById("startBtn");

const retryBtn =
  document.getElementById("retryBtn");

const shareBtn =
  document.getElementById("shareBtn");

const registerBtn =
  document.getElementById("registerBtn");

const homeBtn =
  document.getElementById("homeBtn");

const backBtn =
  document.getElementById("backBtn");

const titleImage =
  document.getElementById("titleImage");

const leftBtn =
  document.getElementById("leftBtn");

const rightBtn =
  document.getElementById("rightBtn");

const depthText =
  document.getElementById("depthText");

const coalText =
  document.getElementById("coalText");

const timeText =
  document.getElementById("timeText");

const resultTitle =
  document.getElementById("resultTitle");

const resultComment =
  document.getElementById("resultComment");

const resultImage =
  document.getElementById("resultImage");

const resultScore =
  document.getElementById("resultScore");

const resultButtons =
  document.getElementById("resultButtons");

const canvas =
  document.getElementById("gameCanvas");

const ctx =
  canvas.getContext("2d");

const bgm =
  document.getElementById("bgm");

const seDig =
  document.getElementById("seDig");

const seGet =
  document.getElementById("seGet");

seDig.volume = 0.3;
seGet.volume = 0.3;

const idleImg = new Image();
idleImg.src = "player_idle.png";

const swingImg = new Image();
swingImg.src = "player_swing.png";

const TILE = 24;
const COLS = 15;
const MAP_ROWS = 320;

let map = [];

let player = {
  x:7,
  y:0
};

let cameraY = 0;

let coal = 0;
let depth = 0;
let time = 60;

let lastTitle = "";
let lastScore = 0;

let scoreRegistered = false;

let running = false;

let leftPressed = false;
let rightPressed = false;

let shake = 0;
let autoDigTimer = 0;
let moveCooldown = 0;

let swing = false;
let rockSePlayed = false;

function playSound(audio){

  audio.currentTime = 0;
  audio.play().catch(()=>{});
}

function showScreen(screen){

  titleScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  resultScreen.classList.remove("active");

  screen.classList.add("active");
}

function showResultButtonsLater(){

  resultButtons.classList.add("hidden");

  setTimeout(
    ()=>{
      resultButtons.classList.remove("hidden");
    },
    1500
  );
}

function resetRegisterState(){

  scoreRegistered = false;

  registerBtn.disabled = false;
  registerBtn.textContent = "記録を登録";

  resultButtons.classList.add("hidden");
}

function generateMap(){

  map = [];

  for(let y=0;y<MAP_ROWS;y++){

    const row = [];

    for(let x=0;x<COLS;x++){

      if(y < 2){
        row.push(0);
        continue;
      }

      const r = Math.random();

      let coalRate =
        0.14 + y * 0.0005;

      if(coalRate > 0.28){
        coalRate = 0.28;
      }

      let rockRate =
        0.08 + y * 0.00035;

      if(rockRate > 0.18){
        rockRate = 0.18;
      }

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

  resetRegisterState();

  generateMap();

  player.x = 7;
  player.y = 0;

  cameraY = 0;

  coal = 0;
  depth = 0;
  time = 60;

  lastTitle = "";
  lastScore = 0;

  shake = 0;
  autoDigTimer = 0;
  moveCooldown = 0;

  swing = false;
  rockSePlayed = false;

  leftPressed = false;
  rightPressed = false;

  running = true;

  updateHud();

  showScreen(gameScreen);

  bgm.currentTime = 0;
  bgm.volume = 0.45;
  bgm.play().catch(()=>{});

  requestAnimationFrame(loop);
}

function endGame(){

  if(!running){
    return;
  }

  running = false;
  bgm.pause();

  let title =
    "穴掘りビギナー";

  let comment =
    "まだ地上に帰れる。";

  let image =
    "result_bad.png";

  if(depth >= 300){

    title =
      "穴掘りキング";

    comment =
      "石炭がちょっと好きになってきた。";

    image =
      "result_normal.png";
  }

  if(depth >= 700){

    title =
      "地底人";

    comment =
      "もう太陽を見ていない。";

    image =
      "result_good.png";
  }

  lastTitle = title;
  lastScore = depth + coal * 10;

  resultTitle.textContent = title;
  resultComment.textContent = comment;
  resultImage.src = image;

  resultScore.innerHTML =
    `深度 ${depth}m<br>` +
    `石炭 ${coal}個<br>` +
    `総合 ${lastScore}点`;

  showScreen(resultScreen);
  showResultButtonsLater();
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

  if(!map[y]){
    return 0;
  }

  return map[y][x];
}

function setBlock(x,y,value){

  if(!map[y]){
    return;
  }

  map[y][x] = value;
}

function digStep(){

  const belowY = player.y + 1;
  const belowX = player.x;

  const block =
    getBlock(belowX, belowY);

  if(block === 3){

    shake = 2;

    if(!rockSePlayed){
      playSound(seDig);
      rockSePlayed = true;
    }

    return;
  }

  rockSePlayed = false;

  if(block === 1){

    setBlock(belowX, belowY, 0);
  }

  if(block === 2){

    setBlock(belowX, belowY, 0);

    coal++;

    playSound(seGet);
  }

  player.y++;

  depth =
    Math.max(
      depth,
      player.y * 2
    );

  swing = !swing;
  shake = 4;

  updateHud();
}

function move(dx){

  if(moveCooldown > 0){
    return;
  }

  const nx = player.x + dx;
  const ny = player.y;

  if(nx < 0) return;
  if(nx >= COLS) return;

  const block =
    getBlock(nx, ny);

  if(block === 3){

    shake = 2;

    if(!rockSePlayed){
      playSound(seDig);
      rockSePlayed = true;
    }

    moveCooldown = 5;

    return;
  }

  rockSePlayed = false;

  if(block === 1){

    setBlock(nx, ny, 0);
  }

  if(block === 2){

    setBlock(nx, ny, 0);

    coal++;

    playSound(seGet);
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

    ctx.fillStyle = "#2b2017";

    ctx.fillRect(
      px,
      py,
      TILE,
      TILE
    );

    return;
  }

  ctx.fillStyle =
    getColor(y);

  ctx.fillRect(
    px,
    py,
    TILE,
    TILE
  );

  ctx.fillStyle =
    "rgba(0,0,0,0.22)";

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
  }

  if(type === 3){

    ctx.fillStyle = "#555";

    ctx.fillRect(
      px + 3,
      py + 3,
      18,
      18
    );

    ctx.fillStyle = "#777";

    ctx.fillRect(
      px + 6,
      py + 6,
      5,
      5
    );
  }
}

function drawBackground(){

  ctx.fillStyle = "#3a271b";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );
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

  time -= 1/60;

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

  if(autoDigTimer >= 10){

    autoDigTimer = 0;
    digStep();
  }

  const targetCameraY =
    player.y * TILE
    - canvas.height * 0.35;

  cameraY +=
    (
      targetCameraY - cameraY
    ) * 0.1;

  if(cameraY < 0){
    cameraY = 0;
  }

  ctx.save();

  if(shake > 0){

    ctx.translate(
      (Math.random()-0.5) * shake,
      (Math.random()-0.5) * shake
    );

    shake *= 0.8;
  }

  drawBackground();

  for(let y=0;y<map.length;y++){

    for(let x=0;x<COLS;x++){

      drawTile(
        x,
        y,
        map[y][x]
      );
    }
  }

  drawPlayer();

  ctx.restore();

  updateHud();

  requestAnimationFrame(loop);
}

function holdButton(
  btn,
  onStart,
  onEnd
){

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

function startFromTitle(e){

  if(e){
    e.preventDefault();
  }

  if(running){
    return;
  }

  startGame();
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

startBtn.addEventListener(
  "click",
  startFromTitle
);

titleImage.addEventListener(
  "click",
  startFromTitle
);

titleImage.addEventListener(
  "touchstart",
  startFromTitle
);

retryBtn.addEventListener(
  "click",
  ()=>{

    running = false;
    bgm.pause();

    showScreen(titleScreen);
  }
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
      `気づいたら\n` +
      `ずっと石炭を掘っていた。⛏️🪨\n\n` +
      `深度 ${depth}m\n` +
      `石炭 ${coal}個\n\n` +
      `無料ブラウザゲーム\n` +
      `「石炭掘って」\n` +
      `https://afoolhippo.github.io/game16/\n\n` +
      `#石炭掘って\n` +
      `#カバゲーセン`;

    window.open(
      "https://twitter.com/intent/tweet?text="
      + encodeURIComponent(text),
      "_blank"
    );
  }
);

registerBtn.addEventListener(
  "click",
  async ()=>{

    if(scoreRegistered){

      alert("この記録は登録済みです");
      return;
    }

    const nickname = prompt(
      "ニックネームを入力してね",
      "匿名カバ"
    );

    if(!nickname){
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "登録中...";

    const { error } =
      await kabaDb
        .from("kaba_scores")
        .insert({
          game_id: GAME_ID,
          game_title: GAME_TITLE,
          nickname: nickname,
          rank_title: lastTitle,
          score: lastScore
        });

    if(error){

      console.error(error);

      registerBtn.disabled = false;
      registerBtn.textContent = "記録を登録";

      alert("登録に失敗しました");

      return;
    }

    scoreRegistered = true;

    registerBtn.textContent = "登録済み";

    alert("記録を登録しました！");
  }
);