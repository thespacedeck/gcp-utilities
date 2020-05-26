const bunyan = require('bunyan');
const { LoggingBunyan } = require('@google-cloud/logging-bunyan');
const { ErrorReporting } = require('@google-cloud/error-reporting');

module.exports = class Logger {
    /**
     * Construct this logger for use with Google Stackdriver.
     * Undefined values may be replaced with defaults
     *
     * @param projectId Google projectId
     * @param keyPath path to service account json
     */
    constructor(config) {
        this.projectId = config.projectId;
        this.keyPath = config.keyPath;
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
            name: serviceName,
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
     *
     * @param serviceName defualt service to report on
     * @param projectVersion version of project/service
     */
    createReporter(serviceName, projectVersion) {
        const reportError = new ErrorReporting(
            {
                projectId: this.projectId,
                keyFilename: this.keyPath,
                reportMode: 'always',
                serviceContext: {
                    service: serviceName,
                    version: projectVersion
                }
            }
        );

        return reportError;
    }
  
}