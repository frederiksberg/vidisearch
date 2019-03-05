var express = require('express');
var ajaxRequest = require("request");
var router = express.Router();
var http = require('http');
var fs = require('fs');
var moment = require('moment');
var config = require('../../../config/config.js');

router.get('/api/extension/vidisearch/cvr', function (req, httpResponse) {

    let queryDsl = buildQuery(req.query.searchTerm);

    console.log(req.query);
    
    let request = {
        host: "distribution.virk.dk",
        port: '80',
        path: '/cvr-permanent/virksomhed/_search',
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": config.extensionConfig.vidisearch.cvr.auth,
        },
    }


    callback = function (response) {
        var str = ''
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            httpResponse.send(str);
        });
    }

    var httpReq = http.request(request, callback);
    httpReq.write(JSON.stringify(queryDsl));
    httpReq.end();
    //This is the data we are posting, it needs 

    // ajaxRequest(request, function (error, res) {
    //     console.log(res, error);
    //     response.send(res);
    //     return;
    // });
});

module.exports = router



function buildQuery(searchTerm) {
    return {
        "_source": [
            "Vrvirksomhed.virksomhedMetadata"
        ],
        "query": {
            "bool": {
                "must": {
                    "wildcard": {
                        "Vrvirksomhed.virksomhedMetadata.nyesteNavn.navn": '*' + searchTerm + '*'
                    }
                },
                "must_not": {
                    "exists": {
                        "field": "Vrvirksomhed.livsforloeb.periode.gyldigTil"
                    }
                },
                "filter": {
                    "match": {
                        "Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse.kommune.kommuneKode": 147
                    }
                }
            }
        }
    }
}