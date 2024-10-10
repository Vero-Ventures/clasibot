const AWS = require('aws-sdk');

exports.handler = async function(event, context) {
    try {
        console.log("Event: ", event);
        console.log("Context: ", context);
    } catch (err) {
        console.log("Error reading object: ", err);
        throw err
    }
}

async function getEmailContents() {{

}}