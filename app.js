import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  doc,
  updateDoc,
  getDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// 🔥 Your Firebase config
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

// reference to your song
const songRef = doc(db, "songs", "song1");

// 🎧 PLAY TRACKING
const audio = document.getElementById("audio1");

audio.addEventListener("play", async () => {
  await updateDoc(songRef, {
    plays: increment(1)
  });

  loadStats();
});

// ❤️ LIKE FUNCTION
window.likeSong = async () => {
  if (localStorage.getItem("liked_song1")) return;

  await updateDoc(songRef, {
    likes: increment(1)
  });

  localStorage.setItem("liked_song1", "true");

  loadStats();
};

// 🔁 SHARE FUNCTION
window.shareSong = async () => {
  navigator.share({
    title: "Kosmic Kloud",
    url: window.location.href
  });
};

// 📊 LOAD STATS
async function loadStats() {
  const snap = await getDoc(songRef);

  if (snap.exists()) {
    const data = snap.data();

    document.getElementById("plays-song1").innerText =
      "Plays: " + data.plays;

    document.getElementById("likes-song1").innerText =
      "Likes: " + data.likes;
  }
}

// initial load
loadStats();