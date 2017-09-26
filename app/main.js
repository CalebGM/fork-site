var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var fs = require('fs');
var request = require('request').defaults({ encoding: null });
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
var mysql = require('mysql');
var fileUpload = require('express-fileupload');

var env = process.env.NODE_ENV || 'development';
var config = require('./config/config.js')[env];

var port = process.env.PORT || 3001;


var s3 = new AWS.S3();

var connection = mysql.createConnection({
	host: process.env.NODE_ENV ? process.env.RDS_HOSTNAME : config.database.host,
	user: process.env.NODE_ENV ? process.env.RDS_USERNAME : config.database.user,
	password: process.env.NODE_ENV ? process.env.RDS_PASSWORD : config.database.password,
	port: process.env.NODE_ENV ? process.env.RDS_PORT : config.database.port
});



const categories = ['Art', 'Comics', 'Fake_News', 'Life', 'Movies', 'Music', 'Sports', 'Video_Games'];
const table = config.database.articles;
const table2 = config.database.users;


app.use(cookieParser());
app.use(bodyParser.json());
app.use(fileUpload());


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
		res.status(200).send({ isAdmin: false });
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
			res.status(200).send(results);
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
			res.status(200).send(results);
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
			res.status(200).send(results);
		}
	});
	
});

app.post('/getArticle', function(req, res) {
	var key = req.body.key;
	var bucket = config.s3.articleBucket;
	
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
					res.status(200).send({ body: content, info: results });
				}
			});
		}
	});
	

});


app.post('/checkLogin', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	
	var sql = "SELECT COUNT(*) AS isAdmin FROM ?? WHERE ata_username = ? AND ata_password = ?";
	sql = mysql.format(sql, [table2, username, password]);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			return;
		} else {
			if (results[0].isAdmin === 1) {
				res.cookie(config.cookie.name, config.cookie.value, { maxAge: 5400000, httpOnly: true }).status(200).send({ isAdmin: true });
			} else {
				res.status(200).send({ isAdmin: false });
			}
		}
	});
});



app.get('/adminLogout', function(req, res) {
	res.clearCookie(config.cookie.name).sendStatus(200);
});






app.post('/admin/publish/uploadImage', function(req, res) {
	var oldUrl = req.body.url;
	var bucket = config.s3.mediaBucket;
	var albumPhotosKey = encodeURIComponent("media") + '/';
	
	var fileSplit = oldUrl.split('/');
	var fileName = fileSplit[fileSplit.length - 1];
	if(!fileName) {
		fileName = fileSplit[fileSplit.length - 2];
	};
	
	var photoKey = albumPhotosKey + fileName;
	request.get(oldUrl, function(err, res2, body) {
		if (err) {
			console.log(err);
		} else {
			let params = {
				Bucket: bucket,
				Key: photoKey,
				Body: body,
				ContentDisposition: 'inline',
				ContentType: 'image/jpeg',
				ACL: 'public-read'
			};
			
			s3.upload(params, function(err, data) {
				if (err) {
					console.log(err);
				} else {
					var newFileSplit = data.Location.split('/');
					var newFileName = newFileSplit[newFileSplit.length - 1];
					var newUrl = config.s3.imgUrl + newFileName;
					res.status(200).send({ url: newUrl });
				}
			});
		}
	});
});



app.post('/admin/publish/uploadLocalImage', function(req, res) {
	var files = req.files;
	var file = files.file;
	var bucket = config.s3.mediaBucket;
	var albumPhotosKey = encodeURIComponent("media") + '/';
	
	var fileName = file.name;
	
	var photoKey = albumPhotosKey + fileName;
	let params = {
		Bucket: bucket,
		Key: photoKey,
		Body: file.data,
		ContentDisposition: 'inline',
		ContentType: 'image/jpeg',
		ACL: 'public-read'
	};
			
	s3.upload(params, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			var newFileSplit = data.Location.split('/');
			var newFileName = newFileSplit[newFileSplit.length - 1];
			var newUrl = config.s3.imgUrl + newFileName;
			res.status(200).send({ url: newUrl });
		}
	});
});



app.post('/admin/publish/postArticle', function(req, res) {
	
	var cats = req.body.categories;
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
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			return;
		} else {
			var article = req.body.article;
			var art = JSON.stringify(article);
			var bucket = config.s3.articleBucket;
			s3.putObject(params = { Bucket: bucket, Key: key, Body: art}, function(err, data) {
				if (err) {
					console.log(err);
					res.send(err);
				} else {
					res.sendStatus(200);
				}
			});
		}
	});
	

});



var uploadArticle = function (req, res, next) {
	var key = req.body.title;
	var article = req.body.article;
	var art = JSON.stringify(article);
	var bucket = config.s3.articleBucket;
	s3.putObject(params = { Bucket: bucket, Key: key, Body: art}, function(err, data) {
		if (err) {
			console.log(err);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
}


var updateSql = function (req, res, next) {
	var cats = req.body.categories;
	var oldKey = req.body.ogTitle;
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
	
			
	var sql = "UPDATE ?? SET Title = ?, Author = ?, Art = ?, Comics = ?, Fake_News = ?, Life = ?, Movies = ?, Music = ?, " +
				"Sports = ?, Video_Games = ?, Last_Updated = ? WHERE Title = ?;";
	var inserts = [table, key, author, isCat[0], isCat[1], isCat[2], isCat[3], isCat[4], isCat[5],
					isCat[6], isCat[7], date, oldKey];
	sql = mysql.format(sql, inserts);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			res.sendStatus(500);
			return;
		} else {
			next();
		}
	});
}

var deleteArticle = function (req, res, next) {
	var oldKey = req.body.ogTitle;
	var key = req.body.title;
	
	if (oldKey === key) {
		next();
	} else {
		var bucket = config.s3.articleBucket;
		s3.deleteObject(params = { Bucket: bucket, Key: oldKey }, function(err, data) {
			if(err) {
				console.log(err);
				res.status(500).send(err);
			} else {
				next();
			}
		});
	}
}
	


app.post('/admin/publish/updateArticle', [updateSql, deleteArticle, uploadArticle]);


app.post('/admin/publish/deleteArticle', function(req, res) {
	var key = req.body.key;
	
	var sql = "DELETE FROM ?? WHERE Title = ?";
	sql = mysql.format(sql, [table, key]);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			return;
		} else {
			var bucket = config.s3.articleBucket;
			s3.deleteObject(params = { Bucket: bucket, Key: key }, function(err, data) {
				if(err) {
					console.log(err);
					res.status(500).send(err);
				} else {
					res.sendStatus(200);
				}
			});
		}
	});
});
					



app.listen(port);