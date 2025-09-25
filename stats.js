import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 Ten sam config co w index.html
const firebaseConfig = {
  apiKey: "AIzaSyAGIqIV-7oeMGa4EHGSQn-wGzo20jcL1aU",
  authDomain: "czolgi-online.firebaseapp.com",
  projectId: "czolgi-online",
  storageBucket: "czolgi-online.firebasestorage.app",
  messagingSenderId: "586260490520",
  appId: "1:586260490520:web:48ce8b963bc81c5779566d"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Gracze (statyczna lista)
const PLAYERS = ["Miłosz","Jakub","Kacper"];

// Funkcja startowa
async function loadStats() {
  const snap = await getDocs(collection(db,"Stats"));
  const docs = snap.docs.map(d=>({id:d.id,...d.data()}));

  // grupujemy według tierów
  ["VIII","IX","X"].forEach(tier=>{
    const tierDocs = docs.filter(d=>d.tier==tier);
    renderTier(tier, tierDocs);
  });
}

// Render dla jednego tieru
function renderTier(tier, docs) {
  const container = document.querySelector(`#tier${tier} .tier-container`);
  container.innerHTML="";

  if (docs.length===0) {
    container.innerHTML="<p>Brak danych.</p>";
    return;
  }

  // --- Największe wyniki ---
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Statystyka</th>
        <th>Najlepsze wyniki</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>DMG</td><td id="bestDMG${tier}"></td></tr>
      <tr><td>Fragi</td><td id="bestFrags${tier}"></td></tr>
      <tr><td>EXP</td><td id="bestEXP${tier}"></td></tr>
    </tbody>`;
  container.appendChild(table);

  showBest(docs,"dmg",document.getElementById(`bestDMG${tier}`));
  showBest(docs,"frags",document.getElementById(`bestFrags${tier}`));
  showBest(docs,"exp",document.getElementById(`bestEXP${tier}`));

  // --- Medale ---
  const medalStats = {};
  docs.forEach(d=>{
    (d.medals||[]).forEach(m=>{
      // nazwa medalu z pliku, np. epic_medal_snajper -> "snajper"
      const cleanName = m.name.replace(/^epic_medal_/,"").replace(/_/g," ");
      if (!medalStats[cleanName]) {
        medalStats[cleanName] = {};
        PLAYERS.forEach(p=>medalStats[cleanName][p]=0);
      }
      const owner = d.player || "?";
      if (medalStats[cleanName][owner]!==undefined) {
        medalStats[cleanName][owner]++;
      }
    });
  });

  const medalsGrid = document.createElement("div");
  medalsGrid.className="medals-grid";
  for (const [medal, players] of Object.entries(medalStats)) {
    const card = document.createElement("div");
    card.className="medal-card";

    const img = document.createElement("img");
    img.src=`https://raw.githubusercontent.com/Beaverossa/Mistrzostwa-Woli-w-WOT/main/medals/epic_medal_${medal.replace(/ /g,"_")}.png`;
    img.alt=medal;

    const info = document.createElement("div");
    info.className="medal-info";
    const title = document.createElement("h3");
    title.textContent=medal;
    info.appendChild(title);

    const playersDiv=document.createElement("div");
    playersDiv.className="medal-players";
    for (const p of PLAYERS) {
      const row=document.createElement("div");
      row.textContent=`${p}: ${players[p]}`;
      playersDiv.appendChild(row);
    }
    info.appendChild(playersDiv);

    card.appendChild(img);
    card.appendChild(info);
    medalsGrid.appendChild(card);
  }
  container.appendChild(medalsGrid);
}

// Wyświetlenie najlepszych wyników z obsługą remisów
function showBest(docs, field, targetEl) {
  const maxVal = Math.max(...docs.map(d=>d[field]||0));
  const bestDocs = docs.filter(d=>d[field]===maxVal);
  targetEl.innerHTML = bestDocs.map(d=>`${d.player||"?"}: ${maxVal}`).join("<br>");
}

// Start
loadStats().catch(err=>{
  console.error("Błąd ładowania:",err);
});
