// catch all errors from routes with this catchAsync 
// and then push to epress for formatted response
const catchAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(err => {
            next(err)
        });
    };
};
  
// format the response for clients to consume
class AppError extends Error {
    constructor(trace, message, statusCode) {
        super(message);

        this.trace = trace;
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

let errorMiddleware = function (err, req, res, next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        troopTravel: [
            { 
                api: 'TT Hotel API', 
                version: projectVersion,
                ERROR: {
                    code: err.statusCode,
                    trace: err.trace,
                    status: err.status,
                    message: err.message,
                    stackTrace: err.stack.split('\n')
                }
            }
        ]
    });
    next()
}

module.exports = { 
    AppError, 
    catchAsync,
    errorMiddleware
}