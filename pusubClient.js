const { PubSub } = require("@google-cloud/pubsub");

module.exports = class PubSubClient {
    /**
     * Construct a new PusubClient
     *
     * @param config for credentials
     */
    constructor(config) {
        this.projectId = config.projectId;
        this.keyPath = config.keyPath;
    }
    
    /**
     * Create the PubSub Client for use.
     */
    init() {

        // Initialize the client
        const client = new PubSub({
            projectId: this.projectId,
            keyFilename: this.keyPath,
        });

        return client;

    }
  
}