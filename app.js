import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

/* 🔥 KEEP YOUR FIREBASE CONFIG HERE */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* 🎵 SONGS */
const songs = [
  {
    id: "song1",
    title: "Point Blank",
    artist: "Kosmic Noize",
    description: "Independent underground drop.",
    audio: "song1.mp3",
    cover: "cover1.jpg"
  },
  {
    id: "song2",
    title: "Arc",
    artist: "Kosmic Noize",
    description: "Heavy electronic energy from the cloud.",
    audio: "ARC.mp3",
    cover: "Arcart.JPG"
  }
];

const songGrid = document.getElementById("song-grid");

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

let audio = new Audio();
let currentSongIndex = null;
let isPlaying = false;
let isShuffle = false;
let isLoop = false;
let lastCommentTime = 0;

/* FORMAT TIME */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");

  return `${min}:${sec}`;
}

/* PREVIEW LONG COMMENTS */
function previewText(text, limit = 60) {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) + "..." : text;
}

/* RANDOM USER FALLBACK */
function generateUserName() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `User ${randomNum}`;
}

/* RENDER SONGS */
songs.forEach((song, index) => {
  const card = document.createElement("article");
  card.className = "song-card";
  card.dataset.index = index;

  card.innerHTML = `
    <img class="cover" src="${song.cover}" alt="${song.title} cover">

    <div class="song-content">
      <h3 class="song-title">${song.title}</h3>
      <p class="artist">${song.artist}</p>
      <p class="description">${song.description}</p>

      <div class="waveform-wrap" data-index="${index}">
        <div class="wave-progress"></div>
      </div>

      <div class="time-row">
        <span class="current-time">0:00</span>
        <span class="duration">0:00</span>
      </div>

      <div class="stats">
        <span class="plays">▶ 0 plays</span>
        <span class="likes">♡ 0 likes</span>
      </div>

      <div class="buttons">
        <button class="play-btn">▶ Play</button>
        <button class="like-btn">♡ Like</button>
        <button class="comment-toggle-btn">💬 Comment</button>
        <button class="share-btn">↗ Share</button>
      </div>

      <div class="comment-box">
        <p class="comment-box-title">Comment at <span class="comment-at-time">0:00</span></p>

        <input class="comment-name" type="text" placeholder="Name optional" maxlength="20">
        <textarea class="comment-text" placeholder="Write a comment..." maxlength="250"></textarea>

        <button class="post-comment-btn">Post Comment</button>
      </div>

      <div class="comments-list"></div>
    </div>
  `;

  songGrid.appendChild(card);

  loadStats(song.id, card);
  loadComments(song.id, card, index);
});

/* LOAD STATS */
async function loadStats(songId, card) {
  const songRef = doc(db, "songs", songId);
  const snapshot = await getDoc(songRef);

  if (snapshot.exists()) {
    const data = snapshot.data();

    card.querySelector(".plays").textContent = `▶ ${data.plays || 0} plays`;
    card.querySelector(".likes").textContent = `♡ ${data.likes || 0} likes`;
  }
}

/* PLAY SONG */
function playSong(index) {
  const song = songs[index];
  const wasSameSong = currentSongIndex === index;

  if (wasSameSong && isPlaying) {
    audio.pause();
    return;
  }

  if (!wasSameSong) {
    audio.src = song.audio;
    currentSongIndex = index;
    addPlay(song.id);
  }

  audio.play();

  miniPlayer.classList.remove("hidden");
  miniCover.src = song.cover;
  miniTitle.textContent = song.title;
  miniArtist.textContent = song.artist;

  updateActiveCard();
}

/* ADD PLAY */
async function addPlay(songId) {
  const songRef = doc(db, "songs", songId);

  try {
    await updateDoc(songRef, {
      plays: increment(1)
    });

    const card = document.querySelector(`[data-index="${currentSongIndex}"]`);
    loadStats(songId, card);
  } catch (error) {
    console.error("Error updating plays:", error);
  }
}

/* LIKE SONG */
async function likeSong(songId, card) {
  const likedKey = `liked-${songId}`;

  if (localStorage.getItem(likedKey)) {
    alert("You already liked this track.");
    return;
  }

  const songRef = doc(db, "songs", songId);

  try {
    await updateDoc(songRef, {
      likes: increment(1)
    });

    localStorage.setItem(likedKey, "true");
    loadStats(songId, card);
  } catch (error) {
    console.error("Error liking song:", error);
  }
}

/* ACTIVE CARD */
function updateActiveCard() {
  document.querySelectorAll(".song-card").forEach((card) => {
    card.classList.remove("active");
  });

  if (currentSongIndex !== null) {
    const currentCard = document.querySelector(`[data-index="${currentSongIndex}"]`);
    currentCard.classList.add("active");
  }
}

/* BUTTON EVENTS */
document.querySelectorAll(".song-card").forEach((card) => {
  const index = Number(card.dataset.index);
  const song = songs[index];

  const playBtn = card.querySelector(".play-btn");
  const likeBtn = card.querySelector(".like-btn");
  const shareBtn = card.querySelector(".share-btn");
  const commentToggleBtn = card.querySelector(".comment-toggle-btn");
  const commentBox = card.querySelector(".comment-box");
  const commentAtTime = card.querySelector(".comment-at-time");
  const postCommentBtn = card.querySelector(".post-comment-btn");
  const nameInput = card.querySelector(".comment-name");
  const textInput = card.querySelector(".comment-text");
  const waveform = card.querySelector(".waveform-wrap");

  playBtn.addEventListener("click", () => {
    playSong(index);
  });

  likeBtn.addEventListener("click", () => {
    likeSong(song.id, card);
  });

  shareBtn.addEventListener("click", async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied.");
    } catch {
      alert("Copy this link: " + url);
    }
  });

  commentToggleBtn.addEventListener("click", () => {
    if (currentSongIndex !== index) {
      playSong(index);
    }

    commentBox.classList.toggle("open");
    commentAtTime.textContent = formatTime(audio.currentTime);
    textInput.focus();
  });

  postCommentBtn.addEventListener("click", async () => {
    const now = Date.now();

    if (now - lastCommentTime < 30000) {
      alert("Wait 30 seconds before commenting again.");
      return;
    }

    let name = nameInput.value.trim();
    let text = textInput.value.trim();

    if (!text) {
      alert("Write a comment first.");
      return;
    }

    if (!name) {
      name = generateUserName();
    }

    const commentTime = currentSongIndex === index ? audio.currentTime : 0;

    try {
      await addDoc(collection(db, "songs", song.id, "comments"), {
        name,
        text,
        time: commentTime,
        createdAt: serverTimestamp()
      });

      lastCommentTime = now;
      textInput.value = "";
      commentBox.classList.remove("open");
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Comment failed. Try again.");
    }
  });

  waveform.addEventListener("click", (event) => {
    if (!audio.duration || currentSongIndex !== index) return;

    const rect = waveform.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;

    audio.currentTime = percent * audio.duration;
  });
});

/* LOAD COMMENTS */
function loadComments(songId, card, index) {
  const commentsList = card.querySelector(".comments-list");
  const waveform = card.querySelector(".waveform-wrap");

  const q = query(
    collection(db, "songs", songId, "comments"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    commentsList.innerHTML = "";

    waveform.querySelectorAll(".comment-marker").forEach((marker) => {
      marker.remove();
    });

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const time = data.time || 0;
      const name = data.name || "User 00000";
      const text = data.text || "";

      const commentEl = document.createElement("div");
      commentEl.className = "comment";

      commentEl.innerHTML = `
        <div class="comment-top">
          <span class="comment-time">${formatTime(time)}</span>
          <span class="comment-user">${name}</span>
        </div>
        <p>${previewText(text, 70)}</p>
      `;

      commentEl.querySelector(".comment-time").addEventListener("click", () => {
        playSong(index);
        audio.currentTime = time;
      });

      commentsList.appendChild(commentEl);

      const marker = document.createElement("span");
      marker.className = "comment-marker";
      marker.dataset.preview = `${name}: ${previewText(text, 45)}`;

      marker.style.left = "0%";

      marker.addEventListener("click", (event) => {
        event.stopPropagation();
        playSong(index);
        audio.currentTime = time;
      });

      marker.dataset.time = time;
      waveform.appendChild(marker);
    });

    updateCommentMarkers();
  });
}

/* UPDATE COMMENT MARKER POSITIONS */
function updateCommentMarkers() {
  document.querySelectorAll(".song-card").forEach((card) => {
    const index = Number(card.dataset.index);
    const markers = card.querySelectorAll(".comment-marker");

    markers.forEach((marker) => {
      const time = Number(marker.dataset.time || 0);

      if (audio.duration && currentSongIndex === index) {
        const percent = Math.min((time / audio.duration) * 100, 100);
        marker.style.left = `${percent}%`;
      } else {
        marker.style.left = "0%";
      }
    });
  });
}

/* AUDIO EVENTS */
audio.addEventListener("play", () => {
  isPlaying = true;
  miniPlayBtn.textContent = "⏸";

  document.querySelectorAll(".play-btn").forEach((btn, index) => {
    btn.textContent = index === currentSongIndex ? "⏸ Pause" : "▶ Play";
  });
});

audio.addEventListener("pause", () => {
  isPlaying = false;
  miniPlayBtn.textContent = "▶";

  document.querySelectorAll(".play-btn").forEach((btn) => {
    btn.textContent = "▶ Play";
  });
});

audio.addEventListener("loadedmetadata", () => {
  const card = document.querySelector(`[data-index="${currentSongIndex}"]`);

  if (card) {
    card.querySelector(".duration").textContent = formatTime(audio.duration);
  }

  updateCommentMarkers();
});

audio.addEventListener("timeupdate", () => {
  if (currentSongIndex === null || !audio.duration) return;

  const percent = (audio.currentTime / audio.duration) * 100;

  miniProgressBar.style.width = `${percent}%`;

  const card = document.querySelector(`[data-index="${currentSongIndex}"]`);

  if (card) {
    card.querySelector(".wave-progress").style.width = `${percent}%`;
    card.querySelector(".current-time").textContent = formatTime(audio.currentTime);

    const commentAtTime = card.querySelector(".comment-at-time");
    if (commentAtTime) {
      commentAtTime.textContent = formatTime(audio.currentTime);
    }
  }
});

audio.addEventListener("ended", () => {
  if (isLoop) {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  playNextSong();
});

/* MINI PLAYER CONTROLS */
miniPlayBtn.addEventListener("click", () => {
  if (currentSongIndex === null) return;

  if (isPlaying) {
    audio.pause();
  } else {
    audio.play();
  }
});

miniProgress.addEventListener("click", (event) => {
  if (!audio.duration) return;

  const rect = miniProgress.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;

  audio.currentTime = percent * audio.duration;
});

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;

  if (isShuffle) {
    isLoop = false;
    loopBtn.classList.remove("active");
  }

  shuffleBtn.classList.toggle("active", isShuffle);
});

loopBtn.addEventListener("click", () => {
  isLoop = !isLoop;

  if (isLoop) {
    isShuffle = false;
    shuffleBtn.classList.remove("active");
  }

  loopBtn.classList.toggle("active", isLoop);
});

/* NEXT SONG */
function playNextSong() {
  if (songs.length <= 1) return;

  let nextIndex;

  if (isShuffle) {
    do {
      nextIndex = Math.floor(Math.random() * songs.length);
    } while (nextIndex === currentSongIndex);
  } else {
    nextIndex = (currentSongIndex + 1) % songs.length;
  }

  playSong(nextIndex);
}
