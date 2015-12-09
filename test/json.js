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


})
