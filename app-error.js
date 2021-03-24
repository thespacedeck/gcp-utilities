class ErrorMiddleware {
    /**
     * Construct this error middleware to use project details
     * Undefined values may be replaced with defaults
     *
     * @param apiName service name
     * @param projectVersion service version
     */
    constructor(apiName, projectVersion, logger, tracer, loggerInstance) {
        this.apiName = apiName;
        this.projectVersion = projectVersion;
        this.tracer = tracer
        this.logger = logger
        this.loggerInstance = loggerInstance
    }

    errorResponse(err, req, res, next) {
        err.statusCode = err.statusCode || 500;
        err.status = err.status || 'error';

        let responseError = { 
            api: this.apiName, 
            version: this.projectVersion,
            result: {
                statusCode: err.statusCode,
                trace: err.trace,
                status: err.status,
                message: err.message,
                stackTrace: err.stack.split('\n')
            }
        }

        // LOG ERROR WITH LOGGER
        let span = this.tracer.getCurrentSpan() ? this.tracer.getCurrentSpan().spanContext.spanId : this.tracer.startSpan();
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
    constructor(trace, message, statusCode) {
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
    ErrorMiddleware,
    AppError, 
    catchAsync,
}