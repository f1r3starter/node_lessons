const net = require('net');

const client = new net.Socket();
client.connect(8080, () => {
    console.log('Connected!');
    client.write(JSON.stringify({phone: "600-732-5190"}));
});

client.on('data', data => {
    console.log(data.toString());
});