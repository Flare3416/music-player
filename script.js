console.log("Test");
async function main() {
    let a = await fetch("http://127.0.0.1:3000/songs/");
    let response = await a.text();
    console.log(response);
    let div=document.createElement("div");
    div.innerHTML="response";
    let as=document.getElementsByTagName("a");
    console.log(as);
}

main();