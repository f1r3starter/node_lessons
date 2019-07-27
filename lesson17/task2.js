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
        $group:
            {
                _id: "$_id._id",
                counter: { "$sum": 1}
            }
    }
]).pretty()
