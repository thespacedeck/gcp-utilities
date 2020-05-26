const bunyan = require('bunyan');
const { LoggingBunyan, LOGGING_TRACE_KEY } = require('@google-cloud/logging-bunyan');
const { ErrorReporting } = require('@google-cloud/error-reporting');

module.exports = class Logger {
    /**
     * Construct this logger for use with Google Stackdriver.
     * Undefined values may be replaced with defaults
     *
     * @param projectId Google projectId
     * @param keyPath path to service account json
     * @param serviceName Google specified service name, if not defualt
     * @param projectVersion path to service account json
     */
    constructor(config) {
        this.projectId = config.projectId;
        this.keyPath = config.keyPath;
        this.serviceName = config.serviceName ? config.serviceName : 'defualt';
        this.projectVersion = config.projectVersion ? config.projectVersion : null;
    }
    
    /**
     * Register this logger for use with Google Stackdriver.
     * Undefined values may be replaced with defaults
     */
    createLogger() {
        // Creates a Bunyan Stackdriver Logging client
        const loggingBunyan = new LoggingBunyan({
            projectId: this.projectId,
            keyFilename: this.keyPath,
        });
        // Create a Bunyan logger that streams to Stackdriver Logging
        const logger = bunyan.createLogger({
            name: this.serviceName,
            streams: [
                // Log to the console at 'info' and above
                {stream: process.stdout, level: 'info'},
                // And log to Stackdriver Logging, logging at 'info' and above
                loggingBunyan.stream('info'),
            ],
        });

        return logger;
    }

    /**
     * Register this logger  to report errors to Google Error Module.
     * Undefined values may be replaced with defaults
     */
    createReporter() {
        const reportError = new ErrorReporting(
            {
                projectId: this.projectId,
                keyFilename: this.keyPath,
                reportMode: 'always',
                serviceContext: {
                    service: this.serviceName,
                    version: this.projectVersion
                }
            }
        );

        return reportError;
    }

    /**
     * Returns the trace key provided by bunyan to provide the log in Google Cloud Trace
     */
    async getTraceKey(traceId) {
        return {
            [LOGGING_TRACE_KEY]: `projects/${this.projectId}/traces/${traceId}`
        };
    }
  
}