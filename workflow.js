const TasksClient = require('./tasksClient');

module.exports = class Workflow {
    /**
     * Construct a new workflow
     *
     * @param context trace
     */
    constructor(config) {
        this.currentWorkflow = [];

        // TRACER CLIENT
        this.context = config.context;

        // LOGGER CLIENT
        if(config.hasOwnProperty('loggerInstance')){
            this.loggerInstance = config.loggerInstance
        }

        // CLOOUDTASK CLIENT
        this.cloudTasksClient = new TasksClient({
            context: this.context,
            loggerInstance: this.loggerInstance ? this.loggerInstance : undefined,
            projectId: config.projectId,
            keyPath: config.keyPath,
        });

    }
    
    /**
     * kickoff workflow with sequence
     *
     * @param currentWorkflow is a sequence: 
     */
    async kickChampion(currentWorkflow) {

        this.currentWorkflow = currentWorkflow;

        for(let i in this.currentWorkflow){

            let task = this.currentWorkflow[i]
            const taskConfig = {
                method: task.operation.method, 
                url: task.service, 
                body: task.operation.body, 
                queue: task.operation.queue, 
                location: task.operation.location,
                spanName: task.spanName ? task.spanName : null,
                scheduleTime: task.operation.scheduleTime ? task.operation.scheduleTime : null
            }
            
            await this.cloudTasksClient.sendTask(taskConfig)
        
            this.currentWorkflow[i].status = 'executed';

        };

    }

    /**
     * Adds operation to workflow queue
     */
    addOperation(operation) {
        this.currentWorkflow.push(operation)
    }

    /**
     * Returns the current workflow queue with execution statusses
     */
    getWorkflowQueue() {
        return this.currentWorkflow
    }
  
}