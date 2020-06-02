const { CloudTasksClient } = require("@google-cloud/tasks");

module.exports = class TasksClient {
    /**
     * Construct variables for this cloud tasks client for use with Google Cloud Tasks.
     * Undefined values may be replaced with defaults
     *
     * @param projectId Google projectId
     * @param keyPath path to service account json
     * 
     * Constructs the actual Google cloud tasks client for internal use
     */
    constructor(config) {
        this.projectId = config.projectId;
        this.keyPath = config.keyPath;

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
        // configuration for the task
        const request = {
            parent: this.TasksClient.queuePath(this.projectId, config.location, config.queue),
            task: {
                httpRequest: {
                        httpMethod: config.method,
                        url: config.url,
                        headers: {
                            'Content-Type': 'application/json',
                    },
                },
            },
        };
        if(config.method === 'POST' || config.method === 'PUT'){
            request.task.httpRequest.body = Buffer.from(JSON.stringify(config.body)).toString('base64');
        }

        let createdTask = await this.TasksClient.createTask(request);

        return createdTask;
    }
  
}