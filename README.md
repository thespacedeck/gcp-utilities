## Trooptravel Google Cloud Tools
A few tools to standardise certain code blocks within the team. Tools include:

- Google Cloud Trace Instancing
- Google Stackdriver Logger enhanced by Bunyan and Google Error Reporting
- Firebase instancing and general CRUD Commands
- MySQL instancing and general CRUD Commands

## Installing

Using npm:

```bash
$ npm install tt-cloud-tools
```

## Examples

### Google Cloud Tracing
In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

```js
const { Tracer } = require('tt-cloud-tools');

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

#### Resources:

- Open Telemetry

## Internal management
Provide your authentication credentials
- gcloud init && git config --global credential.https://source.developers.google.com.helper gcloud.sh

Init Git & commands in directory 
- git init
- git add .
- git commit -m "Initial commit"
- git remote add origin remote repository URL
- git push origin master
- git remote -v

Push to this GSC repo
- git remote add google https://source.developers.google.com/p/tt-hotel-api/r/tt-cloud-utilities // Add your Cloud Repository as a remote - if not created via GCP
- git push --all google // Push from your local Git repository