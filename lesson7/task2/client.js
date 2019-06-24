const net = require('net');

const client = new net.Socket();
client.connect(8080, () => {
    console.log('Connected!');
    client.write(JSON.stringify({filter: {phone: "600-732-5190"}, meta: {format: 'json', archive: true}}));
});

client.on('data', data => {
    console.log(data.toString());
});
