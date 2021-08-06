const AWS = require('aws-sdk');
const ddbGeo = require('dynamodb-geo');
// const { v4: uuidv4 } = require('uuid');

const Ngo = require('./schema');
const stateData = require('./statedata.json');

AWS.config.update({
    region: 'ap-south-1'
});

const ddb = new AWS.DynamoDB();

//configure geo data manager
const config = new ddbGeo.GeoDataManagerConfiguration(ddb, 'NgoGeoLocation');
config.rangeKeyAttributeName = 'NgoName';

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
function isValidStateAndCity(NgoData) {
    let state = NgoData['State'];
    let city = NgoData['City'];
    if(typeof(state) !== "string" || typeof(city) !== "string")
        return false;

    state = state.toUpperCase();
    city = city.charAt(0).toUpperCase() + city.slice(1);

    NgoData['State'] = state;
    NgoData['City'] = city;

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

    if(isValidStateAndCity(NgoData) === false) {
        return buildResponse(400, { 
            error: 'Incorrect Data Passed',
            message: 'Value for City or State incorrect'
         });
    }

    //add derived attribute of location which can act as partition key
    NgoData["Location"] = `${NgoData['State']}-${NgoData['City']}`;
    //Add the Geo Location for the Ngo in database
    try {
        await putGeoLocation({ ngoName: NgoData['Name'], ngoLocation: NgoData['Location'] }, NgoData['GeoLocation']);
    } catch(err) {
        return buildResponse(400, {
            message: "Problem with Geo Location data format",
            error: err
        });
    }

    //save the ngo data.
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
** Function to put the geo location in database.
*/
async function putGeoLocation(attributes, { latitude, longitude }) {
   
   const { ngoName, ngoLocation  } = attributes; 
   await GeoTableManager.putPoint({
        RangeKeyValue: { S: ngoName }, // Use this to ensure uniqueness of the hash/range pairs.
        GeoPoint: { // An object specifying latitutde and longitude as plain numbers. Used to build the geohash, the hashkey and geojson data
            latitude,
            longitude
        },
        PutItemInput: { // Passed through to the underlying DynamoDB.putItem request. TableName is filled in for you.
            Item: { // The primary key, geohash and geojson data is filled in for you
                "NgoLocation": { S: ngoLocation } // Specify attribute values using { type: value } objects, like the DynamoDB API.
            },
            // ... Anything else to pass through to `putItem`, eg ConditionExpression
        }
    }).promise();
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
//putGeoLocation({ngoName: "Ngo1", ngoLocation: "Loc"}, { latitude: 30.34, longitude: 41.27 });