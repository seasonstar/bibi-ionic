"use strict";

angular.module('maybi.directives', [])

.directive('ngcartAddtocart', ['ngCart', function(ngCart){
    return {
        restrict : 'E',
        scope: {
            id:'@',
            name:'@',
            quantity:'@',
            quantityMax:'@',
            price:'@',
            data:'='
        },
        transclude: true,
        templateUrl: function(element, attrs) {
            if ( typeof attrs.templateUrl == 'undefined' ) {
                return 'ngCart/addtocart.html';
            } else {
                return attrs.templateUrl;
            }
        },
        link: function(scope, element, attrs){
            scope.ngCart = ngCart;
            scope.attrs = attrs;
            scope.inCart = function(){
                return  ngCart.getItemById(attrs.id);
            };

            if (scope.inCart()){
                scope.q = ngCart.getItemById(attrs.id).getQuantity();
            } else {
                scope.q = parseInt(scope.quantity);
            }

            scope.qtyOpt =  [];
            for (var i = 1; i <= scope.quantityMax; i++) {
                scope.qtyOpt.push(i);
            }

            scope.alertWarning = function() {
                scope.$emit('alert', '请选择有效商品');
            };
        }
    };
}])

.directive('ngcartSummary', ['ngCart', function(ngCart){
    return {
        restrict : 'E',
        link: function(scope, element, attrs){
            scope.ngCart = ngCart;
        },
        scope: {},
        transclude: true,
        templateUrl: function(element, attrs) {
            if ( typeof attrs.templateUrl == 'undefined' ) {
                return 'ngCart/summary.html';
            } else {
                return attrs.templateUrl;
            }
        }
    };
}])

.directive('ngcartCheckout', ['ngCart', 'fulfilmentProvider', '$timeout', '$ionicActionSheet', function(ngCart, fulfilmentProvider, $timeout, $ionicActionSheet){
    return {
        restrict : 'E',
        link: function(scope, element, attrs){
            scope.ngCart = ngCart;

            scope.showPaymentMethods = function() {

              var sheet = {};
              sheet.buttonClicked = buttonClicked;
              sheet.buttons = [{
                text: '<i class="icon fa fa-paypal"></i> Paypal支付$'
              }, {
                text: '<i class="icon fa fa-wechat"></i> 微信支付￥'
              }];

              $ionicActionSheet.show(sheet);

              function buttonClicked(index) {
                var service = { 0: 'paypal', 1: 'wechat'}

                fulfilmentProvider.setService(service[index]);
                fulfilmentProvider.setSettings(scope.settings);
                fulfilmentProvider.checkout()
              }
            };

        },
        scope: {
            settings:'=',
            show: '=',
        },
        replace: true,
        templateUrl: function(element, attrs) {
            if ( typeof attrs.templateUrl == 'undefined' ) {
                return 'ngCart/checkout.html';
            } else {
                return attrs.templateUrl;
            }
        }
    };
}])
.directive("zoomView", ['$compile', '$ionicModal', '$ionicPlatform', '$cordovaSocialSharing', function ($compile, $ionicModal, $ionicPlatform, $cordovaSocialSharing) {
    return {

      restrict: "A",

      link: function(scope, elem, attr) {

        $ionicPlatform.ready(function () {

          elem.attr("ng-click", "showZoomView()");
          elem.removeAttr("zoom-view");
          $compile(elem)(scope);

          var zoomViewTemplate = '<ion-modal-view class="zoom-view"><ion-header-bar>'+
              '<button ng-click="closeZoomView()" class="button button-clear button-light button-icon ion-ios-close-empty"></button></ion-header-bar>'+
              '<ion-content ng-click="closeZoomView()"><ion-scroll zooming="true" direction="xy" style="width: 100%; height: 100%; position: absolute; top: 0; bottom: 0; left: 0; right: 0; ">'+
              '<img ng-src="{{ngSrc}}" style="width: 100%!important; display:block; width: 100%; height: auto; max-width: 400px; max-height: 700px; margin: auto; padding: 10px; " />'+
              '</ion-scroll> </ion-content>'+
              '<ion-footer-bar><h1 class="title"></h1><button class="button button-light button-icon ion-ios-download-outline" ng-click="downloadFile()"></button></ion-footer-bar>'
              '</ion-modal-view>';

          scope.zoomViewModal = $ionicModal.fromTemplate(zoomViewTemplate, {
            scope: scope,
            animation: "slide-in-right"
          });

          scope.showZoomView = function () {
            scope.zoomViewModal.show();
            scope.ngSrc = attr.zoomSrc;
          };

          scope.closeZoomView = function () {
            scope.zoomViewModal.hide();
          };

          scope.downloadFile = function() {
            var message = "分享图片",
                subject = '分享',
                file = scope.ngSrc,
                link = "http://www.may.bi";

            $cordovaSocialSharing
              .share(message, subject, file, link) // Share via native share sheet
              .then(function(result) {
                console.log('result:' + result);
                // Success!
              }, function(err) {
                console.log('err:' + err);
                scope.broadcast('alert', err);
                // An error occured. Show a message to the user
              });
          }
        });
      }
    };
}])
.directive('showMore', ['$timeout', function($timeout){
    return {
        templateUrl: 'showMore.html',
        restrict: 'A',
        replace: true,
        scope: {
            'title': '=',
        },
        link: function(scope, element, attrs){

                var showMoreHeight = parseInt(attrs.showMore);

                scope.expanded = false;
                scope.expandable = false;

                $timeout(function(){
                    renderStyles();
                }, 300);
                scope.toggle = function(){
                    scope.expanded = !scope.expanded;

                };

                function renderStyles(){
                    var elementHeight = element.find('p')[0].offsetHeight;
                    if(elementHeight > showMoreHeight && scope.expanded === false){
                        scope.expandable = true;
                    }
                }

                scope.showLessStyle = {
                    'max-height': showMoreHeight + 'px',
                    'overflow': 'hidden',
                    'margin-bottom': '6px',
                };


        }
    };
}])

.directive('addressForm', ['$rootScope', '$ionicModal', 'FetchData', 'ngCart', '$state', function($rootScope, $ionicModal, FetchData, ngCart, $state){
    return {
        restrict : 'A',
        scope: {
            'addrId': '=',
            'addresses': '=',
        },
        link: function(scope, element, attrs){
            scope.ngCart = ngCart;
            scope.addr = {};

            var addr_id = scope.addrId;
            if (addr_id) {
                FetchData.get('/api/address/get/'+addr_id).then(function(data){
                    scope.addr= data.address;
                });
            }
            $ionicModal.fromTemplateUrl('add_address.html', {
                scope: scope,
                animation: 'slide-in-right'
            }).then(function (modal) {
                scope.addressModal = modal;
            });
            scope.closeModal = function(){
                scope.addressModal.hide();

            };

            element.bind('click', function(){
                scope.addressModal.show();
            })

            FetchData.get('/api/address/hierarchy').then(function(data){
                scope.COUNTRIES= data.countries;
            });
            scope.$watch('addr["country"]', function(new_val) {
                FetchData.get('/api/address/hierarchy/'+scope.addr.country).then(function(data) {
                    scope.REGIONS= data.regions;
                });
            });

            scope.ngCart = ngCart;
            scope.saveAddress = function(){
                if (addr_id) {
                    FetchData.post('/api/address/update/'+addr_id, {
                        'receiver': scope.addr.receiver,
                        'street1': scope.addr.street1,
                        'street2': scope.addr.street2,
                        'city': scope.addr.city,
                        'state': scope.addr.state,
                        'postcode': scope.addr.postcode,
                        'country': scope.addr.country,
                        'mobile_number': scope.addr.mobile_number,
                    }).then(function(data) {
                        scope.addressModal.hide();
                        $state.transitionTo($state.current, $state.$current.params, { reload: true, inherit: true, notify: true });
                    });
                } else {
                    FetchData.post('/api/address/add', {
                        'receiver': scope.addr.receiver,
                        'street1': scope.addr.street1,
                        'street2': scope.addr.street2,
                        'city': scope.addr.city,
                        'state': scope.addr.state,
                        'postcode': scope.addr.postcode,
                        'country': scope.addr.country,
                        'mobile_number': scope.addr.mobile_number,
                    }).then(function(data) {
                        scope.addressModal.hide();
                        $state.transitionTo($state.current, $state.$current.params, { reload: true, inherit: true, notify: true });

                    });

                }
            }

        },
    };
}])

.directive('followBtn', ['User', 'AuthService', function(User, AuthService){
    return {
        restrict : 'E',
        scope: {
            user:'=',
        },
        transclude: true,
        templateUrl: 'user/followButton.html',
        link: function(scope, element, attrs){
            scope.currentUserID = AuthService.getUser().id;

            scope.follow = function(){
                var user = AuthService.getUser();

                if (scope.user.is_following){
                    scope.user.is_following= false;
                    scope.user.num_followers -= 1;

                    User.unfollow(scope.user.id)
                        .then(function(data){
                            scope.$emit('alert', "已取消关注");
                        }).catch(function(error){
                            scope.user.is_following= true;
                            scope.user.num_followers += 1;
                        });
                } else {
                    scope.user.is_following = true;
                    scope.user.num_followers += 1;

                    User.follow(scope.user.id)
                        .then(function(data){
                            scope.$emit('alert', "关注成功");
                        }).catch(function(error){
                            scope.user.is_following = false;
                            scope.user.num_followers -= 1;

                        });
                }
            };
        }
    };
}])

.directive('headerShrink', ['$document', function($document) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attr) {
            var resizeFactor, blurFactor;
            var scrollContent = $element[0];
            var header = document.body.querySelector('.avatar-section');
            $scope.$on('userDetailContent.scroll', function(event,scrollView) {
                var y = scrollView.__scrollTop;
                if (y >= 0) {
                  header.style[ionic.CSS.TRANSFORM] = 'translate3d(0, -' + Math.min(148, y) + 'px, 0)';
                  scrollContent.style.top = Math.max(64, 250 - y) + 'px';
                }
            });
        }
    }
}])

.directive('itemCarousel', ['$state', function($state) {
    return {
        restrict: 'E',
        scope: {
            board: '='
        },
        templateUrl: 'itemCarousel.html',
        link: function (scope, elem, attrs) {
            scope.items = scope.board.items;

            scope.goItem = function(item_id) {
                $state.go('tab.item', {itemID: item_id});
            };

            scope.goBoard= function(item_id) {
                $state.go('tab.board', {'boardID': scope.board.id})
            };


        }
    };
}])
