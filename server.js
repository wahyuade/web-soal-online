var express = require('express');			 	// menggunakan library express untuk web service http
var app = express();						 	// memanggil library express
var bodyParser = require('body-parser');		// menggunakan library body parser untuk mendapatkan data dari client
var multer = require('multer');					// menggunakan library multer untuk multipart (form-data)
var upload = multer();							// definisi penggunaan library multer
var server = require('http').createServer(app);	// menggunakan library http standart dari node js
var mongodb   = require('mongodb').MongoClient; // menggunakan library mongodb sebagai mongodb client
var ObjectId = require('mongodb').ObjectId;		// untuk memanggil primary key (id)

var db;  //variabel global untuk handle database
var port = process.env.PORT || 80; //setting port server

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
	collection.findOne({_id:ObjectId(req.headers.cookie.slice(10))}, function(err, docs){
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

// routing untuk /dashboard/list_soal khusus untuk admin, sehingga ada jawaban saat list soal
dashboard.get('/list_soal', function(req, res){
	listSoalAdmin(res);
});

dashboard.get('/list_hasil', function(req, res){
	listHasil(res);
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
	collection.findOne({_id:ObjectId(req.headers.cookie.slice(10))}, function(err, docs){
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

soal.get('/list_soal', upload.array(), function(req, res, next){
	listSoalPeserta(req, res);
});

soal.get('/jawab',function(req, res){
	lihatJawabanPeserta(req, res);
});

soal.post('/jawab', upload.array(), function(req, res, next){
	jawabSoal(req, res);
});

//Selesai untuk DASHBOARD PESERTA

//routing untuk halaman landing localhost/ dengan type GET
app.get('/', function(req, res){
	var collection = db.collection('users');
	collection.find().toArray(function(err, docs){
		if(docs.length > 0){
			res.redirect('/login');
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

//untuk mengetahui data user yang login
app.get('/user', function(req,res){
	var collection = db.collection('users');
	collection.findOne({_id:ObjectId(req.headers.cookie.slice(10))}, function(err, docs){
		res.json(docs);
	});
});

//MENDEFINISIKAN ROUTING PREFIX pada alamat / address http untuk /dashboard
app.use('/dashboard', dashboard);

//MENDEFINISIKAN ROUTING PREFIX pada alamat / address http untuk /soal
app.use('/soal', soal);

app.use(express.static('public')); 	//membuka direktori public agar dapat di akses oleh client

server.listen(port);
console.log('port connect in '+port);

//===============DATABASE PROCESS===============
var hapusPeserta = function(res, id){
	var collection = db.collection('users');
	collection.removeOne({_id : ObjectId(id)}, function(err, result){
		res.json(result);
	});
}

var updatePeserta = function(req, res){
	var collection = db.collection('users');
	collection.updateOne({'_id':ObjectId(req.body._id)}, {$set: 
		{
			firstname:req.body.firstname, 
			lastname:req.body.lastname, 
			username:req.body.username, 
			password:req.body.password
		}}, {upsert:false}, function(err, result){
		res.json(result);
	});
}

var listPeserta = function(res){
	var collection = db.collection('users');
	collection.find().toArray(function(err, docs){
		res.json(docs);
	});
}

var jawabSoal = function(req, res){
	var collection = db.collection('jawaban');
	collection.findOne({id_soal:req.body.id_soal, id_user:req.body.id_user}, function(err, docs){
		if(docs == null){
			collection.insert(req.body, function(err, result){
				res.json(result);
			});
		}else{
			collection.updateOne({'_id':ObjectId(docs._id)},{$set:{
				jawab:req.body.jawab
			}}, {upsert:false}, function(err, result){
				res.json(result);
			});
		}
	})
}

var lihatJawabanPeserta = function(req,res){
	var collection = db.collection('jawaban');
}

var listSoalAdmin = function(res){
	var collection = db.collection('data_soal');
	collection.find().toArray(function(err, docs){
		res.json(docs);
	})
}

var listHasil = function(res){
	var jawaban = db.collection('jawaban');
	var soal = db.collection('data_soal');
	var user = db.collection('users');
	var response = new Array();
	var i,j;

	soal.find({}, {jawaban:1}).toArray(function(err, soal_data){
		user.find({role:0}, {_id:1, firstname:1, lastname:1, username:1}).toArray(function(err, user_data){
			jawaban.find({}).toArray(function(err, jawaban_data){
				for(k=0;k<user_data.length;k++){
					var hasil = {};
					hasil.benar = 0;
					hasil.salah = 0;
					hasil.kosong = 0;
					for(i=0;i<soal_data.length;i++){
						for(j=0;j<jawaban_data.length;j++){
							if(soal_data[i]._id == jawaban_data[j].id_soal){
								if(user_data[k]._id == jawaban_data[j].id_user){
									if(soal_data[i].jawaban == jawaban_data[j].jawab){
										hasil.benar++;
									}else{
										hasil.salah++;
									}
								}
							}
						}
					}
					hasil.nilai = (hasil.benar/(soal_data.length))*100;
					hasil.kosong = soal_data.length-(hasil.benar+hasil.salah);
					hasil.nama = user_data[k].firstname+' '+user_data[k].lastname;
					hasil.username = user_data[k].username;
					response.push(hasil);
				}
				res.json(response);
			});
		});
	})
}

var listSoalPeserta = function(req, res){
	var i,j;
	var collection = db.collection('data_soal');
	var jawaban = db.collection('jawaban');
	var respon = {};

	collection.find({}, {a:1,b:1,c:1,d:1,pertanyaan:1}).toArray(function(err, docs){
		jawaban.find({id_user:req.headers.cookie.slice(10)}, {_id:0,id_user:0}).toArray(function(err, result){
			for(i=0;i<docs.length;i++){
				for(j=0;j<result.length;j++){
					if(docs[i]._id == result[j].id_soal){
						docs[i].jawaban = result[j].jawab;
					}
				}
			}
			res.json(docs);
		});
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