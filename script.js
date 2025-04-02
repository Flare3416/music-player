console.log("Test");
let currentsong = new Audio();
let songCache = JSON.parse(localStorage.getItem('songCache')) || null; // [1] Load cache

async function getsongs() {
    // [2] Return cache if exists and is fresh (<1 hour old)
    if (songCache && (Date.now() - songCache.timestamp < 3600000)) {
        console.log("Using cached songs");
        return songCache.data;
    }

    let a = await fetch("https://api.github.com/repos/Flare3416/music-player/contents/songs");
    let response = await a.json();
    
    let songs = [];
    for (let index = 0; index < response.length; index++) {
        const element = response[index];
        if (element.name.endsWith(".mp3")) {
            songs.push(`https://raw.githubusercontent.com/Flare3416/music-player/main/songs/${element.name}`);
        }
    }

    // [3] Update cache with timestamp
    songCache = { data: songs, timestamp: Date.now() };
    localStorage.setItem('songCache', JSON.stringify(songCache)); // [4] Save to localStorage
    return songs;
}

const playMusic = (track) => {
    currentsong.src = track;
    currentsong.play().catch(error => {
        console.error("Playback failed:", error);
    });
}

async function main() {
    let songs = await getsongs();
    console.log(songs);

    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""; // [5] Clear previous entries

    for (const song of songs) {
        const displayName = song.split('/').pop().replaceAll("%20", " ").replaceAll(".mp3", "");
        const [artist, songName] = displayName.split("-");
        
        songUL.innerHTML +=
            `<li data-song-url="${song}">
                <img src="svg/music.svg" alt="">
                <div class="info">
                    <div class="songname">${songName}</div>
                    <div class="artistname">${artist}</div>
                </div>
                <div class="playnow">
                    <img src="svg/play.svg" alt="">
                </div>
            </li>`;
    }

    Array.from(document.querySelectorAll(".songlist li")).forEach(e => {
        e.addEventListener("click", () => {
            const songUrl = e.getAttribute('data-song-url');
            console.log("Playing:", songUrl);
            playMusic(songUrl);
        });
    });
}

main();