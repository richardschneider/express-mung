'use strict';

let should = require('should'),
    express = require('express'),
    request = require('supertest'),
    mung = require('../');

describe ('mung json', () => {

    function inspect (json, req, res) {
        json.inspected_by = 'me'
    }

    function remove (json, req, res) {
        return null;
    }

    function reduce (json, req, res) {
        return json.a;
    }

    it('should return the munged JSON result', done => {
        let server = express()
            .use(mung.json(inspect))
            .get('/', (req, res) => res.status(200).json({ a: 'a' }).end());
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                let expected = {a : 'a', 'inspected_by': 'me'};
                res.body.should.eql(expected);
                res.headers['content-length'].should.equal(JSON.stringify(expected).length.toString())
            })
            .end(done);
    });

    it('should return 204 on null JSON result', done => {
        let server = express()
            .use(mung.json(remove))
            .get('/', (req, res) => res.status(200).json({ a: 'a' }).end());
        request(server)
            .get('/')
            .expect(204)
            .end(done);
    });

    it('should return the munged JSON result from a res.send', done => {
        let server = express()
            .use(mung.json(inspect))
            .get('/', (req, res) => res.status(200).send({ a: 'a' }).end());
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                let expected = {a : 'a', 'inspected_by': 'me'};
                res.body.should.eql(expected);
                res.headers['content-length'].should.equal(JSON.stringify(expected).length.toString())
            })
            .end(done);
    });

    it('should return a munged scalar result as text/plain', done => {
        let server = express()
            .use(mung.json(reduce))
            .get('/', (req, res) => res.status(200).json({ a: 'a' }).end());
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                res.text.should.equal('a');
                res.headers.should.have.property('content-type', 'text/plain; charset=utf-8');
            })
            .end(done);
    });

    it('should abort if a response is sent', done => {
        function error (json, req, res) {
            res.status(403).send('no permissions')
        }
        let server = express()
            .use(mung.json(error))
            .get('/', (req, res) => res.status(200).json({ a: 'a' }).end());
        request(server)
            .get('/')
            .expect(403)
            .expect(res => {
                res.text.should.equal('no permissions');
                res.headers.should.have.property('content-type', 'text/html; charset=utf-8');
            })
            .end(done);
    });

})
