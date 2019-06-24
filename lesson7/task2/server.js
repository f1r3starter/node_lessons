const net = require('net');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Readable, Transform, PassThrough } = require('stream');

class RequestValidator {
    constructor(allowedStructure = null) {
        this.allowedStructure = allowedStructure ||
            {
                filter: {
                    name: {
                        first: 'string',
                        last: 'string'
                    },
                    phone: 'string',
                    address: {
                        zip: 'string',
                        city: 'string',
                        country: 'string',
                        street: 'string'
                    },
                    email: 'string'
                },
                meta: {
                    format: 'string',
                    archive: true
                }
            };
    }

    isInvalid(data, allowedStructure = this.allowedStructure) {
        for (const [key, value] of Object.entries(data)) {
            if (!allowedStructure[key]) {
                return `Request object contains disallowed field '${key}'`;
            }

            if (typeof value !== typeof allowedStructure[key]) {
                return `Field '${key}' should be of type ${typeof allowedStructure[key]}`;
            }

            if (typeof value === 'object') {
                const scalarValidationError = this.isInvalid(value, allowedStructure[key]);
                if (scalarValidationError) {
                    return scalarValidationError;
                }
            } else if (typeof value === 'string' && value === '') {
                return `Field '${key}' cannot be empty`;
            }
        }

        return false;
    }
}

class SocketRead extends Readable {
    constructor(data, validator = null, options = {}) {
        super(options);
        this.data = data;
        this.validator = validator || new RequestValidator();
    }

    _read() {
        if (!this.data) {
            this.push(null);
        } else {
            const validationError =  this.validator.isInvalid(this.data);
            if (validationError) {
                this.emit('error', validationError);
            }
            this.push(JSON.stringify(this.data));
        }
    }
}

class EntriesFilter {
    constructor(entries = []) {
        this.entries = entries;
    }

    filter(filterObj) {
        const strObj = JSON.stringify(filterObj);

        return this.entries.filter(entry =>  JSON.stringify(this._getEntrySubset(entry, ...Object.keys(filterObj))) === strObj);
    }

    _getEntrySubset(obj, ...keys) {
        return keys.reduce((acc, currValue) => ({ ...acc, [currValue]: obj[currValue] }), {})
    }
}

class Converter extends Transform {
    constructor(entriesFilter, type = 'json', delimiter = ';', options = {}) {
        super(options);
        this._validateType(type);
        this.type = type;
        this.entriesFilter = entriesFilter;
        this.delimiter = delimiter;
    }

    _transform(chunk, encoding, done) {
        const requestData = JSON.parse(chunk.toString());
        const entries = this.entriesFilter.filter(requestData.filter);
        const data = this.type === 'json' ? JSON.stringify(entries)
            : entries.map(line => this._convertToCsv(line)).join("\r\n");

        this.push(data);

        done();
    }

    _convertToCsv(jsonData) {
        return Object.values(
            Object.fromEntries(
                Object.entries(jsonData)
                    .filter(([key]) => this.fieldsToSave.includes(key))
            )
        ).map(data => JSON.stringify(data)).join(this.delimiter);
    }

    _validateType(type) {
        if (['json', 'csv'].indexOf(type) === -1) {
            throw new Error('Unknown type');
        }
    }
}

const data = fs.readFileSync(path.join(__dirname, 'users.json')).toString();
const entryFilter = new EntriesFilter(JSON.parse(data));
const validator = new RequestValidator();
const server = net.createServer();

server.on('connection', socket => {
    socket.on('data', msg => {
        const requestData = JSON.parse(msg.toString());
        const error = validator.isInvalid(requestData);

        if (error) {
            socket.write(`You have send an invalid request:` + error);
        } else {
            const converter = new Converter(entryFilter, requestData.meta.format);
            const socketReader = new SocketRead(requestData);
            const archiver = requestData.meta.archive ? zlib.createGzip() : new PassThrough();

            socketReader.pipe(converter).pipe(archiver).pipe(socket);
        }
    });
});

server.listen(8080, () => {
    console.log('TCP Server started!');
});
