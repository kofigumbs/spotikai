Shuffle liked songs on Spotify (via [librespot](https://github.com/librespot-org/librespot)) to any browser that supports `<audio>`.
I created this initially to stream Spotify on my KaiOS feature phone.
It works... it's just not very usable ¯\_(ツ)_/¯

## Quick Start

```
docker build -t spotikai:dev .
docker run --rm -it -p 127.0.0.1:8888:8888 -e PORT=8888 \
  -e SPOTIFY_CLIENT_ID=$SPOTIFY_CLIENT_ID \
  -e SPOTIFY_CLIENT_SECRET=$SPOTIFY_CLIENT_SECRET \
  spotikai:dev
```

<details>
  <summary>Ideas for improvement</summary>
  <ul>
    <li>Show something on the screen... anything... (<a href="https://github.com/veatik90/spotify-playlists-kaios/tree/master/src">this project</a> looks pretty nice)</li>
    <li>Playback contols—not sure how this would work since librespot seems to get pretty far ahead of Spotify Connect</li>
    <li>Stream PCM frames directly via WebSockets to avoid MP3 overhead and volatile connection (see <a href="https://github.com/audiojs
">audiojs</a>)</li>
    <li>Server should be in Rust and implement <a href="https://docs.rs/librespot-playback/0.1.3/librespot_playback/audio_backend/trait.Sink.html">Sink</a> directly without subprocess overhead</li>
    <li>KaiOS supports ad monetization: https://www.kaiostech.com/developer-faq/ https://www.kaiads.com/publishers/sdk.html</li>
  </ul>
</details>
