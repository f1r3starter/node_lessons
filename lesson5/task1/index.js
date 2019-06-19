const { Readable, Writable, Transform } = require('stream');
const crypto = require('crypto');

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

class Cipherer {
    constructor(password = 'random_pass',
                salt = 'random_salt',
                inputEnc = 'utf8',
                outputEnc = 'hex',
                algorithm = 'aes192'
    ) {
        this.key = crypto.scryptSync(password, salt, 24);
        this.inputEnc = inputEnc;
        this.outputEnc = outputEnc;
        this.algorithm = algorithm;
        this.iv = crypto.randomFillSync(Buffer.alloc(16), 10);
    }

    cipher(data) {
        const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
        const cipheredData = cipher.update(data, this.inputEnc, this.outputEnc);

        return cipheredData + cipher.final(this.outputEnc);
    }

    decipher(data) {
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
        const decipheredData = decipher.update(data, this.outputEnc, this.inputEnc);

        return decipheredData + decipher.final(this.inputEnc);
    }
}

class UI extends Readable {
    constructor(customers, validator = null, options = {}) {
        super(options);
        validator = validator || new CustomerValidator();
        customers.map(customer => validator.isInvalid(customer))
            .filter(Boolean)
            .forEach(validationError => this.emit('error', validationError));
        this.customers = customers;
    }

    _read() {
        const customer = this.customers.shift();
        if (!customer) {
            this.push(null);
        } else {
            this.push(JSON.stringify(customer));
        }
    }


}

class Guardian extends Transform {
    constructor(cipherer = null, validator = null, options = {}) {
        super(options);
        this.cipherer = cipherer || new Cipherer();
        this.validator = validator || new CustomerValidator();
        this.pipeSource = null;
        this.on('pipe', this.onPipe);
    }

    onPipe(src) {
        this.pipeSource = src.constructor.name;
    }

    _transform(chunk, encoding, done) {
        const customer = JSON.parse(chunk.toString());
        const validationError = this.validator.isInvalid(customer);
        if (validationError) {
            this.emit('error', validationError);
        }

        this.push(JSON.stringify(this._createGuardedObject(customer)));
        done();
    }

    _createGuardedObject(customer) {
        console.log(this.cipherer);
        return {
            meta: {
                source: this.pipeSource,
            },
            payload: {
                ...customer,
                email:    this.cipherer.cipher(customer.email),
                password: this.cipherer.cipher(customer.password),
            }
        };
    }
}

class AccountManager extends Writable {
    constructor(cipherer = null, validator = null, options) {
        super(options);
        this.cipherer = cipherer || new Cipherer();
        this.validator = validator || new CustomerValidator();
        this.accounts = [];
    }

    _write(chunk, encoding, done) {
        this._addAccount(JSON.parse(chunk.toString()));
        done();
    }

    _addAccount(account) {
        const accountData = account.payload;
        const validationError = this.validator.isInvalid(accountData);
        if (validationError) {
            this.emit('error', validationError);
        }

        const customer = this._decipherCustomer(accountData);
        this.accounts.push(customer);

    }

    _decipherCustomer(account) {
        console.log(this.cipherer);
        return {
            ...account,
            email:    this.cipherer.decipher(account.email),
            password: this.cipherer.decipher(account.password),
        }
    }
}

const cipherer = new Cipherer();

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
const guardian = new Guardian(cipherer);
const manager = new AccountManager(cipherer);
ui.pipe(guardian).pipe(manager);
