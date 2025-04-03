console.log("Test");
let currentsong = new Audio();
let songCache = JSON.parse(localStorage.getItem('songCache')) || null;

// Global track parser function
function parseTrackInfo(trackUrl) {
    const displayName = trackUrl.split('/').pop().replaceAll("%20", " ").replaceAll(".mp3", "");
    const [artist, songName] = displayName.split("-");
    return { artist, songName };
}

// Format time from seconds to MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

async function getsongs() {
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

    songCache = { data: songs, timestamp: Date.now() };
    localStorage.setItem('songCache', JSON.stringify(songCache));
    return songs;
}

const playMusic = (track,pause=false) => {
    const { artist, songName } = parseTrackInfo(track);
    currentsong.src = track;
    if(!pause){
        currentsong.play().catch(error => {
            console.error("Playback failed:", error);
        });
        play.src = "svg/pause.svg";
    }
    
    document.querySelector(".songinfo").innerHTML = `
        <img src="img/citypop.jpg" alt="Current song" style="width: 56px; height: 56px; border-radius: 4px; margin-right: 12px;">
        <div>
            <div style="font-weight: 600;">${songName}</div>
            <div style="font-size: 12px; opacity: 0.7;">${artist}</div>
        </div> 
    `;
    
    // Initialize time display
    document.querySelector(".songtime").innerHTML = `
        <span style="font-size: 12px; opacity: 0.7;">0:00 / --:--</span>
    `;
}

async function main() {
    let songs = await getsongs();
    playMusic(songs[0],true);

    //shows all the song
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";

    for (const song of songs) {
        const { artist, songName } = parseTrackInfo(song);
        
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

    // Song click event
    Array.from(document.querySelectorAll(".songlist li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.getAttribute('data-song-url'));
        });
    });

    // Play/pause button
    play.addEventListener("click", () => {
        if(currentsong.paused){
            currentsong.play();
            play.src = "svg/pause.svg";
        } else {
            currentsong.pause();
            play.src = "svg/PandP.svg";
        }
    });

    // Time update event - only updates .songtime
    currentsong.addEventListener("timeupdate", () => {
        const currentTime = currentsong.currentTime;
        const duration = currentsong.duration || 1;
        
        document.querySelector(".songtime").innerHTML = `
            <span style="font-size: 12px; opacity: 0.7;">
                ${formatTime(currentTime)} / ${duration ? formatTime(duration) : '--:--'}
            </span>`;

        const progressPercent = (currentTime / duration) * 100;
        document.querySelector(".playbar-progress").style.width = `${progressPercent}%`;
    });

    // When song ends
    currentsong.addEventListener("ended", () => {
        play.src = "svg/PandP.svg";
    });
}

main();