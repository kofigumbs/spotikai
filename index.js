const fs = require("fs");
const http = require("http");
const ws = require("ws");
const { spawn } = require("child_process");
const { PORT, SPOTIFY_USERNAME, SPOTIFY_PASSWORD } = process.env;

const server = http.createServer((request, response) => {
  switch (request.url) {
    case "/":
      response.writeHead(200, { "Content-Type": "text/html" });
      fs.createReadStream("index.html").pipe(response);
      break;
    case "/pcm-player.js":
      response.writeHead(200, { "Content-Type": "application/javascript" });
      fs.createReadStream("pcm-player.js").pipe(response);
      break;
    default:
      response.writeHead(404, {});
      response.end();
  }
});

new ws.Server({ server }).on("connection", socket => {
  const flags = [
    "--name", "SpotiKai",
    "--backend", "pipe",
    "--bitrate", "160",
    "--username", SPOTIFY_USERNAME, "--password", SPOTIFY_PASSWORD,
  ];
  spawn("librespot", flags, { stdio: [ "ignore", "pipe", "inherit" ] })
    .stdout.on("data", data => socket.send(data, { binary: true }));
});

server.listen(PORT);
