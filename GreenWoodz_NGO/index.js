const AWS = require('aws-sdk');
const ddbGeo = require('dynamodb-geo');
const { v4: uuidv4 } = require('uuid');

const Ngo = require('./schema');
const stateData = require('./statedata.json');

AWS.config.update({
    region: 'ap-south-1'
});

const ddb = new AWS.DynamoDB();
const table = 'NGO';

const config = new ddbGeo.GeoDataManagerConfiguration(ddb, 'NgoGeoLocation');
config.rangeKeyAttributeName = 'NgoId';

const GeoTableManager = new ddbGeo.GeoDataManager(config);

config.hashKeyLength = 4;

exports.handler = async (event) => {
    
    let response;
    if(event.httpMethod === 'GET') {
        const NGOId = event.queryStringParameters.id
        response = await getNGOById(NGOId);
    }

    if(event.httpMethod === 'POST') {
        const NgoData = event.body;
        response = await createNgo(NgoData);
    }

    console.log(response);

    return response;
};

function buildResponse(statusCode, body) {

    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }

}

/*
** Get Ngo by Id
*/
async function getNGOById(id) {
    console.log(id);
    try {
        const ngo = await Ngo.get(
            {
                "id": "ebf3c0f6-10cb-46c8-ac94-2af372c229da",
                "Location": "GUJARAT-Vadodara"
            }
        );
        return buildResponse(200, { data: ngo });
    } catch(err) {
        return buildResponse(400, {
            message: 'Could not fetch',
            error: err
        });
    }

}

/*
** Check if state and City are valid or not while creating Ngo.
*/
function isValidStateAndCity(state, city) {

    if(Object.keys(stateData).includes(state)) {
        if(stateData[state].includes(city)) {
            return true;
        }
    }
    return false;
}

/*
** Creates Ngo with given data
*/
async function createNgo(NgoData) {

    NgoData['State'] = NgoData['State'].toUpperCase();
    NgoData['City'] = NgoData['City'].charAt(0) + NgoData['City'].slice(1);

    if(isValidStateAndCity(NgoData['State'], NgoData['City']) === false) {
        return buildResponse(400, { 
            error: 'Incorrect Data Passed',
            message: 'Value for City and State incorrect'
         });
    }

    //generate a unique partition key
    NgoData["id"] = uuidv4();

    //add derived attribute of location which can act as range key
    NgoData["Location"] = `${NgoData['State']}-${NgoData['City']}`;

    const ngo = new Ngo(NgoData);

    try {
        await ngo.save();
        return buildResponse(200, {
            data: ngo,
        });
    } catch(err) {
        return buildResponse(400, {
            error: err
        });
    }
}

/*
** Function to put 
*/
async function putGeoLocation(ngoId, { latitude, longitude }) {
    
   GeoTableManager.putPoint({
        RangeKeyValue: { S: ngoId }, // Use this to ensure uniqueness of the hash/range pairs.
        GeoPoint: { // An object specifying latitutde and longitude as plain numbers. Used to build the geohash, the hashkey and geojson data
            latitude,
            longitude
        },
        PutItemInput: { // Passed through to the underlying DynamoDB.putItem request. TableName is filled in for you.
            Item: { // The primary key, geohash and geojson data is filled in for you
                 // Specify attribute values using { type: value } objects, like the DynamoDB API.
            },
            // ... Anything else to pass through to `putItem`, eg ConditionExpression
        }
    }).promise().then((res) => {
        console.log(res);
    });
}


function createGeoLocationTable() {
    // Use GeoTableUtil to help construct a CreateTableInput.
const createTableInput = ddbGeo.GeoTableUtil.getCreateTableRequest(config);
 
// Tweak the schema as desired
//createTableInput.ProvisionedThroughput.ReadCapacityUnits = 2;
 
console.log('Creating table with schema:');
console.dir(createTableInput, { depth: null });
 
// Create the table
ddb.createTable(createTableInput).promise()
    // Wait for it to become ready
    .then(function () { return ddb.waitFor('tableExists', { TableName: config.tableName }).promise() })
    .then(function () { console.log('Table created and ready!') });

}

//createGeoLocationTable();
// putGeoLocation('randomId', { latitude: 30.34, longitude: 41.27 });