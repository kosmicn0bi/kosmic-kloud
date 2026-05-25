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
    title: "Stepbro Chill",
    artist: "Kosmic Noize",
    file: "songs/song1.mp3",
    cover: "covers/cover1.jpg",
    description: "What the hell is even that?!",
    posted: "2026-05-24"
  },
  {
    id: "song2",
    title: "ARC",
    artist: "Kosmic Noize",
    file: "songs/ARC.mp3",
    cover: "covers/Arcart.JPG",
    description: "Hey — Dont Shoot!",
    posted: "2026-05-25"
  }
];

const params = new URLSearchParams(window.location.search);
const songId = params.get("id");
const song = songs.find((s) => s.id === songId);

const trackPage = document.getElementById("track-page");
const pageTitle = document.getElementById("track-page-title");
const pageArtist = document.getElementById("track-page-artist");

let wave;
let playCounted = false;

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
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

  document.getElementById("track-plays").innerText = `Plays: ${data.plays || 0}`;
  document.getElementById("track-likes").innerText = `Likes: ${data.likes || 0}`;
  document.getElementById("track-shares").innerText = `Shares: ${data.shares || 0}`;
}

function renderTrack() {
  if (!song) {
    pageTitle.innerText = "Track Not Found";
    pageArtist.innerText = "This track link is invalid.";
    trackPage.innerHTML = `<p class="description">Go back to the homepage and choose a track.</p>`;
    return;
  }

  document.title = `${song.title} | Phase Sector`;
  pageTitle.innerText = song.title;
  pageArtist.innerText = song.artist;

  trackPage.innerHTML = `
    <img class="track-cover" src="${song.cover}" alt="${song.title} cover art">

    <div class="track-info">
      <h2>${song.title}</h2>
      <p class="artist">${song.artist}</p>
      <p class="description">${song.description}</p>
      <p class="posted-date">Posted: ${song.posted}</p>

      <audio id="track-audio" src="${song.file}" preload="metadata"></audio>
      <div id="track-waveform" class="waveform"></div>

      <div class="time-row">
        <span id="current-time">0:00</span>
        <span id="duration-time">0:00</span>
      </div>

      <div class="stats">
        <span id="track-plays">Plays: 0</span>
        <span id="track-likes">Likes: 0</span>
        <span id="track-shares">Shares: 0</span>
      </div>

      <div class="buttons">
        <button id="play-btn">▶ Play</button>
        <button id="like-btn">❤️ Like</button>
        <button id="share-btn">🔁 Share</button>
      </div>
    </div>
  `;

  initWaveform();
  loadStats(song.id);
}

function initWaveform() {
  const audioElement = document.getElementById("track-audio");
  const playBtn = document.getElementById("play-btn");

  wave = WaveSurfer.create({
    container: "#track-waveform",
    media: audioElement,
    waveColor: "#555b62",
    progressColor: "#00ffd0",
    cursorColor: "#ffffff",
    height: 70,
    barWidth: 2,
    barGap: 2,
    barRadius: 2
  });

  wave.on("ready", () => {
    document.getElementById("duration-time").innerText = formatTime(wave.getDuration());
  });

  wave.on("timeupdate", () => {
    document.getElementById("current-time").innerText = formatTime(wave.getCurrentTime());
  });

  wave.on("play", async () => {
    playBtn.innerText = "⏸ Pause";

    if (!playCounted) {
      playCounted = true;
      await increaseStat(song.id, "plays");
      await loadStats(song.id);
    }
  });

  wave.on("pause", () => {
    playBtn.innerText = "▶ Play";
  });

  wave.on("finish", () => {
    playBtn.innerText = "▶ Play";
    document.getElementById("current-time").innerText = "0:00";
    playCounted = false;
  });

  playBtn.addEventListener("click", () => {
    wave.playPause();
  });

  document.getElementById("like-btn").addEventListener("click", likeSong);
  document.getElementById("share-btn").addEventListener("click", shareSong);
}

async function likeSong() {
  const likedKey = `liked_${song.id}`;

  if (localStorage.getItem(likedKey)) {
    alert("You already liked this track on this device.");
    return;
  }

  await increaseStat(song.id, "likes");
  localStorage.setItem(likedKey, "true");
  await loadStats(song.id);
}

async function shareSong() {
  const shareData = {
    title: `${song.title} by ${song.artist} on Phase Sector`,
    text: `Listen to ${song.title} by ${song.artist} on Phase Sector`,
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Track link copied!");
    }

    await increaseStat(song.id, "shares");
    await loadStats(song.id);
  } catch (error) {
    console.log("Share cancelled or failed:", error);
  }
}

renderTrack();
