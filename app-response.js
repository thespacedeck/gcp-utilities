// setup standard Response Object
let responseObject = { 
    api: require('../../package.json').name, 
    version: require('../../package.json').version,
    result: { 
        statusCode: null,
        data: null
    }
}

// catch all errors from routes with this catchAsync 
// and then push to epress for formatted response
const AppResponse = (res, statusCode, responseData) => {
    responseObject.result.statusCode = statusCode;
    responseObject.result.data = responseData;
    res.status(statusCode).json(responseObject)
};

module.exports = { 
    responseObject,
    AppResponse
}