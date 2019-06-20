const { Readable, Writable, Transform } = require('stream');
const crypto = require('crypto');
const fs = require('fs');

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

class Signer {
    constructor(algorithm = 'RSA-SHA256', format = 'hex') {
        this.algorithm = algorithm;
        this.format = format;
    }

    sign(data, privateKey) {
        const sign = crypto.createSign(this.algorithm);
        sign.update(data);

        return sign.sign(privateKey).toString(this.format);
    }

    verify(data, publicKey, signature) {
        const verifier = crypto.createVerify(this.algorithm);
        verifier.update(data);

        return verifier.verify(publicKey, signature, this.format);
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
    constructor(privateKey, signer = null, validator = null, options = {}) {
        super(options);
        this.privateKey = privateKey;
        this.signer = signer || new Signer();
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

        const guardedObject = this._createGuardedObject(customer);

        this.push(JSON.stringify(guardedObject));
        done();
    }

    _createGuardedObject(customer) {
        const serializedCustomer = JSON.stringify(customer);

        return {
            meta: {
                source: this.pipeSource,
            },
            sign: this.signer.sign(serializedCustomer, this.privateKey),
            payload: customer
        };
    }
}

class AccountManager extends Writable {
    constructor(publicKey, signer = null, validator = null, options) {
        super(options);
        this.publicKey = publicKey;
        this.signer = signer || new Signer();
        this.validator = validator || new CustomerValidator();
        this.accounts = [];
    }

    _write(chunk, encoding, done) {
        this._addAccount(JSON.parse(chunk.toString()));
        done();
    }

    _addAccount({ payload: accountData, sign: signature }) {
        const validationError = this.validator.isInvalid(accountData);
        if (validationError) {
            this.emit('error', validationError);
        }

        if (!this.signer.verify(JSON.stringify(accountData), this.publicKey, signature)) {
            this.emit('error', 'Data was not signed properly');
        }

        this.accounts.push(accountData);
    }
}

const privateKey = fs.readFileSync('./certificates/server-key.pem').toString();
const publicKey = fs.readFileSync('./certificates/server-cert.pem').toString();

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
const guardian = new Guardian(privateKey);
const manager = new AccountManager(publicKey);
ui.pipe(guardian).pipe(manager);
