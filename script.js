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

async function getPlaylists() {
    try {
        // First, try to get playlists from GitHub API (for production)
        const response = await fetch(`https://api.github.com/repos/Flare3416/music-player/contents/songs`);
        
        if (!response.ok) {
            // If GitHub API fails, fall back to hardcoded playlists for local development
            return getHardcodedPlaylists();
        }
        
        const data = await response.json();
        
        // Filter only directories (folders)
        const folders = data.filter(item => item.type === "dir");
        
        const playlists = [];
        
        for (const folder of folders) {
            try {
                // Get folder contents to find songs and images
                const folderResponse = await fetch(`https://api.github.com/repos/Flare3416/music-player/contents/songs/${folder.name}`);
                const folderData = await folderResponse.json();
                
                // Find songs
                const songs = folderData
                    .filter(item => item.name.endsWith(".mp3"))
                    .map(item => `https://raw.githubusercontent.com/Flare3416/music-player/main/songs/${folder.name}/${item.name}`);
                
                // Find first image file for thumbnail
                const imageFile = folderData.find(item => 
                    item.name.toLowerCase().endsWith('.jpg') || 
                    item.name.toLowerCase().endsWith('.jpeg') || 
                    item.name.toLowerCase().endsWith('.png') ||
                    item.name.toLowerCase().endsWith('.webp')
                );
                
                const thumbnail = imageFile 
                    ? `https://raw.githubusercontent.com/Flare3416/music-player/main/songs/${folder.name}/${imageFile.name}`
                    : `default.jpg`; // Fallback to default image in root
                
                playlists.push({
                    name: folder.name,
                    displayName: folder.name.replace(/%20/g, ' '), // Handle URL encoding
                    songs: songs,
                    thumbnail: thumbnail,
                    folderPath: `songs/${folder.name}`
                });
            } catch (folderError) {
                console.warn(`Error fetching folder ${folder.name}:`, folderError);
                // Continue with other folders even if one fails
            }
        }
        
        return playlists;
    } catch (error) {
        console.error("Error fetching playlists from GitHub:", error);
        // Fall back to hardcoded playlists for local development
        return getHardcodedPlaylists();
    }
}

function getHardcodedPlaylists() {
    // Fallback for local development or when GitHub API is unavailable
    return [
        { name: "City Pop", displayName: "City Pop", thumbnail: "songs/City Pop/thumbnail.jpg", folderPath: "songs/City%20Pop" },
        { name: "Rap", displayName: "Rap", thumbnail: "songs/Rap/thumbnail.jpg", folderPath: "songs/Rap" },
        { name: "JPOP", displayName: "JPOP", thumbnail: "songs/JPOP/thumbnail.jpg", folderPath: "songs/JPOP" },
        { name: "Hyper Pop", displayName: "Hyper Pop", thumbnail: "songs/Hyper Pop/thumbnail.jpg", folderPath: "songs/Hyper%20Pop" },
        { name: "2000s Mix", displayName: "2000s Mix", thumbnail: "songs/2000s Mix/thumbnail.jpg", folderPath: "songs/2000s%20Mix" },
        { name: "Metal", displayName: "Metal", thumbnail: "songs/Metal/thumbnail.jpg", folderPath: "songs/Metal" },
        { name: "Phonk", displayName: "Phonk", thumbnail: "songs/Phonk/thumbnail.jpg", folderPath: "songs/Phonk" },
        { name: "Indie", displayName: "Indie", thumbnail: "songs/Indie/thumbnail.jpg", folderPath: "songs/Indie" },
        { name: "Rock", displayName: "Rock", thumbnail: "songs/Rock/thumbnail.jpg", folderPath: "songs/Rock" },
        { name: "Runaway", displayName: "Runaway", thumbnail: "songs/Runaway/thumbnail.jpg", folderPath: "songs/Runaway" },
        { name: "Video Game", displayName: "Video Game", thumbnail: "songs/Video Game/thumbnail.jpg", folderPath: "songs/Video%20Game" }
    ];
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

const playMusic = (track, autoplay = false, thumbnail = null) => {
    const { artist, songName } = parseTrackInfo(track);
    currentsong.src = track;

    if (autoplay) {
        currentsong.play().catch(error => {
            console.error("Playback failed:", error);
        });
        play.src = "svg/pause.svg";
    }

    // Use provided thumbnail or extract folder name for the image
    let imageSrc;
    if (thumbnail) {
        imageSrc = thumbnail;
    } else {
        const folderName = currFolder.split('/').pop();
        imageSrc = `default.jpg`; // Fallback to default image in root
    }
    
    document.querySelector(".songinfo").innerHTML = `
        <img src="${imageSrc}" alt="Current song" style=" border-radius: 4px; margin-right: 12px;" onerror="this.src='default.jpg'">
        <div class="controlinfo">
            <div class="controlsong" style="font-weight: 600;">${songName}</div>
            <div style="opacity: 0.7;">${artist}</div>
        </div> 
    `;

    document.querySelector(".songtime").innerHTML = `
        <span style=" opacity: 0.7;">0:00 / --:--</span>
    `;
}


// Volume control functions gpt
let lastVolumeBeforeMute = 0.3; // Start with default 30%
function setupVolumeControl() {
    const volumeIcon = document.querySelector(".volume-icon");
    const volumeBar = document.querySelector(".volume-bar");
    const volumeProgress = document.querySelector(".volume-progress");

    // Initialize
    // Apply exponential curve to initial volume
    currentsong.volume = applyVolumeCurve(0.3);
    lastVolumeBeforeMute = 0.3;
    updateVolumeDisplay();

    function updateVolumeDisplay() {
        // Display percentage based on linear scale for UI feedback
        const displayPercent = getLinearPercentFromVolume(currentsong.volume) * 100;
        volumeProgress.style.width = `${displayPercent}%`;
        volumeIcon.src = currentsong.volume === 0 ? "svg/volume-mute.svg" : "svg/volume.svg";
    }

    // Convert linear percentage to exponential volume level (human perception)
    function applyVolumeCurve(linearPercent) {
        // Using an exponential curve: volume = linearPercent^3
        // This makes the volume changes more dramatic at the lower end
        return Math.pow(linearPercent, 3);
    }
    
    // Convert actual volume level back to linear percentage for UI display
    function getLinearPercentFromVolume(volume) {
        // Inverse of the exponential function
        return Math.pow(volume, 1/3);
    }

    volumeBar.addEventListener("click", (e) => {
        const rect = volumeBar.getBoundingClientRect();
        const linearPercent = (e.clientX - rect.left) / rect.width;
        
        // Convert linear UI percent to exponential volume curve
        currentsong.volume = applyVolumeCurve(Math.max(0, Math.min(1, linearPercent)));
        
        // Store the linear percentage for restore function
        lastVolumeBeforeMute = linearPercent; 
        
        updateVolumeDisplay();
    });

    volumeIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentsong.volume === 0) {
            // Restore to last volume using the curve
            currentsong.volume = applyVolumeCurve(lastVolumeBeforeMute);
        } else {
            // Before muting, remember current linear position
            lastVolumeBeforeMute = getLinearPercentFromVolume(currentsong.volume);
            currentsong.volume = 0;
        }
        updateVolumeDisplay();
    });
}

async function generatePlaylistCards() {
    const playlists = await getPlaylists();
    const cardContainer = document.querySelector(".cardcontainer");
    
    // Clear existing cards
    cardContainer.innerHTML = "";
    
    // Generate cards for each playlist
    playlists.forEach(playlist => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.setAttribute("data-folder", playlist.folderPath);
        cardElement.setAttribute("data-thumbnail", playlist.thumbnail);
        
        cardElement.innerHTML = `
            <img src="${playlist.thumbnail}" alt="${playlist.displayName}" onerror="this.src='default.jpg'">
            <span>${playlist.displayName}</span>
            <img src="svg/play.svg" alt="" class="playsvg">
        `;
        
        cardContainer.appendChild(cardElement);
    });
    
    // Add click event listeners to the new cards
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const folderPath = card.getAttribute("data-folder");
            const thumbnail = card.getAttribute("data-thumbnail");
            
            // Switch to the folder with autoplay
            await switchFolder(folderPath, true, thumbnail);
        });
    });
}

async function switchFolder(folder, shouldAutoplay = false, thumbnail = null) {
    songs = await getsongs(folder);
    await updateSongList();
    
    // Load first song of the new folder
    if (songs.length > 0) {
        playMusic(songs[0], shouldAutoplay, thumbnail); 
    }
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

// Main initialization function
async function main() {
    // Generate dynamic playlist cards
    await generatePlaylistCards();
    
    // Initialize with the first available playlist
    const playlists = await getPlaylists();
    if (playlists.length > 0) {
        await switchFolder(playlists[0].folderPath, false, playlists[0].thumbnail);
    }

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