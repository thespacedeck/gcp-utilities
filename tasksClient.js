const { CloudTasksClient } = require("@google-cloud/tasks");

module.exports = class TasksClient {
    /**
     * Construct variables for this cloud tasks client for use with Google Cloud Tasks.
     * Undefined values may be replaced with defaults
     *
     * @param projectId Google projectId
     * @param keyPath path to service account json
     * @param location hosted queue location
     * 
     * Constructs the actual Google cloud tasks client for internal use
     */
    constructor(config) {
        this.projectId = config.projectId;
        this.keyPath = config.keyPath;
        this.location = config.serviceName ? config.serviceName : 'europe-west1';

        this.CloudTasksClient = new CloudTasksClient({
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
    sendTask(method, url, body, queue) {
        // configuration for the task
        const request = {
            parent: this.CloudTasksClient.queuePath(this.projectId, this.location, queue),
            task: {
                httpRequest: {
                    httpMethod: method,
                    url: url,
                    headers: {
                    'Content-Type': 'application/json',
                    },
                },
            },
        };
        if(method === 'POST' || method === 'PUT'){
            request.httpRequest.body = Buffer.from(JSON.stringify(body)).toString('base64');
        }

        let createdTask = this.cloudTasksClient.createTask(request);

        return createdTask;
    }
  
}