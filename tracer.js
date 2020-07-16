const opentelemetry = require("@opentelemetry/api");
const { NodeTracerProvider } = require("@opentelemetry/node");
const { SimpleSpanProcessor } = require("@opentelemetry/tracing");

module.exports = class Tracer {
    constructor(config) {
        this.projectId = config.projectId;
        this.keyPath = config.keyPath;
        this.plugins = config.plugins;
        this.api = opentelemetry;
    }
    
    /**
     * Register this tracer for use with the OpenTelemetry API.
     * Undefined values may be replaced with defaults
     */
    createTracer() {

        // Create a provider for activating and tracking spans
        const tracerProvider = new NodeTracerProvider({
            plugins: {
                http: {
                    enabled: this.plugins.http === true ? true : false,
                    path: "@opentelemetry/plugin-http",
                    ignoreOutgoingUrls: [/spans/]
                },
                https: {
                    enabled: this.plugins.https === true ? true : false,
                    path: "@opentelemetry/plugin-https",
                    ignoreOutgoingUrls: [/spans/]
                },
                express: {
                    enabled: this.plugins.express === true ? true : false,
                    path: "@opentelemetry/plugin-express"
                },
                mysql: {
                    enabled: this.plugins.mysql === true ? true : false,
                    path: "@opentelemetry/plugin-mysql"
                },
            }
        });

        // Create an exporter for sending spans data
        const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
        // Initialize the exporter
        const exporter = new TraceExporter({
            projectId: this.projectId,
            keyFilename: this.keyPath,
        });

        // Configure a span processor for the tracer
        tracerProvider.addSpanProcessor(new SimpleSpanProcessor(exporter));

        // Register the tracer
        tracerProvider.register();

        const tracer = opentelemetry.trace.getTracer();

        return tracer;
    }

    /**
     * Returns the opentelemetry construct as api
     */
    getApi() {
        return opentelemetry;
    }
  
}