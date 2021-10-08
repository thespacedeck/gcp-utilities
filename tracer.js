const opentelemetry = require("@opentelemetry/api");
const {
  TraceExporter,
} = require("@google-cloud/opentelemetry-cloud-trace-exporter");
const { NodeTracerProvider } = require("@opentelemetry/node");
const { BatchSpanProcessor } = require("@opentelemetry/tracing");

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
          ignoreOutgoingUrls: [/traces:batchWrite/],
        },
        https: {
          enabled: this.plugins.https === true ? true : false,
          path: "@opentelemetry/plugin-https",
          ignoreOutgoingUrls: [/traces:batchWrite/],
        },
        express: {
          enabled: this.plugins.express === true ? true : false,
          path: "@opentelemetry/plugin-express",
        },
        mysql: {
          enabled: this.plugins.mysql === true ? true : false,
          path: "@opentelemetry/plugin-mysql",
        },
        "@grpc/grpc-js": {
          enabled: this.plugins.grpc === true ? true : false,
          path: "@opentelemetry/plugin-grpc-js",
        },
        dns: {
          enabled: this.plugins.dns === true ? true : false,
          path: "@opentelemetry/plugin-dns",
        },
        graphql: {
          enabled: this.plugins.graphql === true ? true : false,
          path: "@opentelemetry/instrumentation-graphql",
        },
      },
    });

    // Register the tracer
    tracerProvider.register();
    opentelemetry.trace.setGlobalTracerProvider(tracerProvider);

    // Create an exporter for sending spans data
    // Initialize the exporter
    const exporter = new TraceExporter({
      projectId: this.projectId,
      keyFilename: this.keyPath,
    });

    // Configure a span processor for the tracer
    tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter));

    const name = this.projectId;
    const version = "0.1.0";
    const tracer = opentelemetry.trace.getTracer(name, version);

    return tracer;
  }

  /**
   * Returns the opentelemetry construct as api
   */
  getApi() {
    return opentelemetry;
  }
};
