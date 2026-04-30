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
    description: "Hey — Dont Shoot!"
  }
];

const songList = document.getElementById("song-list");
const players = {};
const playCounted = {};

let currentSongId = null;
let currentVolume = 1;
let shuffleEnabled = false;
let loopEnabled = false;

const miniPlayer = document.getElementById("mini-player");
const miniCover = document.getElementById("mini-cover");
const miniTitle = document.getElementById("mini-title");
const miniArtist = document.getElementById("mini-artist");
const miniPlayBtn = document.getElementById("mini-play-btn");
const miniProgress = document.getElementById("mini-progress");
const miniProgressBar = document.getElementById("mini-progress-bar");
const volumeSlider = document.getElementById("volume-slider");
const shuffleBtn = document.getElementById("shuffle-btn");
const loopBtn = document.getElementById("loop-btn");

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function setActiveCard(songId) {
  document.querySelectorAll(".song-card").forEach((card) => {
    card.classList.remove("active");
  });

  const activeCard = document.getElementById(`card-${songId}`);
  if (activeCard) activeCard.classList.add("active");
}

function clearActiveCard(songId) {
  const card = document.getElementById(`card-${songId}`);
  if (card) card.classList.remove("active");
}

function updateMiniPlayer(song, isPlaying = true) {
  currentSongId = song.id;

  miniPlayer.classList.remove("hidden");
  miniCover.src = song.cover;
  miniTitle.innerText = song.title;
  miniArtist.innerText = song.artist;
  miniPlayBtn.innerText = isPlaying ? "⏸" : "▶";
}

function applyVolumeToAllPlayers() {
  Object.keys(players).forEach((id) => {
    players[id].setVolume(currentVolume);
  });
}

/* 🔥 FIXED LOOP + SHUFFLE LOGIC */
function getNextSong(currentId) {
  const currentIndex = songs.findIndex((s) => s.id === currentId);

  // 🔁 LOOP = repeat same song
  if (loopEnabled) {
    return songs[currentIndex];
  }

  // 🔀 SHUFFLE = random track
  if (shuffleEnabled && songs.length > 1) {
    let randomIndex;

    do {
      randomIndex = Math.floor(Math.random() * songs.length);
    } while (songs[randomIndex].id === currentId);

    return songs[randomIndex];
  }

  // ▶ NORMAL NEXT
  const nextSong = songs[currentIndex + 1];
  return nextSong || null;
}

function playSpecificSong(songId) {
  Object.keys(players).forEach((id) => {
    if (id !== songId) {
      players[id].pause();
      document.getElementById(`play-btn-${id}`).innerText = "▶ Play";
      clearActiveCard(id);
    }
  });

  players[songId].play();
}

function renderSongs() {
  songList.innerHTML = "";

  songs.forEach((song) => {
    const card = document.createElement("article");
    card.className = "song-card";
    card.id = `card-${song.id}`;

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

  wave.setVolume(currentVolume);

  wave.on("ready", () => {
    document.getElementById(`duration-${song.id}`).innerText =
      formatTime(wave.getDuration());
  });

  wave.on("timeupdate", () => {
    document.getElementById(`current-${song.id}`).innerText =
      formatTime(wave.getCurrentTime());

    if (currentSongId === song.id) {
      const progress = (wave.getCurrentTime() / wave.getDuration()) * 100;
      miniProgressBar.style.width = progress + "%";
    }
  });

  wave.on("play", async () => {
    document.getElementById(`play-btn-${song.id}`).innerText = "⏸ Pause";

    updateMiniPlayer(song, true);
    setActiveCard(song.id);

    if (!playCounted[song.id]) {
      playCounted[song.id] = true;
      await increaseStat(song.id, "plays");
      await loadStats(song.id);
    }
  });

  wave.on("pause", () => {
    document.getElementById(`play-btn-${song.id}`).innerText = "▶ Play";

    if (currentSongId === song.id) {
      updateMiniPlayer(song, false);
      clearActiveCard(song.id);
    }
  });

  wave.on("finish", () => {
    clearActiveCard(song.id);

    const nextSong = getNextSong(song.id);

    if (nextSong) {
      setTimeout(() => {
        playSpecificSong(nextSong.id);
      }, 300);
    } else {
      updateMiniPlayer(song, false);
    }
  });

  players[song.id] = wave;
}

/* BUTTONS */
window.playSong = (songId) => {
  Object.keys(players).forEach((id) => {
    if (id !== songId) {
      players[id].pause();
      clearActiveCard(id);
    }
  });

  players[songId].playPause();
};

miniPlayBtn.addEventListener("click", () => {
  if (!currentSongId) return;
  players[currentSongId].playPause();
});

miniProgress.addEventListener("click", (e) => {
  if (!currentSongId) return;

  const rect = miniProgress.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;

  players[currentSongId].seekTo(percent);
});

volumeSlider.addEventListener("input", () => {
  currentVolume = Number(volumeSlider.value) / 100;
  applyVolumeToAllPlayers();
});

/* 🔀 SHUFFLE */
shuffleBtn.addEventListener("click", () => {
  shuffleEnabled = !shuffleEnabled;
  shuffleBtn.classList.toggle("active", shuffleEnabled);
});

/* 🔁 LOOP */
loopBtn.addEventListener("click", () => {
  loopEnabled = !loopEnabled;
  loopBtn.classList.toggle("active", loopEnabled);
});

renderSongs();
