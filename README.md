# Builder Catalogue

## Getting started

Install Homebrew & Node.js (if on mac):
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

Otherwise download and install Node.js from [here](https://nodejs.org/).

Install dependencies:

```
npm i
```

Build:

```
npm run build
```

Run:

```
npm start
```

Run in development mode (automatic rebuild):

```
npm run dev
```

Lint:

```
npm run lint
```

## Tests

Run unit tests:

```
npm test
```

Run integration unit tests:

```
npm run test:integration
```

## Log levels

Log level can be changed by prepending `LOG_LEVEL=<log level>` before desired npm script.

Log levels:

```
error
warn
info
debug
trace
```

## Todo

-   Error handling
-   Undefined checks
-   Tests
