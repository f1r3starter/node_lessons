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

        return this._addCustomer(customer);
    }

    static onError(error) {
        throw new Error('Something went wrong: ' + error);
    }

    _init() {
        this.on('add', this._onAdd);
        this.on('get', this._onGet);
        this.on('withdraw', this._onWithdraw);
        this.on('send', this._onSend);
        this.on('error', Bank.onError);
    }

    _onAdd(customerId, sum) {
        this._validateCustomerId(customerId);
        this._validateTransactionSum(sum);
        this._updateBalance(customerId, sum);
    }

    _onGet(customerId, callback) {
        this._validateCustomerId(customerId);
        callback(this._findCustomer(customerId).balance);
    }

    _onWithdraw(customerId, withDrawSum) {
        this._validateCustomerId(customerId);
        this._validateTransactionSum(withDrawSum);
        this._validateTransactionSum(this._findCustomer(customerId).balance - withDrawSum);
        this._updateBalance(customerId, -withDrawSum);
    }

    _onSend(senderId, receiverId, sum) {
        this._validateCustomerId(senderId);
        this._validateCustomerId(receiverId);
        this._validateTransactionSum(sum);
        this._validateTransactionSum(this._findCustomer(senderId).balance - sum);
        this._updateBalance(senderId, -sum);
        this._updateBalance(receiverId, sum);
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

    _validateTransactionSum(transactionSum) {
        if (typeof transactionSum !== 'number' || transactionSum <= 0) {
            this.emit('error', 'Transaction cannot be done with incorrect sum');
        }
    }
}

const bank = new Bank();
const personFirstId = bank.register({
    name: 'Pitter Black',
    balance: 100
});
const personSecondId = bank.register({
    name: 'Oliver White',
    balance: 700
});
bank.emit('send', personFirstId, personSecondId, 50);
bank.emit('get', personSecondId, (balance) => {
    console.log(`I have ${balance}₴`); // I have 750₴
});
bank.emit('get', personFirstId, (balance) => {
    console.log(`I have ${balance}₴`); // I have 50₴
});
