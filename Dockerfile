FROM node:18-buster-slim

RUN apt update -y \
    && apt -y install xz-utils wget dumb-init

RUN apt -y install ffmpeg

# RUN mkdir -p /download \
#     && cd /download \
#     && wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
#     && tar xvf ffmpeg-release-amd64-static.tar.xz \
#     && cp /download/ffmpeg-6.0-amd64-static/ffmpeg /usr/local/bin \
#     && cp /download/ffmpeg-6.0-amd64-static/ffprobe /usr/local/bin \
#     && cd / \
#     && rm -r /download

WORKDIR /workspace
COPY ./src /workspace/src

ENTRYPOINT [ "dumb-init", "--" ]

# CMD [ "ffmpeg", "-version" ]
CMD [ "node", "./src/main.js" ]

