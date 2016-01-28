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

var Acl = require('mysqlacl.js');

// Class definition
// ================

var A = function (table, options, handleError) {
  this.table = table;
  this.options = options;
  this.handleError = handleError;
};


A.prototype.createOptions_(req) {
  return {
    host: this.options.host,
    user: req.headers.user,
    password: req.headers.password,
    database: this.options.database
  };
}

A.prototype.checkRequest = function (req, res, next) {

  if (!req.headers.user || !req.headers.password) {
    this.handleError(req, res);
    next();
  }

  var acl = new Acl(this.table, this.createOptions_(req));

  acl.isAllowed(req.url, req.method, req.headers.user).then(function (res) {
    if (!res) this.handleError(req, res);
    next();
  });

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
