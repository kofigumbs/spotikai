const fetch = require("node-fetch");
const fs = require("fs");
const http = require("http");
const lame = require("@suldashi/lame");
const { spawn } = require("child_process");
const {
  PORT,
  STREAM_PASSWORD,
  SPOTIFY_USERNAME, SPOTIFY_PASSWORD,
  SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

const base64 = s => Buffer.from(s, "binary").toString("base64");

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

const login = (response, url) => {
  const Location = "https://accounts.spotify.com/authorize" +
    "?response_type=code" +
    `&client_id=${SPOTIFY_CLIENT_ID}` +
    "&scope=" + encodeURIComponent([
      "user-library-read",
      "streaming",
      "user-read-playback-state",
      "user-modify-playback-state" ].join(" ")) +
    "&redirect_uri=" + encodeURIComponent(url.origin + "/authorize");
  response.writeHead(302, { Location });
  response.end();
};

const authorize = (response, url) => {
  fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "Authorization": `Basic ${base64(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body:  [
      "grant_type=authorization_code",
      `code=${url.searchParams.get("code")}`,
      `redirect_uri=${url.origin}/authorize`,
    ].join("&"),
  })
    .then(response => {
      if (response.ok) return response;
      throw Error(response.statusText);
    })
    .then(response => response.json())
    .then(body => {
      response.writeHead(301, { Location: `${url.origin}#${body.access_token}` });
      response.end();
    })
    .catch(e => {
      console.error(e);
      response.writeHead(500);
      response.end();
    });
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  switch (url.pathname) {
    case "/":
      return static(response, "index.html", "text/html");
    case "/manifest.webapp":
      return static(response, "manifest.webapp.json", "application/x-web-app-manifest+json");
    case "/login":
      return login(response, url);
    case "/authorize":
      return authorize(response, url);
    case "/audio.mp3":
      return request.headers.cookie === `password=${STREAM_PASSWORD}`
        ? audio(response)
        : notFound(response);
    default:
      return notFound(response);
  }
});

server.listen(PORT);
