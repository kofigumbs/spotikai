const fs = require("fs");
const http = require("http");
const lame = require("@suldashi/lame");
const { spawn } = require("child_process");
const { PORT, SPOTIFY_USERNAME, SPOTIFY_PASSWORD } = process.env;

const server = http.createServer((request, response) => {
  switch (request.url) {
    case "/":
      response.writeHead(200, { "Content-Type": "text/html" });
      fs.createReadStream("index.html").pipe(response);
      break;

    case "/manifest.webapp":
      response.writeHead(200, { "Content-Type": "application/x-web-app-manifest+json" });
      fs.createReadStream("manifest.webapp").pipe(response);
      break;

    case "/audio.mp3":
      const flags = [
        "--name", "SpotiKai",
        "--backend", "pipe",
        "--initial-volume", "100",
        "--username", SPOTIFY_USERNAME, "--password", SPOTIFY_PASSWORD,
      ];
      response.writeHead(200, { "Content-Type": "audio/mpeg" });
      spawn("librespot", flags, { stdio: [ "ignore", "pipe", "inherit" ] })
        .stdout.pipe(new lame.Encoder()).pipe(response);
      break;

    default:
      response.writeHead(404, {});
      response.end();
  }
});

server.listen(PORT);
