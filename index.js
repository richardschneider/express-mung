'use strict';

let mung = {};

mung.json = function json (fn) {
    return function (req, res, next) {
        let original = res.json;
        function hook (json) {
            let originalJson = json;
            res.json = original;
            json = fn(json, req, res);

            // If no returned value from fn, then assume json has been mucked with.
            if (json === undefined)
                json = originalJson;

            // If null, then 204 No Content
            if (json === null)
                return res.status(204);

            return original.call(this, json);
        }
        res.json = hook;

        next();
    }
}

mung.jsonAsync = function json (fn) {
    return function (req, res, next) {
        let original = res.json;
        function hook (json) {
            res.json = original;
            fn(json, req, res)
                .then(json => {
                    // If null, then 204 No Content
                    if (json === null)
                        return res.status(204).end();

                    return original.call(this, json);
            });

            return { end: () => null };
        }
        res.json = hook;

        next();
    }
}

module.exports = mung;
