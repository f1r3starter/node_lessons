const { Bank } = require('./');

jest.mock('events');

describe('Test promise function:', () => {
    const newBank = () => new Bank();
    test('test async getData', async () => {
        expect(newBank()._enroll('vasya', -100)).toBe('success');
    });
});
