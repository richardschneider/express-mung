'use strict';

let should = require('should'),
    Promise = require('bluebird'),
    express = require('express'),
    request = require('supertest'),
    mung = require('../');

describe ('mung jsonAsync', () => {

    function inspect (json, req, res) {
        return Promise.resolve(json)
            .then(json => {
                json.inspected_by = 'me';
                return json;
            });
    }

    function remove (json, req, res) {
        return Promise.resolve(json)
            .then(json => null);
    }

    function reduce (json, req, res) {
        return Promise.resolve(json)
            .then(json => json.a);
    }


    it('should return the munged JSON result', done => {
        let server = express()
            .use(mung.jsonAsync(inspect))
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
            .use(mung.jsonAsync(remove))
            .get('/', (req, res) => res.status(200).json({ a: 'a' }).end());
        request(server)
            .get('/')
            .expect(204)
            .end(done);
    });

    it('should return a munged scalar result as text/plain', done => {
        let server = express()
            .use(mung.jsonAsync(reduce))
            .get('/', (req, res) => res.status(200).json({ a: 'alpha' }).end());
        request(server)
            .get('/')
            .expect(200)
            .expect(res => {
                res.text.should.equal('alpha');
                res.headers.should.have.property('content-type', 'text/plain; charset=utf-8');
            })
            .end(done);
    });

})
