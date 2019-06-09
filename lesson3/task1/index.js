const EventEmitter = require('events');

class UuidGenerator {
    generate() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

class Bank extends EventEmitter {
    constructor(idGenerator = null) {
        super();
        this.idGenerator = idGenerator || new UuidGenerator();
        this.customers = [];
        this._init();
    }

    static onError(error) {
        throw new Error('Something went wrong: ' + error);
    }

    register(customer) {
        this._validateName(customer.name);
        this._validateTransactionAmount(customer.balance, 'balance');

        return this._addCustomer(customer);
    }

    _init() {
        this.on('add', this._onAdd);
        this.on('get', this._onGet);
        this.on('withdraw', this._onWithdraw);
        this.on('error', Bank.onError);
    }

    _onAdd(customerId, amount) {
        this._validateCustomerId(customerId);
        this._validateTransactionAmount(amount);
        this._updateBalance(customerId, amount);
    }

    _onGet(customerId, callback) {
        this._validateCustomerId(customerId);
        callback(this._findCustomer(customerId).balance);
    }

    _onWithdraw(customerId, withDrawSum) {
        this._validateCustomerId(customerId);
        this._validateTransactionAmount(withDrawSum);
        this._validateTransactionAmount(this._findCustomer(customerId).balance - withDrawSum, 'balance');
        this._updateBalance(customerId, -withDrawSum);
    }

    _addCustomer(customer) {
        customer.id = this.idGenerator.generate();
        this.customers.push(customer);

        return customer.id;
    }

    _findCustomer(customerId) {
        return this.customers.find(customer => customer.id === customerId);
    }

    _updateBalance(customerId, diff) {
        this.customers = this.customers.map(
            customer => customer.id === customerId
                ? {...customer, balance: customer.balance + diff}
                : customer
        );
    }

    _validateName(name) {
        if (typeof name !== 'string' || name === '') {
            this.emit('error', 'Customer name cannot be empty');
        }

        if (this.customers.some(customer => customer.name === name)) {
            this.emit('error', 'Customer with the same name already exists');
        }
    }

    _validateCustomerId(customerId) {
        if (!this.customers.some(customer => customer.id === customerId)) {
            this.emit('error', 'Customer does not exist');
        }
    }

    _validateTransactionAmount(amount, type = 'transaction') {
        if (typeof amount !== 'number' || amount <= 0) {
            this.emit('error', `Operation cannot be done with incorrect or negative amount in your ${type}`);
        }
    }
}

const bank = new Bank();
const customerId = bank.register({
    name: 'Pitter Black',
    balance: 100
});
bank.emit('add', customerId, 20);
bank.emit('get', customerId, (balance) => {
    console.log(`I have ${balance}₴`); // I have 120₴
});
bank.emit('withdraw', customerId, 50);
bank.emit('get', customerId, (balance) => {
    console.log(`I have ${balance}₴`); // I have 70₴
});
