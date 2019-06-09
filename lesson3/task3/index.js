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
        this._validateLimit(customer.limit);
        this._validateTransactionAmount(customer.balance, 'balance');

        return this._addCustomer(customer);
    }

    _init() {
        this.on('add', this._onAdd);
        this.on('get', this._onGet);
        this.on('withdraw', this._onWithdraw);
        this.on('send', this._onSend);
        this.on('changeLimit', this._onChangeLimit);
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
        this._checkLimit(customerId, withDrawSum);
        this._updateBalance(customerId, -withDrawSum);
    }

    _onSend(senderId, receiverId, amount) {
        this._checkLimit(senderId, amount);
        this._validateCustomerId(receiverId);
        this._updateBalance(senderId, -amount);
        this._updateBalance(receiverId, amount);
    }

    _onChangeLimit(customerId, limitCallback) {
        this.customers = this.customers.map(
            customer => customer.id === customerId
                ? {...customer, limit: limitCallback}
                : customer
        );
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

    _checkLimit(customerId, amount) {
        this._validateCustomerId(customerId);
        this._validateTransactionAmount(amount);
        const customer = this._findCustomer(customerId);
        const updatedBalance = customer.balance - amount;
        this._validateTransactionAmount(updatedBalance, 'balance');

        if (!customer.limit(amount, customer.balance, updatedBalance)) {
            this.emit('error', 'Operation can not be done due to limit restrictions');
        }
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
            this.emit('error', `Operation cannot be done with incorrect or negative amount in your ${type} ${amount}`);
        }
    }

    _validateLimit(limitCallback) {
        if (typeof limitCallback !== 'function') {
            this.emit('error', `Limit callback should be a function`);
        }
    }
}


const bank = new Bank();
const personId = bank.register({
    name: 'Oliver White',
    balance: 700,
    limit: amount => amount < 10
});
bank.emit('withdraw', personId, 5);
bank.emit('get', personId, (amount) => {
    console.log(`I have ${amount}₴`); // I have 695₴
});
// Вариант 1
bank.emit('changeLimit', personId, (amount, currentBalance,
                                    updatedBalance) => {
    return amount < 100 && updatedBalance > 700;
});
bank.emit('withdraw', personId, 5); // Error
