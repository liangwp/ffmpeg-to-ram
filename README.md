# FFMPEG test

Test FFMPEG frame extraction to RAM, using magic bytes to detect boundaries of
png and jpg files.

* [PNG file header](https://en.wikipedia.org/wiki/PNG#File_header)
* [JPG file structure](https://en.wikipedia.org/wiki/JPEG#Syntax_and_structure)

For simplicity, use the ffmpeg in ubuntu repo instead of the [static ffmpeg](https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz) build

# Prerequisites

* docker >= 24.0.0
* docker compose >= 2.18.1
* Webcam, hardcoded to /dev/video0

# Quick Start

* Clone repository
* `docker compose up --build`
* Jpg files will be written into `./mount` directory
* Refer to code comments for details
