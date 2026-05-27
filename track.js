import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
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

function getRandomUserName() {
  return `User ${Math.floor(1000 + Math.random() * 9000)}`;
}

function getOwnerToken() {
  let token = localStorage.getItem("phase_sector_comment_owner_token");

  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("phase_sector_comment_owner_token", token);
  }

  return token;
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

      <a class="artist artist-link" href="artist.html?artist=${encodeURIComponent(song.artist)}">
        ${song.artist}
      </a>

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

      <section class="comments-section">
        <h3>Comments</h3>

        <div class="comment-form">
          <input id="comment-name" type="text" placeholder="Name optional" maxlength="30" />
          <textarea id="comment-text" placeholder="Leave a comment..." maxlength="300"></textarea>
          <button id="comment-btn">Post Comment</button>
        </div>

        <div id="comments-list" class="comments-list"></div>
      </section>
    </div>
  `;

  initWaveform();
  loadStats(song.id);
  loadComments();

  document.getElementById("comment-btn").addEventListener("click", postComment);
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

async function postComment() {
  const nameInput = document.getElementById("comment-name");
  const textInput = document.getElementById("comment-text");

  const name = nameInput.value.trim() || getRandomUserName();
  const text = textInput.value.trim();
  const ownerToken = getOwnerToken();

  if (!text) {
    alert("Write a comment first.");
    return;
  }

  try {
    await addDoc(collection(db, "songs", song.id, "comments"), {
      name: name,
      text: text,
      ownerToken: ownerToken,
      createdAt: serverTimestamp()
    });

    nameInput.value = "";
    textInput.value = "";

    await loadComments();
  } catch (error) {
    console.error("Comment failed:", error);
    alert("Comment could not be posted. Check Firebase rules.");
  }
}

async function loadComments() {
  const commentsList = document.getElementById("comments-list");
  commentsList.innerHTML = `<p class="no-comments">Loading comments...</p>`;

  try {
    const commentsRef = collection(db, "songs", song.id, "comments");
    const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(commentsQuery);
    const ownerToken = getOwnerToken();

    if (snapshot.empty) {
      commentsList.innerHTML = `<p class="no-comments">No comments yet. Be the first.</p>`;
      return;
    }

    commentsList.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const comment = docSnap.data();
      const commentId = docSnap.id;
      const canDelete = comment.ownerToken === ownerToken;

      const commentCard = document.createElement("div");
      commentCard.className = "comment-card";

      commentCard.innerHTML = `
        <div class="comment-header">
          <strong>${comment.name || "User"}</strong>
          ${canDelete ? `<button class="delete-comment-btn" data-comment-id="${commentId}">Delete</button>` : ""}
        </div>
        <p>${comment.text}</p>
      `;

      commentsList.appendChild(commentCard);
    });

    document.querySelectorAll(".delete-comment-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const commentId = button.getAttribute("data-comment-id");
        await deleteComment(commentId);
      });
    });
  } catch (error) {
    console.error("Comments failed to load:", error);
    commentsList.innerHTML = `<p class="no-comments">Comments could not load. Check Firebase rules.</p>`;
  }
}

async function deleteComment(commentId) {
  const confirmDelete = confirm("Delete your comment?");

  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "songs", song.id, "comments", commentId));
    await loadComments();
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Comment could not be deleted.");
  }
}

renderTrack();
