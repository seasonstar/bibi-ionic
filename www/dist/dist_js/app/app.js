// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('maybi', ['ionic', 'ionic.service.core','ngCordova',
        'angularMoment', 'templates', 'ionic-native-transitions',
        'ion-BottomSheet', 'ion-affix', 'ion-photo',  'ion-geo',
        'maybi.controllers', 'maybi.services', 'maybi.directives', 'maybi.photogram',
        'maybi.constants', 'maybi.filters', 'tag-select'])

.run(['$ionicPlatform', '$rootScope', '$state', 'JPush', '$ionicHistory', '$ionicModal', '$ionicLoading', '$cordovaToast', 'amMoment', 'AuthService', 'ngCart', 'Storage', 'FetchData', function($ionicPlatform, $rootScope, $state, JPush,
            $ionicHistory, $ionicModal, $ionicLoading, $cordovaToast,
            amMoment, AuthService, ngCart, Storage, FetchData) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);

        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

        Wechat.isInstalled(function (installed) {
            $rootScope.IsWechatInstalled = installed;
        }, function (reason) {
            $rootScope.IsWechatInstalled = false;
        });
        YCQQ.checkClientInstalled(function(){
            $rootScope.IsQQInstalled = true;
        },function(){
            $rootScope.IsQQInstalled = false;
        });

        plugins.jPushPlugin.init();
        plugins.jPushPlugin.setApplicationIconBadgeNumber(0);
        //plugins.jPushPlugin.setDebugMode(ENV.debug);
        document.addEventListener("jpush.openNotification", JPush.onOpenNotification, false);
        document.addEventListener("jpush.receiveNotification", JPush.onReceiveNotification, false);
        document.addEventListener("jpush.receiveMessage", JPush.onReceiveMessage, false);

    });

    // set moment locale
    amMoment.changeLocale('zh-cn');

    // ngCart
    $rootScope.$on('ngCart:change', function(event, msg){
        ngCart.$save();
        if (window.cordova) {
            $cordovaToast.show(msg, 'short', 'center');
        } else {
            $ionicLoading.show({
              template: msg,
              duration: 1000,
            });
        }
    });

    $rootScope.$state = $state;


    if (angular.isObject(Storage.get('cart'))) {
        ngCart.$restore(Storage.get('cart'));
    } else {
        ngCart.init();
        FetchData.get('/api/cart').then(function(data) {
            ngCart.$loadCart(data.cart);
        });
    }

    $ionicModal.fromTemplateUrl('auth.html', {
        scope: $rootScope
    }).then(function(modal) {
        $rootScope.authDialog = modal;
    });

    $rootScope.showAuthBox = function() {
        $rootScope.authDialog.show();
    };

    $rootScope.closeAuthBox= function() {
        $rootScope.authDialog.hide();
    };

    $rootScope.$on('$stateChangeStart', function (event, next) {

        if (AuthService.isLoggedIn() === false) {
            var token = Storage.get('access_token');
            if (token) {
                AuthService.authenticate(token)
                    .then(function() {

                    }).catch(function() {
                        Storage.remove('access_token');
                    })
            } else if (next.loginRequired) {
                $rootScope.authDialog.show();
            }
        }
    });

    $rootScope.$on('alertStart', function(event, msg, options) {
        var o = options || {};
        angular.extend(o, {
            template: msg || '<ion-spinner icon="spiral"></ion-spinner>',
        });

        $ionicLoading.show(o);

    });
    $rootScope.$on('alertEnd', function(event) {
        $ionicLoading.hide()
    });

    $rootScope.$on('alert', function(event, msg, options) {
        if (window.cordova) {
            $cordovaToast.show(msg, 'short', 'center');
        } else {
            var o = options || {};
            angular.extend(o, {
                template: msg || '<ion-spinner icon="spiral"></ion-spinner>',
                duration: 1000,
            });

            $ionicLoading.show(o);
        }
    });

    if(Storage.get('introPage') !== 'alreadyShow'){
        $state.go('intro');
    }
}])

.config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$ionicConfigProvider', '$ionicNativeTransitionsProvider', function($httpProvider, $stateProvider, $urlRouterProvider, $ionicConfigProvider,
            $ionicNativeTransitionsProvider){

  //$ionicConfigProvider.scrolling.jsScrolling(false);
  $ionicConfigProvider.views.maxCache(5);

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '',
    abstract: true,
    templateUrl: 'tabs.html',
    controller: 'tabsCtrl',
  })

  // Each tab has its own nav history stack:
  .state('intro', {
      url: '/intro',
      templateUrl: 'intro.html',
      controller: 'introCtrl'
    })

  .state('tab.home', {
    url: '/home',
    nativeTransitions: null,
    views: {
      'tab-home': {
        controller: 'homeCtrl',
        templateUrl: 'home.html',
      }
    },
    loginRequired: true,
  })

  .state('tab.cateHome', {
    url: '/cateHome',
    nativeTransitions: null,
    views: {
      'tab-home': {
        controller: 'cateHomeCtrl',
        templateUrl: 'cateHome.html',
      }
    },
    loginRequired: true,
  })

  .state('tab.noti', {
    url: '/notification',
    nativeTransitions: null,
    views: {
      'tab-noti': {
        controller: 'notificationCtrl',
        templateUrl: 'notification.html',
      }
    },
    loginRequired: true,
  })


  .state('logout', {
    url: "/logout",
    controller: 'logoutCtrl',
  })

  .state('tab.explore', {
      url: '/explore',
      nativeTransitions: null,
      views: {
        'tab-explore': {
          templateUrl: 'photogram/home.html',
          controller: 'exploreCtrl'
        }
      },
      loginRequired: true,
    })

  .state('tab.postDetail', {
      url: '/postDetail/:postID',
      views: {
        'tab-explore': {
          templateUrl: 'photogram/postDetail.html',
          controller: 'postDetailCtrl'
        }
      }
    })

  .state('tab.userDetail', {
      url: '/userDetail/:userID',
      views: {
          'tab-explore': {
              templateUrl: 'userDetail.html',
              controller: 'userDetailCtrl'
          }
      }
  })
  .state('tab.accountUserDetail', {
      url: '/userDetail/:userID',
      views: {
          'tab-account': {
              templateUrl: 'userDetail.html',
              controller: 'userDetailCtrl'
          }
      }
  })

  .state('tab.userList', {
      url: '/userList/:userID/:userType',
      views: {
          'tab-explore': {
              templateUrl: 'userList.html',
              controller: 'userListCtrl'
          }
      }
  })

  .state('tab.myuserList', {
      url: '/myuserList/:userID/:userType',
      views: {
          'tab-account': {
              templateUrl: 'userList.html',
              controller: 'userListCtrl'
          }
      }
  })

  .state('tab.account', {
      url: '/account',
      nativeTransitions: null,
      views: {
        'tab-account@tab': {
          templateUrl: 'account.html',
          controller: 'accountCtrl'
        }
      }
    })

  .state('tab.coupons', {
      url: '/coupons',
      views: {
        'tab-account@tab': {
          templateUrl: 'coupons.html',
          controller: 'couponsCtrl'
        }
      }
    })

  .state('tab.settings', {
      url: '/settings',
      views: {
        'tab-account@tab': {
          templateUrl: 'settings.html',
          controller: 'settingsCtrl'
        }
      }
    })

  .state('tab.profile', {
      url: '/account/profile',
      views: {
        'tab-account': {
          templateUrl: 'profile.html',
          controller: 'profileCtrl'
        }
      }
    })


  .state('tab.about', {
      url: '/about',
      views: {
        'tab-account@tab': {
          templateUrl: 'about.html',
          controller: 'aboutCtrl'
        }
      }
    })


  .state('tab.cart', {
      url: '/cart',
      nativeTransitions: null,
      views: {
        'tab-home': {
          templateUrl: 'cart.html',
          controller: 'cartCtrl'
        }
      }
    })

  .state('tab.checkout', {
      url: '/checkout',
      views: {
        'tab-home': {
          templateUrl: 'checkout.html',
          controller: 'checkoutCtrl'
        }
      }
    })

  .state('tab.categories', {
      url: '/categories',
      views: {
        'tab-home': {
          templateUrl: 'category.html',
          controller: 'categoryCtrl'
        }
      }
    })

  .state('tab.category', {
      url: '/category/:en/:cn',
      views: {
        'tab-home': {
          templateUrl: 'item/items.html',
          controller: 'itemsCtrl'
        }
      }
    })

  .state('tab.search', {
      url: '/search/:query',
      views: {
        'tab-home': {
          templateUrl: 'item/items.html',
          controller: 'itemsCtrl'
        }
      }
    })

  .state('tab.payment.success', {
      url: '/payment/success',
      views: {
        'tab-home': {
          controller: 'paymentSuccessCtrl'
        }
      }
    })

  .state('tab.payment.cancel', {
      url: '/payment/cancel',
      views: {
        'tab-home': {
          controller: 'paymentCancelCtrl'
        }
      }
    })

  .state('tab.item', {
      url: '/item/:itemID',
      views: {
        'tab-home': {
          templateUrl: 'item.html',
          controller: 'itemCtrl',
        }
      }
    })

  .state('tab.board', {
      url: '/board/:boardID',
      views: {
        'tab-home': {
          templateUrl: 'board.html',
          controller: 'boardCtrl'
        }
      }
    })

  .state('tab.address', {
      url: '/address',
      cache: false,
      views: {
        'tab-home': {
          templateUrl: 'address.html',
          controller: 'addressCtrl'
        }
      }
    })

  .state('tab.address_list', {
      url: '/address/list',
      cache: false,
      views: {
        'tab-account': {
          templateUrl: 'address_list.html',
          controller: 'addressCtrl'
        }
      }
    })

  .state('tab.orders', {
      url: '/orders',
      views: {
        'tab-account': {
          templateUrl: 'orders.html',
          controller: 'ordersCtrl'
        }
      }
    })

  .state('tab.order_detail', {
      url: '/order/:order_id',
      views: {
        'tab-account': {
          templateUrl: 'order.html',
          controller: 'orderDetailCtrl'
        }
      }
    })

  .state('tab.order_logistic', {
      url: '/order/logistics/:order_id',
      views: {
        'tab-account': {
          templateUrl: 'logistics.html',
          controller: 'logisticsDetailCtrl'
        }
      }
    })

  .state('tab.order_transfer', {
      url: '/order/transfer/:order_id',
      views: {
        'tab-account': {
          templateUrl: 'transfer_logistics.html',
          controller: 'logisticsDetailCtrl'
        }
      }
    })

  .state('tab.express', {
      url: '/express',
      views: {
        'tab-home': {
          templateUrl: 'expressForm.html',
          controller: 'expressCtrl'
        }
      }
    })

  .state('tab.express_add', {
      url: '/express/add',
      views: {
          'tab-home': {
              templateUrl: 'expressItem_add.html',
              controller: 'expressItemAddCtrl'
          }
      }
  })

  .state('tab.order_entry', {
      url: '/order/entry/:itemID',
      views: {
        'tab-account': {
          templateUrl: 'item.html',
          controller: 'itemCtrl',
        }
      }
    })


  .state('tab.calculate', {
      url: '/calculate',
      views: {
        'tab-home': {
          templateUrl: 'calFee.html',
          controller: 'calculateCtrl'
        }
      }
    })

  .state('tab.favors', {
      url: '/favors',
      views: {
        'tab-account': {
          templateUrl: 'favors.html',
          controller: 'favorCtrl'
        }
      }
    })

  .state('tab.like_posts', {
      url: '/like_posts',
      views: {
        'tab-account': {
          templateUrl: 'photogram/like_posts.html',
          controller: 'likePostsCtrl'
        }
      }
    })

  .state('tab.myPostDetail', {
      url: '/myPostDetail/:postID',
      views: {
        'tab-account': {
          templateUrl: 'photogram/postDetail.html',
          controller: 'postDetailCtrl'
        }
      }
    })

  .state('tab.my_posts', {
      url: '/my_posts',
      views: {
        'tab-account': {
          templateUrl: 'photogram/my_posts.html',
          controller: 'myPostsCtrl'
        }
      }
    })

  .state('tab.faq', {
      url: '/faq',
      views: {
        'tab-account': {
          templateUrl: 'faq.html',
          controller: 'faqCtrl'
        }
      }
    })

  .state('tab.limit', {
      url: '/limit',
      views: {
        'tab-home': {
          templateUrl: 'limit.html',
          controller: 'faqCtrl'
        }
      }
    })

  .state('tab.cs', {
      url: '/customer-service',
      views: {
        'tab-account': {
          templateUrl: 'cs.html',
          controller: 'csCtrl'
        }
      }
    })

  .state('tab.feedback', {
      url: '/feedback',
      views: {
        'tab-account': {
          templateUrl: 'feedback.html',
          controller: 'feedbackCtrl'
        }
      }
    })

  ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/explore');
  $httpProvider.interceptors.push('timeoutHttpIntercept');

  AWS.config.update({
      accessKeyId: 'AKIAI4JD55P3DQLOXQKQ',
      secretAccessKey: '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'
  });
  AWS.config.region = 'us-west-1';

}]);
