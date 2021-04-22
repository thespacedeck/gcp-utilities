const tracerApi = require("@opentelemetry/api");

class ResponseMiddleware {

    apiName = '';
    projectVersion = '';

    /**
     * Construct this error middleware to use project details
     * Undefined values may be replaced with defaults
     *
     * @param apiName service name
     * @param projectVersion service version
     */
    constructor(config) {
        this.responseWrapper = config.responseWrapper
        process.env.RESPONSE_WRAPPER = config.responseWrapper ? JSON.stringify(config.responseWrapper) : JSON.stringify({})
        this.logger = config.logger
        this.loggerInstance = config.loggerInstance
        this.tracer = config.tracer
    }

    response(request, response, next) {

        const json_ = response.json; // capture the default resp.json implementation

        response.json = (object) => {
            json_.call(response, {
                ...JSON.parse(process.env.RESPONSE_WRAPPER),
                result: object
            });
        };
        
        next();
    }

    errorResponse(err, req, res, next) {
        err.statusCode = err.statusCode || 500;
        err.status = err.status || 'error';

        let responseError = {
            statusCode: err.statusCode,
            trace: err.trace,
            status: err.status,
            message: err.message,
            stackTrace: err.stack.split('\n')
        }

        // LOG ERROR WITH LOGGER
        let span = tracerApi.getSpan(tracerApi.context.active()) ? tracerApi.getSpan(tracerApi.context.active()) : this.tracer.startSpan().updateName("errorResponse")
        let labelObject = {
            environment: process.env.NODE_ENV,
            spanId: span.spanContext.spanId
        };
        let loggerKey = this.loggerInstance.getLoggerKey(
            span.spanContext.spanId,
            { labels: labelObject }
            );
            span.setAttribute("ERROR", labelObject.spanId);
            this.logger.error(
                loggerKey,
                responseError
            );
        
        res.status(err.statusCode).json(responseError);
    }

}

// format the response for clients to consume
class AppError extends Error {
    constructor(message, trace, statusCode) {
        super(message);
        
        this.trace = trace;
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// catch all errors from routes with this catchAsync 
// and then push to epress for formatted response
const catchAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(err => {
            next(err)
        });
    };
};

module.exports = { 
    ResponseMiddleware,
    AppError, 
    catchAsync
}