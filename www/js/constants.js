"use strict";

angular.module('maybi.constants', [])

.constant("$ionicLoadingConfig", {
    "template": "请求中..."
})
.constant("Categories", {
    '':"全部",
    'food':"食品",
    'home':"家居",
    'clothes':"服饰",
    'accessories': "配饰",
    'electronics': "数码",
    'office and school supplies': "办公文具",
    'sports': "休闲健身",
})
.constant("ENV", {
    "DEBUG": false,
    //"FIREBASE_URL": "http://sizzling-inferno-6138.firebaseIO.com/",
    //"SERVER_URL": "http://127.0.0.1:8890",
    "SERVER_URL": "http://api.maybi.cn",
})
.constant("paypalSettings", {
    "PAYPAL_LIVE_CLIENT_ID": "",
    "PAYPAL_SANDBOX_CLIENT_ID": "",
    "ENV": "PayPalEnvironmentProduction",// PayPalEnvironmentProduction, PayPalEnvironmentSandbox
    "ShopName": "Maybi Shop",
    "MerchantPrivacyPolicyURL": "",
    "MerchantUserAgreementURL": "",

})
