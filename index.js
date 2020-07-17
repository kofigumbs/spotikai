var Cookies = require("cookies");
const fetch = require("node-fetch");
const fs = require("fs");
const http = require("http");
const lame = require("@suldashi/lame");
const { spawn } = require("child_process");
const {
  PORT,
  SPOTIFY_USERNAME, SPOTIFY_PASSWORD,
  SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
const SIGNING_KEY = require("uuid").v4();

const static = (response, path, contentType) => {
  response.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(`static/${path}`).pipe(response);
};

const notFound = response => {
  response.writeHead(404);
  response.end();
};

const audio = (response, cookies) => {
  if (cookies.get("user", { signed: true }) !== "authorized") {
    return notFound(response);
  }
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
    "&scope=" + encodeURIComponent(
      "user-library-read streaming user-read-playback-state user-modify-playback-state"
    ) +
    "&redirect_uri=" + encodeURIComponent(url.origin + "/authorize");
  response.writeHead(302, { Location });
  response.end();
};

const authorize = (response, url, cookies) => {
  const client = `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`;
  fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "Authorization": `Basic ${Buffer.from(client, "binary").toString("base64")}`,
    },
    body:  [
      "grant_type=authorization_code",
      `code=${url.searchParams.get("code")}`,
      `redirect_uri=${url.origin}/authorize`,
    ].join("&"),
  })
    .then(response => {
      if (response.ok) return response.json();
      else throw Error(response.statusText);
    })
    .then(({ access_token }) => {
      return fetch("https://api.spotify.com/v1/me", {
        headers: { "Authorization": `Bearer ${access_token}` },
      })
        .then(response => response.json())
        .then(({ id }) => {
          if (SPOTIFY_USERNAME === id) return access_token;
          else throw Error("Some other Spotify user is trying to access");
        });
    }).then(access_token => {
      response.statusCode = 301;
      response.setHeader("Location", `${url.origin}#${access_token}`);
      cookies.set("user", "authorized", { signed: true, sameSite: "strict" });
      response.end();
    })
    .catch(error => {
      console.error(error);
      response.writeHead(401);
      response.end();
    });
};

const server = http.createServer((request, response) => {
  const cookies = new Cookies(request, response, { keys: [ SIGNING_KEY ] });
  const url = new URL(
    request.url,
    request.headers.host.match(/localhost/)
      ? `http://${request.headers.host}`
      : `https://${request.headers.host}`
  );
  switch (url.pathname) {
    case "/":
      return static(response, "index.html", "text/html");
    case "/library":
      return static(response, "library.html", "text/html");
    case "/spotify.js":
      return static(response, "spotify.js", "application/javascript");
    case "/library.js":
      return static(response, "library.js", "application/javascript");
    case "/manifest.webapp":
      return static(response, "manifest.webapp.json", "application/x-web-app-manifest+json");
    case "/login":
      return login(response, url);
    case "/authorize":
      return authorize(response, url, cookies);
    case "/audio.mp3":
      return audio(response, cookies);
    default:
      return notFound(response);
  }
});

server.listen(PORT, () =>  console.log("\033[1m%s\x1b[0m", `Running on port ${PORT}`));
