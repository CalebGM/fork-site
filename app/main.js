var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var fs = require('fs');
var request = require('request').defaults({ encoding: null });
var Stream = require('stream');
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
var mysql = require('mysql');

var env = process.env.NODE_ENV || 'development';
//console.log(process.env.NODE_ENV);
var config = require('./config')[env];

//console.log(config);


var s3 = new AWS.S3();

var connection = mysql.createConnection({
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	port: config.database.port
});

const categories = ['Art', 'Comics', 'Fake_News', 'Life', 'Movies', 'Music', 'Sports', 'Video_Games'];
const table = config.database.articles;


//app.use(bodyParser.urlencoded({
//	extended: true
//}));
app.use(cookieParser());
app.use(bodyParser.json());


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", config.url);
	res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function(req, res) {
	var cookieName = config.cookie.name;
	
	if (req.cookies[cookieName] === config.cookie.value) {
		res.cookie(config.cookie.name, config.cookie.value, { maxAge: 5400000, httpOnly: true }).send({ isAdmin: true });
	} else {
		res.sendStatus(200);
	}
	
});

app.post('/getHomePage', function(req, res) {
	var page = Number(req.body.page);
	var offset = (page - 1)*15;
	
	var sql = "SELECT * FROM ?? ORDER BY Created DESC LIMIT ?, 15";
	sql = mysql.format(sql, [table, offset]);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error)
			res.sendStatus(500);
			return;
		} else {
			res.send(results);
		}
	});
});




app.post('/getAuthorPage', function(req, res) {
	var author = req.body.author;
	var page = Number(req.body.page);
	var offset = (page - 1)*15;
	
	var sql = "SELECT * FROM ?? WHERE Author = ? ORDER BY Created DESC LIMIT ?, 15";
	sql = mysql.format(sql, [table, author, offset]);
	console.log(sql);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error)
			res.sendStatus(500);
			return;
		} else {
			res.send(results);
		}
	});
});


app.post('/getCategoryPage', function(req, res) {
	console.log(req.cookies);
	var cat = req.body.category;
	var page = Number(req.body.page);
	
	var offset = (page - 1)*15;
	
	var sql = "SELECT * FROM ?? WHERE ?? = 1 ORDER BY Created DESC LIMIT ?, 15";
	sql = mysql.format(sql, [table, cat, offset]);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			res.sendStatus(500);
			return;
		} else {
			res.send(results);
		}
	});
	
});

app.post('/getArticle', function(req, res) {
	var key = req.body.key;
	var bucket = "ata-articles";
	
	var sql = "SELECT * FROM ?? WHERE Title = ?";
	sql = mysql.format(sql, [table, key]);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			return;
		} else {
			s3.getObject(params = { Bucket: bucket, Key: key }, function(err, data) {
				if (err) {
					console.log(err);
					res.sendStatus(500);
				} else {
					var content = data.Body.toString();
					console.log('after the s3');
					res.send({ body: content, info: results });
				}
			});
		}
	});
	

});


app.post('/checkLogin', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	
	var sql = "SELECT COUNT(*) AS isAdmin FROM ?? WHERE ata_username = ? AND ata_password = ?";
	sql = mysql.format(sql, [table, username, password]);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			return;
		} else {
			if (results[0].isAdmin === 1) {
				console.log('hi');
				res.cookie(config.cookie.name, config.cookie.value, { maxAge: 5400000, httpOnly: true }).send({ isAdmin: true });
			} else {
				res.send({ isAdmin: false });
			}
		}
	});
});


app.post('/admin/publish/uploadImage', function(req, res) {
	var oldUrl = req.body.url;
	var fileSplit = oldUrl.split('/');
	var fileName = fileSplit[fileSplit.length - 1];
	if(!fileName) {
		fileName = fileSplit[fileSplit.length - 2];
	};

	request.get(oldUrl, function(err, res2, body) {
		var bucket = 'ata-media';
		var albumPhotosKey = encodeURIComponent("media") + '/';
		
		var photoKey = albumPhotosKey + fileName;

		
		var params = {
			Bucket: bucket,
			Key: photoKey,
			Body: body,
			ContentDisposition: 'inline',
			ContentType: 'image/jpeg',
			ACL: 'public-read'
		};
		
		s3.upload(params, function(err, data) {
			if (err) {
				return alert('There was an error uploading your photo: ', err.message);
			} else {
				var newFileSplit = data.Location.split('/');
				var newFileName = newFileSplit[newFileSplit.length - 1];
				var newUrl = "https://s3-us-west-2.amazonaws.com/ata-media/media/" + newFileName;
				res.send({ url: newUrl });
			}
		});
	});
});




app.post('/admin/publish/postArticle', function(req, res) {
	
	var cats = req.body.categories;
	console.log(cats);
	var key = req.body.title;
	var author = req.body.author;
	var date = new Date();
	var isCat = new Array();
	
	for (var i = 0; i < categories.length; i++) {
		if (cats.includes(categories[i]))
			isCat.push(true);
		else
			isCat.push(false);
	}
	
			
	var sql = "INSERT INTO ?? (Title, Author, Art, Comics, Fake_News, Life, Movies, Music, Sports, Video_Games," +
				 " Created, Last_Updated) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
	var inserts = [table, key, author, isCat[0], isCat[1], isCat[2], isCat[3], isCat[4], isCat[5],
					isCat[6], isCat[7], date, date];
	sql = mysql.format(sql, inserts);
	console.log(sql);
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			return;
		} else {
			console.log(results.insertId);
			var article = req.body.article;
			var art = JSON.stringify(article);
			var bucket = "ata-articles";
			s3.putObject(params = { Bucket: bucket, Key: key, Body: art}, function(err, data) {
				if (err) {
					console.log(err);
					res.send(err);
				} else {
					console.log(data);
					res.sendStatus(200);
				}
			});
		}
	});
	

});


app.post('/admin/publish/updateArticle', function(req, res) {
	
	var cats = req.body.categories;
	console.log(cats);
	var key = req.body.title;
	var author = req.body.author;
	var date = new Date();
	var isCat = new Array();
	
	for (var i = 0; i < categories.length; i++) {
		if (cats.includes(categories[i]))
			isCat.push(true);
		else
			isCat.push(false);
	}
	
			
	var sql = "UPDATE ?? SET Author = ?, Art = ?, Comics = ?, Fake_News = ?, Life = ?, Movies = ?, Music = ?, " +
				"Sports = ?, Video_Games = ?, Last_Updated = ? WHERE Title = ?;";
	var inserts = [table, author, isCat[0], isCat[1], isCat[2], isCat[3], isCat[4], isCat[5],
					isCat[6], isCat[7], date, key];
	sql = mysql.format(sql, inserts);
	console.log(sql);
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			return;
		} else {
			console.log(results.insertId);
			var article = req.body.article;
			var art = JSON.stringify(article);
			var bucket = "ata-articles";
			s3.putObject(params = { Bucket: bucket, Key: key, Body: art}, function(err, data) {
				if (err) {
					console.log(err);
					console.log('hey');
					res.send(err);
				} else {
					console.log(data);
					console.log('yo');
					res.sendStatus(200);
				}
			});
		}
	});
	

});

app.listen(3001);