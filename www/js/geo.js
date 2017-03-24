angular.module('ion-geo', [])
    .service('geoService', ['$ionicPlatform', '$q', '$cordovaGeolocation',
            function($ionicPlatform, $q, $cordovaGeolocation){
        this.getLocation = getLocation;

        function getLocation() {
            return $q(function (resolve, reject) {
                var posOptions = {timeout: 9000, enableHighAccuracy: false};
                $ionicPlatform.ready(function() {
                    $cordovaGeolocation.getCurrentPosition(posOptions)
                        .then(function (position) {
                            resolve(position);
                        }, function (error) {
                            error.from = 'getLocation';
                            reject(error);
                        });
                })
            });
        }

    }])
    .directive('ionGooglePlace', [
        '$ionicModal',
        '$ionicPlatform',
        '$http',
        '$q',
        '$timeout',
        '$rootScope',
        'geoService',
        function($ionicModal, $ionicPlatform, $http, $q, $timeout, $rootScope, geoService) {
            return {
                require: '?ngModel',
                restrict: 'E',
                template: '<input type="text" readonly="readonly" id="ion-geo" class="ion-google-place" autocomplete="off">',
                replace: true,
                scope: {
                    ngModel: '=?',
                    geocode: '=?',
                    currentLocation: '@',
                },
                link: function(scope, element, attrs, ngModel) {
                    var unbindBackButtonAction;

                    scope.locations = [];
                    var searchEventTimeout = undefined;

                    scope.displayCurrentLocation = false;
                    scope.currentLocation = scope.currentLocation === "true"? true:false;

                    if(!!navigator.geolocation && scope.currentLocation){
                        scope.displayCurrentLocation = true;
                    }

                    $ionicModal.fromTemplateUrl('photogram/locationModal.html', {
                        scope: scope,
                        focusFirstInput: true,
                        animation: 'slide-in-right',
                    }).then(function(modal){

                        scope.popup = modal;

                        scope.selectLocation = function(location){
                            ngModel.$setViewValue(location);
                            ngModel.$render();
                            scope.popup.hide();

                            if (unbindBackButtonAction) {
                                unbindBackButtonAction();
                                unbindBackButtonAction = null;
                            }
                            scope.$emit('ionGooglePlaceSetLocation',location);
                        };

                        scope.setCurrentLocation = function(){
                            var location = '正在获取位置...';
                            ngModel.$setViewValue(location);
                            ngModel.$render();
                            scope.popup.hide();
                            reverseGeocoding(scope.geocode)
                                .then(function(location){
                                    ngModel.$setViewValue(location);
                                    element.attr('value', location);
                                    ngModel.$render();
                                }).catch(function(error){
                                    console.log('erreur catch', JSON.stringify(error));
                                    var location = '获取当前位置失败';
                                    ngModel.$setViewValue(location);
                                    ngModel.$render();
                                    scope.popup.hide();
                                    $timeout(function(){
                                        ngModel.$setViewValue(null);
                                        ngModel.$render();
                                        scope.popup.hide();
                                    }, 2000);
                                });
                        };

                        scope.search = function(query){
                            if (searchEventTimeout) $timeout.cancel(searchEventTimeout);
                            searchEventTimeout = $timeout(function() {
                                if(!query) return;
                                //if(query.length < 3);

                                $http.get('https://maps.googleapis.com/maps/api/geocode/json', {
                                    params: {
                                        address: query,
                                        language: 'en',
                                        key: 'AIzaSyC57Wo22mMcQufa-9I0LHQl9XXr0Nu0IiU',
                                    }
                                }).success(function(res){
                                    var addresses = [];
                                    angular.forEach(res['results'], function(address){
                                        var formatted_addr = getAvailableAddress(address);
                                        if (formatted_addr) {
                                            addresses.push(formatted_addr);
                                        }
                                    })
                                    scope.locations = addresses;
                                }).catch(function(err){
                                    console.log(JSON.stringify(err));
                                });
                            }, 350); // we're throttling the input by 350ms to be nice to google's API
                        };

                        scope.closeModal = function(){

                        }

                        var onClick = function(e){
                            e.preventDefault();
                            e.stopPropagation();

                            unbindBackButtonAction = $ionicPlatform.registerBackButtonAction(closeOnBackButton, 250);

                            scope.popup.show();
                        };

                        scope.closeModal = function(){
                            scope.searchQuery = '';
                            scope.popup.hide();

                            if (unbindBackButtonAction){
                                unbindBackButtonAction();
                                unbindBackButtonAction = null;
                            }
                        };

                        closeOnBackButton = function(e){
                            e.preventDefault();

                            scope.popup.hide();

                            if (unbindBackButtonAction){
                                unbindBackButtonAction();
                                unbindBackButtonAction = null;
                            }
                        }

                        element.bind('click', onClick);
                        element.bind('touchend', onClick);
                    });

                    if(attrs.placeholder){
                        element.attr('placeholder', attrs.placeholder);
                    }

                    ngModel.$formatters.unshift(function (modelValue) {
                        if (!modelValue) return '';
                        return modelValue;
                    });

                    ngModel.$parsers.unshift(function (viewValue) {
                        return viewValue;
                    });

                    ngModel.$render = function(){
                        if(!ngModel.$viewValue){
                            element.val('');
                        } else {
                            element.val(ngModel.$viewValue || '');
                        }
                    };

                    scope.$on("$destroy", function(){
                        if (unbindBackButtonAction){
                            unbindBackButtonAction();
                            unbindBackButtonAction = null;
                        }
                    });

                    function reverseGeocoding(location) {
                        return $q(function (resolve, reject) {
                            var lat = location[1];
                            var lng = location[0];
                            $http.get('https://maps.googleapis.com/maps/api/geocode/json', {
                                params: {
                                    latlng: lat + ',' + lng,
                                    language: 'en',
                                    key: ''
                                }
                            }).success(function(res){
                                var results = res['results'];
                                if (res['status'] == 'OK') {
                                    if (results[1]) {
                                        var formatted_addr = getAvailableAddress(results[1]);
                                    } else {
                                        var formatted_addr = getAvailableAddress(results[0]);
                                    }
                                    resolve(formatted_addr);
                                } else {
                                    var error = {
                                        status: res['status'],
                                        from: 'reverseGeocoding'
                                    };
                                    reject(error);
                                }
                            }).catch(function(err){
                                console.log(JSON.stringify(err));
                                reject(error);
                            })
                        });
                    }

                    function getAvailableAddress(address) {
                        var elements = {};
                        var formatted_addr = null;
                        angular.forEach(address.address_components, function (address_component) {
                            elements[address_component.types[0]] = address_component.short_name;
                        });
                        if (elements.locality && elements.administrative_area_level_1) {
                            formatted_addr = [elements.locality,
                                elements.administrative_area_level_1,
                                elements.country].join(',');
                        }

                        return formatted_addr;
                    }
                }
            };
        }
    ]);
