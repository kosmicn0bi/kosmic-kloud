import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
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

const submitBtn = document.getElementById("submit-music-btn");
const statusText = document.getElementById("submit-status");

function getValue(id) {
  return document.getElementById(id).value.trim();
}

async function submitMusic() {
  const artist = getValue("submit-artist");
  const contact = getValue("submit-contact");
  const title = getValue("submit-title");
  const genre = getValue("submit-genre");
  const mp3Link = getValue("submit-mp3");
  const artworkLink = getValue("submit-artwork");
  const agree = document.getElementById("submit-agree").checked;

  if (!artist || !contact || !title || !genre || !mp3Link || !artworkLink) {
    alert("Please fill out artist, contact, title, genre, MP3 link, and artwork link.");
    return;
  }

  if (!agree) {
    alert("Please confirm you own the music or have permission to submit it.");
    return;
  }

  const submissionData = {
    artist,
    contact,
    title,
    genre,
    mp3Link,
    artworkLink,
    soundcloud: getValue("submit-soundcloud"),
    spotify: getValue("submit-spotify"),
    social: getValue("submit-social"),
    notes: getValue("submit-notes"),
    status: "new",
    submittedAt: serverTimestamp()
  };

  try {
    statusText.innerText = "Submitting...";

    await addDoc(collection(db, "submissions"), submissionData);

    statusText.innerText = "Submission sent. Thank you!";

    document.querySelectorAll("input, textarea").forEach((field) => {
      if (field.type === "checkbox") {
        field.checked = false;
      } else {
        field.value = "";
      }
    });
  } catch (error) {
    console.error("Submission failed:", error);
    statusText.innerText = "Submission could not be sent. Please try again later.";
  }
}

submitBtn.addEventListener("click", submitMusic);
