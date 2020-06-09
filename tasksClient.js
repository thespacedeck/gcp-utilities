const { CloudTasksClient } = require("@google-cloud/tasks");

module.exports = class TasksClient {
    /**
     * Construct variables for this cloud tasks client for use with Google Cloud Tasks.
     * Undefined values may be replaced with defaults
     *
     * @param projectId Google projectId
     * @param keyPath path to service account json
     * @param context trace
     * 
     * Constructs the actual Google cloud tasks client for internal use
     */
    constructor(config) {
        this.projectId = config.projectId;
        this.keyPath = config.keyPath;

        // TRACER CLIENT
        this.context = config.context;

        this.TasksClient = new CloudTasksClient({
            projectId: this.projectId,
            keyFilename: this.keyPath
        });
    }

    /**
     * Create Task and send it to queue
     *
     * @param method Google projectId
     * @param url path to service account json
     * @param body hosted queue location
     * @param queue hosted queue location
     *
     */
    async sendTask(config) {

        let span;
        if(config.spanName !== null){
            span = this.context.startSpan(config.spanName, {
                parent: this.context.getCurrentSpan()
            });

            span.setAttributes(config)

            // creat trace parent
            config.traceparent = '00-' + span.spanContext.traceId + '-' + span.spanContext.spanId + '-0' + span.spanContext.traceFlags
        }

        if(config.hasOwnProperty('headers')){
            config.headers['Content-Type'] = 'application/json';
            config.headers['traceparent'] = config.traceparent ? config.traceparent : null;
        }else{
            config.headers = {
                'Content-Type': 'application/json',
                'traceparent': config.traceparent ? config.traceparent : null,
            }
        }

        // configuration for the task
        const request = {
            parent: this.TasksClient.queuePath(this.projectId, config.location, config.queue),
            task: {
                httpRequest: {
                    httpMethod: config.method,
                    url: config.url,
                    headers: config.headers,
                },
            },
        };
        if(config.method === 'POST' || config.method === 'PUT'){
            request.task.httpRequest.body = Buffer.from(JSON.stringify(config.body)).toString('base64');
        }

        let createdTask = await this.TasksClient.createTask(request);

        if(config.spanName !== null){
            span.end()
        }

        return createdTask;
    }
  
}