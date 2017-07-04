var dashboardAdminApp = angular.module('dashboardAdminApp', []);

dashboardAdminApp.controller('AdminController', function($scope, $http){
	$scope.judul = 'Tambah Soal';
	var refresh = function(){
		     $http({
          method  : 'GET',
          url     : '/dashboard/list_peserta'
         }).then(function success(result){
         	$scope.users = result.data;
         }, function error(err){
         	console.log(err);
         })

         $http({
          method  : 'GET',
          url     : '/dashboard/list_soal'
         }).then(function success(result){
         	$scope.listSoal = result.data;
         }, function error(err){
         	console.log(err);
         })
	}
  $scope.logoutUser = function(){
    document.cookie = null;
    location.href = 'login';
  }
  //untuk mengetahui user siapa yg login
    $http({
      method  : 'GET',
      url     : '/user/'
     }).then(function success(result){
      $scope.userLogin = result.data.firstname+" "+result.data.lastname;
     }, function error(err){
      console.log(err);
     })
	  refresh();

    $scope.hapusPeserta = function(id){
    	$http({
          method  : 'DELETE',
          url     : '/dashboard/hapus/'+id,
          headers : {'Content-Type': 'application/json'} 
         })
		.then(function success(result){
			refresh();
		}, function error(err){
			console.log(err);
		})
    }

    $scope.updatePeserta = function(user){
    	console.log(user);
    	$http({
          method  : 'POST',
          url     : '/dashboard/update/',
          data    : user, //forms user object
          headers : {'Content-Type': 'application/json'} 
         })
		.then(function success(result){
			$('#'+user.username).modal('toggle');
		}, function error(err){
			console.log(err);
		})	
    }

    $scope.tambahSoal = function(){
    	$scope.judul = 'Tambah Soal';
    	$scope.soal = null;
    }

    $scope.uploadSoal = function(soal){
    	$http({
          method  : 'POST',
          url     : '/dashboard/upload_soal/',
          data    : soal, //forms user object
          headers : {'Content-Type': 'application/json'} 
         })
		.then(function success(result){
			refresh();
		}, function error(err){
			console.log(err);
		})	
    }

    $scope.detailSoal = function(soal, index){
    	$scope.judul = 'Edit : No '+index;
    	$scope.soal = soal;
    }

    $scope.hapusSoal = function(soal){
    	if(soal._id != null){
    		$http({
	          method  : 'DELETE',
	          url     : '/dashboard/hapus_soal/'+soal._id,
	          headers : {'Content-Type': 'application/json'} 
	         })
			.then(function success(result){
				refresh();
				$scope.judul = 'Tambah Soal';
    			$scope.soal = null;
			}, function error(err){
				console.log(err);
			})
    	}else{
    		$scope.soal = null;
    	}
    }
});