const fs = require('fs');
const path = require('path');

// Configuration
const SONGS_DIR = './songs';
const PLAYLISTS_FILE = './playlists.json';
const SUPPORTED_AUDIO = ['.mp3'];
const SUPPORTED_IMAGES = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];

/**
 * Scans the songs directory and generates playlists.json
 */
function generatePlaylistsJson() {
    console.log('🎵 Scanning songs directory...');
    
    if (!fs.existsSync(SONGS_DIR)) {
        console.error('❌ Songs directory not found!');
        return;
    }

    const playlists = [];
    const folders = fs.readdirSync(SONGS_DIR).filter(item => {
        const fullPath = path.join(SONGS_DIR, item);
        return fs.statSync(fullPath).isDirectory();
    });

    console.log(`📁 Found ${folders.length} folders`);

    folders.forEach(folderName => {
        const folderPath = path.join(SONGS_DIR, folderName);
        const files = fs.readdirSync(folderPath);
        
        // Find MP3 files
        const songs = files
            .filter(file => SUPPORTED_AUDIO.includes(path.extname(file).toLowerCase()))
            .map(file => `songs/${folderName}/${file}`);
        
        // Skip folders without MP3 files
        if (songs.length === 0) {
            console.log(`⏭️  Skipping '${folderName}' - no MP3 files found`);
            return;
        }
        
        // Find thumbnail image
        const imageFile = files.find(file => 
            SUPPORTED_IMAGES.includes(path.extname(file).toLowerCase())
        );
        
        const thumbnail = imageFile 
            ? `songs/${folderName}/${imageFile}`
            : 'default.jpg';
        
        const playlist = {
            name: folderName,
            displayName: folderName,
            thumbnail: thumbnail,
            folderPath: `songs/${folderName}`,
            songs: songs
        };
        
        playlists.push(playlist);
        console.log(`✅ Added '${folderName}' - ${songs.length} songs, thumbnail: ${imageFile || 'default'}`);
    });

    // Write to JSON file
    const jsonData = {
        playlists: playlists,
        lastUpdated: new Date().toISOString(),
        totalPlaylists: playlists.length,
        totalSongs: playlists.reduce((sum, p) => sum + p.songs.length, 0)
    };

    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(jsonData, null, 2));
    console.log(`\n🎉 Generated ${PLAYLISTS_FILE} with ${playlists.length} playlists`);
    console.log(`📊 Total songs: ${jsonData.totalSongs}`);
    console.log(`🕒 Last updated: ${jsonData.lastUpdated}`);
}

/**
 * Watch for changes in songs directory
 */
function watchSongsDirectory() {
    if (!fs.existsSync(SONGS_DIR)) {
        console.error('❌ Songs directory not found for watching!');
        return;
    }

    console.log('👀 Watching songs directory for changes...');
    
    fs.watch(SONGS_DIR, { recursive: true }, (eventType, filename) => {
        if (filename) {
            console.log(`🔄 Change detected: ${eventType} - ${filename}`);
            setTimeout(() => {
                generatePlaylistsJson();
            }, 1000); // Debounce for 1 second
        }
    });
}

// Main execution
function main() {
    console.log('🎵 Dynamic Playlist Generator\n');
    
    // Generate initial playlists.json
    generatePlaylistsJson();
    
    // Check if running with watch flag
    if (process.argv.includes('--watch')) {
        watchSongsDirectory();
        console.log('\n✨ Watching mode enabled. Press Ctrl+C to stop.');
    } else {
        console.log('\n💡 Tip: Run with --watch flag to automatically update when files change');
        console.log('   Example: node generate-playlists.js --watch');
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Stopping playlist generator...');
    process.exit(0);
});

main();
