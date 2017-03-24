import { APIRequest } from "./request";
import { DeferredPromise } from "./promise";
import { Settings } from "./settings";
import { IonicPlatform } from "./core";
import { Storage } from "./storage";
import { Logger } from "./logger";
import { PushToken } from "../push/push-token";
import { DataType } from "./data-types.js";

var Core = IonicPlatform;
var AppUserContext = null;
var settings = new Settings();
var storage = new Storage();

var userAPIBase = settings.getURL('api') + '/api/v1/app/' + settings.get('app_id') + '/users';
var userAPIEndpoints = {
  'load': function(userModel) {
    return userAPIBase + '/' + userModel.id;
  },
  'remove': function(userModel) {
    return userAPIBase + '/' + userModel.id;
  },
  'save': function(userModel) {
    return userAPIBase + '/' + userModel.id;
  },
  'identify': function() {
    return userAPIBase + '/identify';
  },
  'addToken': function() {
    return userAPIBase + '/pushUnique';
  }
};

class UserContext {
  static get label() {
    return "ionic_io_user_" + settings.get('app_id');
  }

  static delete() {
    storage.deleteObject(UserContext.label);
  }

  static store() {
    storage.storeObject(UserContext.label, User.current());
  }

  static getRawData() {
    return storage.retrieveObject(UserContext.label) || false;
  }

  static load() {
    var data = storage.retrieveObject(UserContext.label) || false;
    if (data) {
      return User.fromContext(data);
    }
    return false;
  }
}

class PushData {

  /**
   * Push Data Object
   *
   * Holds push data to use in conjunction with Ionic User models.
   * @constructor
   * @param {object} tokens Formatted token data
   */
  constructor(tokens) {
    this.logger = new Logger({
      'prefix': 'Ionic Push Token:'
    });
    this.tokens = {
      'android': [],
      'ios': []
    };
    if (tokens && (typeof tokens === 'object')) {
      this.tokens = tokens;
    }
  }

  /**
   * Add a new token to the current list of tokens
   * Duplicates are not added, but still return as succesfully added.
   *
   * @param {ionic.io.push.Token} token Push Token
   * @return {boolean} False on error, otherwise true
   */
  addToken(token) {
    var platform = null;

    if ((typeof token === 'undefined') || !token || token === '') {
      this.logger.info('you need to pass a valid token to addToken()');
      return false;
    }

    if (token.token) {
      token = token.token;
    }

    // check if this is a dev token
    if (token.slice(0,3) === 'DEV') {
      this.logger.info('dev tokens cannot be saved to a user as they are a temporary resource');
      return false;
    }

    if (Core.isAndroidDevice()) {
      platform = 'android';
    } else if (Core.isIOSDevice()) {
      platform = 'ios';
    }

    if (platform === null || !this.tokens.hasOwnProperty(platform)) {
      this.logger.info('cannot determine the token platform. Are you running on an Android or iOS device?');
      return false;
    }

    var platformTokens = this.tokens[platform];
    var hasToken = false;
    var testToken = null;

    for (testToken in platformTokens) {
      if (platformTokens[testToken] === token) {
        hasToken = true;
      }
    }
    if (!hasToken) {
      platformTokens.push(token);
    }

    return true;
  }

  /**
   * Remove the specified token if it exists in any platform token listing
   * If it does not exist, nothing is removed, but we will still return success
   *
   * @param {ionic.io.push.Token} token Push Token
   * @return {boolean} true
   */
  removeToken(token) {
    var x;
    for (x in this.tokens) {
      var platform = this.tokens[x];
      var testToken;
      for (testToken in platform) {
        if (platform[testToken] === token.token) {
          platform.splice(testToken, 1);
        }
      }
    }
    return true;
  }
}

class UserData {
  constructor(data) {
    this.data = {};
    if ((typeof data === 'object')) {
      this.data = data;
      this.deserializerDataTypes();
    }
  }

  deserializerDataTypes() {
    for (var x in this.data) {
      // if we have an object, let's check for custom data types
      if (typeof this.data[x] === 'object') {
        // do we have a custom type?
        if (this.data[x].__Ionic_DataTypeSchema) {
          var name = this.data[x].__Ionic_DataTypeSchema;
          var mapping = DataType.getMapping();
          if (mapping[name]) {
            // we have a custom type and a registered class, give the custom data type
            // from storage
            this.data[x] = mapping[name].fromStorage(this.data[x].value);
          }
        }
      }
    }
  }

  set(key, value) {
    this.data[key] = value;
  }

  unset(key) {
    delete this.data[key];
  }

  get(key, defaultValue) {
    if (this.data.hasOwnProperty(key)) {
      return this.data[key];
    } else {
      return defaultValue || null;
    }
  }
}

export class User {
  constructor() {
    this.logger = new Logger({
      'prefix': 'Ionic User:'
    });
    this._blockLoad = false;
    this._blockSave = false;
    this._blockDelete = false;
    this._dirty = false;
    this._fresh = true;
    this._unset = {};
    this.push = new PushData();
    this.data = new UserData();
  }

  isDirty() {
    return this._dirty;
  }

  static current(user) {
    if (user) {
      AppUserContext = user;
      UserContext.store();
      return AppUserContext;
    } else {
      if (!AppUserContext) {
        AppUserContext = UserContext.load();
      }
      if (!AppUserContext) {
        AppUserContext = new User();
      }
      return AppUserContext;
    }
  }

  static fromContext(data) {
    var user = new User();
    user.id = data._id;
    user.data = new UserData(data.data.data);
    user.push = new PushData(data.push.tokens);
    user._fresh = data._fresh;
    user._dirty = data._dirty;
    return user;
  }

  static load(id) {
    var deferred = new DeferredPromise();

    var tempUser = new User();
    tempUser.id = id;

    if (!tempUser._blockLoad) {
      tempUser._blockLoad = true;
      new APIRequest({
        'uri': userAPIEndpoints.load(tempUser),
        'method': 'GET',
        'json': true,
        'headers': {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(function(result) {
        tempUser._blockLoad = false;
        tempUser.logger.info('loaded user');

        // set the custom data
        tempUser.data = new UserData(result.payload.custom_data);

        // set the push tokens
        if (result.payload._push && result.payload._push.android_tokens) {
          tempUser.push.tokens.android = result.payload._push.android_tokens;
        }
        if (result.payload._push && result.payload._push.ios_tokens) {
          tempUser.push.tokens.ios = result.payload._push.ios_tokens;
        }

        tempUser.image = result.payload.image;
        tempUser._fresh = false;

        deferred.resolve(tempUser);
      }, function(error) {
        tempUser._blockLoad = false;
        tempUser.logger.error(error);
        deferred.reject(error);
      });
    } else {
      tempUser.logger.info("a load operation is already in progress for " + this + ".");
      deferred.reject(false);
    }

    return deferred.promise;
  }

  isFresh() {
    return this._fresh;
  }

  isValid() {
    if (this.id) {
      return true;
    }
    return false;
  }

  getAPIFormat() {
    var self = this;
    var data = this.data.data;
    data.user_id = this.id; // eslint-disable-line camelcase
    data._push = {
      'android_tokens': this.push.tokens.android,
      'ios_tokens': this.push.tokens.ios
    };

    if (!this.isFresh()) {
      return { 'update': data, 'remove': self._unset };
    }
    return data;
  }

  getFormat(format) {
    var self = this;
    var formatted = null;
    switch (format) {
      case 'api':
        formatted = self.getAPIFormat();
        break;
    }
    return formatted;
  }

  static anonymousId() {
    // this is not guaranteed to be unique
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); //eslint-disable-line
      return v.toString(16);
    });
  }

  delete() {
    var self = this;
    var deferred = new DeferredPromise();

    if (!self.isValid()) {
      return false;
    }

    if (!self._blockDelete) {
      self._blockDelete = true;
      self._delete();
      new APIRequest({
        'uri': userAPIEndpoints.remove(this),
        'method': 'DELETE',
        'headers': {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(function(result) {
        self._blockDelete = false;
        self.logger.info('deleted ' + self);
        deferred.resolve(result);
      }, function(error) {
        self._blockDelete = false;
        self.logger.error(error);
        deferred.reject(error);
      });
    } else {
      self.logger.info("a delete operation is already in progress for " + this + ".");
      deferred.reject(false);
    }

    return deferred.promise;
  }

  _store() {
    if (this === User.current()) {
      UserContext.store();
    }
  }

  _delete() {
    if (this === User.current()) {
      UserContext.delete();
    }
  }

  save() {
    var self = this;
    var deferred = new DeferredPromise();

    if (!self._blockSave) {
      self._blockSave = true;
      self._store();
      var saveURL = userAPIEndpoints.save(this);
      var saveMethod = 'PUT';
      if (self.isFresh()) {
        saveURL = userAPIEndpoints.identify(this);
        saveMethod = 'POST';
      }
      new APIRequest({
        'uri': saveURL,
        'method': saveMethod,
        'headers': {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        'body': JSON.stringify(self.getFormat('api'))
      }).then(function(result) {
        self._dirty = false;
        if (!self.isFresh()) {
          self._unset = {};
        }
        self._fresh = false;
        self._blockSave = false;
        self.logger.info('saved user');
        deferred.resolve(result);
      }, function(error) {
        self._dirty = true;
        self._blockSave = false;
        self.logger.error(error);
        deferred.reject(error);
      });
    } else {
      self.logger.info("a save operation is already in progress for " + this + ".");
      deferred.reject(false);
    }

    return deferred.promise;
  }

  set id(v) {
    if (v && (typeof v === 'string') && v !== '') {
      this._id = v;
      return true;
    } else {
      return false;
    }
  }

  get id() {
    return this._id || null;
  }

  toString() {
    return '<IonicUser [\'' + this.id + '\']>';
  }

  addPushToken(token) {
    return this.push.addToken(token);
  }

  removePushToken(token) {
    if (!(token instanceof PushToken)) {
      token = new PushToken(token);
    }
    return this.push.removeToken(token);
  }

  set(key, value) {
    delete this._unset[key];
    return this.data.set(key, value);
  }

  get(key, defaultValue) {
    return this.data.get(key, defaultValue);
  }

  unset(key) {
    this._unset[key] = true;
    return this.data.unset(key);
  }
}
