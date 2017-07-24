var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');


var s3 = new AWS.S3();

//app.use(bodyParser.urlencoded({
//	extended: true
//}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/getCategoryPage', function(req, res) {
	//console.log("got hit\n");
	//console.log(req.body.category);
	//res.send('hello');
	var cat = req.body.category;
	var bucket = "ata-" + cat;
	s3.listObjectsV2(params = { Bucket: bucket }, function(err, data) {
		if (err) {
			//console.log(err);
			res.send(err);
		} else {
			//console.log(data.Contents[0].Key);
			res.send(data.Contents);
		}
	});
});

app.post('/getArticle', function(req, res) {
	var cat = req.body.category;
	var key = req.body.key;
	var bucket = "ata-" + cat;
	s3.getObject(params = { Bucket: bucket, Key: key }, function(err, data) {
		if (err) {
			console.log(err);
			res.send(err);
		} else {
			var content = data.Body.toString();
			console.log(data.Body);
			res.send({ body: content });
		}
	});
});

app.listen(3001);