console.log("Test");
let currentsong = new Audio();

async function getsongs() {
    let a = await fetch("https://api.github.com/repos/Flare3416/music-player/contents/songs");
    let response = await a.json(); // Changed to .json() since GitHub API returns JSON
    
    let songs = [];
    for (let index = 0; index < response.length; index++) {
        const element = response[index];
        if (element.name.endsWith(".mp3")) {
            // Construct raw GitHub URL
            songs.push(`https://raw.githubusercontent.com/Flare3416/music-player/main/songs/${element.name}`);
        }
    }
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

    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            const songUrl = e.getAttribute('data-song-url');
            console.log("Playing:", songUrl);
            playMusic(songUrl);
        });
    });
}

main();