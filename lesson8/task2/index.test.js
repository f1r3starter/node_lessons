const { Bank } = require('./');

describe('Test Bank:', () => {
    jest.mock('events');
    const newBank = new Bank();
    const customer = {name: 'petya', amount: 100};
    const customerId = newBank.register(customer);

    test('test new client registered', async () => {
        expect(typeof customerId).toBe('number');
    });

    test('test client exists', async () => {
        expect(() => newBank.register(customer)).toThrow(`duplicated customer for name: '${customer.name}'`);
    });

    test('test amount should be greater than 0', async () => {
        expect(() => newBank.emit('add', 666, -1)).toThrow(`amount should be grater than 0`);
    });

    test('test consumer with id not found', async () => {
        expect(() => newBank.emit('add', 666, 1)).toThrow(`customer with id '666' not found`);
    });

    test('test success enroll', async () => {
        expect(newBank.emit('add', customerId, 1)).toBeTruthy();
    });
});
