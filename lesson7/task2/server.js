const net = require('net');
const fs = require('fs');
const path = require('path');


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

const data = fs.readFileSync(path.join(__dirname, 'users.json'));
const entryFilter = new EntriesFilter(JSON.parse(data));
const validator = new RequestValidator();

const server = net.createServer();

server.on('connection', socket => {
    console.log('New client connected!');

    socket.write('Welcome a board!\n');

    socket.on('data', msg => {
        const requestData = JSON.parse(msg.toString());
        const error = validator.isInvalid(requestData);

        if (error) {
            socket.write(`You have send an invalid request:` + error);
        } else {
            const dataToSend = entryFilter.filter(requestData);

            socket.write(JSON.stringify(dataToSend));
        }
    });
});

server.listen(8080, () => {
    console.log('TCP Server started!');
});
