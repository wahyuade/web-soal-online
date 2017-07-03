var express = require('express');			 	// menggunakan library express untuk web service http
var app = express();						 	// memanggil library express
var bodyParser = require('body-parser');		// menggunakan library body parser untuk mendapatkan data dari client
var multer = require('multer');					// menggunakan library multer untuk multipart (form-data)
var upload = multer();							// definisi penggunaan library multer
var server = require('http').createServer(app);	// menggunakan library http untuk mengawasi port server di library socket.io
var mongodb   = require('mongodb').MongoClient; // menggunakan library mongodb sebagai mongodb client
var ObjectId = require('mongodb').ObjectId;		// untuk memanggil primary key (id)
var io = require('socket.io').listen(server);	// menggunakan library socket.io untuk realtime socket
var db;

//koneksi ke database mongodb
var url = 'mongodb://localhost:27017/web-soal';
mongodb.connect(url, function(err, dbase){
  	console.log("Connected successfully to server");
  	db = dbase;
});

//=============Setting app untuk express============
app.use(bodyParser.json());							//parsing app json
app.use(bodyParser.urlencoded({ extended: true })); //parsing x-form-url

// ===========ROUTING=============
//mendefinisikan variabel dashboard untuk routing pada /dashboard [DASHBOARD ADMIN]
var dashboard = express.Router();

//middleware untuk /dashboard
dashboard.use(function(req,res,next){
	var collection = db.collection('users');
	collection.findOne(ObjectId(req.headers.cookie), function(err, docs){
		if(docs != null){
			if(docs.role == 1){
				next();	//ketika sukses melewati validasi / pengecekan yang diinginkan
			}else{
				res.redirect('/soal');
			}
		}else{
			res.redirect('/login');
		}
	});
	// console.log();
});

// routing untuk /dashboard/
dashboard.get('/', function(req,res){
	res.sendFile(__dirname + '/dashboard_admin.html');
});

// routing untuk /dashboard/list_peserta -> melihat list data peserta
dashboard.get('/list_peserta', function(req,res){
	listPeserta(res);
});

// routing untuk /dashboard/hapus -> parameter wajib [_id] untuk menghapus peserta
dashboard.delete('/hapus/:id', function(req,res){
	hapusPeserta(res, req.params.id);
});

// routing untuk /dashboard/update -> parameter wajib [_id] untuk mengupdate data peserta
dashboard.post('/update', upload.array(), function(req,res,next){
	updatePeserta(req, res);
});

dashboard.get('/list_soal', function(req, res){
	listSoal(res);
});

// routing untuk /dashboard/upload_soal -> digunakan untuk update maupun insert soal ke mongodb
dashboard.post('/upload_soal', upload.array(), function(req,res,next){
	uploadSoal(req, res);
});

// routing untuk /dashboard/update -> parameter wajib [_id] untuk mengupdate data peserta
dashboard.delete('/hapus_soal/:id', upload.array(), function(req,res,next){
	hapusSoal(res, req.params.id);
});

//Selesai untuk DASHBOARD ADMIN

//ROUTING UNTUK localhost/soal -> DASHBOARD PESERTA
var soal = express.Router();

//middleware untuk /soal
soal.use(function(req,res,next){
	var collection = db.collection('users');
	collection.findOne(ObjectId(req.headers.cookie), function(err, docs){
		if(docs != null){
			if(docs.role == 0){
				next();	//ketika sukses melewati validasi / pengecekan yang diinginkan
			}else{
				res.redirect('/dashboard');
			}
		}else{
			res.redirect('/login');
		}
	});
	// console.log();
});

soal.get('/', function(req,res){
	res.sendFile(__dirname + '/dashboard_peserta.html');
});

//Selesai untuk DASHBOARD PESERTA

//routing untuk halaman landing localhost/ dengan type GET
app.get('/', function(req, res){
	var collection = db.collection('users');
	collection.find().toArray(function(err, docs){
		if(docs.length > 0){
			res.sendFile(__dirname + '/index.html');
		}else{
			res.sendFile(__dirname + '/register_admin.html');
		}
	});
});

//routing untuk halaman landing localhost/register dengan type GET
app.get('/register', function(req, res){
	res.sendFile(__dirname + '/register.html');
});

//routing untuk /register dengan type POST
app.post('/register', upload.array(), function(req,res,next){
	// console.log(req.body);
	registerAccount(req.body, res);
});

//routing untuk halaman landing localhost/login dengan type GET
app.get('/login', function(req, res){
	res.sendFile(__dirname + '/login.html');
});

//routing untuk halaman landing localhost/login dengan type POST
app.post('/login', upload.array(), function(req,res,next){
	loginAccount(req.body, res);
});

//MENDEFINISIKAN ROUTING PREFIX pada alamat / address http untuk /dashboard
app.use('/dashboard', dashboard);

//MENDEFINISIKAN ROUTING PREFIX pada alamat / address http untuk /soal
app.use('/soal', soal);

app.use(express.static('public')); 	//membuka direktori public agar dapat di akses oleh client

server.listen(80);

//===============DATABASE PROCESS===============
var hapusPeserta = function(res, id){
	var collection = db.collection('users');
	collection.removeOne({_id : ObjectId(id)}, function(err, result){
		res.json(result);
	});
}

var updatePeserta = function(req, res){
	var collection = db.collection('users');
	collection.updateOne({'_id':ObjectId(req.body._id)}, {$set: {firstname:req.body.firstname, lastname:req.body.lastname, username:req.body.username, password:req.body.password}}, {upsert:false}, function(err, result){
		res.json(result);
	});
}

var listPeserta = function(res){
	var collection = db.collection('users');
	collection.find().toArray(function(err, docs){
		res.json(docs);
	});
}

var listSoal = function(res){
	var collection = db.collection('data_soal');
	collection.find().toArray(function(err, docs){
		res.json(docs);
	})
}

var uploadSoal = function(req,res){
	var collection = db.collection('data_soal');
	if(req.body._id != null){
		collection.updateOne({'_id':ObjectId(req.body._id)}, {$set: {
			pertanyaan:req.body.pertanyaan,
			jawaban:req.body.jawaban,
			a:req.body.a,
			b:req.body.b,
			c:req.body.c,
			d:req.body.d
		}}, {upsert:false}, function(err, result){
			res.json(result);
		});
	}else{
		collection.insert(req.body, function(err, result){
			res.json(result);
		})
	}
}

var hapusSoal = function(res, id){
	var collection = db.collection('data_soal');
	collection.removeOne({_id : ObjectId(id)}, function(err, result){
		res.json(result);
	});
}

var registerAccount = function(data, res){
	var collection = db.collection('users');
	collection.find().toArray(function(err, docs){
		if(docs.length > 0){
			data.role = 0;  //untuk register peserta biasa
		}else{
			data.role = 1; 	//untuk register admin
		}
		collection.insert(data, function(err, result){
			res.json(result);
		});
	});
}
var loginAccount = function(data, res){
	var collection = db.collection('users');
	if(data.username != null && data.password != null){
		collection.findOne({ username : data.username }, function(err, docs){
			if(docs != null){
				if(docs.password == data.password){
					res.json({ succes:true ,message : "Login successfully", user : docs});
				}else{
					res.json({ succes:false ,message : "Invalid username & password"});					
				}
			}else{
				res.json({ succes:false ,message : "Invalid username & password"});
			}
		});
	}else{
		res.json({ succes:false ,message : "Invalid username & password"});
	}
}