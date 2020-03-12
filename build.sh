#!/bin/bash

# yarn build:scratch
docker buildx build --platform linux/arm,linux/arm64,linux/amd64 -t nimashoghi/keyboard-control:latest . --push
