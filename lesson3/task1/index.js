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

    register(customer) {
        this._validateName(customer.name);
        this._validateTransactionSum(customer.balance);
        customer.id = this.idGenerator.generate();
        this.customers.push(customer);

        return customer.id;
    }

    static onError(error) {
        throw new Error('Something went wrong: ' + error);
    }

    _init() {
        this.on('add', this._onAdd);
        this.on('get', this._onGet);
        this.on('withdraw', this._onWithdraw);
        this.on('error', Bank.onError);
    }

    _onAdd(personId, sum) {
        this._validatePersonId(personId);
        this._validateTransactionSum(sum);
        this._updateBalance(personId, sum);
    }

    _onGet(personId, callback) {
        this._validatePersonId(personId);
        callback(this._findPerson(personId).balance);
    }

    _onWithdraw(personId, withDrawSum) {
        this._validatePersonId(personId);
        this._validateTransactionSum(withDrawSum);
        this._validateTransactionSum(this._findPerson(personId).balance - withDrawSum);
        this._updateBalance(personId, -withDrawSum);
    }

    _findPerson(personId) {
        return this.customers.find(customer => customer.id === personId);
    }

    _updateBalance(personId, diff) {
        this.customers = this.customers.map(
            customer => customer.id === personId
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

    _validatePersonId(personId) {
        if (!this.customers.some(customer => customer.id === personId)) {
            this.emit('error', 'Customer does not exist');
        }
    }

    _validateTransactionSum(transactionSum) {
        if (typeof transactionSum !== 'number' || transactionSum <= 0) {
            this.emit('error', 'Transaction cannot be done with incorrect sum');
        }
    }
}

const bank = new Bank();
const personId = bank.register({
    name: 'Pitter Black',
    balance: 100
});
bank.emit('add', personId, 20);
bank.emit('get', personId, (balance) => {
    console.log(`I have ${balance}₴`); // I have 120₴
});
bank.emit('withdraw', personId, 50);
bank.emit('get', personId, (balance) => {
    console.log(`I have ${balance}₴`); // I have 70₴
});
