const { Readable, Writable, Transform } = require('stream');

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

class AccountManager extends Writable {
    constructor(options) {
        super(options);
        this.accounts = [];
    }

    _write(chunk, encoding, done) {
        this.accounts.push(JSON.parse(chunk.toString()));
        done();
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
const ui = new UI(customers);
const guardian = new Guardian();
const manager = new AccountManager();
ui.pipe(guardian).pipe(manager);
