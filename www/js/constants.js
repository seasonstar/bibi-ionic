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
    "PAYPAL_LIVE_CLIENT_ID": "Ae4fip_tqokJ21KO6wf3_fIbhkP1v_xrro3UA_tGO-3aPRrdchEQil9sQOWx9DCm2q-IgCfndMbQuCUA",
    "PAYPAL_SANDBOX_CLIENT_ID": "AUTrm3bKk0UnrnmNkzIlWpdKk4dNIPone_Jqw-vMPJvxpSvaxkc8pqooZ4-P30I49YVq9ZudvyF5avEn",
    "ENV": "PayPalEnvironmentProduction",// PayPalEnvironmentProduction, PayPalEnvironmentSandbox
    "ShopName": "Maybi Shop",
    "MerchantPrivacyPolicyURL": "",
    "MerchantUserAgreementURL": "",

})
