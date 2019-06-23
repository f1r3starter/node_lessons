const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const endOfLine = require('os').EOL;
const zlib = require('zlib');

class Json2csv extends Transform {
    constructor(fieldsToSave, delimiter = ';', options = {}) {
        super(options);
        this.fieldsToSave = fieldsToSave;
        this.delimiter = delimiter;
        this.prevPart = '';
    }

    _transform(chunk, encoding, done) {
        const lines = this._parseChunk(chunk.toString());
        lines.map(line => this._convertToCsv(line)).forEach(csvLine => this.push(csvLine));

        done();
    }

    _parseChunk(chunk) {
        const prefix = chunk.substr(0,1) === '[' ? '' : '[' + this.prevPart;
        const lastBrace = chunk.lastIndexOf('}') + 1;
        const jsonData = prefix + chunk.substr(0, lastBrace) + ']';
        this.prevPart = chunk.substr(lastBrace + 1);
        return JSON.parse(jsonData);
    }

    _convertToCsv(jsonData) {
        return Object.values(
            Object.fromEntries(
                Object.entries(jsonData)
                    .filter(([key]) => this.fieldsToSave.includes(key))
            )
        ).map(data => JSON.stringify(data)).join(this.delimiter) + endOfLine;
    }
}

class Archiver {
    constructor(mode='pack') {
        this.mode = mode;
    }

    createStream() {
        return this.mode === 'pack' ? zlib.createGzip() : zlib.createGunzip();
    }
}

const fileStream = fs.createReadStream(path.join(__dirname, '/data/comments.json'));
const fileWriteStream = fs.createWriteStream(
    path.join(__dirname, '/data/comments.csv.gz')
);

const archiver = new Archiver();
const json2csv = new Json2csv(['postId', 'name', 'body']);

fileStream.pipe(json2csv).pipe(archiver.createStream()).pipe(fileWriteStream);
