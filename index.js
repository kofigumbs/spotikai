const fs = require("fs");
const http = require("http");
const lame = require("@suldashi/lame");
const { spawn } = require("child_process");
const { PORT, STREAM_PASSWORD, SPOTIFY_USERNAME, SPOTIFY_PASSWORD } = process.env;

const static = (response, path, contentType) => {
  response.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(`static/${path}`).pipe(response);
};

const notFound = response => {
  response.writeHead(404);
  response.end();
};

const audio = response => {
  const flags = [
    "--name", "SpotiKai",
    "--backend", "pipe",
    "--initial-volume", "100",
    "--username", SPOTIFY_USERNAME, "--password", SPOTIFY_PASSWORD,
  ];
  response.writeHead(200, { "Content-Type": "audio/mpeg" });
  spawn("librespot", flags, { stdio: [ "ignore", "pipe", "inherit" ] })
    .stdout.pipe(new lame.Encoder()).pipe(response);
};

const server = http.createServer((request, response) => {
  switch (request.url) {
    case "/":
      return static(response, "index.html", "text/html");
    case "/manifest.webapp":
      return static(response, "manifest.webapp.json", "application/x-web-app-manifest+json");
    case "/audio.mp3":
      return request.headers.cookie === `password=${STREAM_PASSWORD}`
        ? audio(response)
        : notFound(response);
    default:
      return notFound(response);
  }
});

server.listen(PORT);
