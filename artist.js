const artists = {
  "Kosmic Noize": {
    soundcloud: "https://soundcloud.com/kosmicnoize",
    spotify: "https://open.spotify.com/artist/0mmSncpawq94IaBJSdBcNB",
    applemusic: "https://music.apple.com/us/artist/kosmic-noize/1625134522",
    youtube: "https://www.youtube.com/channel/UCbYsYcVcI6n596R0G_altuw"
  }
};

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
const artistName = params.get("artist");

const artistTitle = document.getElementById("artist-name");
const artistSubtitle = document.getElementById("artist-page-subtitle");
const artistCount = document.getElementById("artist-count");
const artistSongList = document.getElementById("artist-song-list");

function renderArtistPage() {
  if (!artistName) {
    artistTitle.innerText = "Artist Not Found";
    artistSubtitle.innerText = "This artist link is invalid.";
    artistCount.innerText = "";
    artistSongList.innerHTML = "";
    return;
  }

  const artistSongs = songs
    .filter((song) => song.artist === artistName)
    .sort((a, b) => new Date(b.posted) - new Date(a.posted));

  document.title = `${artistName} | Phase Sector`;
  artistTitle.innerText = artistName;

  if (artistSongs.length === 0) {
    artistCount.innerText = "No tracks found for this artist.";
    artistSongList.innerHTML = "";
    return;
  }

  const artistData = artists[artistName];

  artistCount.innerHTML = `
    <div class="artist-socials">

      <a href="${artistData.soundcloud}" target="_blank" class="social-icon">
        <img src="/assets/icons/soundcloud.svg" alt="SoundCloud">
      </a>

      <a href="${artistData.spotify}" target="_blank" class="social-icon">
        <img src="/assets/icons/spotify.svg" alt="Spotify">
      </a>

      <a href="${artistData.applemusic}" target="_blank" class="social-icon">
        <img src="/assets/icons/applemusic.svg" alt="Apple Music">
      </a>

      <a href="${artistData.youtube}" target="_blank" class="social-icon">
        <img src="/assets/icons/youtube.svg" alt="YouTube">
      </a>

    </div>

    <span>${artistSongs.length} track${artistSongs.length === 1 ? "" : "s"} uploaded to Phase Sector</span>
  `;

  artistSongList.innerHTML = "";

  artistSongs.forEach((song) => {
    const card = document.createElement("article");
    card.className = "song-card";

    card.innerHTML = `
      <img class="cover" src="${song.cover}" alt="${song.title} cover art">

      <div class="song-content">
        <h3 class="song-title">${song.title}</h3>

        <a class="artist artist-link" href="artist.html?artist=${encodeURIComponent(song.artist)}">
          ${song.artist}
        </a>

        <p class="description">${song.description || ""}</p>
        <p class="posted-date">Posted: ${song.posted}</p>

        <div class="buttons">
          <a class="button-link" href="track.html?id=${song.id}">View Track</a>
        </div>
      </div>
    `;

    artistSongList.appendChild(card);
  });
}

renderArtistPage();
