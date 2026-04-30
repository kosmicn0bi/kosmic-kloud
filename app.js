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
  apiKey: "YOUR KEY",
  authDomain: "kosmic-kloud.firebaseapp.com",
  projectId: "kosmic-kloud"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const songs = [
  {
    id: "song1",
    title: "My First Track",
    artist: "Kosmic Noize",
    file: "songs/song1.mp3",
    cover: "covers/cover1.jpg"
  },
  {
    id: "song2",
    title: "ARC",
    artist: "Kosmic Noize",
    file: "songs/ARC.mp3",
    cover: "covers/Arcart.JPG"
  }
];

const players = {};
let currentSongId = null;

const miniPlayer = document.getElementById("mini-player");
const miniCover = document.getElementById("mini-cover");
const miniTitle = document.getElementById("mini-title");
const miniPlayBtn = document.getElementById("mini-play-btn");
const miniProgressBar = document.getElementById("mini-progress-bar");

function renderSongs() {
  const list = document.getElementById("song-list");
  list.innerHTML = "";

  songs.forEach((song) => {
    const card = document.createElement("div");
    card.className = "song-card";
    card.id = `card-${song.id}`;

    card.innerHTML = `
      <img class="cover" src="${song.cover}">
      <div>
        <h3>${song.title}</h3>
        <button onclick="playSong('${song.id}')">Play</button>
        <audio id="audio-${song.id}" src="${song.file}"></audio>
      </div>
    `;

    list.appendChild(card);

    const audio = document.getElementById(`audio-${song.id}`);

    audio.addEventListener("timeupdate", () => {
      if (currentSongId === song.id) {
        const progress = (audio.currentTime / audio.duration) * 100;
        miniProgressBar.style.width = progress + "%";
      }
    });

    audio.addEventListener("ended", () => {
      document.getElementById(`card-${song.id}`).classList.remove("active");
    });

    players[song.id] = audio;
  });
}

window.playSong = (id) => {
  Object.keys(players).forEach((songId) => {
    players[songId].pause();
    document.getElementById(`card-${songId}`).classList.remove("active");
  });

  players[id].play();
  currentSongId = id;

  document.getElementById(`card-${id}`).classList.add("active");

  const song = songs.find(s => s.id === id);
  miniPlayer.classList.remove("hidden");
  miniCover.src = song.cover;
  miniTitle.innerText = song.title;
};

miniPlayBtn.addEventListener("click", () => {
  if (!currentSongId) return;

  const player = players[currentSongId];
  if (player.paused) {
    player.play();
  } else {
    player.pause();
  }
});

renderSongs();
