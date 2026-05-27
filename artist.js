const songs = [
  {
    id: "song1",
    title: "Stepbro Chill",
    artist: "Kosmic Noize",
    instagram: "https://instagram.com/kosmicnoize",
    soundcloud: "https://soundcloud.com/",
    youtube: "https://youtube.com/",
    file: "songs/song1.mp3",
    cover: "covers/cover1.jpg",
    description: "What the hell is even that?!",
    posted: "2026-05-24"
  },

  {
    id: "song2",
    title: "ARC",
    artist: "Kosmic Noize",
    instagram: "https://instagram.com/kosmicnoize",
    soundcloud: "https://soundcloud.com/",
    youtube: "https://youtube.com/",
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
const artistSongList = document.getElementById("artist-song-list");

function renderArtistPage() {

  if (!artistName) {
    artistTitle.innerText = "Artist Not Found";
    return;
  }

  const artistSongs = songs
    .filter(song => song.artist === artistName)
    .sort((a, b) => new Date(b.posted) - new Date(a.posted));

  document.title = `${artistName} | Phase Sector`;

  artistTitle.innerText = artistName;
  artistSubtitle.innerText = `Tracks uploaded to Phase Sector`;
  const artistData = artistSongs[0];

  document.getElementById("artist-count").innerHTML = `
  <div class="artist-socials">

    <a href="${artistData.instagram}" target="_blank" class="social-btn">
      Instagram
    </a>

    <a href="${artistData.soundcloud}" target="_blank" class="social-btn">
      SoundCloud
    </a>

    <a href="${artistData.youtube}" target="_blank" class="social-btn">
      YouTube
    </a>

  </div>
`;
  artistSongList.innerHTML = "";

  if (artistSongs.length === 0) {
    artistSongList.innerHTML = `
      <p class="description">No tracks found for this artist.</p>
    `;
    return;
  }

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

        <p class="description">${song.description}</p>

        <p class="posted-date">
          Posted: ${song.posted}
        </p>

        <div class="buttons">
          <a class="button-link" href="track.html?id=${song.id}">
            View Track
          </a>
        </div>
      </div>
    `;

    artistSongList.appendChild(card);

  });
}

renderArtistPage();
