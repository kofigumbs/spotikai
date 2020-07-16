## Quick Start

```
docker build -t spotikai:dev . && \
  docker run --rm -it -p 127.0.0.1:8888:8888 -e PORT=8888 \
  -e SPOTIFY_USERNAME=$SPOTIFY_USERNAME \
  -e SPOTIFY_PASSWORD=$SPOTIFY_PASSWORD \
  -e SPOTIFY_CLIENT_ID=$SPOTIFY_CLIENT_ID \
  -e SPOTIFY_CLIENT_SECRET=$SPOTIFY_CLIENT_SECRET \
  spotikai:dev
```
