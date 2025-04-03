console.log("Test");
let currentsong = new Audio();
let songs;
let currentSongIndex = 0;
let currFolder;

function parseTrackInfo(trackUrl) {
    const displayName = trackUrl.split('/').pop().replaceAll("%20", " ").replaceAll(".mp3", "");
    const [artist, songName] = displayName.split("-");
    return { artist, songName };
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

async function getsongs(folder) {
    currFolder = folder;
    
    // Try localStorage first to avoid API call entirely
    const cacheKey = `music_${folder}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
        return JSON.parse(cached);
    }
    
    try {
        // Only call API if no cache exists
        const response = await fetch(`https://api.github.com/repos/Flare3416/music-player/contents/${folder}`);
        const data = await response.json();
        
        // Extract songs
        const songs = data
            .filter(item => item.name.endsWith(".mp3"))
            .map(item => `https://raw.githubusercontent.com/Flare3416/music-player/main/${folder}/${item.name}`);
        
        // Save to localStorage for future use
        localStorage.setItem(cacheKey, JSON.stringify(songs));
        
        return songs;
    } catch (error) {
        console.error("API Error:", error);
        return []; // Return empty array if both API and cache fail
    }
}

const playMusic = (track, autoplay = false) => {
    const { artist, songName } = parseTrackInfo(track);
    currentsong.src = track;

    if (autoplay) {
        currentsong.play().catch(error => {
            console.error("Playback failed:", error);
        });
        play.src = "svg/pause.svg";
    }

    // Extract folder name for the image - FIXED: don't lowercase or remove all spaces
    const folderName = currFolder.split('/').pop();
    
    document.querySelector(".songinfo").innerHTML = `
        <img src="img/${folderName}.jpg" alt="Current song" style=" border-radius: 4px; margin-right: 12px;">
        <div class="controlinfo">
            <div class="controlsong" style="font-weight: 600;">${songName}</div>
            <div style="opacity: 0.7;">${artist}</div>
        </div> 
    `;

    document.querySelector(".songtime").innerHTML = `
        <span style=" opacity: 0.7;">0:00 / --:--</span>
    `;
}

// Volume control functions
let lastVolumeBeforeMute = 0.3; // Start with default 30%
function setupVolumeControl() {
    const volumeIcon = document.querySelector(".volume-icon");
    const volumeBar = document.querySelector(".volume-bar");
    const volumeProgress = document.querySelector(".volume-progress");

    // Initialize
    currentsong.volume = 0.3;
    lastVolumeBeforeMute = 0.3;
    updateVolumeDisplay();

    function updateVolumeDisplay() {
        volumeProgress.style.width = `${currentsong.volume * 100}%`;
        volumeIcon.src = currentsong.volume === 0 ? "svg/volume-mute.svg" : "svg/volume.svg";
    }

    volumeBar.addEventListener("click", (e) => {
        const rect = volumeBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        currentsong.volume = Math.max(0, Math.min(1, percent));
        lastVolumeBeforeMute = currentsong.volume; // Remember this position
        updateVolumeDisplay();
    });

    volumeIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentsong.volume === 0) {
            // Restore to last volume instead of fixed 30%
            currentsong.volume = lastVolumeBeforeMute;
        } else {
            // Before muting, remember current volume
            lastVolumeBeforeMute = currentsong.volume;
            currentsong.volume = 0;
        }
        updateVolumeDisplay();
    });
}

async function updateSongList() {
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

    // Re-attach click events to the new list items
    Array.from(document.querySelectorAll(".songlist li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.getAttribute('data-song-url'), true);
        });
    });
}

async function switchFolder(folder,shouldAutoplay = false) {
    songs = await getsongs(folder,shouldAutoplay);
    await updateSongList();
    
    // Load first song of the new folder but don't autoplay
    if (songs.length > 0) {
        playMusic(songs[0],shouldAutoplay); 
    }
}

// Main initialization function
async function main() {
    // Initialize with the default folder
    await switchFolder("songs/City%20Pop",false);
    
    // Add click event listeners to all album cards
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            // Get the album name directly from the span
            const albumName = card.querySelector("span").innerText;
            
            // Create folder path with URL encoding for spaces
            const folderPath = `songs/${encodeURIComponent(albumName)}`;
            
            // Switch to the folder without autoplay
            await switchFolder(folderPath,true);
        });
    });

    // Play/pause button
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "svg/pause.svg";
        } else {
            currentsong.pause();
            play.src = "svg/PandP.svg";
        }
    });

    // Previous button
    previous.addEventListener("click", () => {
        if (songs.length === 0) return;
        
        // Find current index by comparing the full URL
        const currentIndex = songs.findIndex(song => {
            // Compare the full URLs after normalizing
            return new URL(song).href === new URL(currentsong.src).href;
        });
        
        if (currentIndex === -1) {
            console.warn("Current song not found in playlist");
            return;
        }
        // Calculate previous with wrap-around
        const prevIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
        playMusic(songs[prevIndex], true);
    });
    
    // Next button
    next.addEventListener("click", () => {
        if (songs.length === 0) return;
        
        // Find current index by comparing the full URL
        const currentIndex = songs.findIndex(song => {
            return new URL(song).href === new URL(currentsong.src).href;
        });
        
        if (currentIndex === -1) {
            console.warn("Current song not found in playlist");
            return;
        }
        
        // Calculate next with wrap-around
        const nextIndex = (currentIndex + 1) % songs.length;
        playMusic(songs[nextIndex], true);
    });

    // Time update event
    currentsong.addEventListener("timeupdate", () => {
        const currentTime = currentsong.currentTime;
        const duration = currentsong.duration || 0;

        document.querySelector(".songtime").innerHTML = `
            <span style=" opacity: 0.7;">
                ${formatTime(currentTime)} / ${duration ? formatTime(duration) : '--:--'}
            </span>`;

        // Update progress bar
        if (duration > 0) {
            const progressPercent = (currentTime / duration) * 100;
            document.querySelector(".playbar-progress").style.width = `${progressPercent}%`;
            document.querySelector(".playbar-handle").style.left = `${progressPercent}%`;
        }
    });

    // Adding event listener to playbar
    document.querySelector(".playbar").addEventListener("click", e => {
        const playbar = e.currentTarget;
        const rect = playbar.getBoundingClientRect();
        const clickPosition = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        document.querySelector(".playbar-progress").style.width = `${clickPosition * 100}%`;

        if (currentsong.duration) {
            currentsong.currentTime = clickPosition * currentsong.duration;
        }
    });

    // When song ends
    currentsong.addEventListener("ended", () => {
        play.src = "svg/PandP.svg";
    });

    setupVolumeControl();

    // Adding event-listener for hamburger icon
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".sidebar").style.left = "0";
        document.querySelector(".hamburger").style.display = "none";
    });

    // Adding event-listener for close icon
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".sidebar").style.left = "-100%";
        document.querySelector(".hamburger").style.display = "block";
    });
}

main();