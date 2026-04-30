import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

const songs = [
  {
    id: "song1",
    title: "My First Track",
    artist: "Kosmic Noize",
    file: "songs/song1.mp3",
    cover: "covers/cover1.jpg",
    description: "First official Kosmic Kloud test drop."
  }

  /*
  ,
  {
    id: "song2",
    title: "Track Name",
    artist: "Friend Name",
    file: "songs/song2.mp3",
    cover: "covers/cover2.jpg",
    description: "Optional description here."
  }
  */
];

const songList = document.getElementById("song-list");
const players = {};
const playCounted = {};

function renderSongs() {
  songList.innerHTML = "";

  songs.forEach((song) => {
    const card = document.createElement("article");
    card.className = "song-card";

    card.innerHTML = `
      <img class="cover" src="${song.cover}" alt="${song.title} cover art">

      <div class="song-content">
        <h3 class="song-title">${song.title}</h3>
        <p class="artist">${song.artist}</p>
        <p class="description">${song.description || ""}</p>

        <div id="waveform-${song.id}" class="waveform"></div>

        <div class="stats">
          <span id="plays-${song.id}">Plays: 0</span>
          <span id="likes-${song.id}">Likes: 0</span>
          <span id="shares-${song.id}">Shares: 0</span>
        </div>

        <div class="buttons">
          <button id="play-btn-${song.id}" onclick="playSong('${song.id}')">▶ Play</button>
          <button onclick="likeSong('${song.id}')">❤️ Like</button>
          <button onclick="shareSong('${song.id}', '${song.title}', '${song.artist}')">🔁 Share</button>
        </div>
      </div>
    `;

    songList.appendChild(card);
    initWaveform(song);
    loadStats(song.id);
  });
}

function initWaveform(song) {
  const wave = WaveSurfer.create({
    container: `#waveform-${song.id}`,
    waveColor: "#8a8fa8",
    progressColor: "#00d9ff",
    cursorColor: "#ffffff",
    height: 70,
    barWidth: 2,
    barGap: 2,
    barRadius: 2,
    responsive: true
  });

  wave.load(song.file);

  wave.on("play", async () => {
    document.getElementById(`play-btn-${song.id}`).innerText = "⏸ Pause";

    if (!playCounted[song.id]) {
      playCounted[song.id] = true;
      await increaseStat(song.id, "plays");
      await loadStats(song.id);
    }
  });

  wave.on("pause", () => {
    document.getElementById(`play-btn-${song.id}`).innerText = "▶ Play";
  });

  wave.on("finish", () => {
    document.getElementById(`play-btn-${song.id}`).innerText = "▶ Play";
    playCounted[song.id] = false;
  });

  players[song.id] = wave;
}

async function ensureSongDoc(songId) {
  const songRef = doc(db, "songs", songId);
  const snap = await getDoc(songRef);

  if (!snap.exists()) {
    await setDoc(songRef, {
      plays: 0,
      likes: 0,
      shares: 0
    });
  }

  return songRef;
}

async function increaseStat(songId, field) {
  const songRef = await ensureSongDoc(songId);

  await updateDoc(songRef, {
    [field]: increment(1)
  });
}

async function loadStats(songId) {
  const songRef = await ensureSongDoc(songId);
  const snap = await getDoc(songRef);
  const data = snap.data();

  document.getElementById(`plays-${songId}`).innerText = `Plays: ${data.plays || 0}`;
  document.getElementById(`likes-${songId}`).innerText = `Likes: ${data.likes || 0}`;
  document.getElementById(`shares-${songId}`).innerText = `Shares: ${data.shares || 0}`;
}

window.playSong = (songId) => {
  Object.keys(players).forEach((id) => {
    if (id !== songId) {
      players[id].pause();
      document.getElementById(`play-btn-${id}`).innerText = "▶ Play";
    }
  });

  players[songId].playPause();
};

window.likeSong = async (songId) => {
  const likedKey = `liked_${songId}`;

  if (localStorage.getItem(likedKey)) {
    alert("You already liked this track on this device.");
    return;
  }

  await increaseStat(songId, "likes");
  localStorage.setItem(likedKey, "true");
  await loadStats(songId);
};

window.shareSong = async (songId, title, artist) => {
  const shareData = {
    title: `${title} by ${artist} on Kosmic Kloud`,
    text: `Listen to ${title} by ${artist} on Kosmic Kloud`,
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }

    await increaseStat(songId, "shares");
    await loadStats(songId);
  } catch (error) {
    console.log("Share cancelled or failed:", error);
  }
};

renderSongs();
