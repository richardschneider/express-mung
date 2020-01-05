'use strict';

let should = require('should'),
    express = require('express'),
    request = require('supertest'),
    mung = require('..');

describe('mung sendAsync', () => {

    let originalResponseTextBody
    let modifiedResponseTextBody
    let originalResponseJSONBody
    let modifiedResponseJsonBody

    beforeEach(() => {
        originalResponseTextBody = 'This is the response body'
        modifiedResponseTextBody = 'This is the response body with more content';
        originalResponseJSONBody = {
            a: 'a'
        },
        modifiedResponseJsonBody = {
            a: 'a',
            b: 'b',
        }
    })

    function modifyText (data, req, res) {
        return Promise.resolve(data + ' with more content')
    }

    function modifyJson (data, req, res) {
        data.b = 'b';
        return Promise.resolve(JSON.parse(JSON.stringify(data)))
    }

    function error (data, req, res) {
        return Promise.resolve(data)
            .then(data => data.foo.bar.hopefully.fails())
    }

    function error403 (data, req, res) {
        res.status(403).end();
        return Promise.resolve(data);
    }

    it('should return the munged text result', done => {
        const server = express()
            .use(mung.sendAsync(modifyText))
            .get('/', (req, res) => {
                res.send(originalResponseTextBody);
            });
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                res.text.should.eql(modifiedResponseTextBody);
            })
            .end(done);
    });

    it('should return a munged json body ', done => {
        const server = express()
            .use(mung.sendAsync(modifyJson))
            .get('/', (req, res) => {
                res.send(originalResponseJSONBody);
            });
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                res.body.should.eql(modifiedResponseJsonBody);
            })
            .end(done);
    });

    it('should not mung an error response (by default)', done => {
        const server = express()
            .use(mung.sendAsync(modifyText))
            .get('/', (req, res) => {
                res.status(404)
                    .send(originalResponseTextBody);
            });
        request(server)
            .get('/')
            .expect(404)
            .expect(res => {
                res.text.should.equal(originalResponseTextBody)
                res.body.should.deepEqual({});
            })
            .end(done);
    });

    it('should mung an error response when told to', done => {
        const server = express()
            .use(mung.sendAsync(modifyText, { mungError: true }))
            .get('/', (req, res) => {
                res.status(404)
                    .send(originalResponseTextBody);
            });
        request(server)
            .get('/')
            .expect(404)
            .expect(res => {
                res.text.should.eql(modifiedResponseTextBody);
            })
            .end(done);
    });

    it('should abort if a response is sent', done => {
        const server = express()
            .use(mung.sendAsync(error403))
            .get('/', (req, res) => {
                res.status(200)
                    .send(originalResponseTextBody)
            });
        request(server)
            .get('/')
            .expect(403)
            .end(done);
    });

    it('should 500 on a synchronous exception', done => {
        const server = express()
            .use(mung.sendAsync(error))
            .get('/', (req, res) => {
                res.status(200)
                    .send(originalResponseTextBody);
            });
        request(server)
            .get('/')
            .expect(500)
            .end(done);
    });

    it('should 500 on an asynchronous exception', done => {
        const server = express()
            .use(mung.sendAsync(error))
            .get('/', (req, res) => {
                process.nextTick(() => {
                    res.status(200).send(originalResponseTextBody);
                });
            });
        request(server)
            .get('/')
            .expect(500)
            .end(done);
    });
})
