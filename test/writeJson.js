'use strict';

let should = require('should'),
    express = require('express'),
    request = require('supertest'),
    mung = require('../');

describe('mung writeJson', () => {

    let originalResponseBody

    beforeEach(() => {
        originalResponseBody = JSON.stringify({ a: 'a' })
    })

    function inspect (json, req, res) {
        json.inspected_by = 'me'
    }

    function remove (json, req, res) {
        return null;
    }

    function reduce (json, req, res) {
        return json.a;
    }

    function error(json, req, res) {
        json.foo.bar.hopefully.fails();
    }

    it('should return the munged JSON result', done => {
        let server = express()
            .use(mung.writeJson(inspect, { encoding: 'utf-8' }))
            .get('/', (req, res) => {
                res.set('Content-Type', 'application/json')
                    .status(200)
                    .write(originalResponseBody);
                res.end();
            });
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                let expected = {
                    a : 'a',
                    'inspected_by': 'me'
                };
                res.body.should.eql(expected);
                res.headers['content-length'].should.equal(JSON.stringify(expected).length.toString())
            })
            .end(done);
    });

    it('should not mung an error response (by default)', done => {
        let server = express()
            .use(mung.writeJson(inspect, { encoding: 'utf-8' }))
            .get('/', (req, res) => {
                res.set('Content-Type', 'application/json')
                    .status(404)
                    .write(originalResponseBody);
                res.end();
            });
        request(server)
            .get('/')
            .expect(404)
            .expect(res => {
                res.body.should.not.have.property('inspected_by');
            })
            .end(done);
    });

    it('should mung an error response when told to', done => {
        let server = express()
            .use(mung.writeJson(inspect, { mungError: true }, { encoding: 'utf-8' }))
            .get('/', (req, res) => {
                res.set('Content-Type', 'application/json')
                    .status(404)
                    .write(originalResponseBody);
                res.end();
            });
        request(server)
            .get('/')
            .expect(404)
            .expect(res => {
                let expected = {
                    a : 'a',
                    'inspected_by': 'me'
                };
                res.body.should.eql(expected);
                res.headers['content-length'].should.equal(JSON.stringify(expected).length.toString())
            })
            .end(done);
    });

    it('should return 204 on null JSON result', done => {
        let server = express()
            .use(mung.writeJson(remove, { encoding: 'utf-8' }))
            .get('/', (req, res) => {
                res.set('Content-Type', 'application/json')
                    .status(200)
                    .write(originalResponseBody)
                res.end();
            });
        request(server)
            .get('/')
            .expect(204)
            .end(done);
    });

    it('should not munge a response when the content type is not application/json', done => {
        let server = express()
            .use(mung.writeJson(inspect, { encoding: 'utf-8' }))
            .get('/', (req, res) => {
                res.status(200)
                    .write(originalResponseBody)
                res.end();
            });
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                res.text.should.equal(originalResponseBody);
            })
            .end(done);
    });

    it('should abort if a response is sent', done => {
        function error (json, req, res) {
            res.status(403).json({ foo: 'bar '})
        }
        let server = express()
            .use(mung.writeJson(error, { encoding: 'utf-8' }))
            .get('/', (req, res) => {
                res.set('Content-Type', 'application/json')
                    .status(200)
                    .write(originalResponseBody)
                res.end()
            });
        request(server)
            .get('/')
            .expect(403)
            .end(done);
    });

    it('should 500 on a synchronous exception', done => {
        let server = express()
            .use((err, req, res, next) => res.status(500).send(err.message).end())
            .use(mung.writeJson(error, { encoding: 'utf-8' }))
            .get('/', (req, res) => {
                res.set('Content-Type', 'application/json')
                    .status(200)
                    .write(originalResponseBody);
                res.end();
            });
        request(server)
            .get('/')
            .expect(500)
            .end(done);
    });

    it('should 500 on an asynchronous exception', done => {
        let server = express()
            .use((err, req, res, next) => res.status(500).send(err.message).end())
            .use(mung.writeJson(error, { encoding: 'utf-8' }))
            .get('/', (req, res) => {
                process.nextTick(() => {
                    res.set('Content-Type', 'application/json')
                        .status(200).write(originalResponseBody);
                    res.end();
                });
            });
        request(server)
            .get('/')
            .expect(500)
            .end(done);
    });

})
