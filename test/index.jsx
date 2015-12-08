'use strict';

let should = require('should'),
    express = require('express'),
    request = require('supertest'),
    prefer = require('../');

describe ('mung', () => {

    var server;
    before(done => {
        server = express()
            .use(prefer)
            .get('/', (req, res) => res.status(200).json({ a: 'a' }).end());
        done();
    });

    it('should always be present', done => {
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                should.exist(res.body);
            })
            .end(done);
    });

    it('should have token and value', done => {
        request(server)
            .get('/')
            .set('prefer', 'x=y')
            .expect(200)
            .expect(res => {
                res.body.should.have.property('x', 'y');
            })
            .end(done);
    });

    it('should remove whitespace from token and value', done => {
        request(server)
            .get('/')
            .set('prefer', '  x   =   y   ')
            .expect(200)
            .expect(res => {
                res.body.should.have.property('x', 'y');
            })
            .end(done);
    });

    it('should be case insensitive to the header name', done => {
        request(server)
            .get('/')
            .set('PrefeR', '  x   =   y   ')
            .expect(200)
            .expect(res => {
                res.body.should.have.property('x', 'y');
            })
            .end(done);
    });

    it('should allow multiple tokens', done => {
        request(server)
            .get('/')
            .set('prefer', 'respond-async, wait=10, foo=bar, qux')
            .expect(200)
            .expect(res => {
                res.body.should.have.property('respond-async');
                res.body.should.have.property('wait', '10');
                res.body.should.have.property('foo', 'bar');
                res.body.should.have.property('qux');
            })
            .end(done);
    });

})
