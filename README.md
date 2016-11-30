# Postman Sandbox

> This repository has not yet been updated with code and tests for production use.
>
> If you are looking to execute collections, you should bee using [Newman](https://github.com/postmanlabs/newman)

## Usage
```
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
