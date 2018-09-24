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
    var prefix = id + '-' + title + '/media';
    var bucket, baseUrl;

    if (req.body.source === "Article") {
        bucket = config.s3.articleBucket;
        baseUrl = config.s3.articleUrl;
    } else if (req.body.source === "Post") {
        bucket = config.s3.postBucket;
        baseUrl = config.s3.postUrl;
    } else if (req.body.source === "Announcement") {
        bucket = config.s3.announceBucket;
        baseUrl = config.s3.announceUrl;
    }

    //console.log(bucket);
    //console.log(baseUrl);
    
	s3.listObjectsV2({Bucket: bucket, Prefix: prefix}, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			//console.log(data.Contents);
			var content = data.Contents;
			var images = [];
				
			for (var i = 0; i < content.length; i++) {
				let nextImg = { original: baseUrl + content[i].Key };
				images.push(nextImg);
				//console.log(images);
			}
			
            //console.log(images);
			res.status(200).send({ images: images });
		}
	});
});

app.post('/getContent', function(req, res) {
    var title = req.body.title;
    var id = req.body.id;
    var key = id + '-' + title + '/article';
    var sqlTable, bucket, idName;

    if (req.body.source === "Article") {
        sqlTable = table;
        bucket = config.s3.articleBucket;
        idName = "idArticles";
    } else if (req.body.source === "Post") {
        sqlTable = table3;
        bucket = config.s3.postBucket;
        idName = "idposts";
    } else if (req.body.source === "Announcement") {
        sqlTable = table4;
        bucket = config.s3.announceBucket;
        idName = "idannouncements";
    }
	
	var sql = "SELECT * FROM ?? WHERE Title = ? && ?? = ?";
    sql = mysql.format(sql, [sqlTable, title, idName, id]);
    //console.log(sql);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			return;
        } else {
            //console.log(results);
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
    var title = req.body.title;
    var id = req.body.id;
	var logo = req.body.logo;
	var imgBar = req.body.imgBar;
	var draft = req.body.draft;
	var photoKey, bucket, baseUrl;
	
		
	var fileSplit = oldUrl.split('/');
	var fileName = fileSplit[fileSplit.length - 1];
	if(!fileName) {
		fileName = fileSplit[fileSplit.length - 2];
	};
	
	if (logo) {
        photoKey = id + '-' + title + '/' + 'logo';
	} else if (imgBar) {
        photoKey = id + '-' + title + '/media/' + fileName;
	} else if(draft) {
        photoKey = id + '-' + title + '/artmedia/' + fileName;
    }

    if (req.body.source === "Article") {
        bucket = config.s3.articleBucket;
        baseUrl = config.s3.articleUrl;
    } else if (req.body.source === "Post") {
        bucket = config.s3.postBucket;
        baseUrl = config.s3.postUrl;
    } else if (req.body.source === "Announcement") {
        bucket = config.s3.announceBucket;
        baseUrl = config.s3.announceUrl;
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
						var newUrl = baseUrl + id + '-' + title + '/artmedia/' + newFileName;
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
    console.log('hi        ' + files.file);
	var file = files.file;
    var title = files.title.name;
    var id = files.id.name;
	var logo = files.logo;
	var imgBar = files.imgBar;
    var draft = files.draft;
    var article = files.article;
    var post = files.post;
    var announcement = files.announcement;
    var photoKey, bucket, baseUrl, fileName;

    if (article) {
        bucket = config.s3.articleBucket;
        baseUrl = config.s3.articleUrl;
    } else if (post) {
        bucket = config.s3.postBucket;
        baseUrl = config.s3.postUrl;
    } else if (announcement) {
        bucket = config.s3.announceBucket;
        baseUrl = config.s3.announceUrl;
    }
	
	if (logo) {
		photoKey = id + '-' + title + '/' + 'logo';
    } else if (imgBar) {
        fileName = files.fileName.name;
        photoKey = id + '-' + title + '/media/' + fileName;
    } else if (draft) {
        fileName = files.fileName.name;
        photoKey = id + '-' + title + '/artmedia/' + fileName;
    }
    //console.log(photoKey);
    //console.log(bucket);
	
	imagemin.buffer(file.data, {
		plugins: [
			imageminJpegRecompress(),
			imageminPngquant({quality: '55-80'})
		]
	})
	.then(function (data) {
		//console.log(data);
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
				var newUrl = baseUrl + id + '-' + title + '/artmedia/' + newFileName;
				res.status(200).send({ url: newUrl });
			}
		});
	})
	
	

});

app.post('/publish/addContent', function (req, res) {
    var id = req.body.id;
    var title = req.body.title;
    var content = req.body.content;
    var contentJSON = JSON.stringify(content);
    var key = id + '-' + title + '/article';
    var bucket;

    if (req.body.source === "Article") {
        bucket = config.s3.articleBucket;
    } else if (req.body.source === "Post") {
        bucket = config.s3.postBucket;
    } else if (req.body.source === "Announcement") {
        bucket = config.s3.announceBucket;
    }


    s3.putObject(params = { Bucket: bucket, Key: key, Body: contentJSON }, function (err, data) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            res.sendStatus(200);
        }
    });
});

app.post('/publish/addSql', function (req, res) {
    var date = new Date();
    var title = req.body.title;
    var sql;
    console.log(req.body.title);
    if (req.body.source === "Article") {
        var cats = req.body.categories;
        var login = req.body.login;
        var author = login ? req.body.author : "Guest";
        var isCat = new Array();

        for (var i = 0; i < categories.length; i++) {
            if (cats.includes(categories[i]))
                isCat.push(true);
            else
                isCat.push(false);
        }


        sql = "INSERT INTO ?? (Title, User, Author, Story, Images, Video, Goof, Serious, " +
            " Created, Last_Updated) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
        var inserts = [table, title, login, author, isCat[0], isCat[1], isCat[2], isCat[3], isCat[4],
            date, date];
        sql = mysql.format(sql, inserts);

    } else if (req.body.source === "Post") {
        var articleTitle = req.body.articleTitle;
        var parentId = req.body.parentId ? req.body.parentId : 5;
        var parentIsStart = req.body.parentIsStart;
        var login = req.body.login;
        var author = login ? req.body.author : "Guest";


        sql = "INSERT INTO ?? (Title, Article, ParentId, ParentIsStart, User, Author, Created) " +
            "VALUES(?, ?, ?, ?, ?, ?, ?); ";
        var inserts = [table3, title, articleTitle, parentId, parentIsStart, login, author, date];
        sql = mysql.format(sql, inserts);

    } else if (req.body.source === "Announcement") {
        sql = "INSERT INTO ?? (Title, Created, Last_Updated) VALUES(?, ?, ?);";
        var inserts = [table4, title, date, date];
        sql = mysql.format(sql, inserts);
    }
    console.log(sql);

    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
            return;
        } else {
            res.status(200).send({ id: results.insertId });
        }
    })
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




var uploadContent = function (req, res, next) {
	var key = req.body.id + '-' + req.body.title + '/article';
	var content = req.body.content;
	var contentJSON = JSON.stringify(content);
    var bucket;

    if (req.body.source === "Article") {
        bucket = config.s3.articleBucket;
    } else if (req.body.source === "Post") {
        bucket = config.s3.postBucket;
    } else if (req.body.source === "Announcement") {
        bucket = config.s3.announceBucket;
    }
	s3.putObject(params = { Bucket: bucket, Key: key, Body: contentJSON}, function(err, data) {
		if (err) {
			console.log(err);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
}


var updateSql = function (req, res, next) {
    var date = new Date();
    var oldTitle = req.body.ogTitle;
    var newTitle = req.body.title;
    var id = req.body.id;

    if (req.body.source === "Article") {
        var cats = req.body.categories;
        var author = req.body.author;
        var isCat = new Array();

        for (var i = 0; i < categories.length; i++) {
            if (cats.includes(categories[i]))
                isCat.push(true);
            else
                isCat.push(false);
        }


        var sql = "UPDATE ?? SET Title = ?, Author = ?, Story = ?, Images = ?, Video = ?, Goof = ?, " +
            "Serious = ?, Last_Updated = ? WHERE Title = ? && idArticles = ?;";
        var inserts = [table, newTitle, author, isCat[0], isCat[1], isCat[2], isCat[3], isCat[4], date, oldTitle, id];
        sql = mysql.format(sql, inserts);

    } else if (req.body.source === "Post") {
        var articleTitle = req.body.articleTitle;
        var parentId = req.body.parentId ? req.body.parentId : 5;
        var parentIsStart = req.body.parentIsStart;
        var login = req.body.login;
        var author = login ? req.body.author : "Guest";

        var sql = "UPDATE ?? SET Title = ?, Last_Updated = ? WHERE Title = ? && idposts = ?;";
        var inserts = [table3, newTitle, date, oldTitle, id];
        sql = mysql.format(sql, inserts);

    } else if (req.body.source === "Announcement") {
        var sql = "UPDATE ?? SET Title = ?, Last_Updated = ? WHERE Title = ? && idannouncements = ?;";
        var inserts = [table4, newTitle, date, oldTitle, id];
        sql = mysql.format(sql, inserts);
    }

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

var deleteContent = function (req, res, next) {
    var id = req.body.id;
	var oldKey = id + '-' + req.body.ogTitle;
	var key = id + '-' + req.body.title;
    var bucket;
    console.log(req.body.imgBar);

    if (req.body.source === "Article") {
        bucket = config.s3.articleBucket;
        baseUrl = config.s3.articleUrl;
    } else if (req.body.source === "Post") {
        bucket = config.s3.postBucket;
        baseUrl = config.s3.postUrl;
    } else if (req.body.source === "Announcement") {
        bucket = config.s3.announceBucket;
        baseUrl = config.s3.announceUrl;
    }
   // console.log(bucket);
    //console.log(key);
    //console.log(oldKey);
    if (oldKey === key) {
		deleteFolder(bucket, key + '/media', req.body.imgBar, function(err) {
			if(err) {
				console.log(err);
				next();
            } else {
				next();
			}
		});
	} else {
		deleteFolder(bucket, oldKey, null, function(err) {
			if(err) {
				console.log(err);
				res.status(500).send(err);
			} else {
				next();
			}
		});
	}
}
	


app.post('/admin/publish/updateContent', [updateSql, deleteContent, uploadContent]);


app.post('/admin/publish/deleteContent', function (req, res) {
    var id = req.body.id;
    var title = req.body.key;
    var key = id + '-' + title;
    var sqlTable, bucket, idName;

    if (req.body.source === "Article") {
        sqlTable = table;
        bucket = config.s3.articleBucket;
        idName = "idArticles";
    } else if (req.body.source === "Post") {
        sqlTable = table3;
        bucket = config.s3.postBucket;
        idName = "idposts";
    } else if (req.body.source === "Announcement") {
        sqlTable = table4;
        bucket = config.s3.announceBucket;
        idName = "idannouncements";
    }
	
	var sql = "DELETE FROM ?? WHERE Title = ? && ?? = ?";
	sql = mysql.format(sql, [sqlTable, title, idName, id]);
	
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			return;
        } else {
            deleteFolder(bucket, key, null, function (err) {
                if(err) {
                    console.log(err);
                    res.status(500).send(err);
                } else {
                    res.sendStatus(200);
                }
            })
		}
	});
});
					

var deleteFolder = function (bucket, prefix, saveItems, callback) {
    s3.listObjectsV2(params = { Bucket: bucket, Prefix: prefix }, function (err, data) {
        if (err) {
            return callback(err);
        } else {
            var params = {
                Bucket: bucket,
                Delete: { Objects: [] }
            }
            data.Contents.forEach(function (content) {
                console.log(content.Key);
                console.log(saveItems);
                if (saveItems !== null) {
                    if (saveItems.indexOf(content.Key) === -1) {
                        params.Delete.Objects.push({ Key: content.Key });
                    }
                } else {
                    params.Delete.Objects.push({ Key: content.Key });
                }
            });
            if (params.Delete.Objects.length > 0) {
                s3.deleteObjects(params, function (err, data) {
                    if (err) {
                        return callback(err);
                    } else {
                        return callback();
                    }
                })
            } else {
                return callback();
            }
        }
    })
}

app.listen(port);