angular.module('ion.headerShrink', [])

.directive('headerShrink', ['$document', '$ionicScrollDelegate', '$timeout', function($document, $ionicScrollDelegate, $timeout) {
  var fadeAmt;

  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
      var scrollHandle = $attr.headerShrink;
      var scrollContent = $element.find('ion-content');

      var tab  = $document[0].body.querySelector('.tab-nav');
      var y = 0;
      var prevY = 0;
      var scrollDelay = 0.4;
      var defaultDelay = 0.4 * 2000;
      var fadeAmt;
      var headerHeight = 0;
      var headers = [];

      headers = $element.find('ion-header-bar');

      headerHeight = headers[0].offsetHeight;

      // performance low...
      function translateY (element, y) {
        if (!element.style[ionic.CSS.TRANSITION_DURATION]) {
          element.style[ionic.CSS.TRANSITION_DURATION] = scrollDelay+'s';
          $timeout(function () {
            element.style[ionic.CSS.TRANSITION_DURATION] = '';
          }, defaultDelay, false);
        }
        element.style[ionic.CSS.TRANSFORM] = 'translate3d(0, ' + -y + 'px, 0)';
      }

      scrollContent.on("scroll", function(e) {

        var scrollTop = $ionicScrollDelegate.$getByHandle(scrollHandle).getScrollPosition().top;

        // start after some offset
        if(scrollTop >= 25) {
          y = Math.min(headerHeight / scrollDelay, Math.max(0, y + scrollTop - prevY));
        } else {
          y = 0;
        }

        ionic.requestAnimationFrame(function() {
          fadeAmt = 1 - (y / headerHeight);
          for(var k = 0, l = headers.length; k < l; k++) {
            //translateY(headers[k], y);
            //
            headers[k].style[ionic.CSS.TRANSFORM] = 'translate3d(0, ' + -y + 'px, 0)';
            headers[k].style.opacity = fadeAmt;
          }
          scrollContent[0].style.top = Math.max(20, headerHeight - y) + 'px';

          /*
          tab.style[ionic.CSS.TRANSFORM] = 'translate3d(0, ' + y + 'px, 0)';
          tab.style[ionic.CSS.TRANSITION_DURATION] = scrollDelay + 's';
          tab.style.opacity = fadeAmt;
          scrollContent[0].style.bottom = Math.max(0, headerHeight - y) + 'px';
          */


        });

        prevY = scrollTop;
      });
    }
  }
}])
