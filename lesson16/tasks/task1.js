db.customers.drop();
db.orders.drop();

const randomNum = (min, max) => Math.floor(min + Math.random()*(max + 1 - min));

for (let i = 0; i < 3000; i++) {
    const { insertedId } = db.customers.insertOne({
        name: {
            first: 'some first name',
            last: 'some last name'
        },
        balance: randomNum(10000, 15000),
        created: new Date()
    })
    for (let j = 0; j < randomNum(1, 10); j++) {
        db.orders.insertOne({
            customerId: insertedId,
            count: randomNum(1, 10),
            price: randomNum(20, 100),
            discount: randomNum(5, 30),
            title: 'some title',
            product: 'some product'
        });
    }
}

