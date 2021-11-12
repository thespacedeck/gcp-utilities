## Google Cloud Platform Utilities

A few utilities to standardise certain code blocks within the team. utilities include:

- Google Cloud Trace Instancing
- Google Stackdriver Logger enhanced by Bunyan and Google Error Reporting
- Firebase instancing and general CRUD Commands
- MySQL instancing and general CRUD Commands
- Centralised Error Handling in Express (via middleware with manual override: i.e. in routes)

## Installing

Using npm:

```bash
# install
$ npm install gcp-cloud-utilities

#update
$ npm i gcp-cloud-utilities@latest
```

## Examples

### Google Cloud Tracing

In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

```js
const { Tracer } = require("gcp-cloud-utilities");

let tracerInstance = new Tracer({
  projectId: "YOUR-GOOGLE-PROJECT-ID",
  keyPath: "PATH/TO/SERVICE-ACCOUNT.JSON",
  plugins: {
    http: true, // boolean: to include in constructor of NodeTracerProvider
    https: true,
    express: false,
    mysql: false,
    grpc: false,
    dns: false,
    graphql: false,
  },
});

let tracer = tracerInstance.createTracer();
let api = tracerInstance.getApi();
```

### Propagate trace between services

This will forward 'traceparent' in header to subsequent services/projects

```js
const axios = require("axios");

function clientDemoRequest() {
  console.log("Starting client demo request");

  const span = tracer.startSpan("clientDemoRequest()", {
    parent: tracer.getCurrentSpan(),
    kind: api.SpanKind.SERVER,
  });

  tracer.withSpan(span, async () => {
    span.setAttribute("prop", "value");
    span.setAttributes({
      prop1: "value",
      prop2: "value",
    });
    span.addEvent("sending request");
    await axios.get("request/url").then((results) => {});
    span.setStatus({ code: api.CanonicalCode.OK });

    span.end();

    // The process must remain alive for the duration of the exporter flush
    // timeout or spans might be dropped
    console.log("Client request complete, waiting to ensure spans flushed...");
    setTimeout(() => {
      console.log("Done 🎉");
    }, 2000);
  });
}

clientDemoRequest();
```

#### Resources:

- [`Open Telemetry`](https://github.com/open-telemetry/opentelemetry-js)

### Google Cloud Logger

In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

```js
const { Logger } = require("gcp-cloud-utilities");

let loggerInstance = new Logger({
  projectId: "YOUR-GOOGLE-PROJECT-ID",
  keyPath: "PATH/TO/SERVICE-ACCOUNT.JSON",
  serviceName: "default",
  projectVersion: "1.0.8",
});

const constructorOptions = {
  level: "info",
  // add more option according to API reference
};

let logger = loggerInstance.createLogger(constructorOptions); // look at https://www.npmjs.com/package/bunyan#levels for log levels
let reporter = loggerInstance.createReporter();

logger.error(error); // submits error to Stackdriver
reporter.report(error); // reports error to Error Reporting
logger.error(new Error(error)); // submits error to both Stackdriver and Error Reporting

let labelObject = {
  key: key,
  clientId: clientId,
  tripId: tripId,
  originId: originId,
  destinationId: destinationId,
};

// If you wish to view log entries inline with trace spans in the Stackdriver Trace Viewer. This means log entry shows in Cloud Logging, Error Reporting and Cloud Trace
logger.error(
  await loggerInstance.getLoggerKey(
    tracer.getCurrentSpan().spanContext.traceId,
    labelObject
  ),
  new Error("Error now logged inline with trace span")
);
```

### MySQL Client for Google Cloud SQL

In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

```js
const { MySql } = require("gcp-cloud-utilities");

// All connection configurations from the mysql repo is available
const connection = new MySql({
  host: "localhost",
  user: "root",
  database: "accomodation",
  password: "",
  connectionLimit: 5,
});

// Example 1: Promised based execution
const mysql = connection.connect(true, true);
async function executeQuery() {
  // simple query
  await mysql
    .query("SELECT * FROM `hp_accomodation` LIMIT 1")
    .then(([results, fields]) => {
      console.log(results);
    })
    .catch((error) => {});

  console.log("finished");
}
executeQuery();

// Example 2: Promised based await queries
const mysql = connection.connect(true, true);
async function executeWithAwait() {
  let results = await mysql.query("SELECT * FROM `hp_accomodation` LIMIT 1");
  console.log(results);
  console.log("finished");
}
executeWithAwait();

// Example 3: Promised based Pool Connections
const mysql = connection.pool(true);
console.log("created pool");
async function executeQueryInPool() {
  await asyncForEach([1, 2], async (num) => {
    let results = await mysql.query(`SELECT * FROM hp_accomodation LIMIT ?`, [
      num,
    ]);
    console.log(results);
  });
  console.log("finished");
  mysql.end();
}
executeQueryInPool();

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

// Example 4: Async queries
const mysql = connection.connect(false, true);
async function executeWithAwait() {
  mysql.query("SELECT * FROM `hp_accomodation`");
  console.log(
    "query was deployed and connection will automatically end() when finished"
  );
}
executeWithAwait();

// Example 5: Pool based async queries in loop
const mysql = connection.pool(false);
console.log("created pool");
async function executeQueryInPool() {
  await asyncForEach([1, 2], async (num) => {
    mysql.query(`SELECT * FROM hp_accomodation LIMIT ?`, [num]);
    console.log("query was deployed");
  });
  console.log("pool connection will close when becoming stale");
}
executeQueryInPool();

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

// With the above example, you can query the state of your deployed queries and close the pool on finalisation in order to preserve concurrency
// Remember, calling connection.pool(false) which equals createPool() from the repo, will establish a connection in itself
setTimeout(function () {
  console.log(`All Connections ${mysql._allConnections.length}`);
  console.log(`Acquiring Connections ${mysql._acquiringConnections.length}`);
  console.log(`Free Connections ${mysql._freeConnections.length}`);
  console.log(`Queue Connections ${mysql._connectionQueue.length}`);
}, 3000);
```

### Centralised Error Handling

In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

#### When used as middleware:

```js
const { ErrorMiddleware } = require('gcp-cloud-utilities')
const apiName = require('./package.json').name;
const projectVersion = require('./package.json').version;
let errorMiddleware = new ErrorMiddleware(apiName, projectVersion);

// strictly to be used last in line before app.listin()
app.use((err, req, res, next) => {
    errorMiddleware.errorResponse(err, req, res, next)
});

app.listen(process.env.PORT || 8080);

// -- automatically catch error in route and format it when passed to express error handler
const { catchAsync } = require('gcp-cloud-utilities')
app.use('/places', catchAsync(async (req, res, next) => {
    new Error('Oeps, there is an error on this line...')
});
```

#### When used manually:

```js
const { AppError } = require("gcp-cloud-utilities");
app.all("*", (req, res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!`, // Error Message
      404 // specified error code, else will default to 500
    )
  );
});
```

### Google Cloud Tasks

In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

#### Setup TasksClient and send with a one-liner:

```js
const { TasksClient } = require('gcp-cloud-utilities');

// CLOOUDTASK CLIENT
const cloudTasksClient = new TasksClient({
    context: tracer, // if needed
    loggerInstance: loggerInstance // if needed
    projectId: 'YOUR-GOOGLE-PROJECT-ID',
    keyPath: 'PATH/TO/SERVICE-ACCOUNT.JSON',
});

// content of the task
const payload = {
    prop: 'test-from-repo'
}

const time_in_seconds_from_now = (Math.round(new Date() / 1000)) + 300 // 5 minutes from now

cloudTasksClient.sendTask({
    method: 'POST',
    url: `https://url.com`,
    body: payload,
    queue: 'my-queue',
    location: 'europe-west1'
    spanName: 'custom span name', // specify if you want to execute underneath its own span
    headers: {
        key: 'value'
    },
    scheduleTime: time_in_seconds_from_now // specify if you want to schedule the task in the future (must be in seconds)
})
```

### Workflow Manager

In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

#### Setup TasksClient and send with a one-liner:

```js
const { TasksClient, Workflow } = require('gcp-cloud-utilities');

let tracer = new Tracer({
    projectId: 'YOUR-GOOGLE-PROJECT-ID',
    keyPath: 'PATH/TO/SERVICE-ACCOUNT.JSON',
    plugins: {
        http: true, // boolean: to include in constructor of NodeTracerProvider
        https: true,
        express: false
    }
}).createTracer()

var express = require("express");
var app = express();

app.post("/", async function(req, res, next) {

    const workflow = new Workflow({
        context: tracer, // tracer will be passed on to CloudTask construction (if needed)
        loggerInstance: loggerInstance // if needed
        projectId: 'YOUR-GOOGLE-PROJECT-ID',
        keyPath: 'PATH/TO/SERVICE-ACCOUNT.JSON',
    })

    // content of the task
    const payload = {
        prop: 'test-from-repo'
    }

    const time_in_seconds_from_now = (Math.round(new Date() / 1000)) + 300 // 5 minutes from now

    workflow.kickChampion([
        {

            service: 'http://example.com',
            spanName: 'GET call 1', // specify if you want to execute underneath its own span
            operation: {
                method: 'GET',
                body: payload, // in case of POST
                queue: 'gcp-hotel-api',
                location: 'europe-west1',
                scheduleTime: time_in_seconds_from_now // specify if you want to schedule the task in the future (must be in seconds)
            }
        },
        {
            service: 'http://example.com',
            spanName: 'GET call 2', // specify if you want to execute underneath its own span
            operation: {
                method: 'GET',
                body: payload, // in case of POST
                queue: 'gcp-hotel-api',
                location: 'europe-west1'
            }
        }
    ])

    res.send("done");

    setInterval(function(){
        console.log(workflow.getWorkflowQueue())
    }, 5000);
});

var listener = app.listen(8080, function() {
  console.log("Listening on port " + listener.address().port);
});
```

### PubSub Client

In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

#### Setup PubSubClient:

```js
const { PubSubClient } = require("gcp-cloud-utilities");

let pubsub = new Tracer({
  projectId: "YOUR-GOOGLE-PROJECT-ID",
  keyPath: "PATH/TO/SERVICE-ACCOUNT.JSON",
}).init();

pubsub
  .topic(topicName)
  .publish(dataBuffer)
  .then((messageId) => {
    console.log(`Message ${messageId} published.`);
  })
  .catch((err) => {
    console.error("ERROR:", err);
  });
```
