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

let active = null;
let offsetX=0, offsetY=0;
const HANDLE_SIZE = 8;

// --- LISTA MEDALI ---
const medalsDB = [
  { file: "epic_medal_bilottes_medal_109x134.png", name: "Bilottes Medal" },
  { file: "epic_medal_de_langlades_medal_134x145.png", name: "De Langlades Medal" },
  { file: "epic_medal_radley-walters_medal_150x179.png", name: "Radley-Walters Medal" },
  { file: "epic_medal_yoshio_tamada_151x157.png", name: "Yoshio Tamada" },
  { file: "epic_medals_fadins_medal_150x150.png", name: "Fadins Medal" },
  { file: "epic_medals_halonens_medal_150x157.png", name: "Halonens Medal" },
  { file: "epic_medals_kolobanovs_medal_150x149.png", name: "Kolobanovs Medal" },
  { file: "epic_medals_lehvasiaihos_medal_127x110.png", name: "Lehvasiaihos Medal" },
  { file: "epic_medals_nicols_medal_150x151.png", name: "Nicols Medal" },
  { file: "epic_medals_orliks_medal_150x156.png", name: "Orliks Medal" },
  { file: "epic_medals_pools_medal_119x141.png", name: "Pools Medal" },
  { file: "epic_medals_starks_medal_150x140.png", name: "Starks Medal" },
  { file: "epic_medals_tarczays_medal_136x146.png", name: "Tarczays Medal" },
  { file: "honorary_ranks_brunos_medal_132x132.png", name: "Brunos Medal" },
  { file: "honorary_ranks_burdas_medal_119x160.png", name: "Burdas Medal" },
  { file: "honorary_ranks_dumitrus_medal_135x127.png", name: "Dumitrus Medal" },
  { file: "honorary_ranks_gores_medal_141x139.png", name: "Gores Medal" },
  { file: "honorary_ranks_naydins_medal_141x151.png", name: "Naydins Medal" },
  { file: "honorary_ranks_oskins_medal_126x144.png", name: "Oskins Medal" },
  { file: "honorary_ranks_pascuccis_medal_126x128.png", name: "Pascuccis Medal" },
  { file: "honorary_ranks_raseiniai_heroes_medal_152x141.png", name: "Raseiniai Heroes Medal" }
];

const baseUrl = "https://raw.githubusercontent.com/Beaverossa/Mistrzostwa-Woli-w-WOT/main/medals/";
const medalImages = {};
for (const m of medalsDB) {
  const img = new Image();
  img.src = baseUrl + m.file;
  medalImages[m.name] = img;
}

// --- IMAGE COMPARE ---
function compareImages(img1, img2, size=32) {
  const c1=document.createElement("canvas"), c2=document.createElement("canvas");
  c1.width=c2.width=size; c1.height=c2.height=size;
  c1.getContext("2d").drawImage(img1,0,0,size,size);
  c2.getContext("2d").drawImage(img2,0,0,size,size);

  const d1=c1.getContext("2d").getImageData(0,0,size,size).data;
  const d2=c2.getContext("2d").getImageData(0,0,size,size).data;

  let diff=0;
  for (let i=0;i<d1.length;i+=4){
    diff+=Math.abs(d1[i]-d2[i]);
    diff+=Math.abs(d1[i+1]-d2[i+1]);
    diff+=Math.abs(d1[i+2]-d2[i+2]);
  }
  const maxDiff=255*3*(d1.length/4);
  return 1-diff/maxDiff;
}

// --- Wczytanie obrazu ---
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

// --- Rysowanie ---
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
    drawHandle(x,y); drawHandle(x+w,y); drawHandle(x,y+h); drawHandle(x+w,y+h);
  }
}
function drawHandle(x,y){ ctx.fillRect(x-HANDLE_SIZE/2,y-HANDLE_SIZE/2,HANDLE_SIZE,HANDLE_SIZE); }

// --- Obsługa myszy ---
canvas.addEventListener("mousedown", e=>{
  const mx = e.offsetX, my = e.offsetY;
  for (const key in rects) {
    const r = rects[key];
    const x = r.x*canvas.width, y = r.y*canvas.height;
    const w = r.w*canvas.width, h = r.h*canvas.height;
    const corners = [
      {cx:x,cy:y,corner:"tl"},{cx:x+w,cy:y,corner:"tr"},
      {cx:x,cy:y+h,corner:"bl"},{cx:x+w,cy:y+h,corner:"br"}
    ];
    for (const c of corners) {
      if (Math.abs(mx-c.cx)<HANDLE_SIZE && Math.abs(my-c.cy)<HANDLE_SIZE) {
        active={key,mode:"resize",corner:c.corner}; return;
      }
    }
    if (mx>=x && mx<=x+w && my>=y && my<=y+h) {
      active={key,mode:"move"}; offsetX=mx-x; offsetY=my-y; return;
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
    r.x=(mx-offsetX)/canvas.width; r.y=(my-offsetY)/canvas.height;
  } else if (active.mode==="resize") {
    let x=x0,y=y0,w=w0,h=h0;
    if (active.corner==="tl"){ w+=(x-mx); h+=(y-my); x=mx; y=my; }
    if (active.corner==="tr"){ w=(mx-x); h+=(y-my); y=my; }
    if (active.corner==="bl"){ w+=(x-mx); h=(my-y); x=mx; }
    if (active.corner==="br"){ w=(mx-x); h=(my-y); }
    r.x=x/canvas.width; r.y=y/canvas.height; r.w=w/canvas.width; r.h=h/canvas.height;
  }
  draw();
});
canvas.addEventListener("mouseup",()=>active=null);

// --- Parser DMG ---
function parseDMGText(text) {
  if (!text) return null;
  let cleaned = text.replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  return parseInt(cleaned, 10);
}

// --- OCR + MEDALS ---
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

  // Medale – porównanie grafiki
  const medalCrop = cropRect(rects.medals);
  const medalSize = 64;
  const found=[];
  for (let x=0; x<medalCrop.width; x+=medalSize) {
    const sub=document.createElement("canvas");
    sub.width=sub.height=medalSize;
    sub.getContext("2d").drawImage(medalCrop,x,0,medalSize,medalSize,0,0,medalSize,medalSize);
    for (const m of medalsDB) {
      const ref=medalImages[m.name];
      if (!ref.complete) continue;
      const sim=compareImages(sub, ref);
      if (sim>0.85) { found.push(m.name); break; }
    }
  }
  medalsInput.value = found.length?found.join(", "):"Brak rozpoznanych medali";

  statusEl.textContent="Analiza zakończona.";
});

// --- Crop funkcja ---
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