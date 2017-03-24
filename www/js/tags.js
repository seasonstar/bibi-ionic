(function(){

angular.module('tag-select', [])
.directive('tagSelect', ['$ionicModal','$timeout', '$filter', '$cordovaToast', 'FetchData', function ($ionicModal, $timeout, $filter, $cordovaToast, FetchData) {
    return {
        restrict: 'A',
        require : 'ngModel',
        scope: {
            ngModel: '=?',
            tagType: '@',
        },
        link: function (scope, iElement, iAttrs, ngModelController) {

            scope.ui = {
                checkedTags: scope.ngModel,
                value: null,
                searchQuery: ''
            };

            // getting options template

            /*
            ngModelController.$render = function(){
                scope.ui.value = ngModelController.$viewValue;
            };
            */

            scope.confirmTags = function(){
                ngModelController.$setViewValue(scope.ui.checkedTags);
                ngModelController.$render();

                scope.modal.hide().then(function(){
                    scope.ui.searchQuery = '';
                });

            };
            scope.setOption = function(tag){
                // add or remove tag
                if (!getTagByName(tag)) {
                    if (scope.ui.checkedTags.length < 3){
                        scope.ui.checkedTags.push(tag);
                    } else {
                        $cordovaToast.show('最多只能添加3个标签哦', 'short', 'center')
                    }
                } else {
                    removeTagByName(tag);
                }
            }

            scope.compareValues = function(tag){
                return getTagByName(tag);
            };

            var getTagByName = function(tag){
                var found = null;
                angular.forEach(scope.ui.checkedTags, function (t) {
                    if  (t === tag) {
                        found = tag ;
                    }
                });
                return found;
            }

            var removeTagByName = function(tag){
                angular.forEach(scope.ui.checkedTags, function (t, index) {
                    if  (t == tag) {
                        scope.ui.checkedTags.splice(index, 1);
                    }
                });
            }

            scope.clearSearch = function(){
                scope.ui.searchQuery= '';
            };

            scope.closeModal = function(){
                scope.modal.hide();
            };

            scope.addNewTag = function(){
                var tag = scope.ui.searchQuery;
                scope.setOption(tag);
                scope.clearSearch();

            }

            //loading the modal
            $ionicModal.fromTemplateUrl('photogram/tagsModal.html', {
                scope: scope,
                animation: 'slide-in-right',
            }).then(function(modal){
                scope.modal = modal;
            });

            scope.$on('$destroy', function(){
                scope.modal.remove();
            });

            iElement.on('click', function(){
                scope.modal.show();
                FetchData.get('/api/post/tags/'+scope.tagType).then(function(data){
                    scope.options = data.tags_group;
                });

            });

            //#TODO ?: WRAP INTO $timeout?
            ngModelController.$render();

        }
    };
}])

})();
