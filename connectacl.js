//
// URL: VERB /account/bucket || VERB /account/s/bucket with headers: user & password
//      let the url be the object (/account/bucket) 
//
// These functions are inherited from mysqlacl:
// grant(object, verb, role), isAllowed(...), revoke(...)
//
// grant and revoke should only be allowed when account === user. user/password is 
// automatically validated when performing the MySQL request
//
// perform check that grant and revoke is allowed in a separate function
// grantRevokeOk(url, headers)
//
//

// imports
// ========

var Acl = require('mysqlacl');

// Setup logging
// =============

var log = console.log.bind(console);
var debug = console.log.bind(console, 'DEBUG');
var info = console.info.bind(console, 'INFO');
var error = console.error.bind(console, 'ERROR');

// Class definition
// ================

var A = function (table, options, handleError) {
  if (!table || !options || !handleError)
    throw new Error('table, options and handleError and mandatory!');

  this.table = table;
  this.options = options;
  this.handleError = handleError;
};


A.prototype.createOptions_ = function (req) {
  return {
    host: this.options.host,
    user: req.headers.user,
    password: req.headers.password,
    database: this.options.database
  };
}

A.prototype.getFunc = function () {
  var self = this;

  return function (req, res, next) {

    if (!req.headers.user || !req.headers.password) {
      self.handleError(req, res, next, 'Missing header user and/or password!');
    }

    var acl = new Acl(self.table, self.createOptions_(req));

    acl.isAllowed(req.url, req.method, req.headers.user).then(function (res) {
        if (!res) self.handleError(req, res, next, 'Operation now allowed');
        next();
      })
      .catch(function (err) {
        self.handleError(req, res, next, 'Internal error: ' + err);
      });

  }
};

// object should be something like: /account/bucket etc.
A.prototype.grant = function (object, verb, role, req) {
  var acl = new Acl(this.table, this.createOptions_(req));
  return acl.grant(objecy, verb, role);
};

// object should be something like: /account/bucket etc.
A.prototype.revoke = function (object, verb, role, req) {
  var acl = new Acl(this.table, this.createOptions_(req));
  return acl.revoke(objecy, verb, role);
};


// exports
// =======

module.exports = A;
