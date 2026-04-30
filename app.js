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
  },
  {
    id: "song2",
    title: "ARC",
    artist: "Kosmic Noize",
    file: "songs/ARC.mp3",
    cover: "covers/Arcart.JPG",
    description: "Arc — second drop."
  }
];

const songList = document.getElementById("song-list");
const players = {};
const playCounted = {};

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

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

        <audio id="media-${song.id}" src="${song.file}" preload="metadata"></audio>
        <div id="waveform-${song.id}" class="waveform"></div>

        <div class="time-row">
          <span id="current-${song.id}">0:00</span>
          <span id="duration-${song.id}">0:00</span>
        </div>

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
  const audioElement = document.getElementById(`media-${song.id}`);

  const wave = WaveSurfer.create({
    container: `#waveform-${song.id}`,
    media: audioElement,
    waveColor: "#8a8fa8",
    progressColor: "#00d9ff",
    cursorColor: "#ffffff",
    height: 60,
    barWidth: 2,
    barGap: 2,
    barRadius: 2
  });

  wave.on("ready", () => {
    document.getElementById(`duration-${song.id}`).innerText =
      formatTime(wave.getDuration());
  });

  wave.on("timeupdate", () => {
    document.getElementById(`current-${song.id}`).innerText =
      formatTime(wave.getCurrentTime());
  });

  wave.on("play", async () => {
    document.getElementById(`play-btn-${song.id}`).innerText = "⏸ Pause";

    setupMediaSession(song);

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
    document.getElementById(`current-${song.id}`).innerText = "0:00";
    playCounted[song.id] = false;
  });

  players[song.id] = wave;
}

function setupMediaSession(song) {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    album: "Kosmic Kloud",
    artwork: [
      { src: song.cover, sizes: "512x512", type: "image/jpeg" }
    ]
  });

  navigator.mediaSession.setActionHandler("play", () => players[song.id].play());
  navigator.mediaSession.setActionHandler("pause", () => players[song.id].pause());
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
