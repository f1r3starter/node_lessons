const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');

class Json2csv extends Transform {
    constructor(delimiter = ';', options = {}) {
        super(options);
        this.delimiter = delimiter;
    }

    _transform(chunk, encoding, done) {
        const customerData = JSON.parse(chunk.toString());
        const validationError =  this.validator.isInvalid(customerData);
        if (validationError) {
            this.emit('error', validationError);
        }

        this.push(JSON.stringify(this._decryptObject(customerData)));
        done();
    }

    _convertToCsv(jsonData) {
        return jsonData.values().join(this.delimiter);
    }
}

const fileStream = fs.createReadStream(path.join(__dirname, '/data/test.txt'));
const fileWriteStream = fs.createWriteStream(
    path.join(__dirname, '/data/test.txt.copy')
);

const json2csv = new Json2csv();

fileStream.pipe(json2csv).pipe(fileWriteStream);
