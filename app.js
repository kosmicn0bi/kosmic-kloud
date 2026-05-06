import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
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
const commentUnsubs = {};

let currentSongId = null;
let currentVolume = 1;
let shuffleEnabled = false;
let loopEnabled = false;
let lastCommentTime = 0;

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

function previewText(text, limit = 70) {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) + "..." : text;
}

function generateUserName() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `User ${randomNum}`;
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

function getNextSong(currentId) {
  const currentIndex = songs.findIndex((s) => s.id === currentId);

  if (loopEnabled) {
    return songs[currentIndex];
  }

  if (shuffleEnabled && songs.length > 1) {
    let randomIndex;

    do {
      randomIndex = Math.floor(Math.random() * songs.length);
    } while (songs[randomIndex].id === currentId);

    return songs[randomIndex];
  }

  return songs[currentIndex + 1] || null;
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

        <div class="waveform-wrap">
          <div id="waveform-${song.id}" class="waveform"></div>
          <div id="comment-markers-${song.id}" class="comment-markers"></div>
        </div>

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
          <button onclick="openCommentBox('${song.id}')">💬 Comment</button>
        </div>

        <div id="comment-box-${song.id}" class="comment-box">
          <p class="comment-box-title">
            Comment at <span id="comment-time-${song.id}">0:00</span>
          </p>

          <input
            id="comment-name-${song.id}"
            class="comment-name"
            type="text"
            placeholder="Name optional"
            maxlength="20"
          />

          <textarea
            id="comment-text-${song.id}"
            class="comment-text"
            placeholder="Write a comment..."
            maxlength="250"
          ></textarea>

          <button onclick="postComment('${song.id}')">Post Comment</button>
        </div>

        <div id="comments-list-${song.id}" class="comments-list"></div>
      </div>
    `;

    songList.appendChild(card);
    initWaveform(song);
    loadStats(song.id);
    loadComments(song.id);
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

    renderCommentMarkers(song.id);
  });

  wave.on("timeupdate", () => {
    document.getElementById(`current-${song.id}`).innerText =
      formatTime(wave.getCurrentTime());

    const commentTime = document.getElementById(`comment-time-${song.id}`);
    if (commentTime) {
      commentTime.innerText = formatTime(wave.getCurrentTime());
    }

    if (currentSongId === song.id) {
      const duration = wave.getDuration();
      const currentTime = wave.getCurrentTime();

      if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        miniProgressBar.style.width = progress + "%";
      }
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
    document.getElementById(`play-btn-${song.id}`).innerText = "▶ Play";
    document.getElementById(`current-${song.id}`).innerText = "0:00";
    playCounted[song.id] = false;
    clearActiveCard(song.id);

    if (currentSongId === song.id) {
      miniProgressBar.style.width = "0%";
    }

    const nextSong = getNextSong(song.id);

    if (nextSong && players[nextSong.id]) {
      setTimeout(() => {
        playSpecificSong(nextSong.id);
      }, 400);
    } else {
      updateMiniPlayer(song, false);
    }
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

function getSongById(songId) {
  return songs.find((song) => song.id === songId);
}

window.playSong = (songId) => {
  Object.keys(players).forEach((id) => {
    if (id !== songId) {
      players[id].pause();
      document.getElementById(`play-btn-${id}`).innerText = "▶ Play";
      clearActiveCard(id);
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

window.openCommentBox = (songId) => {
  const box = document.getElementById(`comment-box-${songId}`);
  const textInput = document.getElementById(`comment-text-${songId}`);
  const timeLabel = document.getElementById(`comment-time-${songId}`);

  if (!box || !players[songId]) return;

  box.classList.toggle("open");
  timeLabel.innerText = formatTime(players[songId].getCurrentTime());

  if (box.classList.contains("open")) {
    textInput.focus();
  }
};

window.postComment = async (songId) => {
  const now = Date.now();

  if (now - lastCommentTime < 30000) {
    alert("Wait 30 seconds before commenting again.");
    return;
  }

  const nameInput = document.getElementById(`comment-name-${songId}`);
  const textInput = document.getElementById(`comment-text-${songId}`);
  const box = document.getElementById(`comment-box-${songId}`);

  let name = nameInput.value.trim();
  const text = textInput.value.trim();

  if (!text) {
    alert("Write a comment first.");
    return;
  }

  if (!name) {
    name = generateUserName();
  }

  const time = players[songId] ? players[songId].getCurrentTime() : 0;

  try {
    await addDoc(collection(db, "songs", songId, "comments"), {
      name,
      text,
      time,
      createdAt: serverTimestamp()
    });

    lastCommentTime = now;
    textInput.value = "";
    box.classList.remove("open");
  } catch (error) {
    console.error("Error posting comment:", error);
    alert("Comment failed. Try again.");
  }
};

function loadComments(songId) {
  if (commentUnsubs[songId]) {
    commentUnsubs[songId]();
  }

  const commentsQuery = query(
    collection(db, "songs", songId, "comments"),
    orderBy("createdAt", "desc")
  );

  commentUnsubs[songId] = onSnapshot(commentsQuery, (snapshot) => {
    const commentsList = document.getElementById(`comments-list-${songId}`);

    if (!commentsList) return;

    commentsList.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const comment = document.createElement("div");
      comment.className = "comment";

      const top = document.createElement("div");
      top.className = "comment-top";

      const time = document.createElement("span");
      time.className = "comment-time";
      time.innerText = formatTime(data.time || 0);
      time.addEventListener("click", () => {
        if (players[songId]) {
          playSpecificSong(songId);
          players[songId].setTime(data.time || 0);
        }
      });

      const user = document.createElement("span");
      user.className = "comment-user";
      user.innerText = data.name || "User 00000";

      const text = document.createElement("p");
      text.innerText = previewText(data.text || "", 80);

      top.appendChild(time);
      top.appendChild(user);

      comment.appendChild(top);
      comment.appendChild(text);

      commentsList.appendChild(comment);
    });

    renderCommentMarkers(songId, snapshot);
  });
}

async function renderCommentMarkers(songId, snapshotFromListener = null) {
  const markerWrap = document.getElementById(`comment-markers-${songId}`);
  const wave = players[songId];

  if (!markerWrap || !wave) return;

  markerWrap.innerHTML = "";

  const duration = wave.getDuration();

  if (!duration || duration <= 0) return;

  if (snapshotFromListener) {
    snapshotFromListener.forEach((docSnap) => {
      createCommentMarker(songId, docSnap.data(), duration);
    });

    return;
  }

  const commentsQuery = query(
    collection(db, "songs", songId, "comments"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(commentsQuery, (snapshot) => {
    markerWrap.innerHTML = "";

    snapshot.forEach((docSnap) => {
      createCommentMarker(songId, docSnap.data(), duration);
    });
  });
}

function createCommentMarker(songId, data, duration) {
  const markerWrap = document.getElementById(`comment-markers-${songId}`);
  const time = data.time || 0;
  const percent = Math.min(Math.max((time / duration) * 100, 0), 100);

  const marker = document.createElement("button");
  marker.className = "comment-marker";
  marker.style.left = `${percent}%`;
  marker.title = `${data.name || "User 00000"}: ${previewText(data.text || "", 60)}`;

  marker.addEventListener("click", (event) => {
    event.stopPropagation();

    if (players[songId]) {
      playSpecificSong(songId);
      players[songId].setTime(time);
    }
  });

  markerWrap.appendChild(marker);
}

miniPlayBtn.addEventListener("click", () => {
  if (!currentSongId || !players[currentSongId]) return;

  players[currentSongId].playPause();
});

miniProgress.addEventListener("click", (e) => {
  if (!currentSongId || !players[currentSongId]) return;

  const rect = miniProgress.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;

  players[currentSongId].seekTo(percent);
});

volumeSlider.addEventListener("input", () => {
  currentVolume = Number(volumeSlider.value) / 100;
  applyVolumeToAllPlayers();
});

shuffleBtn.addEventListener("click", () => {
  shuffleEnabled = !shuffleEnabled;

  if (shuffleEnabled) {
    loopEnabled = false;
    loopBtn.classList.remove("active");
  }

  shuffleBtn.classList.toggle("active", shuffleEnabled);
});

loopBtn.addEventListener("click", () => {
  loopEnabled = !loopEnabled;

  if (loopEnabled) {
    shuffleEnabled = false;
    shuffleBtn.classList.remove("active");
  }

  loopBtn.classList.toggle("active", loopEnabled);
});

renderSongs();
