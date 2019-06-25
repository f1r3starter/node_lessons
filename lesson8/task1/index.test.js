const { validate, validateFields } = require('./');

const validateObject = {
    data: {
        payload: {
            name: 'string',
            email: 'string',
            password: 'string',
        },
        meta: {
            source: 'string',
            algorithm: 'string',
        },
    },
    name: 'string',
    instance: 'string'
};

describe('Test validate function:', () => {
    test('test payload should be an object', () => {
        const errorObject = { ...validateObject, data: {payload: 'string'}};
        expect(() => validate(errorObject)).toThrow(`${errorObject.name}: payload should be an object`);
    });

    test('test payload should have required field name', () => {
        const errorObject = { ...validateObject, data: {payload: {}}};
        expect(() => validate(errorObject)).toThrow(`${errorObject.name}: payload should have required field name`);
    });

    test('test payload.name should not be empty', () => {
        const errorObject = { ...validateObject, data: {payload: {name: ''}}};
        expect(() => validate(errorObject)).toThrow(`${errorObject.name}: payload.name should not be empty`);
    });

    test('test payload.name should should be a string', () => {
        const errorObject = { ...validateObject, data: {payload: {name: 123}}};
        expect(() => validate(errorObject)).toThrow(`${errorObject.name}: payload.name should should be a string`);
    });

    test('test payload should have required field email', () => {
        const errorObject = { ...validateObject, data: {payload: {name: 'name'}}};
        expect(() => validate(errorObject)).toThrow(`${errorObject.name}: payload should have required field email`);
    });

    test('test payload.email should not be empty', () => {
        const errorObject = { ...validateObject, data: {payload: {name: 'name', email: ''}}};
        expect(() => validate(errorObject)).toThrow(`${errorObject.name}: payload.email should not be empty`);
    });

    test('test payload.email should should be a string', () => {
        const errorObject = { ...validateObject, data: {payload: {name: 'name', email: 123}}};
        expect(() => validate(errorObject)).toThrow(`${errorObject.name}: payload.email should should be a string`);
    });

    test('test payload should have required field password', () => {
        const errorObject = { ...validateObject, data: {payload: {name: 'name', email: 'email'}}};
        expect(() => validate(errorObject)).toThrow(`${errorObject.name}: payload should have required field password`);
    });

    test('test payload.password should not be empty', () => {
        const errorObject = { ...validateObject, data: {payload: {name: 'name', email: 'email', password: ''}}};
        expect(() => validate(errorObject)).toThrow(`${errorObject.name}: payload.password should not be empty`);
    });

    test('test payload.password should should be a string', () => {
        const errorObject = { ...validateObject, data: {payload: {name: 'name', email: 'email', password: 123}}};
        expect(() => validate(errorObject)).toThrow(`${errorObject.name}: payload.password should should be a string`);
    });

    test('test success', () => {
        expect(validate(validateObject)).toBeUndefined();
    });
});

describe('Test validateFields function:', () => {
    test('test data contains not allowed field', () => {
        const errorObject = { ...validateObject, data: { payload: { error: 'error' } }};
        expect(() => validateFields(errorObject)).toThrow(`${errorObject.name}: data contains not allowed field — error`);
    });

    test('test data contains not allowed field in object', () => {
        const errorObject = { ...validateObject, data: {payload: { name: 'name', email: 'email', password: 123 }, error: {}}};
        expect(() => validateFields(errorObject)).toThrow(`${errorObject.name}: data contains not allowed field — error`);
    });

    test('test success', () => {
        expect(validateFields(validateObject)).toBeUndefined();
    });
});