import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  deleteDoc,
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

// Change this password after testing.
const ADMIN_PASSWORD = "NOBiNOiZE25@";

const loginBox = document.getElementById("admin-login");
const adminPanel = document.getElementById("admin-panel");
const passwordInput = document.getElementById("admin-password");
const rememberAdmin = document.getElementById("remember-admin");
const loginBtn = document.getElementById("login-btn");
const addTrackBtn = document.getElementById("add-track-btn");
const statusText = document.getElementById("admin-status");
const adminTrackList = document.getElementById("admin-track-list");

const postedInput = document.getElementById("song-posted");
postedInput.valueAsDate = new Date();

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function unlockAdmin() {
  if (passwordInput.value !== ADMIN_PASSWORD) {
    alert("Wrong password.");
    return;
  }

  if (rememberAdmin && rememberAdmin.checked) {
    localStorage.setItem("phase_sector_admin_unlocked", "true");
  } else {
    localStorage.removeItem("phase_sector_admin_unlocked");
  }

  loginBox.classList.add("hidden-admin");
  adminPanel.classList.remove("hidden-admin");

  loadAdminTracks();
}

async function addTrack() {
  const title = getValue("song-title");
  const artist = getValue("artist-name-input");
  const file = getValue("song-file");
  const cover = getValue("song-cover");
  const posted = getValue("song-posted");
  const description = getValue("song-description");

  if (!title || !artist || !file || !cover || !posted) {
    alert("Please fill out title, artist, MP3 path, cover path, and posted date.");
    return;
  }

  const id = slugify(`${artist}-${title}`);

  const songData = {
    title,
    artist,
    file,
    cover,
    description,
    posted,
    plays: 0,
    likes: 0,
    shares: 0,
    socials: {
      soundcloud: getValue("artist-soundcloud"),
      spotify: getValue("artist-spotify"),
      applemusic: getValue("artist-applemusic"),
      youtube: getValue("artist-youtube")
    },
    createdAt: serverTimestamp()
  };

  try {
    statusText.innerText = "Adding track...";

    await setDoc(doc(db, "songs", id), songData, { merge: true });

    statusText.innerHTML = `Track added. <a class="artist-link" href="track.html?id=${encodeURIComponent(id)}">View Track</a>`;

    document.getElementById("song-title").value = "";
    document.getElementById("song-file").value = "";
    document.getElementById("song-cover").value = "";
    document.getElementById("song-description").value = "";

    await loadAdminTracks();
  } catch (error) {
    console.error("Add track failed:", error);
    statusText.innerText = "Track could not be added. Check Firebase rules.";
  }
}

async function loadAdminTracks() {
  if (!adminTrackList) return;

  adminTrackList.innerHTML = "<p>Loading tracks...</p>";

  try {
    const songsRef = collection(db, "songs");
    const songsQuery = query(songsRef, orderBy("posted", "desc"));
    const snapshot = await getDocs(songsQuery);

    if (snapshot.empty) {
      adminTrackList.innerHTML = "<p>No tracks found.</p>";
      return;
    }

    adminTrackList.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const song = docSnap.data();
      const songId = docSnap.id;

      const item = document.createElement("div");
      item.className = "admin-track-item";

      item.innerHTML = `
        <div>
          <strong>${song.title}</strong>
          <p>${song.artist}</p>
        </div>

        <button class="delete-track-btn" data-id="${songId}">
          Delete
        </button>
      `;

      adminTrackList.appendChild(item);
    });

    document.querySelectorAll(".delete-track-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const songId = button.getAttribute("data-id");

        const confirmDelete = confirm(
          "Delete this track from Phase Sector? This will not delete the MP3 or artwork from GitHub."
        );

        if (!confirmDelete) return;

        await deleteDoc(doc(db, "songs", songId));

        alert("Track deleted.");

        await loadAdminTracks();
      });
    });
  } catch (error) {
    console.error("Load admin tracks failed:", error);
    adminTrackList.innerHTML = "<p>Tracks could not load. Check Firebase rules.</p>";
  }
}

loginBtn.addEventListener("click", unlockAdmin);
addTrackBtn.addEventListener("click", addTrack);

if (localStorage.getItem("phase_sector_admin_unlocked") === "true") {
  loginBox.classList.add("hidden-admin");
  adminPanel.classList.remove("hidden-admin");
  loadAdminTracks();
}
