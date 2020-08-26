## Quick Start

```
git submodule update --init
npm install
(cd librespot && cargo build)
SPOTIFY_CLIENT_ID=$SPOTIFY_CLIENT_ID \
  SPOTIFY_CLIENT_SECRET=$SPOTIFY_CLIENT_SECRET \
  npm run start:debug
```
