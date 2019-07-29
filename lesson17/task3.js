const size = 3;
const pages = Math.ceil(db.customers.countDocuments({}) / size);

for (let page = 0; page < pages; page++) {
    const cursor = db.orders.aggregate([
        {
            $group:
                {
                    _id: {
                        product: '$product',
                        customerId: '$customerId'
                    },
                    total: {
                        $sum: 1
                    }
                }
        },
        {
            '$lookup': {
                'from': 'customers',
                'localField': '_id.customerId',
                'foreignField': '_id',
                'as': 'customer'
            }
        },
        {
            $group:
                {
                    _id: {
                        customerId: '$_id.customerId'
                    },
                    fName: { $first: '$customer.name.first' },
                    lName: { $first: '$customer.name.last' },
                    orders: {
                        $push: {
                            '_id': '$_id.product',
                            'total': '$total'
                        },
                    }
                }
        },
        {
            $sort: {
                '_id.customerId': 1
            }
        },
        {
            '$project': {
                '_id': false
            }
        },
        {
            '$facet': {
                metadata: [{ $count: "total" }, { $addFields: { page: page + 1 } }],
                data: [ { $skip: page * size }, { $limit: size } ] // add projection here wish you re-shape the docs
            }
        }
    ]);

    print(tojson(cursor.toArray()));
}
