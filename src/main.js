'use strict';

const child_process = require('node:child_process');
const fs = require('node:fs');
const stream = require('node:stream');

if (require.main === module) {
    main();
}

async function main() {
    console.log('start');
    // capture using ffmpeg
    // await captureFilesFromFeed();
    await streamFromFeed();
    console.log('end');
}

/**
 * Wrapper function that runs ffmpeg and writes 10 frames to files, at a rate of 1 fps.
 * 
 * @returns promise that resolves to null
 */
async function captureFilesFromFeed() {
    return new Promise((resolve, reject) => {
        // ffmpeg -y -i /dev/video0 -r 1 -frames:v 10 -f image2 /workspace/mount/abc_%03d.jpg
        var proc = child_process.spawn(
            'ffmpeg',
            [
                '-y',
                '-i', '/dev/video0',
                '-r', '1',
                '-frames:v', '10',
                '-f', 'image2', // this muxer REQUIRES the numbered filename syntax (eg %03d)
                '/workspace/mount/abc_%03d.jpg'
            ],
        )
        var stderrBuffer = '';
        proc.stderr.on('data', data => {
            stderrBuffer += data;
        });
        proc.on('close', (exitCode) => {
            if (exitCode == 0) {
                console.log(stderrBuffer);
                resolve();
            } else {
                console.log('ffmpeg non-zero exit code')
                console.log(stderrBuffer);
                // reject(new Error('non-zero exit code'));
            }
        });
    });
}

/**
 * Wrapper function that runs ffmpeg and captures 10 frames at a rate of 1 fps.
 * Does NOT write to file immediately, instead pipes to a stream.
 * 
 * @returns promise that resolves to null
 */
async function streamFromFeed() {
    return new Promise((resolve, reject) => {
        // ffmpeg -y -i /dev/video0 -r 1 -frames:v 10 -f image2 /workspace/mount/abc_%03d.jpg
        // ffmpeg -y -i /dev/video0 -r 1 -frames:v 10 -f image2 /workspace/mount/abc_%03d.jpg -r 1 -frames:v 10 -vf scale=320:-1 -f image2 /workspace/mount/sm_%03d.jpg
        var proc = child_process.spawn(
            'ffmpeg',
            [
                '-i', '/dev/video0',
                '-r', '1',
                '-frames:v', '10',
                '-f', 'image2pipe', // produces jpg files in pipe
                // '-',
                'pipe:1',
            ],
            // we can pipe 2 outputs, but we have to do our own identification of the images
            // 'ffmpeg',
            // [
            //     '-i', '/dev/video0',
            //     '-r', '1',
            //     '-frames:v', '10',
            //     '-f', 'image2pipe',
            //     'pipe:1',
            //     '-r',
            //     '1',
            //     '-frames:v',
            //     '10',
            //     '-vf',
            //     'scale=320:-1',
            //     '-f', 'image2pipe',
            //     'pipe:1',
            // ],
        );
        var stderrBuffer = '';
        proc.stderr.on('data', data => {
            stderrBuffer += data;
        });
        
        proc.on('close', (exitCode) => {
            if (exitCode == 0) {
                // console.log(stderrBuffer);
                resolve();
            } else {
                console.log('ffmpeg non-zero exit code');
                console.log(stderrBuffer);
                resolve();
                // reject(new Error('non-zero exit code'));
            }
        });

        // var outstream = fs.createWriteStream('/workspace/mount/binarydump.jpg');
        var outstream = identifyJpgFilesFromStream();
        proc.stdout.pipe(outstream);
    });
}

/**
 * Returns a writable stream to for ffmpeg to pipe to.
 * Splits a ffmpeg output stream into individual jpg files by identifing the jpg
 * format 2-byte header.
 * Can be extended to other types of files recognisable by magic bytes.
 * 
 * This demo writes each jpg file to disk, but the buffer could be sent to redis
 * or something else.
 * 
 * @returns promise that resolves to null
 */
function identifyJpgFilesFromStream() {
    let f = null;
    let counter = 0;
    let s = new stream.Writable({
        write: (chunk, encoding, callback) => {
            if (chunk[0] == 0xff && chunk[1] == 0xd8) {
                // jpg header detected
                // end the previous stream if any, and open a new one
                if (f) {
                    f.end();
                    counter++;
                }
                f = fs.createWriteStream(`/workspace/mount/file_${counter.toString().padStart(3, '0')}.jpg`);
            }
            let drain = f.write(chunk);

            callback();

            // if drain is `false`, must wait for drain event (incomplete)
            return drain;
        },
        destroy: (err, callback) => {
            console.log('destroy called');
            if (f) {
                f.destroy(err);
            }
            callback(err);
        },
        final: callback => {
            console.log('final called');
            f.end();
            callback(); // may take an err argument
        },
        construct: callback => {
            // try {
            //     f1 = fs.createWriteStream('/workspace/mount/file1.part');
            //     f2 = fs.createWriteStream('/workspace/mount/file2.part');
            // } catch (err) {
            //     callback(err);
            // }
            callback();
        },
    });
    
    return s;
}