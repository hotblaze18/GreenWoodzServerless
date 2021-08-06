const dynamoose = require('dynamoose');

const NgoSchema = new dynamoose.Schema({
    "Location": {
        type: String,
        hashKey: true,
    },
    "Name": {
        type: String,
        rangeKey: true
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
    "GeoLocation": {
        type: Object,
        schema: {
            "longitude": {
                type: Number,
                required: true
            },
            "latitude": {
                type: Number,
                required: true
            }
        }
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