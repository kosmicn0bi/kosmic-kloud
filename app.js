import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCHfRvoY_hQfGWvDDsmSwtJ91wDbVuMdGk",
  authDomain: "kosmic-kloud.firebaseapp.com",
  projectId: "kosmic-kloud",
  storageBucket: "kosmic-kloud.firebasestorage.app",
  messagingSenderId: "288726984724",
  appId: "1:288726984724:web:4d5b236ab5565fe6a49f01"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🎧 SONG LIST (ADD MORE HERE)
const songs = [
  {
    id: "song1",
    title: "My First Track",
    artist: "Kosmic Noize",
    file: "songs/song1.mp3",
    cover: "covers/cover1.jpg",
    description: "First official Kosmic Kloud test drop."
  }

  // 👉 Add more songs like this:
  /*
  ,
  {
    id: "song2",
    title: "Track Name",
    artist: "Friend Name",
    file: "songs/song2.mp3",
    cover: "covers/cover2.jpg",
    description: "Optional description"
  }
  */
];

const songList = document.getElementById("song-list");

// 🎨 RENDER SONG CARDS
function renderSongs() {
  songList.innerHTML = "";

  songs.forEach((song) => {
    const card = document.createElement("div");
    card.className = "song-card";

    card.innerHTML = `
      <img class="cover" src="${song.cover}" />

      <div class="song-content">
        <h3 class="song-title">${song.title}</h3>
        <p class="artist">${song.artist}</p>
        <p class="description">${song.description || ""}</p>

        <audio id="audio-${song.id}" controls>
          <source src="${song.file}?v=1" type="audio/mpeg">
        </audio>

        <div class="stats">
          <span id="plays-${song.id}">Plays: 0</span>
          <span id="likes-${song.id}">Likes: 0</span>
          <span id="shares-${song.id}">Shares: 0</span>
        </div>

        <div class="buttons">
          <button onclick="likeSong('${song.id}')">❤️ Like</button>
          <button onclick="shareSong('${song.id}', '${song.title}', '${song.artist}')">🔁 Share</button>
        </div>
      </div>
    `;

    songList.appendChild(card);

    const audio = document.getElementById(`audio-${song.id}`);

    audio.addEventListener("play", async () => {
      await increaseStat(song.id, "plays");
      await loadStats(song.id);
    });

    loadStats(song.id);
  });
}

// 📦 ENSURE FIRESTORE DOC EXISTS
async function ensureSongDoc(songId) {
  const ref = doc(db, "songs", songId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      plays: 0,
      likes: 0,
      shares: 0
    });
  }

  return ref;
}

// 📊 INCREASE STAT
async function increaseStat(songId, field) {
  const ref = await ensureSongDoc(songId);

  await updateDoc(ref, {
    [field]: increment(1)
  });
}

// 📊 LOAD STATS
async function loadStats(songId) {
  const ref = await ensureSongDoc(songId);
  const snap = await getDoc(ref);
  const data = snap.data();

  document.getElementById(`plays-${songId}`).innerText =
    `Plays: ${data.plays || 0}`;

  document.getElementById(`likes-${songId}`).innerText =
    `Likes: ${data.likes || 0}`;

  document.getElementById(`shares-${songId}`).innerText =
    `Shares: ${data.shares || 0}`;
}

// ❤️ LIKE BUTTON
window.likeSong = async (songId) => {
  const key = `liked_${songId}`;

  if (localStorage.getItem(key)) {
    alert("You already liked this track");
    return;
  }

  await increaseStat(songId, "likes");
  localStorage.setItem(key, "true");
  await loadStats(songId);
};

// 🔁 SHARE BUTTON
window.shareSong = async (songId, title, artist) => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: `${title} - ${artist}`,
        url: window.location.href
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }

    await increaseStat(songId, "shares");
    await loadStats(songId);
  } catch (err) {
    console.log("Share cancelled");
  }
};

// 🚀 INIT
renderSongs();
