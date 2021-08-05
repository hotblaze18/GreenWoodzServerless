//import your handler file or main file of Lambda
let handler = require('./index');


const getNgoTestEvent = {
    "httpMethod": "GET",
    "queryStringParameters": {
        "id": "ebf3c0f6-10cb-46c8-ac94-2af372c229da"
    }
};

const postNgoTestEvent = {
    "httpMethod": "POST",
    "body": {
        "Name": "Ngo1",
        "Address": "This is address.",
        "City": "Vadodara",
        "State": "Gujarat",
        "Zip": 390010
    }  
}

//Call your exports function with required params
//In AWS lambda these are event, content, and callback
//event and content are JSON object and callback is a function
//In my example i'm using empty JSON
handler.handler( getNgoTestEvent, //event
    {}, //content
    function(data,ss) {  //callback function with two arguments 
        console.log(data);
    });