db.customers.drop();
db.orders.drop();

const randomNum = (min, max) => Math.floor(min + Math.random()*(max + 1 - min));
const customers = [];

for (let i = 0; i < 3000; i++) {
    customers.push({
        name: {
            first: 'some first name',
            last: 'some last name'
        },
        balance: randomNum(10000, 15000),
        created: new Date()
    })
}

const { insertedIds } = db.customers.insertMany(customers)

const orders = [];

insertedIds.forEach(id =>  {
    for (let j = 0; j < randomNum(1, 10); j++) {
        orders.push({
            customerId: id,
            count: randomNum(1, 10),
            price: randomNum(20, 100),
            discount: randomNum(5, 30),
            title: 'some title',
            product: 'some product'
        })
    }
});

db.orders.insertMany(orders)

print('Total customers count', db.customers.count())
print('Total customers collection data size', db.customers.dataSize(), 'bytes')
print('Total orders collection data size', db.orders.dataSize(), 'bytes')
print('Total data size', db.customers.dataSize() + db.orders.dataSize(), 'bytes')
