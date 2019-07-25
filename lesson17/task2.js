db.customers.aggregate([
    {
        "$lookup": {
            "from": "orders",
            "localField": "_id",
            "foreignField": "customerId",
            "as": "orders"
        }
    },
    {
        "$project": {
            "fName": "$name.first",
            "lName": "$name.last",
            "orders._id": 1,
            "orders.count": 1,
            "_id": 0
        }
    }
])
