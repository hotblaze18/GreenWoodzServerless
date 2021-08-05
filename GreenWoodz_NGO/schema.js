const dynamoose = require('dynamoose');

const NgoSchema = new dynamoose.Schema({
    "id": {
        type: String,
        hashKey: true
    },
    "Location": {
        type: String,
        rangeKey: true
    },
    "Name": {
        type: String,
        required: true
    },
    "State": {
        type: String,
        required: true
    },
    "City": {
        type: String,
        required: true
    },
    "Address": {
        type: String,
        required: true
    },
    "Zip": {
        type: Number,
        required: true
    },
    "Contact": {
        type: Object,
        schema: {
            "Email": String,
            "Phone": [String]
        }
    }
}, {
    "timestamps": true
});

const Ngo = dynamoose.model("Ngo", NgoSchema);

module.exports = Ngo;