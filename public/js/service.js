var loginApp = angular.module('loginApp', []);

loginApp.controller('loginController', function($scope, $http){
	$scope.user = {};

	$scope.submitLogin = function(){
		// console.log($scope.user);
		$http({
          method  : 'POST',
          url     : '/login',
          data    : $scope.user, //forms user object
          headers : {'Content-Type': 'application/json'} 
         })
		.then(function success(result){
			document.cookie = 'x_api_key='+result.data.user._id;
			location.href = 'dashboard';
		}, function error(err){
			console.log(err);
		})
	};
});

var registerApp = angular.module('registerApp', []);

registerApp.controller('registerController', function($scope, $http){
	$scope.user = {};

	$scope.submitRegister = function(){
		// console.log($scope.user);
		$http({
          method  : 'POST',
          url     : '/register',
          data    : $scope.user, //forms user object
          headers : {'Content-Type': 'application/json'} 
         })
		.then(function success(result){
			document.cookie = 'x_api_key='+result.data.ops[0]._id;
			location.href = 'dashboard';
		}, function error(err){
			console.log(err);
		})
	};
});