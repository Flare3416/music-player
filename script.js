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
    // Check if we're running locally (file:// or localhost)
    const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
        console.log("Running locally, trying JSON file first...");
        try {
            const jsonPlaylists = await getJsonPlaylists();
            if (jsonPlaylists && jsonPlaylists.length > 0) {
                return jsonPlaylists;
            }
        } catch (error) {
            console.log("JSON file not available locally, using hardcoded fallback");
        }
        // If JSON fails locally, use hardcoded playlists
        return getHardcodedPlaylists();
    }
    
    try {
        // For production (GitHub Pages), try GitHub API first
        const response = await fetch(`https://api.github.com/repos/Flare3416/music-player/contents/songs`);
        
        if (!response.ok) {
            // If GitHub API fails, fall back to hardcoded playlists for local development
            console.log("GitHub API not available, using local fallback");
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
                
                // Only include folders that have MP3 files
                if (songs.length === 0) {
                    console.log(`Skipping folder ${folder.name} - no MP3 files found`);
                    continue;
                }
                
                // Find first image file for thumbnail
                const imageFile = folderData.find(item => 
                    item.name.toLowerCase().endsWith('.jpg') || 
                    item.name.toLowerCase().endsWith('.jpeg') || 
                    item.name.toLowerCase().endsWith('.png') ||
                    item.name.toLowerCase().endsWith('.webp') ||
                    item.name.toLowerCase().endsWith('.gif') ||
                    item.name.toLowerCase().endsWith('.bmp') ||
                    item.name.toLowerCase().endsWith('.svg')
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
                
                console.log(`Added playlist: ${folder.name} with ${songs.length} songs`);
            } catch (folderError) {
                console.warn(`Error fetching folder ${folder.name}:`, folderError);
                // Continue with other folders even if one fails
            }
        }
        
        return playlists;
    } catch (error) {
        console.error("GitHub API error:", error);
        // If GitHub API fails, try JSON as backup
        return getJsonPlaylists();
    }
}

async function getJsonPlaylists() {
    try {
        console.log("Loading playlists from JSON file...");
        const response = await fetch('./playlists.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Loaded ${data.playlists.length} playlists from JSON (last updated: ${data.lastUpdated})`);
        return data.playlists;
    } catch (error) {
        console.error("Error loading playlists from JSON:", error);
        // Final fallback to minimal hardcoded playlists
        return getHardcodedPlaylists();
    }
}

function getHardcodedPlaylists() {
    // Final fallback with all your playlists for when both GitHub API and JSON file fail
    console.warn("Using complete hardcoded playlists as final fallback");
    return [
        { name: "2000s Mix", displayName: "2000s Mix", thumbnail: "default.jpg", folderPath: "songs/2000s Mix" },
        { name: "City Pop", displayName: "City Pop", thumbnail: "default.jpg", folderPath: "songs/City Pop" },
        { name: "Hyper Pop", displayName: "Hyper Pop", thumbnail: "default.jpg", folderPath: "songs/Hyper Pop" },
        { name: "Indie", displayName: "Indie", thumbnail: "default.jpg", folderPath: "songs/Indie" },
        { name: "JPOP", displayName: "JPOP", thumbnail: "default.jpg", folderPath: "songs/JPOP" },
        { name: "Metal", displayName: "Metal", thumbnail: "default.jpg", folderPath: "songs/Metal" },
        { name: "Phonk", displayName: "Phonk", thumbnail: "default.jpg", folderPath: "songs/Phonk" },
        { name: "Rap", displayName: "Rap", thumbnail: "default.jpg", folderPath: "songs/Rap" },
        { name: "Rock", displayName: "Rock", thumbnail: "default.jpg", folderPath: "songs/Rock" },
        { name: "Runaway", displayName: "Runaway", thumbnail: "default.jpg", folderPath: "songs/Runaway" },
        { name: "Video Game", displayName: "Video Game", thumbnail: "default.jpg", folderPath: "songs/Video Game" },
        { name: "Test", displayName: "Test", thumbnail: "default.jpg", folderPath: "songs/Test" }
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
        
        if (!response.ok) {
            // If GitHub API fails, use local fallback
            return getLocalSongs(folder);
        }
        
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
        // Fall back to local songs
        return getLocalSongs(folder);
    }
}

function getLocalSongs(folder) {
    // Fallback song lists for local development
    const localSongs = {
        "songs/City Pop": [
            "songs/City Pop/Tatsuro Yamashita-Christmas Eve.mp3",
            "songs/City Pop/Tatsuro Yamashita-Goodbye Summer Days.mp3",
            "songs/City Pop/Tatsuro Yamashita-Ride on Time.mp3"
        ],
        "songs/Rap": [
            "songs/Rap/Chief Keef-Love Sosa.mp3",
            "songs/Rap/Drake-Headlines.mp3",
            "songs/Rap/Travis Scott -SICKO MODE.mp3"
        ],
        "songs/JPOP": [
            "songs/JPOP/Aimer-Kataomoi.mp3",
            "songs/JPOP/Radwimps-Hyperventilation.mp3",
            "songs/JPOP/Radwimps-Oshakashama.mp3",
            "songs/JPOP/Vaundy-Napori.mp3"
        ],
        "songs/Hyper Pop": [
            "songs/Hyper Pop/2hollis-Gold.mp3",
            "songs/Hyper Pop/Glaive-1984.mp3",
            "songs/Hyper Pop/Tsubi Club-Laced Up.mp3"
        ],
        "songs/2000s Mix": [
            "songs/2000s Mix/Céline Dion-I'm Alive.mp3",
            "songs/2000s Mix/Dido-Thank You.mp3",
            "songs/2000s Mix/Kanye West-Good Life.mp3"
        ],
        "songs/Metal": [
            "songs/Metal/AC DC-Thunderstruck.mp3",
            "songs/Metal/Avenged Sevenfold-Hail To The King.mp3",
            "songs/Metal/Led Zeppelin-Immigrant Song.mp3"
        ],
        "songs/Phonk": [
            "songs/Phonk/Saint Punk-Empty Bed.mp3",
            "songs/Phonk/Zyzz Music-Malo Tebya.mp3"
        ],
        "songs/Indie": [
            "songs/Indie/Marina-The State of Dreamin.mp3",
            "songs/Indie/Passion Pit-Take a Walk.mp3",
            "songs/Indie/The Jungle Giants-Feel The Way I Do.mp3"
        ],
        "songs/Rock": [
            "songs/Rock/Bee Gees-Stayin' Alive.mp3",
            "songs/Rock/Green Day-21 Guns.mp3",
            "songs/Rock/Nirvana-Smells Like Teen Spirit.mp3"
        ],
        "songs/Runaway": [
            "songs/Runaway/Kanye West-Runaway.mp3"
        ],
        "songs/Video Game": [
            "songs/Video Game/Halo-Theme Song.mp3",
            "songs/Video Game/Pokemon BlueRed-Lavender Town.mp3",
            "songs/Video Game/Rosa Walton-Cyberpunk Edgerunner.mp3"
        ],
        "songs/Test": [
            "songs/Test/Kanye West-Runaway.mp3"
        ]
    };
    
    return localSongs[folder] || [];
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
            playMusic(e.getAttribute('data-song-url'), true, getCurrentThumbnail());
        });
    });
}

// Helper function to compare song URLs (works for both local and remote)
function compareSongUrls(url1, url2) {
    if (!url1 || !url2) return false;
    
    try {
        // Try to compare as URLs first
        return new URL(url1).href === new URL(url2).href;
    } catch (e) {
        // Fallback for local files - normalize and compare
        const normalize = (url) => {
            return url.replace(/\\/g, '/')
                     .replace(/%20/g, ' ')
                     .toLowerCase()
                     .trim();
        };
        
        const normalized1 = normalize(url1);
        const normalized2 = normalize(url2);
        
        // Try exact match first
        if (normalized1 === normalized2) return true;
        
        // Try comparing just the filename
        const filename1 = normalized1.split('/').pop();
        const filename2 = normalized2.split('/').pop();
        
        return filename1 === filename2;
    }
}

// Helper function to get current thumbnail
function getCurrentThumbnail() {
    // Try to find the card by exact folder match first
    let currentCard = document.querySelector(".card[data-folder='" + currFolder + "']");
    
    // If not found, try to find by folder name (handle URL encoding issues)
    if (!currentCard) {
        const folderName = currFolder.split('/').pop();
        const cards = document.querySelectorAll(".card");
        
        for (const card of cards) {
            const cardFolder = card.getAttribute("data-folder");
            const cardFolderName = cardFolder.split('/').pop();
            
            // Compare normalized folder names
            if (normalizeString(folderName) === normalizeString(cardFolderName)) {
                currentCard = card;
                break;
            }
        }
    }
    
    return currentCard ? currentCard.getAttribute("data-thumbnail") : null;
}

// Helper function to normalize strings for comparison
function normalizeString(str) {
    return str.replace(/%20/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
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
        
        console.log("Previous clicked - Current song src:", currentsong.src);
        console.log("Available songs:", songs);
        
        // Find current index using better comparison
        const currentIndex = songs.findIndex(song => compareSongUrls(song, currentsong.src));
        
        console.log("Found current index:", currentIndex);
        
        if (currentIndex === -1) {
            console.warn("Current song not found in playlist");
            // If we can't find the current song, just play the last song
            playMusic(songs[songs.length - 1], true, getCurrentThumbnail());
            return;
        }
        // Calculate previous with wrap-around
        const prevIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
        console.log("Playing previous song at index:", prevIndex);
        playMusic(songs[prevIndex], true, getCurrentThumbnail());
    });
    
    // Next button
    next.addEventListener("click", () => {
        if (songs.length === 0) return;
        
        console.log("Next clicked - Current song src:", currentsong.src);
        console.log("Available songs:", songs);
        
        // Find current index using better comparison
        const currentIndex = songs.findIndex(song => compareSongUrls(song, currentsong.src));
        
        console.log("Found current index:", currentIndex);
        
        if (currentIndex === -1) {
            console.warn("Current song not found in playlist");
            // If we can't find the current song, just play the first song
            playMusic(songs[0], true, getCurrentThumbnail());
            return;
        }
        
        // Calculate next with wrap-around
        const nextIndex = (currentIndex + 1) % songs.length;
        console.log("Playing next song at index:", nextIndex);
        playMusic(songs[nextIndex], true, getCurrentThumbnail());
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
        
        // Auto-play next song
        if (songs.length > 0) {
            console.log("Song ended - finding next song");
            const currentIndex = songs.findIndex(song => compareSongUrls(song, currentsong.src));
            
            console.log("Current index for auto-play:", currentIndex);
            
            if (currentIndex !== -1) {
                // Calculate next with wrap-around
                const nextIndex = (currentIndex + 1) % songs.length;
                console.log("Auto-playing next song at index:", nextIndex);
                playMusic(songs[nextIndex], true, getCurrentThumbnail());
            } else {
                // If we can't find current song, just play the first one
                console.log("Could not find current song, playing first song");
                playMusic(songs[0], true, getCurrentThumbnail());
            }
        }
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