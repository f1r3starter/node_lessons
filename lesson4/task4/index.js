const { Readable, Writable, Transform } = require('stream');

class CustomerValidator {
    constructor(allowedStructure = null) {
        this.allowedStructure = allowedStructure
            || {payload: {name: 'string', email: 'string', password: 'string'}, meta: {algorithm: 'string'}};
    }

    isInvalid(data, allowedStructure = this.allowedStructure) {
        for (const [key, value] of Object.entries(data)) {
            if (!allowedStructure[key]) {
                return `Customer object contains disallowed field '${key}'`;
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

        if (Object.keys(data).length !== Object.keys(allowedStructure).length) {
            return `Object does not contain all necessary fields`;
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

class Decryptor extends Transform {
    constructor(validator = null, allowedAlgos = null, options = {}) {
        super(options);
        this.validator = validator || new CustomerValidator();
        this.allowedAlgos = allowedAlgos || ['hex', 'base64'];
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

    _decryptObject(customer) {
        return {
                ...customer.payload,
                email:    this._decrypt(customer.payload.email, customer.meta.algorithm),
                password: this._decrypt(customer.payload.password, customer.meta.algorithm),
            };
    }

    _decrypt(str, method) {
        if (!this.allowedAlgos.includes(method)) {
            this.emit('error', 'Unsupported decryption algorithm');
        }

        return Buffer.from(str, method).toString();
    }
}

class AccountManager extends Writable {
    constructor(validator, options) {
        super(options);
        this.validator = validator
            || new CustomerValidator({name: 'string', email: 'string', password: 'string'});
        this.accounts = [];
    }

    _write(chunk, encoding, done) {
        const account = JSON.parse(chunk.toString());
        const validationError =  this.validator.isInvalid(account);
        if (validationError) {
            this.emit('error', validationError);
        }

        this.accounts.push(account);
        done();
    }
}

const customers = [
    {
        payload: {
            name: 'Pitter Black',
            email: '70626c61636b40656d61696c2e636f6d',
            password: '70626c61636b5f313233'
        },
        meta: {
            algorithm: 'hex'
        }
    }
];

const ui = new UI(customers);
const decryptor = new Decryptor();
const manager = new AccountManager();
ui.pipe(decryptor).pipe(manager);
