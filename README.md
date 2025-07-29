# Rym Music Player 🎵

A dynamic web music player with automatic playlist generation and a clean, modern UI.

![Rym Player Screenshot](screenshot.png) *<!-- Add screenshot later -->*

## Features ✨

- 🎧 Play/pause, previous/next track controls
- 📁 **Dynamic playlist generation** - automatically creates playlists from song folders
- 🖼️ **Flexible thumbnail system** - uses any image in song folders as playlist covers
- 🔍 Search functionality (UI ready)
- 📶 Volume control with mute toggle
- 🎼 Real-time progress bar with seek functionality
- 📱 Responsive design (mobile-friendly)
- 🖥️ Modern UI with light/dark theme support
- 🌐 GitHub API integration for hosted deployment
- 💾 Smart caching for better performance

## Technologies Used 🛠️

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Audio**: Web Audio API
- **API**: GitHub Contents API for dynamic playlist loading
- **Icons**: Custom SVG icons
- **Hosting**: GitHub Pages compatible

## 🆕 Dynamic Playlist System

### How It Works
The music player automatically creates playlists based on folders in the `songs/` directory:

- **Each folder** = One playlist
- **Folder name** = Playlist title
- **Any image in folder** = Playlist thumbnail
- **All MP3 files** = Playlist songs

### Adding New Playlists

1. **Create a folder** in the `songs/` directory:
   ```
   songs/Your New Playlist/
   ```

2. **Add your music files** (MP3 format):
   ```
   songs/Your New Playlist/
   ├── Artist - Song 1.mp3
   ├── Artist - Song 2.mp3
   └── Artist - Song 3.mp3
   ```

3. **Add a thumbnail image** (any name, any supported format):
   ```
   songs/Your New Playlist/
   ├── cover.jpg          ← Playlist thumbnail
   ├── Artist - Song 1.mp3
   ├── Artist - Song 2.mp3
   └── Artist - Song 3.mp3
   ```

4. **Refresh the page** - Your playlist appears automatically! 🎉

### Supported Image Formats
- `.jpg` / `.jpeg`
- `.png`
- `.webp`

### Example Structure
```
songs/
├── City Pop/
│   ├── thumbnail.jpg
│   ├── Tatsuro Yamashita-Christmas Eve.mp3
│   └── Tatsuro Yamashita-Ride on Time.mp3
├── Jazz Collection/
│   ├── cover.png
│   ├── Miles Davis-Kind of Blue.mp3
│   └── John Coltrane-Giant Steps.mp3
└── Electronic/
    ├── artwork.webp
    └── Daft Punk-One More Time.mp3
```

## Project Structure 📂

```
music-player/
├── index.html              # Main HTML file
├── script.js               # Player logic with dynamic playlist system
├── nav.css                 # Navigation bar styles
├── sidebar.css             # Playlist sidebar styles
├── main.css                # Main content styles
├── control.css             # Player controls styles
├── default.jpg             # Default playlist thumbnail
├── screenshot.png          # Project screenshot
├── svg/                    # SVG icons
│   ├── play.svg
│   ├── pause.svg
│   ├── next.svg
│   └── ...
├── songs/                  # Music folders (playlists)
│   ├── City Pop/
│   │   ├── thumbnail.jpg   # Playlist cover
│   │   └── *.mp3          # Music files
│   ├── Rap/
│   │   ├── thumbnail.jpg
│   │   └── *.mp3
│   └── [More Playlists]/
└── README.md               # This file
```

## Setup & Installation ⚙️

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Flare3416/music-player.git
   cd music-player
   ```

2. **Add your music**:
   - Create folders in the `songs/` directory
   - Add MP3 files and cover images to each folder
   - Follow the structure shown above

3. **Run locally**:
   - Open `index.html` in a web browser
   - Or use a local server for better CORS handling

4. **Deploy to GitHub Pages**:
   - Push to your GitHub repository
   - Enable GitHub Pages in repository settings
   - The player will automatically use GitHub API for playlist loading

## Features in Detail 🔍

### Smart Loading System
- **Production**: Uses GitHub Contents API to fetch playlists
- **Development**: Falls back to predefined playlists for local testing
- **Caching**: Stores playlist data in localStorage for faster loading

### Error Handling
- Graceful fallbacks when images fail to load
- Continues loading other playlists if one fails
- Default placeholder for missing thumbnails

### Audio Controls
- Smooth play/pause transitions
- Previous/next track with playlist wrap-around
- Click-to-seek progress bar
- Exponential volume curve for natural audio control
- Mute/unmute with volume memory

## Browser Compatibility 🌐

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Add your music playlists or code improvements
4. Submit a pull request

## License 📄

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments 🙏

- Icons and UI inspiration from modern music players
- GitHub API for seamless playlist management
- Web Audio API for smooth playback experience
