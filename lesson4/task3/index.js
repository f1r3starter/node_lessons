const { Readable, Writable, Transform } = require('stream');
const EventEmitter = require('events');

class CustomerValidator {
    constructor(allowedFields = null) {
        this.allowedStructure = allowedFields || ['name', 'email', 'password'];
    }

    isInvalid(customer) {
        for (const [key, value] of Object.entries(customer)) {
            if (typeof value !== 'string' || value === "") {
                return `Customer field ${key} should be non-empty string`;
            }

            if (!this.allowedStructure.includes(key)) {
                return `Customer object contains disallowed field ${key}`;
            }
        }

        if (Object.keys(customer).length !== this.allowedStructure.length) {
            return `Customer object does not contain all necessary fields`;
        }

        return false;
    }
}

class DB extends EventEmitter {
    constructor() {
        super();
        this.records = [];
        this._init();
    }

    onPersist(source, payload, date) {
        this._validateSource(source);
        this._validatePayload(payload);
        this._validateDate(date);

        this.records.push({source, payload, date});
    }

    _init() {
        this.on('persist', this.onPersist);
    }

    _validateSource(source) {
        if (typeof source !== 'string') {
            this.emit('error', 'Source should be a string');
        }
    }

    _validatePayload(payload) {
        if (typeof payload !== 'object') {
            this.emit('error', 'Payload should be an object');
        }
    }

    _validateDate(date) {
        if (typeof date !== 'object' || !date instanceof Date) {
            this.emit('error', 'Date should be presented as Date object');
        }
    }
}

class UI extends Readable {
    constructor(customers, validator = null, options = {}) {
        super(options);
        this.customers = customers;
        this.validator = validator || new CustomerValidator();
    }

    _read() {
        let customer = this.customers.shift();
        if (!customer) {
            this.push(null);
        } else {
            const validationError =  this.validator.isInvalid(customer);
            if (validationError) {
                this.emit('error', validationError);
            }
            this.push(JSON.stringify(customer));
        }
    }


}

class Guardian extends Transform {
    constructor(validator = null, options = {}) {
        super(options);
        this.validator = validator || new CustomerValidator();
        this.pipeSource = null;
        this.on('pipe', this.onPipe);
    }

    onPipe(src) {
        this.pipeSource = src.constructor.name;
    }

    _transform(chunk, encoding, done) {
        const customer = JSON.parse(chunk.toString());
        const validationError =  this.validator.isInvalid(customer);
        if (validationError) {
            this.emit('error', validationError);
        }

        this.push(JSON.stringify(this._createGuardedObject(customer)));
        done();
    }

    _createGuardedObject(customer) {
        return {
            meta: {
                source: this.pipeSource,
            },
            payload: {
                ...customer,
                email:    Buffer.from(customer.email).toString('hex'),
                password: Buffer.from(customer.password).toString('hex'),
            }
        };
    }
}

class Logger extends Transform {
    constructor(db, options = {}) {
        super(options);
        this.db = db;
    }

    _transform(chunk, encoding, done) {
        const data = JSON.parse(chunk.toString());
        this._validate(data);
        this.db.emit('persist', data.meta.source, data.payload, new Date());

        done();
    }

    _validate(data) {
        if (typeof data.meta.source !== 'string') {
            this.emit('error', 'Source should be a string');
        }

        if (typeof data.payload !== 'object') {
            this.emit('error', 'Payload should be an object');
        }
    }
}

class AccountManager extends Writable {
    constructor(validator, options) {
        super(options);
        this.validator = validator || new CustomerValidator();
        this.accounts = [];
    }

    _write(chunk, encoding, done) {
        this._addAccount(JSON.parse(chunk.toString()));
        done();
    }

    _addAccount(account) {
        const validationError =  this.validator.isInvalid(account.payload);
        if (validationError) {
            this.emit('error', validationError);
        }

        this.accounts.push(account);
        console.log(account.payload);
    }
}

const customers = [
    {
        name: 'Pitter Black',
        email: 'pblack@email.com',
        password: 'pblack_123'
    },
    {
        name: 'Oliver White',
        email: 'owhite@email.com',
        password: 'owhite_456'
    }
];
const db = new DB();
const ui = new UI(customers);
const guardian = new Guardian();
const logger = new Logger(db);
const manager = new AccountManager();
ui.pipe(guardian).pipe(logger).pipe(manager);
