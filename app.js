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
    title: "Stepbro Chill",
    artist: "Kosmic Noize",
    file: "songs/song1.mp3",
    cover: "covers/cover1.jpg",
    description: "What the hell is even that?!.",
    posted: "2026-05-24"
  }
];

const songList = document.getElementById("song-list");

function renderSongs() {
  songList.innerHTML = "";

  const sortedSongs = [...songs].sort((a, b) => {
    return new Date(b.posted) - new Date(a.posted);
  });

  sortedSongs.forEach((song) => {
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

    songList.appendChild(card);
  });
}

renderSongs();
