const EventEmitter = require('events');

class Bank extends EventEmitter {

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
