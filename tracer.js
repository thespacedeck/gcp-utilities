const opentelemetry = require("@opentelemetry/api");
const { NodeTracerProvider } = require("@opentelemetry/node");
const { SimpleSpanProcessor } = require("@opentelemetry/tracing");

module.exports = class tracer {
    constructor(config) {
        this.projectId = config.projectId;
        this.keyPath = config.keyPath;
        this.plugins = config.plugins;
    }
    
    /**
     * Register this tracer for use with the OpenTelemetry API.
     * Undefined values may be replaced with defaults
     *
     * @param projectId Google projectId
     * @param keyPath path to service account json
     * @param otPlugins object of Open Telementry plugins to be activated
     */
    static createTracer(projectId, keyPath, plugins) {

        // Create a provider for activating and tracking spans
        const tracerProvider = new NodeTracerProvider({
            plugins: {
                http: {
                    enabled: plugins.http === true ? true : false,
                    path: "@opentelemetry/plugin-http"
                },
                https: {
                    enabled: plugins.https === true ? true : false,
                    path: "@opentelemetry/plugin-https"
                },
                express: {
                    enabled: plugins.express === true ? true : false,
                    path: "@opentelemetry/plugin-express"
                }
            }
        });

        // Create an exporter for sending spans data
        const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
        // Initialize the exporter
        const exporter = new TraceExporter({
            projectId: projectId,
            keyFilename: keyPath,
        });

        // Configure a span processor for the tracer
        tracerProvider.addSpanProcessor(new SimpleSpanProcessor(exporter));

        // Register the tracer
        tracerProvider.register();

        const tracer = opentelemetry.trace.getTracer();

        return { 
            opentelemetry,
            tracer
        }
    }
  
}