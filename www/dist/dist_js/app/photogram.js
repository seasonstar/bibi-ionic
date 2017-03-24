'use strict';

PhotogramFactory.$inject = ['FetchData', 'ENV', '$http', '$q', '$rootScope', 'Storage', 'PhotoService'];
photoList.$inject = ['Photogram', '$q', '$timeout', '$rootScope', '$state', 'photoShare'];
photoShare.$inject = ['$rootScope', 'Photogram', '$ionicActionSheet', '$cordovaSocialSharing', 'sheetShare', 'AuthService', '$ionicPopup'];
var photogramModule = angular.module('maybi.photogram', [])

photogramModule.factory('Photogram', PhotogramFactory);
photogramModule.directive('photoList', photoList);
photogramModule.service('photoShare', photoShare);

function PhotogramFactory(FetchData, ENV, $http, $q, $rootScope, Storage, PhotoService) {

    var posts = [];
    var currentTab = '';
    var hasNextPage = true;
    var isEmpty = false;
    var nextPage = 0;
    var perPage = 10;

    return {
        post: createPost,
        delPost: delPost,
        getDetail: getDetail,
        search: search,
        addComment: addComment,
        deleteComment: deleteComment,
        like: like,
        unlike: unlike,
        report: report,

        getUserPosts: getUserPosts,
        getUserLikes: getUserLikes,
        fetchTopPosts: fetchTopPosts,
        increaseNewPosts: increaseNewPosts,
        getPosts: function() {
            return posts;
        },
        setCurrentTab: function(tab) {
            currentTab = tab;
        },
        getCurrentTab: function() {
            return currentTab;
        },
        hasNextPage: function() {
            return hasNextPage;
        },
        isEmpty: function() {
            return isEmpty;
        },
    };

    function increaseNewPosts() {
        var deferred = $q.defer();
        $http.get(ENV.SERVER_URL + '/api/post/list', {
            params: {
                type: currentTab,
                page: nextPage,
                per_page: perPage,
            }
        }).success(function(r, status) {
            if (status === 200 && r.message == "OK"){
                if (r.posts.length < perPage) {
                    hasNextPage = false;
                }
                nextPage++;
                deferred.resolve(r);
            } else {
                deferred.reject();
            }
        }).error(function (data){
            deferred.reject();
        });
        return deferred.promise;
    }

    function fetchTopPosts() {
        var deferred = $q.defer();
        hasNextPage = true;
        isEmpty = false;

        $http.get(ENV.SERVER_URL + '/api/post/list', {
            params: {
                type: currentTab,
                page: 0,
                per_page: perPage,
            }
        }).success(function(r, status) {
            if (status === 200 && r.message == "OK"){
                if (r.posts.length < perPage) {
                    hasNextPage = false;
                }
                nextPage=1;
                if (r.posts.length === 0) {
                    isEmpty = true;
                }

                deferred.resolve(r);
            } else {
                deferred.reject();
            }
        }).error(function (data){
            deferred.reject();
        });
        return deferred.promise;
    }

    function getUserPosts(userId, page) {
        var deferred = $q.defer();
        hasNextPage = true;
        isEmpty = false;

        $http.get(ENV.SERVER_URL + '/api/post/list', {
            params: {
                page: page,
                per_page: perPage,
                user_id: userId,
            }
        }).success(function(r, status) {
            if (status === 200 && r.message == "OK"){
                if (r.posts.length < perPage) {
                    hasNextPage = false;
                }
                if (page == 0 && r.posts.length === 0) {
                    isEmpty = true;
                }
                deferred.resolve(r);
            } else {
                deferred.reject();
            }
        }).error(function (data){
            deferred.reject();
        });
        return deferred.promise;
    }

    function getUserLikes(userId, page) {
        var deferred = $q.defer();
        hasNextPage = true;
        isEmpty = false;

        $http.get(ENV.SERVER_URL + '/api/post/likes', {
            params: {
                page: page,
                per_page: perPage,
                user_id: userId,
            }
        }).success(function(r, status) {
            if (status === 200 && r.message == "OK"){
                if (r.posts.length < perPage) {
                    hasNextPage = false;
                }
                if (page == 0 && r.posts.length === 0) {
                    isEmpty = true;
                }
                deferred.resolve(r);
            } else {
                deferred.reject();
            }
        }).error(function (data){
            deferred.reject();
        });
        return deferred.promise;
    }

    function search(query) {
        var deferred = $q.defer();
        hasNextPage = true;
        isEmpty = false;

        $http.get(ENV.SERVER_URL + '/api/post/list', {
            params: {
                type: currentTab,
                page: 0,
                per_page: perPage,
                title: query,
            }
        }).success(function(r, status) {
            if (status === 200 && r.message == "OK"){
                if (r.posts.length < perPage) {
                    hasNextPage = false;
                }
                if (r.posts.length === 0) {
                    isEmpty = true;
                }
                nextPage = 1;
                deferred.resolve(r);
            } else {
                deferred.reject();
            }
        }).error(function (data){
            deferred.reject();
        });
        return deferred.promise;
    }

    function createPost(form) {
        var deferred = $q.defer();
        var primary_filename = 'primary/' + new Date().getTime() + ".jpeg";

        PhotoService.upload(form.primary_image, primary_filename,
            function(data){
                $http.post(ENV.SERVER_URL + '/api/post/image_uploaded', {
                    url: primary_filename,
                    type: 'primary_image',
                });
                $rootScope.$broadcast('alert', "发送成功");

            }, function(error){
                $rootScope.$broadcast('alert', "发送失败，请重试");
                deferred.reject(error);
                return deferred.promise;
            });

        form.primary_image = 'http://assets.maybi.cn/'+primary_filename;

        var photos = [];
        angular.forEach(form.photos, function(img, index){
            var filename = 'photo/'+index+'/' + new Date().getTime() + ".jpeg";
            PhotoService.upload(img, filename,
                function(data){
                    $http.post(ENV.SERVER_URL + '/api/post/image_uploaded', {
                        url: filename,
                        type: 'photos',
                    });

                }, function(error){
                    deferred.reject(error);
                    return deferred.promise;
                });

            photos.push('http://assets.maybi.cn/'+filename);

        });

        form.photos = photos;

        FetchData.post('/api/post/create', form)
            .then(function(r) {
                deferred.resolve(r);
            }).catch(function (error){
                deferred.reject(error);
            });

        return deferred.promise;

    }


    function delPost(postId) {
        var deferred = $q.defer();

        FetchData.post('/api/post/delete/'+ postId).then(function(r) {
            deferred.resolve(r);
        }).catch(function (error){
            deferred.reject(error);
        });

        return deferred.promise;
    }

    function getDetail(postId) {
        var deferred = $q.defer();

        FetchData.get('/api/post/detail/' + postId)
            .then(function(r) {
                deferred.resolve(r);
            }).catch(function (error){
                deferred.reject(error);
            });

        return deferred.promise;
    }

    function addComment(postId, text) {
        var deferred = $q.defer();

        FetchData.post('/api/post/comment/add', {
            post_id: postId,
            content: text,
        }).then(function(r) {
            deferred.resolve(r);
        }).catch(function (error){
            deferred.reject(error);
        });

        return deferred.promise;
    }

    function deleteComment(commentId, postId) {
        var deferred = $q.defer();

        FetchData.post('/api/post/comment/delete', {
            comment_id: commentId,
            post_id: postId,
        }).then(function(r) {
            deferred.resolve(r);
        }).catch(function (error){
            deferred.reject(error);
        });

        return deferred.promise;
    }

    function like(postId) {
        var deferred = $q.defer();

        FetchData.post('/api/post/like/'+postId)
            .then(function(r) {
                deferred.resolve(r);
            }).catch(function (error){
                deferred.reject(error);
            });

        return deferred.promise;
    }

    function unlike(postId) {
        var deferred = $q.defer();

        FetchData.post('/api/post/unlike/'+postId)
            .then(function(r) {
                deferred.resolve(r);
            }).catch(function (error){
                deferred.reject(error);
            });

        return deferred.promise;
    }

    function report(postId, subject) {
        var deferred = $q.defer();

        FetchData.post('/api/post/report', {
            post_id: postId,
            subject: subject
        }).then(function(r) {
            deferred.resolve(r);
        }).catch(function (error){
            deferred.reject(error);
        });

        return deferred.promise;
    }
}

function photoList(Photogram, $q, $timeout, $rootScope, $state, photoShare){
    return {
        restrict: 'E',
        scope: {
            post: '=',
            withAffix: '=',
        },
        replace: true,
        link: function(scope, elem, attrs) {
            scope.like = function(){
                if (scope.post.is_liked){
                    scope.post.is_liked = false;
                    scope.post.num_likes -= 1;
                    Photogram.unlike(scope.post.post_id)
                        .then(function(data){
                        }).catch(function(error){
                            scope.post.is_liked = true;
                            scope.post.num_likes += 1;
                        });
                } else {
                    scope.post.is_liked= true;
                    scope.post.num_likes += 1;
                    Photogram.like(scope.post.post_id)
                        .then(function(data){
                        }).catch(function(error){
                            scope.post.is_liked= false;
                            scope.post.num_likes -= 1;
                        });
                }
            };
            scope.goPost = function() {
                for(var name in $state.current.views) {
                    var name = name;
                }

                if (name=="tab-explore"){
                    $state.go('tab.postDetail', {postID: scope.post.post_id});
                } else {
                    $state.go('tab.myPostDetail', {postID: scope.post.post_id});
                }
            };
            scope.actions = function(){
                photoShare.popup(scope.post);
            }
            scope.zoom = function() {
                if (ionic.Platform.isAndroid()) {
                    PhotoViewer.show(scope.post.primary_image, ''); //cordova photoviewer
                } else {
                    ImageViewer.show(scope.post.primary_image);    // cordova ImageViewer for IOS
                }
            };

            scope.goUser = function(){
                $state.go('tab.userDetail', {userID: scope.post.user.id});
            };

            scope.searchTag = function(tag){

            };
        },


        templateUrl: function(element, attrs) {
            if ( typeof attrs.withAffix == 'undefined' ) {
                return 'photogram/photoList.html';
            } else {
                return 'photogram/photoListNoAffix.html';
            }
        },
    }

}

function photoShare($rootScope, Photogram, $ionicActionSheet, $cordovaSocialSharing,
        sheetShare, AuthService, $ionicPopup){

    this.popup = function(post) {
      var sheet = {};
      sheet.destructiveText = '<i class="icon fa fa-info-circle"></i> 举报';
      sheet.cancelText = '取消';
      sheet.buttonClicked = buttonClicked;
      sheet.destructiveButtonClicked = destructiveButtonClicked;
      sheet.cssClass = 'actions-menu';
      sheet.buttons = [{
        text: '<i class="icon fa fa-share-alt"></i> 分享'
      }];
      if (post.user.id == AuthService.getUser().id) {
          sheet.buttons.push({
            text: '<i class="icon fa fa-trash"></i> 删除'
          })
      }

      $ionicActionSheet.show(sheet);

      function destructiveButtonClicked(){
        var buttons = [
            { text: '垃圾广告' },
            { text: '虚假信息' },
            { text: '恶意攻击' },
            { text: '暴力色情' },
            { text: '触犯法规' },
            { text: '其他原因' },
        ];
        $ionicActionSheet.show({
            buttons: buttons,
            titleText: '举报原因',
            cssClass: 'actions-menu',
            cancelText: '取消',
            buttonClicked: function(index) {
                var subject = buttons[index].text;
                Photogram.report(post.post_id, subject).then(function(data){
                    $rootScope.$emit('alert', "已举报");
                });
                return true;
            }
        });
        return true;
      }

      function buttonClicked(index) {

        if (index == 0){
            if ($rootScope.IsWechatInstalled && $rootScope.IsQQInstalled){
                sheetShare.popup(post, 'post');
            } else {
                var message = "分享图片",
                    subject = '分享',
                    file = post.primary_image,
                    link = "http://www.may.bi";

                $cordovaSocialSharing
                    .share(message, subject, file, link) // Share via native share sheet
                    .then(function(result) {
                        console.log('result:' + result);
                    }, function(err) {
                        $rootScope.$emit('alert', err);
                    });
            }

        } else if (index == 1) {
            Photogram.delPost(post.post_id).then(function(data){
                $rootScope.$emit('alert', "删除成功");
            })

        }
        return true;

      }
    }


}
