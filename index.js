const { PORT, MODE, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
const SIGNING_KEY = require("crypto").randomBytes(20).toString("hex");

const Cookies = require("cookies");
const fetch = require("node-fetch");
const fs = require("fs");
const http = require("http");
const lame = require("@suldashi/lame");
const { spawn } = require("child_process");

const getJson = response => {
  if (response.ok) return response.json();
  else throw Error(response.statusText);
};

const static = (response, path, contentType) => {
  response.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(`static/${path}`).pipe(response);
};

const notFound = response => {
  response.writeHead(404);
  response.end();
};

const audio = (response, cookies) => {
  const username = cookies.get("username", { signed: true });
  const token = cookies.get("token", { signed: true });
  if (!username || !token) return notFound(response);

  const flags = [
    "--name", "SpotiKai",
    "--backend", "pipe",
    "--initial-volume", "100",
    "--username", username, "--token", token,
  ];
  response.writeHead(200, { "Content-Type": "audio/mpeg" });
  spawn(`./librespot/target/${MODE}/librespot`, flags, { stdio: [ "ignore", "pipe", "inherit" ] })
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
    .then(getJson)
    .then(({ access_token }) => {
      return fetch("https://api.spotify.com/v1/me", {
        headers: { "Authorization": `Bearer ${access_token}` },
      })
        .then(getJson)
        .then(({ id }) => ({ id, access_token }));
    }).then(credentials => {
      response.statusCode = 301;
      response.setHeader("Location", `${url.origin}#${credentials.access_token}`);
      cookies.set("username", credentials.id, { signed: true, sameSite: "strict" });
      cookies.set("token", credentials.access_token, { signed: true, sameSite: "strict" });
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
