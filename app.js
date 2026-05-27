import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
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

const songList = document.getElementById("song-list");

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadSongs() {
  songList.innerHTML = `<p class="no-comments">Loading tracks...</p>`;

  try {
    const songsQuery = query(collection(db, "songs"), orderBy("posted", "desc"));
    const snapshot = await getDocs(songsQuery);

    if (snapshot.empty) {
      songList.innerHTML = `<p class="no-comments">No tracks uploaded yet.</p>`;
      return;
    }

    const songs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    renderSongs(songs);
  } catch (error) {
    console.error("Songs failed to load:", error);
    songList.innerHTML = `<p class="no-comments">Tracks could not load. Check Firebase rules.</p>`;
  }
}

function renderSongs(songs) {
  songList.innerHTML = "";

  songs.forEach((song) => {
    const card = document.createElement("article");
    card.className = "song-card";

    card.innerHTML = `
      <img class="cover" src="${escapeHTML(song.cover)}" alt="${escapeHTML(song.title)} cover art">

      <div class="song-content">
        <h3 class="song-title">${escapeHTML(song.title)}</h3>

        <a class="artist artist-link" href="artist.html?artist=${encodeURIComponent(song.artist || "")}">
          ${escapeHTML(song.artist)}
        </a>

        <p class="description">${escapeHTML(song.description)}</p>
        <p class="posted-date">Posted: ${escapeHTML(song.posted)}</p>

        <div class="buttons">
          <a class="button-link" href="track.html?id=${encodeURIComponent(song.id)}">View Track</a>
        </div>
      </div>
    `;

    songList.appendChild(card);
  });
}

loadSongs();
