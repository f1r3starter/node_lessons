const events = jest.genMockFromModule('events');

events.emit = (event, cb) => {
    throw new Error(event);
};

module.exports = events;
