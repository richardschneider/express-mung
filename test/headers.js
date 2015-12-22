'use strict';

let should = require('should'),
    express = require('express'),
    request = require('supertest'),
    mung = require('../');

describe ('mung headers', () => {

    it('should return the munged headers', done => {
        function inspect (req, res) {
            res.set('x-inspected-by', 'me');
        }
        let server = express()
            .use(mung.headers(inspect))
            .get('/', (req, res) => res.status(200).json({ a: 'a' }).end());
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                res.headers.should.have.property('x-inspected-by', 'me');
                res.body.should.eql({a: 'a'});
            })
            .end(done);
    });

    it('should work with promises', done => {
        function inspect (req, res) {
            return Promise.resolve(true)
                .then(() => {
                    res.set('x-inspected-by', 'me');
            });
        }
        let server = express()
            .use(mung.headersAsync(inspect))
            .get('/', (req, res) => res.status(200).json({ a: 'a' }).end());
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                res.headers.should.have.property('x-inspected-by', 'me');
                res.body.should.eql({a: 'a'});
            })
            .end(done);
    });

    it('should 500 on a synchronous exception', done => {
        function error (req, res) {
            req.hopefully_fails();
        }
        let server = express()
            .use(mung.headers(error))
            .get('/', (req, res) => res.status(200).json({ a: 'a' }).end());
        request(server)
            .get('/')
            .expect(500)
            .end(done);
    });

    it('should 500 on an asynchronous exception', done => {
        function error (req, res) {
            return Promise.resolve(true)
                .then(() => {
                    req.hopefully_fails();
            });
        }
        let server = express()
            .use(mung.headersAsync(error))
            .get('/', (req, res) => res.status(200).json({ a: 'a' }).end());
        request(server)
            .get('/')
            .expect(500)
            .end(done);
    });

})
