"use strict";

angular.module('maybi.filters', [])

.filter('reverse', function() {
    return function(items) {
        if (!angular.isArray(items)) return false;
        return items.slice().reverse();
    };
})

.filter('nl2br', function($sce){
    return function(msg,is_xhtml) {
        var is_xhtml = is_xhtml || true;
        var breakTag = (is_xhtml) ? '<br />' : '<br>';
        var msg = (msg + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
        return $sce.trustAsHtml(msg);
    }
})
