'use strict';

let mung = {};
let faux_fin = { end: () => null };

function isScalar(v) {
    return typeof v !== 'object' && !Array.isArray(v);
}

mung.json = function json (fn) {
    return function (req, res, next) {
        let original = res.json;
        function hook (json) {
            let originalJson = json;
            res.json = original;
            if (res.headersSent)
                return res;
            json = fn(json, req, res);
            if (res.headersSent)
                return res;

            // If no returned value from fn, then assume json has been mucked with.
            if (json === undefined)
                json = originalJson;

            // If null, then 204 No Content
            if (json === null)
                return res.status(204);

            // If scalar value, then text/plain
            if (isScalar(json)) {
                res.set('content-type', 'text/plain');
                return res.send(json);
            }

            return original.call(this, json);
        }
        res.json = hook;

        next && next();
    }
}

mung.jsonAsync = function json (fn) {
    return function (req, res, next) {
        let original = res.json;
        function hook (json) {
            res.json = original;
            if (res.headersSent)
                return;
            fn(json, req, res)
                .then(json => {
                    if (res.headersSent)
                        return;

                    // If null, then 204 No Content
                    if (json === null)
                        return res.status(204).end();

                    // If scalar value, then text/plain
                    if (isScalar(json)) {
                        res.set('content-type', 'text/plain');
                        return res.send(json);
                    }

                    return original.call(this, json);
                });

            return faux_fin;
        }
        res.json = hook;

        next && next();
    }
}

mung.headers = function headers (fn) {
    return function (req, res, next) {
        let original = res.end;
        function hook () {
            res.end = original;
            if (res.headersSent)
                return;
            fn(req, res);
            if (res.headersSent) {
                console.error('sending response while in mung.headers is undefined behaviour');
                return;
            }

            return original.apply(this, arguments);
        }
        res.end = hook;

        next && next();
    }
}

mung.headersAsync = function headersAsync (fn) {
    return function (req, res, next) {
        let original = res.end;
        function hook () {
            let args = arguments;
            res.end = () => null;
            fn(req, res)
                .then(() => {
                    res.end = original;
                    if (res.headersSent)
                        return;
                    original.apply(this, args);
                });
        }
        res.end = hook;

        next && next();
    }
}

module.exports = mung;
