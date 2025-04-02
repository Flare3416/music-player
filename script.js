console.log("Test");

async function getsongs() {
    let a = await fetch("http://127.0.0.1:3000/songs/");
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    // Now get the <a> elements from the div
    let as = div.getElementsByTagName("a");

    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith("mp3")) {
            songs.push(element.href.split("/songs/")[1]);
        }
    }

    return songs;
}

async function main() {
    let songs = await getsongs();
    console.log(songs);

    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];



    for (const song of songs) {
        songUL.innerHTML += `<li>
                        <img src="svg/music.svg" alt="">
                        <div class="info">
                            <div class="songname">${song.replaceAll("%20", " ").replaceAll(".mp3", "").split("-")[1]}</div>
                            <div class="artistname">${song.replaceAll("%20", " ").replaceAll(".mp3", "").split("-")[0]}</div>
                        </div>
                        <div class="playnow">
                            <img src="svg/play.svg" alt="">
                        </div>
                    </li>
        `;
    }

    // Play the first song
    var audio = new Audio(songs[0]);
    // audio.play();


}

main();
