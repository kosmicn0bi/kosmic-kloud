const songs = [
  {
    id: "song2",
    title: "ARC",
    artist: "Kosmic Noize",
    file: "songs/ARC.mp3",
    cover: "covers/Arcart.JPG",
    description: "Hey — Dont Shoot!",
    posted: "2026-05-25"
  },
  {
    id: "song1",
    title: "My First Track",
    artist: "Kosmic Noize",
    file: "songs/song1.mp3",
    cover: "covers/cover1.jpg",
    description: "First official Phase Sector test drop.",
    posted: "2026-05-24"
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
    return;
  }

  const artistSongs = songs
    .filter((song) => song.artist === artistName)
    .sort((a, b) => new Date(b.posted) - new Date(a.posted));

  document.title = `${artistName} | Phase Sector`;
  artistTitle.innerText = artistName;
  artistSubtitle.innerText = `${artistName} on Phase Sector`;

  if (artistSongs.length === 0) {
    artistCount.innerText = "No tracks found for this artist.";
    artistSongList.innerHTML = "";
    return;
  }

  artistCount.innerText = `${artistSongs.length} track${artistSongs.length === 1 ? "" : "s"} uploaded to Phase Sector`;
  artistSongList.innerHTML = "";

  artistSongs.forEach((song) => {
    const card = document.createElement("article");
    card.className = "song-card";

    card.innerHTML = `
      <img class="cover" src="${song.cover}" alt="${song.title} cover art">

      <div class="song-content">
        <h3 class="song-title">${song.title}</h3>
        <p class="artist">${song.artist}</p>
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
