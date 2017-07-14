var dashboardPesertaApp = angular.module('dashboardPesertaApp', []);

dashboardPesertaApp.controller('PesertaController', function($scope, $http){
	var index = 0;
	$http({
      method  : 'GET',
      url     : '/user/'
     }).then(function success(result){
      $scope.userLogin = result.data.firstname+" "+result.data.lastname;
     }, function error(err){
      console.log(err);
     });

     $http({
          method  : 'GET',
          url     : '/soal/list_soal'
         }).then(function success(result){
         	$scope.judul = 'Soal No. 1';
        	$scope.soal = result.data[0]; 	
         	$scope.listSoal = result.data;
         }, function error(err){
         	console.log(err);
         });

     $scope.detailSoal = function(soal, id){
     	$scope.judul = 'Soal No. '+id;
     	$scope.soal = soal;
     	index = id-1;
     	status(soal.jawaban);
     }

     $scope.backSoal = function(soal){
     	if(index>0){
			--index;
     	}else{
     		index = soal.length-1;
     	}
     	$scope.judul = 'Soal No. '+(index+1);
     	$scope.soal = soal[index];
     	status(soal[index].jawaban);
     }
     $scope.nextSoal = function(soal){
    	if(index<soal.length-1) {
			++index;	
    	}else{
    		index = 0;
    	}
    	$scope.judul = 'Soal No. '+(index+1);
     	$scope.soal = soal[index];
     	status(soal[index].jawaban);
     }

     $scope.pilihJawaban = function(soal,jawaban){
     	soal.jawaban = jawaban;

        var jawab = {id_soal:soal._id,id_user:document.cookie.slice(10),jawab:jawaban}

        $http({
          method  : 'POST',
          data : jawab,
          url     : '/soal/jawab',
          headers : {'Content-Type': 'application/json'} 
         }).then(function success(result){
         	document.getElementById('no'+(index)).style.backgroundColor="green";
         	document.getElementById('status').className = "col-md-9 alert alert-info";
         	console.log(result)
         }, function error(err){
         	console.log(err);
         });
     }

     function status(jawaban){
     	if(jawaban != undefined){
            document.getElementById('no'+(index)).style.backgroundColor="green";
     		document.getElementById('status').className = "col-md-9 alert alert-info";
     	}else{
            document.getElementById('no'+(index)).style.backgroundColor="";
     		document.getElementById('status').className = "col-md-9 alert";
     	}
     }
     $scope.logoutUser = function(){
        document.cookie = "x_api_key=";
        location.href = 'login';
      }
});