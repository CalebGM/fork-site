var express = require('express');
var app = express();
var helmet = require('helmet');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var request = require('request').defaults({ encoding: null });
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
var mysql = require('mysql');
var imagemin = require('imagemin');
var imageminJpegRecompress = require('imagemin-jpeg-recompress');
var imageminPngquant = require('imagemin-pngquant');

var fileUpload = require('express-fileupload');

var env = process.env.NODE_ENV || 'development';
var config = require('./config/config.js')[env];
var authCheck = require('./api/authCheck').authCheck;


var port = process.env.PORT || 3001;



var s3 = new AWS.S3();
//var AWSCognito = new AWS.cognitoIdentityServiceProvider();

//AWSCognito.config.region = config.region;
//var poolData = { UserPoolId: config.poolId, ClientId: config.clientId };
//var userPool = new AWSCognito.CognitoUserPool(poolData);

var connection = mysql.createConnection({
	host: process.env.NODE_ENV ? process.env.RDS_HOSTNAME : config.database.host,
	user: process.env.NODE_ENV ? process.env.RDS_USERNAME : config.database.user,
	password: process.env.NODE_ENV ? process.env.RDS_PASSWORD : config.database.password,
	port: process.env.NODE_ENV ? process.env.RDS_PORT : config.database.port
});



const categories = config.categories;
const table = config.database.articles;
const table2 = config.database.users;
const table3 = config.database.posts;
const table4 = config.database.announcements;


app.use(helmet());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(fileUpload());


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", config.url);
	res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function (req, res) {
	var cookieName = config.cookie.name;
	
	if (req.cookies[cookieName] === config.cookie.value) {
		res.cookie(config.cookie.name, config.cookie.value, { maxAge: 5400000, httpOnly: true, secure: true }).send({ isAdmin: true });
	} else {
		res.status(200).send({ isAdmin: false });
	}
	
});

app.get('/getAboutPage', function(req, res) {
	var bucket = config.s3.articleBucket;
    var key = 'About/article';

	s3.getObject(params = { Bucket: bucket, Key: key }, function(err, data) {
		if (err) {
			console.log(err);
			res.sendStatus(500);
		} else {
			var content = data.Body.toString();
			res.status(200).send({ body: content });
		}
	});
});


app.post('/getAnnouncementsPage', function (req, res) {
    var page = Number(req.body.page);
    var offset = (page - 1) * 15;

    var sql = "SELECT * FROM ?? ORDER BY Created DESC LIMIT ?, 15";
    sql = mysql.format(sql, [table4, offset]);

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        } else {
            res.status(200).send(results);
        }
    })
});


app.post('/getAnnouncement', function (req, res) {
    var title = req.body.title;
    var id = req.body.id;
    var key = id + '-' + title + '/article';
    var bucket = config.s3.announceBucket;
    console.log(key);

    var sql = "SELECT * FROM ?? WHERE Title = ? && idannouncements = ?";
    sql = mysql.format(sql, [table4, title, id]);

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
            return;
        } else {
            s3.getObject(params = { Bucket: bucket, Key: key }, function (err, data) {
                if (err) {
                    console.log(err);
                    res.sendStatus(500);
                } else {
                    var content = data.Body.toString();
                    res.status(200).send({ body: content, info: results });
                }
            });
        }
    })
})



app.post('/getArticle', function (req, res) {
    var title = req.body.title;
    var id = req.body.id;
    var key = id + '-' + title + '/article';
    var bucket = config.s3.articleBucket;

    var sql = "SELECT * FROM ?? WHERE Title = ? && idArticles = ?";
    sql = mysql.format(sql, [table, title, id]);

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
            return;
        } else {
            s3.getObject(params = { Bucket: bucket, Key: key }, function (err, data) {
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
	console.log(cat);
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


app.post('/getImgBarMedia', function(req, res) {
    var title = req.body.title;
    var id = req.body.id;
	var bucket = config.s3.articleBucket;
	var prefix = id + '-' + title + '/media';
	
	s3.listObjects({Bucket: bucket, Prefix: prefix}, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			//console.log(data.Contents);
			var content = data.Contents;
			var images = [];
				
			for (var i = 0; i < content.length; i++) {
				let nextImg = { original: config.s3.baseUrl + content[i].Key };
				images.push(nextImg);
				console.log(images);
			}
			
			//console.log(images);
			res.status(200).send({ images: images });
		}
	});
});

app.post('/getArticle', function(req, res) {
    var title = req.body.title;
    var id = req.body.id;
	var key = id + '-' + title + '/article';
	var bucket = config.s3.articleBucket;
	
	var sql = "SELECT * FROM ?? WHERE Title = ? && idArticles = ?";
	sql = mysql.format(sql, [table, title, id]);
	
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


app.post('/getPost', function (req, res) {
    var title = req.body.title;
    var id = req.body.id;
    var key = id + '-' + title + '/article';
    var bucket = config.s3.postBucket;

    var sql = "SELECT * FROM ?? WHERE Title = ? && idposts = ?";
    sql = mysql.format(sql, [table3, title, id]);

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log('about to have get post sql error');
            console.log(error);
            return;
        } else {
            s3.getObject(params = { Bucket: bucket, Key: key }, function (err, data) {
                if (err) {
                    console.log('about to have get post s3 error');
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


app.post('/getParentPost', function (req, res) {
    var currentPostId = req.body.id;

    var sql = "SELECT * FROM ?? WHERE idposts = ?";
    sql = mysql.format(sql, [table3, currentPostId]);

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
            return;
        } else {
            res.status(200).send({ info: results });
        }
    });
});


app.post('/getChildPosts', function (req, res) {
    var currentPostId = req.body.id;
    var isStart = req.body.isStart ? 1 : 0;
    console.log(currentPostId);
    console.log(isStart);

    var sql = "SELECT * FROM ?? WHERE ParentId = ? && ParentIsStart = ?";
    sql = mysql.format(sql, [table3, currentPostId, isStart]);

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
            return;
        } else {
            console.log(results);
            res.status(200).send({ info: results });
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
				res.cookie(config.cookie.name, config.cookie.value, { maxAge: 5400000, httpOnly: true, secure: true }).status(200).send({ isAdmin: true });
			} else {
				res.status(200).send({ isAdmin: false });
			}
		}
	});
});



app.get('/adminLogout', function(req, res) {
	res.clearCookie(config.cookie.name).sendStatus(200);
});



app.post('/newUserSignUp', function (req, res) {
    var attributeList = [];
    var dataEmail = { Name: 'email', Value: req.body.email };
    var attributeEmail = AWSCognito.CognitoUserAttribute(dataEmail);
    attributeList.push(attributeEmail);

    userPool.signUp('username', 'password', attributeList, null, function (err, result) {
        if (err) {
            alert(err);
            return;
        }
        cognitoUser = result.user;
        console.log('user name is ' + cognitoUser.getUsername());
    });
});


app.post('/login', function (req, res) {
    var authenticationData = { Username: req.body.username, Password: req.body.password };
    var authenticationDetails = new AWSCognito.AuthenticationDetails(authenticationData);
    var userData = { Username: req.body.username, Pool: userPool };

    var cognitoUser = new AWSCognito.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log('access token + ' + result.getAccessToken().getJwtTOken());
            console.log('idToken + ' + result.idToken.jwtToken);
        },
        onFailure: function (err) {
            alert(err);
        },
    });
});




app.post('/admin/publish/uploadImage', function(req, res) {
	var oldUrl = req.body.url;
	var bucket = config.s3.articleBucket;
	var title = req.body.title;
	var logo = req.body.logo;
	var imgBar = req.body.imgBar;
	var draft = req.body.draft;
	var photoKey;
	
		
	var fileSplit = oldUrl.split('/');
	var fileName = fileSplit[fileSplit.length - 1];
	if(!fileName) {
		fileName = fileSplit[fileSplit.length - 2];
	};
	
	if (logo) {
		photoKey = title + '/' + 'logo';
	} else if (imgBar) {
		photoKey = title + '/media/' + fileName;
	} else if(draft) {
		photoKey = title + '/artmedia/' + fileName;
	}

	request.get(oldUrl, function(err, res2, body) {
		if (err) {
			console.log(err);
		} else {
			imagemin.buffer(body, {
				plugins: [
					imageminJpegRecompress(),
					imageminPngquant({quality: '55-80'})
				]
			})
			.then(function (data) {
				console.log(data);
				let params = {
				Bucket: bucket,
				Key: photoKey,
				Body: data,
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
						var newUrl = config.s3.baseUrl + title + '/artmedia/' + newFileName;
						res.status(200).send({ url: newUrl });
					}
				});
			})
		}
	});
});



app.post('/admin/publish/uploadLocalImage', function(req, res) {

	var files = req.files;
	console.log(files);
	var file = files.file;
	var title = files.title.name;
	var logo = files.logo;
	var imgBar = files.imgBar;
	var draft = files.draft;
	var bucket = config.s3.articleBucket;
	var photoKey;
		
	var fileName = file.name;
	
	if (logo) {
		photoKey = title + '/' + 'logo';
	} else if (imgBar) {
		photoKey = title + '/media/' + fileName;
	} else if(draft) {
		photoKey = title + '/artmedia/' + fileName;
	}
	
	imagemin.buffer(file.data, {
		plugins: [
			imageminJpegRecompress(),
			imageminPngquant({quality: '55-80'})
		]
	})
	.then(function (data) {
		console.log(data);
		let params = {
		Bucket: bucket,
		Key: photoKey,
		Body: data,
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
				var newUrl = config.s3.baseUrl + title + '/artmedia/' + newFileName;
				res.status(200).send({ url: newUrl });
			}
		});
	})
	
	

});



app.post('/admin/publish/postArticle', function(req, res) {
	
	var cats = req.body.categories;
	var title = req.body.title;
    var login = req.body.login;
    var author = login ? req.body.author : "Guest";
	var date = new Date();
	var isCat = new Array();
	
	for (var i = 0; i < categories.length; i++) {
		if (cats.includes(categories[i]))
			isCat.push(true);
		else
			isCat.push(false);
	}
	
			
	var sql = "INSERT INTO ?? (Title, User, Author, Story, Images, Video, Goof, Serious, " +
				 " Created, Last_Updated) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
	var inserts = [table, title, login, author, isCat[0], isCat[1], isCat[2], isCat[3], isCat[4],
				 date, date];
	sql = mysql.format(sql, inserts);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			return;
        } else {
            var key = results.insertId + '-' + title + '/article';
			var article = req.body.article;
			var art = JSON.stringify(article);
			var bucket = config.s3.articleBucket;
			s3.putObject(params = { Bucket: bucket, Key: key, Body: art}, function(err, data) {
				if (err) {
					console.log(err);
					res.send(err);
				} else {
                    res.status(200).send({ articleId: results.insertId });
				}
			});
		}
	});
	

});



app.post('/publish/addPost', function (req, res) {
    var postTitle = req.body.title;
    var articleTitle = req.body.articleTitle;
    var parentId = req.body.parentId ? req.body.parentId : 5;
    var parentIsStart = req.body.parentIsStart;
    var login = req.body.login;
    var author = login ? req.body.author : "Guest";
    var date = new Date();


    var sql = "INSERT INTO ?? (Title, Article, ParentId, ParentIsStart, User, Author, Created) " + 
                "VALUES(?, ?, ?, ?, ?, ?, ?); ";
    var inserts = [table3, postTitle, articleTitle, parentId, parentIsStart, login, author, date];
    sql = mysql.format(sql, inserts);

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
            return;
        } else {
            console.log(results.insertId);
            var key = results.insertId + '-' + postTitle + '/article';
            console.log(key);
            var post = req.body.article;
            var postJson = JSON.stringify(post);
            var bucket = config.s3.postBucket;
            s3.putObject(params = { Bucket: bucket, Key: key, Body: postJson }, function (err, data) {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    res.status(200).send({ postId: results.insertId });
                }
            });
        }
    });
});



app.post('/publish/addAnnouncement', function (req, res) {
    var title = req.body.title;
    var date = new Date();

    var sql = "INSERT INTO ?? (Title, Created, Last_Updated) VALUES(?, ?, ?);";
    var inserts = [table4, title, date, date];
    sql = mysql.format(sql, inserts);

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
            return;
        } else {
            var key = results.insertId + '-' + title + '/article';
            var article = req.body.article;
            var art = JSON.stringify(article);
            var bucket = config.s3.announceBucket;
            s3.putObject(params = { Bucket: bucket, Key: key, Body: art }, function (err, data) {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    res.status(200).send({ articleId: results.insertId });
                }
            });
        }
    });
});



app.post('/admin/publish/updateAbout', function(req, res) {
	var newAbout = req.body.article;
	var about = JSON.stringify(newAbout);
	var bucket = config.s3.articleBucket;
	var key = 'About/article';
	
	s3.putObject(params = { Bucket: bucket, Key: key, Body: about}, function(err, data) {
		if (err) {
			console.log(err);
			res.status(500).send(err);
		} else {
			res.sendStatus(200);
		}
	});
});




var uploadArticle = function (req, res, next) {
	var key = req.body.id + '-' + req.body.title + '/article';
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
	var oldTitle = req.body.ogTitle;
    var newTitle = req.body.title;
    var id = req.body.id;
	var author = req.body.author;
	var date = new Date();
	var isCat = new Array();
	
	for (var i = 0; i < categories.length; i++) {
		if (cats.includes(categories[i]))
			isCat.push(true);
		else
			isCat.push(false);
	}
	
			
	var sql = "UPDATE ?? SET Title = ?, Author = ?, Story = ?, Images = ?, Video = ?, Goof = ?, " +
				"Serious = ?, Last_Updated = ? WHERE Title = ? && idposts = ?;";
	var inserts = [table, newTitle, author, isCat[0], isCat[1], isCat[2], isCat[3], isCat[4], date, oldTitle, id];
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
    var id = req.body.id;
	var oldKey = id + '-' + req.body.ogTitle;
	var key = id + '-' + req.body.title;
	var bucket = config.s3.articleBucket;
	
	if (oldKey === key) {
		s3.deleteObject(params = { Bucket: bucket, Key: key + '/media' }, function(err, data) {
			if(err) {
				console.log(err);
				next();
			} else {
				next();
			}
		});
	} else {
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


app.post('/admin/publish/deleteArticle', function (req, res) {
    var id = req.body.id;
    var title = req.body.key;
	var key = id + '-' + title;
	
	var sql = "DELETE FROM ?? WHERE Title = ? && idArticle = ?";
	sql = mysql.format(sql, [table, title, id]);
	
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

app.post('/publish/deleteAnnouncement', function (req, res) {
    var id = req.body.id;
    var title = req.body.title;
    var key = id + '-' + title;

    var sql = "DELETE FROM ?? WHERE Title = ? && idannouncements = ?";
    sql = mysql.format(sql, [table4, title, id]);

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
            return;
        } else {
            var bucket = config.s3.announceBucket;
            s3.deleteObject(params = { Bucket: bucket, Key: key }, function (err, data) {
                if (err) {
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