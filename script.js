console.log("Test");
let currentsong = new Audio();

async function getsongs() {
    let a = await fetch("http://127.0.0.1:3000/songs/");
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href); // Store full URL instead of splitting
        }
    }
    return songs;
}

const playMusic = (track) => {
    // let audio = new Audio(track); // Use the full URL directly
    currentsong.src=track;
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
            `<li data-song-url="${song}"> <!-- Store full URL in data attribute -->
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

    //attach event listener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            const songUrl = e.getAttribute('data-song-url'); // Get full URL
            console.log("Playing:", songUrl);
            playMusic(songUrl);
        });
    });

    //attach event listener to ea
}

main();