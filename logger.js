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
     * 
     * @param fatal: The service/app is going to stop or become unusable now. An operator should definitely look into this soon.
     * @param error: Fatal for a particular request, but the service/app continues servicing other requests. An operator should look at this soon(ish). Include as much information as possible to assist in a postmortem analysis of the error, be mindful with sensitive data.
     * @param warn: A note on something that should probably be looked at by an operator eventually. Data inconsistencies, responses from 3rd party services that do not comply with their API specifications.
     * @param info: Detail on regular operation.
     * @param debug: Anything else, i.e. too verbose to be included in “info” level.
     * @param trace: Logging from external libraries used by your app or very detailed application logging.
     */
    createLogger(constructorOptions) {
        // Creates a Bunyan Stackdriver Logging client
        const loggingBunyan = new LoggingBunyan({
            projectId: this.projectId,
            keyFilename: this.keyPath,
        });

        let streamsObj = [
            // And log to Stackdriver Logging, logging at 'info' and above
            loggingBunyan.stream(constructorOptions.level ? constructorOptions.level : 'info'),
        ]

        if(process.env.NODE_ENV !== "production"){
            streamsObj.push(
                // Log to the console at 'info' and above
                {stream: process.stdout, level: constructorOptions.level ? constructorOptions.level : 'info'}
            )
        }

        let constructor = {
            ...{ 
                name: this.serviceName,
                streams: streamsObj,
                serializers: bunyan.stdSerializers
            }, 
            ...constructorOptions
        }

        // Create a Bunyan logger that streams to Stackdriver Logging
        const logger = bunyan.createLogger(constructor);

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
    async getLoggerKey(traceId, logEntryOptions) {

        return {
            ...{
                [LOGGING_TRACE_KEY]: `projects/${this.projectId}/traces/${traceId}`
            },
            ...logEntryOptions
        };
    }
  
}