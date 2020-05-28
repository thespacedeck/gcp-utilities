## Trooptravel Google Cloud utilities
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
$ npm install tt-cloud-utilities

#update
$ npm i tt-cloud-utilities@latest
```

## Examples

### Google Cloud Tracing
In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

```js
const { Tracer } = require('tt-cloud-utilities');

let tracerInstance = new Tracer({
    projectId: 'YOUR-GOOGLE-PROJECT-ID',
    keyPath: 'PATH/TO/SERVICE-ACCOUNT.JSON',
    plugins: {
        http: true, // boolean: to include in constructor of NodeTracerProvider
        https: true,
        axios: false
    }
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
        kind: api.SpanKind.SERVER
    });

    tracer.withSpan(span, async () => {
        span.addEvent('sending request');
        await axios.get("request/url")
        .then(results => {
            
        })
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
const { Logger } = require('tt-cloud-utilities');
 
let loggerInstance = new Logger({
    projectId: 'YOUR-GOOGLE-PROJECT-ID',
    keyPath: 'PATH/TO/SERVICE-ACCOUNT.JSON',
    serviceName: 'default',
    projectVersion: '1.0.8'
});
 
let logger = loggerInstance.createLogger();
let reporter = loggerInstance.createReporter();
 
logger.error(error); // submits error to Stackdriver
reporter.report(error); // reports error to Error Reporting
logger.error(new Error(error)); // submits error to both Stackdriver and Error Reporting

// If you wish to view log entries inline with trace spans in the Stackdriver Trace Viewer. This means log entry shows in Cloud Logging, Error Reporting and Cloud Trace
logger.error(await loggerInstance.getTraceKey(tracer.getCurrentSpan().spanContext.traceId), new Error("Error now logged inline with trace span"));  
```

### MySQL Client for Google Cloud SQL
In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

```js
const { MySql } = require('tt-cloud-utilities');

// All connection configurations from the mysql repo is available
const connection = new MySql({
    host: 'localhost',
    user: 'root',
    database: 'accomodation',
    password: '',
    connectionLimit: 5
})

// Example 1: Promised based execution
const mysql = connection.connect(true, true)
async function executeQuery(){
    // simple query
    await mysql.query('SELECT * FROM `hp_accomodation` LIMIT 1')
        .then( ([results, fields]) => {
            console.log(results); 
        })
        .catch( error => {
            
        })

    console.log('finished')
}
executeQuery()

// Example 2: Promised based await queries
const mysql = connection.connect(true, true)
async function executeWithAwait(){
    let results = await mysql.query('SELECT * FROM `hp_accomodation` LIMIT 1');
    console.log(results)
    console.log('finished') 
}
executeWithAwait()

// Example 3: Promised based Pool Connections
const mysql = connection.pool(true)
console.log('created pool')
async function executeQueryInPool(){
    await asyncForEach([1, 2], async (num) => {
        let results = await mysql.query(`SELECT * FROM hp_accomodation LIMIT ?`,
            [num]
        );
        console.log(results)
    })
    console.log('finished')  
    mysql.end() 
}
executeQueryInPool()

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

// Example 4: Async queries
const mysql = connection.connect(false, true)
async function executeWithAwait(){
    mysql.query('SELECT * FROM `hp_accomodation`');
    console.log('query was deployed and connection will automatically end() when finished')  
}
executeWithAwait()

// Example 5: Pool based async queries in loop
const mysql = connection.pool(false)
console.log('created pool')
async function executeQueryInPool(){
    await asyncForEach([1, 2], async (num) => {
        mysql.query(`SELECT * FROM hp_accomodation LIMIT ?`,
            [num]
        );
        console.log('query was deployed')  
    })
    console.log('pool connection will close when becoming stale')  
}
executeQueryInPool()

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

// With the above example, you can query the state of your deployed queries and close the pool on finalisation in order to preserve concurrency
// Remember, calling connection.pool(false) which equals createPool() from the repo, will establish a connection in itself
setTimeout(function(){ 
    console.log(`All Connections ${mysql._allConnections.length}`);
    console.log(`Acquiring Connections ${mysql._acquiringConnections.length}`);
    console.log(`Free Connections ${mysql._freeConnections.length}`);
    console.log(`Queue Connections ${mysql._connectionQueue.length}`);
}, 3000);
```

## Examples

### Centralised Error Handling
In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

## When used as middleware:
```js
const { ErrorMiddleware } = require('tt-cloud-utilities')
const apiName = require('./package.json').name;
const projectVersion = require('./package.json').version;
let errorMiddleware = new ErrorMiddleware(apiName, projectVersion);

// strictly to be used last in line before app.listin()
app.use((err, req, res, next) => {
    errorMiddleware.errorResponse(err, req, res, next)
});

app.listen(process.env.PORT || 8080);
```

## When used manually:
```js
const { AppError } = require('tt-cloud-utilities')
app.all('*', (req, res, next) => {
    next(
        new AppError(
            `Can't find ${req.originalUrl} on this server!`, // Error Message
            404 // specified error code, else will default to 500
        )
    );
});
```

## Internal management
Provide your authentication credentials
- gcloud init && git config --global credential.https://source.developers.google.com.helper gcloud.sh

Init Git & commands in directory 
- git init
- git add .
- git remote add origin remote repository URL
- git commit -m "Initial commit"
- npm version patch // to increment your package version
- git push origin master
- git remote -v // list repo destinations - can be used in '$ git remote add google'

Push to this GSC repo
- git remote add google https://source.developers.google.com/p/tt-hotel-api/r/tt-cloud-utilities // Add your Cloud Repository as a remote - if not created via GCP
- git push --all google // Push from your local Git repository
- npm publish // publish/update to npm
- npm unpublish // remove package from npm (there are some rules you need to adhere to...)