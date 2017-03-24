/**
 * Created by Gavin on 15-9-17.
 */
//var  md= angular.module('ionic', []),
  var  noop = angular.noop,
    jqLite = angular.element,
    extend = angular.extend;
angular.module('ion.ionBottomSheet', []).directive('ionBottomSheet', ['$document', function($document,$sce) {
        return {
            restrict: 'E',
            scope: true,
            replace: true,
            link: function($scope, $element) {
                var keyUp = function(e) {
                    if (e.which == 27) {
                        $scope.cancel();
                        $scope.$apply();
                    }
                };
                var backdropClick = function(e) {
                    if (e.target == $element[0]) {
                        $scope.cancel();
                        $scope.$apply();
                    }
                };
                $scope.$on('$destroy', function() {
                    $element.remove();
                    $document.unbind('keyup', keyUp);
                });
                $document.bind('keyup', keyUp);
                // $element.bind('click', backdropClick);
            },
            template: '<div class="keypad-sheet-backdrop">' +
                '<div class="keypad-sheet-overlay" ng-click="cancel()"></div>' +
                '<div class="keypad-sheet-wrapper">' +
                '<div class="keypad-sheet"">' +
                '<div class="keypad-sheet-group keypad-sheet-options">' +
                '<div class="action-sheet-title" ng-if="titleText" ng-bind-html="titleText"></div>' +
                '<div ng-if="titleHtml">' +
                '<div class="row keypad-show-num">' +
                '<div class="col"><div class="num-show" ng-bind-html="firstNum"></div></div>'+
                '<div class="col"><div class="num-show" ng-bind-html="secondNum"></div></div>'+
                '<div class="col"><div class="num-show" ng-bind-html="thirdNum"></div></div>'+
                '<div class="col"><div class="num-show" ng-bind-html="fourthNum"></div></div>'+
                '</div>' +
                '</div>' +
                '<div class="row container-side-menu" data-ng-repeat="subButtons in buttons">' +
                '<div class="col" data-ng-repeat="button in subButtons">' +
                '<button class="button button-icon " ng-click="buttonClicked(button)"><i class="{{button.btClass}}"></i>{{button.btText}}</button>'+
                '</div>' +
                '</div>'+
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>'
        };
    }]);
var PLATFORM_BACK_BUTTON_PRIORITY_ACTION_SHEET = 300;
/**
 * buttons[
 * [{btText:"buttonText",btClass:"buttonClass",btId:"buttonId",hideOnClick:false},{...}],
 * [{btText:"buttonText",btClass:"buttonClass",btId:"buttonId"},{...}]
 * ...
 * ]
 */
angular.module('ion-BottomSheet', ['ion.ionBottomSheet']).factory('$bottomSheet', [
        '$rootScope',
        '$compile',
        '$animate',
        '$timeout',
        '$ionicTemplateLoader',
        '$ionicPlatform',
        '$ionicBody',
        function($rootScope, $compile, $animate, $timeout, $ionicTemplateLoader, $ionicPlatform, $ionicBody) {
            return {
                show: ikeyPad
            };
            function ikeyPad(opts) {
                var scope = $rootScope.$new(true);
                extend(scope, {
                    cancel: noop,
                    destructiveButtonClicked: noop,
                    buttonClicked: noop,
                    $deregisterBackButton: noop,
                    buttons: [],
                    cancelOnStateChange: true,
                    htmlText:false,
                    titleHtml:false
                }, opts || {});
                // Compile the template
                var element = scope.element = $compile('<ion-bottom-sheet  ng-class="cssClass" buttons="buttons"></ion-bottom-sheet>')(scope);

                // Grab the sheet element for animation
                var sheetEl = jqLite(element[0].querySelector('.keypad-sheet-wrapper'));

                var stateChangeListenDone = scope.cancelOnStateChange ?
                    $rootScope.$on('$stateChangeSuccess', function() { scope.cancel(); }) :
                    noop;

                // removes the actionSheet from the screen
                scope.removeSheet = function(done) {
                    if (scope.removed) return;

                    scope.removed = true;
                    sheetEl.removeClass('keypad-sheet-up');
                    $timeout(function() {
                        // wait to remove this due to a 300ms delay native
                        // click which would trigging whatever was underneath this
                        $ionicBody.removeClass('keypad-sheet-open');
                    }, 400);
                    scope.$deregisterBackButton();
                    stateChangeListenDone();

                    $animate.removeClass(element, 'active').then(function() {
                        scope.$destroy();
                        element.remove();
                        // scope.cancel.$scope is defined near the bottom
                        scope.cancel.$scope = sheetEl = null;
                        (done || noop)();
                    });
                };

                scope.showSheet = function(done) {
                    if (scope.removed) return;

                    $ionicBody.append(element)
                        .addClass('keypad-sheet-open');

                    $animate.addClass(element, 'active').then(function() {
                        if (scope.removed) return;
                        (done || noop)();
                    });
                    $timeout(function() {
                        if (scope.removed) return;
                        sheetEl.addClass('keypad-sheet-up');
                    }, 20, false);
                };

                // registerBackButtonAction returns a callback to deregister the action
                scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(
                    function() {
                        $timeout(scope.cancel);
                    },
                    PLATFORM_BACK_BUTTON_PRIORITY_ACTION_SHEET
                );

                // called when the user presses the cancel button
                scope.cancel = function() {
                    // after the animation is out, call the cancel callback
                    scope.removeSheet(opts.cancel);
                };

                scope.buttonClicked = function(button) {
                    // Check if the button click event returned true, which means
                    // we can close the action sheet
                    console.log('button==',button);
                    opts.buttonClicked&&opts.buttonClicked(button,scope);
                    button.hideOnClick&&scope.removeSheet();
                };

                scope.destructiveButtonClicked = function() {
                    // Check if the destructive button click event returned true, which means
                    // we can close the action sheet
                    if (opts.destructiveButtonClicked() === true) {
                        scope.removeSheet();
                    }
                };
                scope.showSheet();
                // Expose the scope on $ionicActionSheet's return value for the sake
                // of testing it.
                scope.cancel.$scope = scope;
                return scope.cancel;
            }
        }]);
