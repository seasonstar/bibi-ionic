# bibi-ionic

Bibi 电商全栈解决方案，配合以下项目使用:

> [bibi server](https://github.com/seasonstar/bibi) 服务端项目

> [bibi-frontend](https://github.com/seasonstar/bibi) 微信前端项目

[app下载地址](http://android.myapp.com/myapp/detail.htm?apkName=cn.maybi.ionicapp)

---------------------
### Screenshot
![](http://7xn6eu.com1.z0.glb.clouddn.com/ionicapp01.jpg)
![](http://7xn6eu.com1.z0.glb.clouddn.com/ionicapp02.jpg)
![](http://7xn6eu.com1.z0.glb.clouddn.com/ionicapp03.jpg)

## 快速开始

### 1. 首先安装ionic
    $ sudo npm install -g cordova ionic

### 2. 项目Clone到本地
    $ git clone https://github.com/seasonstar/bibi-ionic.git

### 3. 添加 android 或 ios 平台
注： 真机调试，浏览器可以跳过此步骤；
 ios 开发只能在 mac 下进行。

    $ cd ioniclub
    $ ionic platform add ios
    $ ionic platform add android

### 4. 添加所有用到的插件

```bash
npm install
bower install

ionic plugin add com.ionic.keyboard
ionic plugin add cordova-plugin-console
ionic plugin add cordova-plugin-whitelist
ionic plugin add cordova-plugin-device
ionic plugin add cordova-plugin-statusbar
ionic plugin add cordova-plugin-splashscreen
ionic plugin add cordova-plugin-camera
ionic plugin add cordova-plugin-dialogs
ionic plugin add https://git.oschina.net/seasonstar/ImagePicker.git
ionic plugin add cordova-plugin-geolocation
ionic plugin add cordova-plugin-file
ionic plugin add cordova-plugin-file-transfer
ionic plugin add cordova-plugin-x-toast
ionic plugin add cordova-plugin-x-socialsharing
ionic plugin add ionic-plugin-deploy

cordova plugin add https://github.com/RaananW/PhoneGap-Image-Resizer
cordova plugin add https://github.com/Telerik-Verified-Plugins/NativePageTransitions#0.6.2
cordova plugin add cordova-plugin-wkwebview
cordova plugin add com-sarriaroman-photoviewer
cordova plugin add https://github.com/dsolimando/ImageViewer
cordova plugin add http://git.oschina.net/seasonstar/PayPal-Cordova-Plugin
cordova plugin add cordova-plugin-wechat --variable wechatappid=########
cordova plugin add https://github.com/iVanPan/cordova_weibo.git --variable WEIBO_APP_ID=#######
cordova plugin add https://github.com/iVanPan/Cordova_QQ.git --variable QQ_APP_ID=#####
cordova plugin add  https://github.com/jpush/jpush-phonegap-plugin.git --variable API_KEY=######
cordova -d plugin add path/to/add/phonegap-facebook-plugin --variable APP_ID="####" --variable APP_NAME="####"

# Note： 以上所有的--variable请改为自己申请的ID
```

### 5. 运行
#### 浏览器
    $  ionic serve
#### ios
    $  ionic build ios
    $  ionic run ios
#### android
    $  ionic build android
    $  ionic run android


### 6. NOTE
Please follow the instruction
to install some package tools

https://www.airpair.com/ionic-framework/posts/production-ready-apps-with-ionic-framework

或重新npm install

有问题欢迎提issue
