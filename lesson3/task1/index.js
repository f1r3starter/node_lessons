const EventEmitter = require('events');

class Bank extends EventEmitter {
    constructor() {
        super();
        this.customers = [];
    }

    register(customer) {
        Bank._validateCustomer(customer);
        this.customers.push(customer);
    }

    static _validateCustomer(customer) {
        if (typeof customer.name !== 'string' || customer.name === '') {
            throw new Error('Customers name cannot be empty');
        }

        if (typeof customer.balance !== 'number') {
            throw new Error('Customers balance should be a number');
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
