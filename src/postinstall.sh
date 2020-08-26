#!/usr/bin/env bash

set -ex -o pipefail


# Generate Heroku files

echo "BUILD_PATH=librespot" > RustConfig
echo "build-essential libasound2-dev" > Aptfile


# Apply librespot diff

pushd librespot
git init
git reset --hard
git apply ../src/librespot.patch
popd
