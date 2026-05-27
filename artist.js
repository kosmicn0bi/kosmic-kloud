import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
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

const params = new URLSearchParams(window.location.search);
const artistName = params.get("artist");

const artistTitle = document.getElementById("artist-name");
const artistSubtitle = document.getElementById("artist-page-subtitle");
const artistCount = document.getElementById("artist-count");
const artistSongList = document.getElementById("artist-song-list");

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadArtistPage() {
  if (!artistName) {
    artistTitle.innerText = "Artist Not Found";
    artistSubtitle.innerText = "This artist link is invalid.";
    artistCount.innerText = "";
    artistSongList.innerHTML = "";
    return;
  }

  artistTitle.innerText = "Loading...";
  artistSongList.innerHTML = `<p class="no-comments">Loading artist tracks...</p>`;

  try {
    const songsQuery = query(
      collection(db, "songs"),
      where("artist", "==", artistName)
    );

    const snapshot = await getDocs(songsQuery);

    const artistSongs = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .sort((a, b) => new Date(b.posted) - new Date(a.posted));

    renderArtistPage(artistSongs);
  } catch (error) {
    console.error("Artist failed to load:", error);
    artistTitle.innerText = artistName;
    artistCount.innerText = "Artist tracks could not load. Check Firebase rules.";
    artistSongList.innerHTML = "";
  }
}

function renderSocialIcon(url, icon, label) {
  if (!url) return "";

  return `
    <a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" class="social-icon">
      <img src="/assets/icons/${icon}.svg" alt="${label}">
    </a>
  `;
}

function renderArtistPage(artistSongs) {
  document.title = `${artistName} | Phase Sector`;
  artistTitle.innerText = artistName;

  if (artistSongs.length === 0) {
    artistCount.innerText = "No tracks found for this artist.";
    artistSongList.innerHTML = "";
    return;
  }

  const socials = artistSongs.find((song) => song.socials)?.socials || {};

  artistCount.innerHTML = `
    <div class="artist-socials">
      ${renderSocialIcon(socials.soundcloud, "soundcloud", "SoundCloud")}
      ${renderSocialIcon(socials.spotify, "spotify", "Spotify")}
      ${renderSocialIcon(socials.applemusic, "applemusic", "Apple Music")}
      ${renderSocialIcon(socials.youtube, "youtube", "YouTube")}
    </div>

    <span>${artistSongs.length} track${artistSongs.length === 1 ? "" : "s"} uploaded to Phase Sector</span>
  `;

  artistSongList.innerHTML = "";

  artistSongs.forEach((song) => {
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

    artistSongList.appendChild(card);
  });
}

loadArtistPage();
