# Postman Sandbox [![Build Status](https://travis-ci.org/postmanlabs/postman-sandbox.svg?branch=develop)](https://travis-ci.org/postmanlabs/postman-sandbox) [![codecov](https://codecov.io/gh/postmanlabs/postman-sandbox/branch/develop/graph/badge.svg)](https://codecov.io/gh/postmanlabs/postman-sandbox)

Module that unifies execution of third-party JavaScript within Node VM and Browser iFrame.

> This module is part of Postman Runtime Core and is not intended for independent use.
>
> If you are looking to execute collections, you should bee using [Newman](https://github.com/postmanlabs/newman)

## Usage
```js
var Sandbox = require('postman-sandbox'),
    context;

Sandbox.createContext(function (err, ctx) {
    if (err) {
        return console.error(err);
    }

    ctx.execute(`// code here`, {}, {}, function (err) {
        if (err) {
            return console.error(err);
        }
        console.log('executed')
    });
});
```

## Sandbox Environment

The following section outlines the API available inside sandbox scripts

### pm

- pm.globals
- pm.environment
- pm.collectionVariables
- pm.test

#### pre-request script specials

- pm.request

#### test script specials

- pm.request
- pm.response

## Events fired from Sandbox
- pong
- error
- console
- execution
- execution.error
- execution.error.*
- execution.request.*
- execution.result.*
- execution.cookies.*

## Events responded to
- ping
- execute
- execution.abort.*
- execution.response.*
- execution.cookies.*
- execution.console.*

## Contributing

### Debug in browser

To debug tests in Chrome's DevTools, start tests using `npm run test-browser -- --debug` and click `DEBUG`.
