console.log("Test");
let currentsong = new Audio();

// Global track parser function
function parseTrackInfo(trackUrl) {
    const displayName = trackUrl.split('/').pop()
                              .replaceAll("%20", " ")
                              .replaceAll(".mp3", "");
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
    let a = await fetch("https://api.github.com/repos/Flare3416/music-player/contents/songs");
    let response = await a.json();
    
    let songs = [];
    for (let index = 0; index < response.length; index++) {
        const element = response[index];
        if (element.name.endsWith(".mp3")) {
            songs.push(`https://raw.githubusercontent.com/Flare3416/music-player/main/songs/${element.name}`);
        }
    }
    return songs;
}

const playMusic = (track, autoplay = false) => {
    const { artist, songName } = parseTrackInfo(track);
    currentsong.src = track;
    
    if(autoplay){
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
    
    document.querySelector(".songtime").innerHTML = `
        <span style="font-size: 12px; opacity: 0.7;">0:00 / --:--</span>
    `;
}

async function main() {
    let songs = await getsongs();
    console.log(songs);

    // Load first song but don't autoplay
    if (songs.length > 0) {
        playMusic(songs[0]);
    }

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
            playMusic(e.getAttribute('data-song-url'), true);
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

    // Time update event
    currentsong.addEventListener("timeupdate", () => {
        const currentTime = currentsong.currentTime;
        const duration = currentsong.duration || 0;
        
        document.querySelector(".songtime").innerHTML = `
            <span style="font-size: 12px; opacity: 0.7;">
                ${formatTime(currentTime)} / ${duration ? formatTime(duration) : '--:--'}
            </span>`;
        
        // Update progress bar
        if (duration > 0) {
            const progressPercent = (currentTime / duration) * 100;
            document.querySelector(".playbar-progress").style.width = `${progressPercent}%`;
        }
    });

    // When song ends
    currentsong.addEventListener("ended", () => {
        play.src = "svg/PandP.svg";
    });
}

main();