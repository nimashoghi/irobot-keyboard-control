#!/bin/bash

# yarn build:scratch
docker --experimental buildx build --platform linux/arm,linux/arm64,linux/amd64 -t nimashoghi/keyboard-control:with-server . --push
