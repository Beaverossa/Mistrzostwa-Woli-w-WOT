const fileInput = document.getElementById("fileInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const analyzeBtn = document.getElementById("analyzeBtn");

const dmgInput = document.getElementById("dmgInput");
const fragsInput = document.getElementById("fragsInput");
const medalsInput = document.getElementById("medalsInput");
const statusEl = document.getElementById("status");

let image = null;

// Początkowe ramki (w %)
let rects = {
  dmg:   { x:0.25, y:0.92, w:0.10, h:0.05, color:"yellow" },
  frags: { x:0.22, y:0.92, w:0.03, h:0.05, color:"red" },
  medals:{ x:0.24, y:0.25, w:0.35, h:0.10, color:"lime" }
};

let active = null; // {key, mode: 'move'|'resize', corner}
let offsetX=0, offsetY=0;
const HANDLE_SIZE = 8; // px

// Wczytanie obrazu
fileInput.addEventListener("change", e=>{
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = ()=>{
    image = img;
    canvas.width = img.width/2;
    canvas.height = img.height/2;
    draw();
  };
  img.src = url;
});

// Rysowanie obrazu + ramek + uchwytów
function draw() {
  if (!image) return;
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  ctx.font="12px Arial";
  for (const key in rects) {
    const r = rects[key];
    const x = r.x*canvas.width, y = r.y*canvas.height;
    const w = r.w*canvas.width, h = r.h*canvas.height;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x,y,w,h);
    ctx.fillStyle=r.color;
    ctx.fillText(key.toUpperCase(), x+4, y+12);
    // uchwyty
    drawHandle(x,y);
    drawHandle(x+w,y);
    drawHandle(x,y+h);
    drawHandle(x+w,y+h);
  }
}
function drawHandle(x,y){
  ctx.fillRect(x-HANDLE_SIZE/2,y-HANDLE_SIZE/2,HANDLE_SIZE,HANDLE_SIZE);
}

// Obsługa myszy
canvas.addEventListener("mousedown", e=>{
  const mx = e.offsetX, my = e.offsetY;
  for (const key in rects) {
    const r = rects[key];
    const x = r.x*canvas.width, y = r.y*canvas.height;
    const w = r.w*canvas.width, h = r.h*canvas.height;

    // sprawdź rogi
    const corners = [
      {cx:x,cy:y,corner:"tl"},
      {cx:x+w,cy:y,corner:"tr"},
      {cx:x,cy:y+h,corner:"bl"},
      {cx:x+w,cy:y+h,corner:"br"}
    ];
    for (const c of corners) {
      if (Math.abs(mx-c.cx)<HANDLE_SIZE && Math.abs(my-c.cy)<HANDLE_SIZE) {
        active={key,mode:"resize",corner:c.corner};
        return;
      }
    }
    // sprawdź środek
    if (mx>=x && mx<=x+w && my>=y && my<=y+h) {
      active={key,mode:"move"};
      offsetX=mx-x; offsetY=my-y;
      return;
    }
  }
});
canvas.addEventListener("mousemove", e=>{
  if (!active) return;
  const mx=e.offsetX,my=e.offsetY;
  const r=rects[active.key];
  const x0=r.x*canvas.width,y0=r.y*canvas.height;
  const w0=r.w*canvas.width,h0=r.h*canvas.height;

  if (active.mode==="move") {
    r.x=(mx-offsetX)/canvas.width;
    r.y=(my-offsetY)/canvas.height;
  } else if (active.mode==="resize") {
    let x=x0,y=y0,w=w0,h=h0;
    if (active.corner==="tl"){ w+=(x-mx); h+=(y-my); x=mx; y=my; }
    if (active.corner==="tr"){ w=(mx-x); h+=(y-my); y=my; }
    if (active.corner==="bl"){ w+=(x-mx); h=(my-y); x=mx; }
    if (active.corner==="br"){ w=(mx-x); h=(my-y); }
    r.x=x/canvas.width; r.y=y/canvas.height;
    r.w=w/canvas.width; r.h=h/canvas.height;
  }
  draw();
});
canvas.addEventListener("mouseup",()=>active=null);

// Parser dla DMG (obsługuje 1,234 → 1234)
function parseDMGText(text) {
  if (!text) return null;
  let cleaned = text.replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  return parseInt(cleaned, 10);
}

// OCR
analyzeBtn.addEventListener("click", async ()=>{
  if (!image) { statusEl.textContent="Brak obrazu."; return; }
  statusEl.textContent="Analiza...";

  // DMG
  const dmgCrop = cropRect(rects.dmg);
  const { data:{ text:dmgText }} = await Tesseract.recognize(
    dmgCrop,'eng',{ tessedit_char_whitelist:'0123456789,.' }
  );
  dmgInput.value = parseDMGText(dmgText) || "";

  // Fragi
  const fragsCrop = cropRect(rects.frags);
  const { data:{ text:fragText }} = await Tesseract.recognize(
    fragsCrop,'eng',{ tessedit_char_whitelist:'0123456789' }
  );
  fragsInput.value = parseInt(fragText)||"";

  // Medale (demo)
  medalsInput.value = "Rozpoznane medale (demo)";

  statusEl.textContent="Analiza zakończona.";
});

function cropRect(r) {
  const sx = r.x*image.width;
  const sy = r.y*image.height;
  const sw = r.w*image.width;
  const sh = r.h*image.height;

  const c = document.createElement("canvas");
  c.width = sw; c.height = sh;
  c.getContext("2d").drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
  return c;
}
