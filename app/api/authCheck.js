var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');


var env = process.env.NODE_ENV || 'development';
var config = require('../config/config.js')[env];
var jwt_set = require('../config/jwt_set.json');

var userPool_Id = config.userPool_Id;


const pems = {};
for (let i = 0; i < jwt_set.keys.length; i++) {
    const jwk = {
        kty: jwt_set.keys[i].kty,
        n: jwt_set.keys[i].n,
        e: jwt_set.keys[i].e
    }
    const pem = jwkToPem(jwk);
    pems[jwt_set.keys[i].kid] = pem;
}



exports.authCheck = function (req, res, next) {
    const jwtToken = req.headers.jwt;
    ValidateToken(pems, jwtToken)
        .then((data) => {
            console.log(data);
            next();
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
}


function ValidateToken(pems, jwtToken) {
    const p = new Promise((res, rej) => {
        const decodedJWT = jwt.decode(jwtToken, { complete: true })
        if (!decodedJWT) {
            console.log("Not a valid JWT token");
            rej("Not a valid JWT token");
        }

        if (decodedJWT.apyload.iss != userPool_Id) {
            console.log("invalid issuer");
            rej({
                message: "invalid issuer",
                iss: decodedJWT.payload
            })
        }

        if (decodedJWT.payload.token_use != 'access') {
            console.log("Not an access token");
            rej("Not an access token");
        }

        const kid = decodedJWT.header.kid;
        const pem = pems[kid];
        if (!pem) {
            console.log('Invalid access token');
            rej('Invalid access token');
        }

        console.log("Decoding the JWT with PEM!");
        jwt.verify(jwtToken, pem, { issuer: userPool_Id }, function (err, payload) {
            if (err) {
                console.log("Unauthorized signature for this JWT Token")
                rej("Unauthorized signature for this JWT Token");
            } else {
                res(payload);
            }
        })
    })
    return p;
}