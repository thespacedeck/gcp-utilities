const TasksClient = require('./tasksClient');

module.exports = class Workflow {
    /**
     * Construct a new workflow
     *
     * @param context trace
     */
    constructor(config) {
        this.context = config.context;
        this.currentWorkflow = [];

        // TRACER CLIENT
        this.context = config.context;

        // CLOOUDTASK CLIENT
        this.cloudTasksClient = new TasksClient({
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
                location: task.operation.location
            }
            
            if(task.hasOwnProperty('trace')){
                console.log('w/span')
                const span = this.context.startSpan(task.trace.name, {
                    parent: this.context.getCurrentSpan()
                });
                this.context.withSpan(span, async () => {
                    span.setAttribute('serviceRequest: ', task.service);
                    taskConfig.traceparent = '00-' + span.spanContext.traceId + '-' + span.spanContext.spanId + '-0' + span.spanContext.traceFlags
                    await this.cloudTasksClient.sendTask(taskConfig)
                    setTimeout(() => {
                    }, 2000);
                    span.end();
                });
            }else{
                console.log('wo/span')
                await this.cloudTasksClient.sendTask(taskConfig)
            }
        
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