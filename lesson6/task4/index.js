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
    constructor(options = {mode: 'pack', algorithm: 'gzip'}) {
        this._validateOptions(options);
        this.mode = options.mode;
        this.algorithm = options.algorithm;
    }

    createStream() {
        return this.mode === 'pack' ? this._pack() : this._unpack();
    }

    _pack() {
        return this.algorithm === 'gzip' ? zlib.createGzip() : zlib.createDeflate();
    }

    _unpack() {
        return this.algorithm === 'gzip' ? zlib.createGunzip() : zlib.createInflate();
    }

    _validateOptions(options) {
        if (typeof options.mode !== 'string' || typeof options.algorithm !== 'string') {
            throw new Error('mode and algorithm should be a string');
        }

        if (Object.keys(options).length !== 2) {
            throw new Error('options should have only algorithm and mode properties');
        }

        if (['pack', 'unpack'].indexOf(options.mode) === -1 || ['gzip', 'deflate'].indexOf(options.algorithm) === -1) {
            throw new Error('inproper value for mode or algorithm');
        }
    }
}

const fileStream = fs.createReadStream(path.join(__dirname, '/data/comments.json'));
const fileWriteStream = fs.createWriteStream(
    path.join(__dirname, '/data/comments.csv.gz')
);

const archiver = new Archiver({mode: 'pack', algorithm: 'deflate'});
const json2csv = new Json2csv(['postId', 'name', 'body']);

fileStream.pipe(json2csv).pipe(archiver.createStream()).pipe(fileWriteStream);
