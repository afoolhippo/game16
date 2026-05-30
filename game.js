const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const homeBtn = document.getElementById("homeBtn");
const shareBtn = document.getElementById("shareBtn");

const depthText = document.getElementById("depth");
const coalText = document.getElementById("coal");

const rankTitle = document.getElementById("rankTitle");
const rankImage = document.getElementById("rankImage");
const finalScore = document.getElementById("finalScore");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let depth;
let coal;
let gameOver;

const TILE = 32;

let player;

function startGame(){

titleScreen.classList.remove("active");
resultScreen.classList.remove("active");
gameScreen.classList.add("active");

depth = 0;
coal = 0;
gameOver = false;

player = {
x:5,
y:3
};

generateMap();

updateHUD();

requestAnimationFrame(loop);

}

let map=[];

function generateMap(){

map=[];

for(let y=0;y<50;y++){

let row=[];

for(let x=0;x<10;x++){

let r=Math.random();

if(r<0.12){
row.push("coal");
}
else if(r<0.18){
row.push("rock");
}
else{
row.push("soil");
}

}

map.push(row);

}

map[player.y][player.x]="empty";

}

function updateHUD(){

depthText.textContent = depth;
coalText.textContent = coal;

}

function loop(){

if(gameOver)return;

draw();

requestAnimationFrame(loop);

}

function draw(){

ctx.fillStyle="#8c6239";
ctx.fillRect(0,0,320,480);

for(let y=0;y<15;y++){

for(let x=0;x<10;x++){

let my=y+player.y-7;

if(my<0||my>=map.length) continue;

let tile=map[my][x];

if(tile==="soil"){
ctx.fillStyle="#a06d3f";
}

if(tile==="coal"){
ctx.fillStyle="#222";
}

if(tile==="rock"){
ctx.fillStyle="#777";
}

if(tile==="empty"){
ctx.fillStyle="#8c6239";
}

ctx.fillRect(
x*TILE,
y*TILE,
TILE-1,
TILE-1
);

}

}

ctx.fillStyle="pink";

ctx.fillRect(
player.x*TILE,
7*TILE,
TILE,
TILE
);

}

document.addEventListener("keydown",(e)=>{

if(gameOver)return;

let nx=player.x;
let ny=player.y;

if(e.key==="ArrowLeft") nx--;
if(e.key==="ArrowRight") nx++;
if(e.key==="ArrowDown") ny++;

move(nx,ny);

});

canvas.addEventListener("click",()=>{

if(gameOver)return;

move(player.x,player.y+1);

});

function move(nx,ny){

if(nx<0||nx>=10)return;
if(ny<0||ny>=50)return;

let tile=map[ny][nx];

if(tile==="rock"){

return;

}

if(tile==="coal"){
coal++;
}

map[ny][nx]="empty";

player.x=nx;
player.y=ny;

depth=Math.max(depth,ny);

updateHUD();

if(ny>=49){

finishGame();

}

}

function finishGame(){

gameOver=true;

gameScreen.classList.remove("active");
resultScreen.classList.add("active");

let title;
let image;

if(coal<20){

title="穴掘りビギナー";
image="rank_beginner.png";

}
else if(coal<50){

title="穴掘りキング";
image="rank_king.png";

}
else{

title="地底の住人";
image="rank_underground.png";

}

rankTitle.textContent=title;
rankImage.src=image;
finalScore.textContent=`石炭 ${coal}個`;

}

shareBtn.addEventListener("click",()=>{

const text=
`石炭を${coal}個掘った！⛏️🪨\n無料ブラウザゲーム「石炭掘って」\n#石炭掘って`;

window.open(
`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
);

});

retryBtn.addEventListener("click",startGame);

homeBtn.addEventListener("click",()=>{

resultScreen.classList.remove("active");
titleScreen.classList.add("active");

});

startBtn.addEventListener("click",startGame);