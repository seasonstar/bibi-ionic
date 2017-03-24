'use strict';
angular
    .module('ion-photo', [
      'ionic',
      'ngCordova',
      'jrCrop'
    ])
    .factory('PhotoService', PhotoService)
    // Photo Crop
    .directive('ionCrop', ionCropDirective)
    // Photo Filter
    .factory('PhotoFilter', PhotoFilterFactory)
    .directive('vin', vintageDirective)
    .directive('photoFilter', photoFilterDirective)
    .directive('photoTag', photoTag)
    .directive('photoCarousel', photoFilterCarouselDirective)
    .factory('Vintage', Vintage);

function PhotoService($ionicActionSheet, ENV, $jrCrop, $rootScope, $http,
        $ionicModal, $cordovaCamera, $cordovaImagePicker, $q) {

    // Default Setting
    var setting = {
      jrCrop: false,
      quality: 80,
      allowEdit: false,
      correctOrientation: true,
      targetWidth: 800,
      targetHeight: 800,
      saveToPhotoAlbum: false,
      allowRotation: false,
      aspectRatio: 0
    };

    return {
      open: open,
      crop: cropModal,
      filter: filterModal,
      upload: uploadToS3,
    };

    function open(options) {
        var defer = $q.defer();
        var options = options || {};

        if (window.cordova) {
            capture(options)
                .then(function (image) {
                    console.log('resolved image');
                    defer.resolve(image);
                })
        } else {
            $rootScope.$broadcast('alert', "请到设置允许打开相机");
        }

        function capture(option) {
            var defer = $q.defer();

            // Primary Image
            if ((option.pieces === 1 && option.allowFilter === true) || option.allowEdit === true) {
                var options = {
                    quality: option.quality ? option.quality : setting.quality,
                    aspectRatio: option.aspectRatio ? option.aspectRatio : setting.aspectRatio,
                    allowRotation: option.allowRotation ? option.allowRotation : setting.allowRotation,
                    allowEdit: option.allowEdit ? option.allowEdit : setting.allowEdit,
                    correctOrientation: option.correctOrientation ? option.correctOrientation : setting.correctOrientation,
                    targetWidth: option.width ? option.width : setting.targetWidth,
                    targetHeight: option.height ? option.height : setting.targetHeight,
                    saveToPhotoAlbum: option.saveToPhotoAlbum ? option.saveToPhotoAlbum : setting.saveToPhotoAlbum,
                    destinationType: window.cordova ? Camera.DestinationType.DATA_URL : null,
                    encodingType: window.cordova ? Camera.EncodingType.JPEG : null,
                    popoverOptions: window.cordova ? CameraPopoverOptions : null,
                };
                options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                $cordovaCamera
                    .getPicture(options)
                    .then(function (imageData) {
                        defer.resolve('data:image/jpeg;base64,'+imageData);
                    }, function (err) {
                        defer.reject('Error When taking Photo:' + err);
                    });
            }
            // Multi Select
            if (option.allowFilter === false) {
                var options = {
                   maximumImagesCount: option.pieces,
                   width: option.width ? option.width : setting.targetWidth,
                   height: option.height ? option.height : setting.targetHeight,
                   quality: option.quality ? option.quality : setting.quality,
                   outputType: imagePicker.OutputType.BASE64_STRING,
                };

                if (ionic.Platform.isAndroid()) {
                    //options.outputType = imagePicker.OutputType.FILE_URI;
                } else {
                    options.outputType = imagePicker.OutputType.BASE64_STRING;
                }

                $cordovaImagePicker.getPictures(options)
                    .then(function (results) {
                        var imgs = [];
                        for (var i = 0; i < results.length; i++) {
                            imgs.push('data:image/jpeg;base64,'+results[i].replace(/(\r\n|\n|\r)/g, ""));
                        }
                        defer.resolve(imgs);
                    }, function(error) {
                        defer.reject('error when choosing photos: '+ error);
                    });
            }

            console.log('capture image', options);

            return defer.promise;
        }

        return defer.promise;
    }

    function cropModal(image, option) {
        var defer = $q.defer();
        $jrCrop.crop({
            url: image,
            aspectRatio: option.aspectRatio ? option.aspectRatio : false,
            allowRotation: option.allowRotation ? option.allowRotation : false,
            width: option.width ? option.width : setting.targetWidth,
            height: option.height ? option.height : setting.targetHeight,
            cancelText: '取消',
            chooseText: '确定'
        }).then(function(canvas) {
            defer.resolve(canvas);
        })

        return defer.promise;
    }

    function filterModal(image, callback) {
        //image = 'data:image/jpeg;base64,' + image;

        var template = '<ion-modal-view class="modal-capture"><ion-header-bar class="bar bar-header">'+
            '<button class="button button-clear button-icon ion-ios-arrow-back" ng-click="closeFilter()"></button><div class="title"></div>' +
            '<button class="button button-icon " ng-click="submitFilter()">下一步</button>' +
            '</ion-header-bar><ion-content class="has-header has-carousel"><photo-filter image="image" loading="loading"></photo-filter></ion-content>'+
            '<div class="bar bar-subfooter bar-carousel">'+
            '<photo-tag tags="form.tags" type="form.type" ng-if="currentTab==\'标签\'"></photo-tag>'+
            '<photo-carousel image="image" loading="loading" ng-if="currentTab==\'滤镜\'"></photo-carousel></div>'+
            '<div class="bar bar-footer">' +
            '<div class="bar-filter" ng-repeat="tab in [\'标签\', \'滤镜\']" ng-click="changeTab(tab)">'+
            '<div class="footer-tab" ng-class="{\'active\': currentTab==tab}" >{{tab}}</div>'+
            '</div></div>'+
            '</ion-modal-view>';
        var scope = $rootScope.$new(true);

        scope.image = image;
        scope.form = {
            photo: '',
            tags: [],
            type: '',
        };

        scope.submitFilter = function() {
            if (!scope.form.type){
                scope.$emit('alert', '请选择一个标签');
                return
            }
            var canvas = document.getElementById('vin-image'); //
            console.log('Submit Filter');
            scope.form.photo = canvas.src;
            callback(scope.form);
            scope.closeFilter();
        };

        scope.closeFilter = function(){
            console.log('Close Modal Filter');
            scope.modalFilter.hide();
            scope.modalFilter.remove();
        };

        scope.currentTab = '标签';
        scope.changeTab = function(tab){
            scope.currentTab = tab;
        };

        scope.modalFilter = $ionicModal.fromTemplate(template, {
            scope: scope
        });
        scope.modalFilter.show();
    }

    function dataURItoBlob(dataURI) {
	    var binary = atob(dataURI.split(',')[1]);
	    var array = [];
	    for (var i = 0; i < binary.length; i++) {
	        array.push(binary.charCodeAt(i));
	    }

	    var mimeString = 'image/jpeg';
	    return new Blob([new Uint8Array(array)], {
	        type: mimeString
	    });
	}

    function uploadToS3(imageData, filename, successCallback, failCallback) {
        var data = dataURItoBlob(imageData);
        var bucket = new AWS.S3({
            params: {
                Bucket: 'maybi-img'
            }
        });
        var params = {
            Key: filename,
            Body: data,
            ContentEncoding: 'base64',
            ContentType: 'image/jpeg',
            ACL: "public-read",
        };

        bucket.putObject(params, function(err, data) {
            if (err) {
                //console.log(JSON.stringify(err));
                failCallback(err);
            } else {
                //data.Location is your s3 image path
                //console.log(JSON.stringify(data));
                successCallback(data);
            }
        }).on('httpUploadProgress',function(progress) {
            // Log Progress Information
            console.log(Math.round(progress.loaded / progress.total * 100) + '% done');
        });
    }

    function uploadThumbnails(imageData, filename) {

        window.imageResizer.resizeImage(
            successCallback,
            function (error) {
                console.log("Error : \r\n" + error);
            }, imageData, 400, 400, {
                resizeType: ImageResizer.RESIZE_TYPE_MAX_PIXEL,
                imageDataType: ImageResizer.IMAGE_DATA_TYPE_BASE64,
                format: 'jpeg',
                quality: 100,
            }
        );

        function successCallback(data){
            var bucket = new AWS.S3({
                params: {
                    Bucket: 'maybi'
                }
            });
            var params = {
                Key: '400/'+filename,
                Body: data.imageData,
                ContentEncoding: 'base64',
                ContentType: 'image/jpeg',
                ACL: "public-read",
            };

            bucket.putObject(params, function(err, data) {
                if (err) {
                    //console.log(JSON.stringify(err));
                } else {
                    //data.Location is your s3 image path
                    //console.log(JSON.stringify(data));
                }
            }).on('httpUploadProgress',function(progress) {
                // Log Progress Information
                console.log(Math.round(progress.loaded / progress.total * 100) + '% done');
            });
        }


    }

}

// jrCrop
function ionCropDirective($jrCrop, $ionicActionSheet) {

    return {
        restrict: 'A',
        scope: {
            ngModel: '=',
            option: '=',
            cropSave: '&'
        },
        templateUrl: 'photogram/ionCrop.html',
        link: ionCropLink
    };

    function ionCropLink(scope, element) {

        // Triggered on a button click, or some other target
        scope.action = action;
        element.bind('click', getElem);
        scope.crop = crop;
        angular.element(document.getElementById('browseBtn'))
            .on('change', fileUpload);


        function getElem() {
            document.getElementById('browseBtn').click();
        }

        // Show the action sheet
        function action() {
            var buttons = [{
                text: '<i class="icon ion-camera"></i> 拍照'
            }, {
                text: '<i class="icon ion-images"></i> 相册'
            }];
            $ionicActionSheet.show({
              buttons: buttons,
              titleText: '裁剪',
              cancelText: '取消',
              buttonClicked: function (index) {

                if (index === 0) {
                  console.log('Photo Camera');
                }
                // Photo Album
                if (index === 1) {
                  document.getElementById('browseBtn')
                    .click();
                }
                return true;
              }
            });
        }

        function fileUpload(e) {

            var file = e.target.files[0];
            var reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = function (event) {
              var image = event.target.result;
              scope.crop(image);
            };

            // Clear input file
            angular.element(document.getElementById('browseBtn'))
                .val('');

        }

        function crop(image) {

            console.log(scope.option);

            $jrCrop.crop({
                url: image,
                width: scope.option ? scope.option.width : 200,
                height: scope.option ? scope.option.height : 200,
                cancelText: 'Cancel',
                chooseText: 'Save'
            }).then(function (canvas) {
                var image = canvas.toDataURL();
                //            var name = $scope.option ? $scope.option.name : 'thumb';
                //            var filename = ($scope.option ? $scope.option.name : '') + '_' + name + window.Number(new window.Date() + '.jpg';

                //var file = base64ToBlob(image.replace('data:image/png;base64,', ''), 'image/jpeg');
                //            file.name = filename;

                //upload(file);
                console.log(image);
                scope.ngModel = image;
            });

        }
    }
}

// Photo Filter
function PhotoFilterFactory($rootScope, $q, $ionicModal) {

    return {
        load: modalFilter
    };

    function modalFilter(image, done) {
        var template =
            '<ion-modal-view class="modal-capture"><ion-header-bar>'+
            '<button class="button button-clear button-icon ion-ios-arrow-back" ng-click="closeCapture()"></button>'+
            '<div class="title"></div>' +
            '<button class="button button-icon " ng-click="submitCapture()">下一步</button>' +
            '</ion-header-bar><ion-content><photo-filter image="form.photo"></photo-filter></ion-content></ion-modal-view>';


        var image = image.toDataURL();

        var scope = $rootScope.$new(true);
        scope.closeCapture = closeModalCapture;
        scope.submitCapture = submitCapture;
        scope.form = {
            photo: image
        };

        scope.modal = $ionicModal.fromTemplate(template, {
            scope: scope
        });

        scope.modal.show();

        function submitCapture() {
            var canvas = document.getElementById('vin-image');
            var dataUrl = canvas.src;
            done(dataUrl);
            closeModalCapture();
        }

        function closeModalCapture() {
            scope.modal.hide();
            scope.modal.remove();
        }
    }
}

function photoFilterDirective() {
    return {
      restrict: 'E',
      scope: {
        image: '=',
        loading: '='
      },
      transclude: true,
      templateUrl: 'photogram/photoFilter.html'
    };
}

function photoFilterCarouselDirective(Vintage, $timeout) {
    return {
        restrict: 'E',
        scope: {
            image: '=',
            loading: '='
        },
        templateUrl: 'photogram/photoFilterCarousel.html',
        link: function (scope, elem, attrs) {
            scope.filters = Vintage.filters;
            scope.applyFilter = function(effect) {
                var originalImage = document.getElementById('original-image');
                var currImage = document.getElementById('vin-image');
                currImage.src = originalImage.src;
                scope.loading = true;
                if (effect == 'normal') {
                    scope.loading = false;
                } else {
                    Vintage.effect(effect).
                        then(function(resp){
                          scope.loading = false;
                        })
                }
            }
        }
    };
}

function photoTag() {
    return {
        restrict: 'E',
        scope: {
            tags: '=',
            type: '=',
        },
        templateUrl: 'photogram/photoTag.html',
        link: function (scope, elem, attrs) {
            scope.tags = [];
            scope.selectType = function(type){
                scope.type = type;
            }
        }
    };
}

function vintageDirective(Vintage, $timeout) {
    return {
      restrict: 'A',
      scope: {
        filter: '=',
        name: '@',
        image: '=',
        loading: '='
      },
      template: '<img ng-src="{{ image }}" id="{{ name }}">',
    };
}

function Vintage($q){
    var vintagePresetsCN = {
      'vintage': '葡萄',
      'sepia': '褐色',
      'greenish': '绿意',
      'reddish': '泛红',
      'random': '随机',
    };


    var vintagePresets = {
      /**
       * Basic vintage effect
       */
      vintage: {
        curves: (function() {
          var rgb = function (x) {
            return -12 * Math.sin( x * 2 * Math.PI / 255 ) + x;
          },
          r = function(x) {
            return -0.2 * Math.pow(255 * x, 0.5) * Math.sin(Math.PI * (-0.0000195 * Math.pow(x, 2) + 0.0125 * x ) ) + x;
          },
          g = function(x) {
            return -0.001045244139166791 * Math.pow(x,2) + 1.2665372554875318 * x;
          },
          b = function(x) {
            return 0.57254902 * x + 53;
          },
          c = {r:[],g:[],b:[]};
          for(var i=0;i<=255;++i) {
            c.r[i] = r( rgb(i) );
            c.g[i] = g( rgb(i) );
            c.b[i] = b( rgb(i) );
          }
          return c;
        })(),
        screen: {
          r: 227,
          g: 12,
          b: 169,
          a: 0.15
        },
        vignette: 0.7,
        viewFinder: false // or path to image 'img/viewfinder.jpg'
      },
      /**
       * Sepia effect
       */
      sepia: {
        curves: (function() {
          var rgb = function (x) {
            return -12 * Math.sin( x * 2 * Math.PI / 255 ) + x;
          },
          c = {r:[],g:[],b:[]};
          for(var i=0;i<=255;++i) {
            c.r[i] = rgb(i);
            c.g[i] = rgb(i);
            c.b[i] = rgb(i);
          }
          return c;
        })(),
        sepia: true
      },
      /**
       * Greenish effect
       */
      greenish: {
        curves: (function() {
          var rgb = function (x) {
            return -12 * Math.sin( x * 2 * Math.PI / 255 ) + x;
          },
          c = {r:[],g:[],b:[]};
          for(var i=0;i<=255;++i) {
            c.r[i] = rgb(i);
            c.g[i] = rgb(i);
            c.b[i] = rgb(i);
          }
          return c;
        })(),
        vignette: 0.6,
        lighten: 0.1,
        screen: {
          r: 255,
          g: 255,
          b: 0,
          a: 0.15
        }
      },
      /**
       * Reddish effect
       */
      reddish: {
        curves: (function() {
          var rgb = function (x) {
            return -12 * Math.sin( x * 2 * Math.PI / 255 ) + x;
          },
          c = {r:[],g:[],b:[]};
          for(var i=0;i<=255;++i) {
            c.r[i] = rgb(i);
            c.g[i] = rgb(i);
            c.b[i] = rgb(i);
          }
          return c;
        })(),
        vignette: 0.6,
        lighten: 0.1,
        screen: {
          r: 255,
          g: 0,
          b: 0,
          a: 0.15
        }
      },
      random: function () {
        var d = [!1, "assets/images/viewfinder.jpg"],
            g = 30 - Math.floor(60 * Math.random()),
            a = 30 - Math.floor(60 * Math.random()),
            h = function () {
                if (0.5 <= Math.random()) return !1;
                for (var a = 5 <= Math.random(), d = 5 <= Math.random() ? d : function (a) {
                    return a
                }, g = a ? g : function (a) {
                    return a
                }, h = a ? h : function (a) {
                    return a
                }, k = a ? k : function (a) {
                    return a
                }, a = {
                    r: [],
                    g: [],
                    b: []
                }, p = 0; 255 >= p; ++p) a.r[p] =
                g(d(p)),
                a.g[p] = h(d(p)),
                a.b[p] = k(d(p));
                return a
            }(),
            k;
        k = 0.5 <= Math.random() ? !1 : {
                r: Math.floor(255 * Math.random()),
                g: Math.floor(255 * Math.random()),
                b: Math.floor(255 * Math.random()),
                a: 0.4 * Math.random()
            };
        return {
                contrast: g,
                brightness: a,
                curves: h,
                screen: k,
                desaturate: Math.random(),
                vignette: Math.random(),
                lighten: 0.3 * Math.random(),
                noise: Math.floor(50 * Math.random()),
                viewFinder: false,
                sepia: 0.5 <= Math.random()
            }
        }
    };

    return {
      filters: vintagePresetsCN,
      effect: filter,
    };

    function filter(effect) {
        var defer = $q.defer();
        var image = document.getElementById('vin-image');

        var options = {
            onError: function() {
                alert('ERROR');
            },
            onStop: function() {
                defer.resolve(effect);
            }
        };
        var eff = effect!='random' ? vintagePresets[effect] : vintagePresets[effect]();

        new VintageJS(image, options, eff);

        return defer.promise;
    }
}
