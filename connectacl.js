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

A.prototype.getIsAllowedFunc = function () {
  var self = this;

  return function (req, res, next) {
    if (!req.headers.user || !req.headers.password) {
      self.handleError(req, res, next, 'Missing header user and/or password!');
    }

    var acl = new Acl(self.table, self.createOptions_(req));
    acl.init();

    acl.isAllowed(req.url, req.method, req.headers.user).then(function (result) {
        if (!result) {
          self.handleError(req, res, next, 'Operation not allowed');
          return;
        }
        next();
      })
      .catch(function (err) {
        self.handleError(req, res, next, 'Internal error: ' + err);
      });
  }
};

/////////

var checkHeadersAndParams = function (headers, params) {
  return (headers.user && headers.password && params.accountid && params.accountid === headers.user);
}

var handleRequest = function (req, res) {
  return new Promise(function (fullfil, reject) {

    if (!checkHeadersAndParams(req.headers, req.params)) {
      handleError(req, res, next, 'Incorrect request headers or accountid! Make sure that the account' +
        ' id of the object equals the credentials used! ' +
        JSON.stringify(req.headers) + ":" +
        JSON.stringify(req.params));
      reject('checkHeadersAndParams failed');
      return;
    }
    var buffer = '';
    req.on('data', function (chunk) {
      chunk = chunk.toString();
      buffer += chunk;
    });

    req.on('end', function () {
      try {
        var data = JSON.parse(buffer);
        fullfil(data);
      } catch (err) {
        var result = {
          error: 'ERROR parsing input, likely malformed/missing JSON: ' + err
        };
        res.write(JSON.stringify(result));
        res.end();
        reject(err);
      }
    });
  });
};

var writeRes = function (res, result) {
  debug(result)
  res.write(JSON.stringify(result));
  res.end();
};

A.prototype.getGrantFunc = function () {
  var self = this;

  return function (req, res, next) {
    handleRequest(req, res)
      .then(function (data) {
        var acl = new Acl(self.table, self.createOptions_(req));
        return acl.grant(data.name, data.verbs, req.params.accountid, req)
      })
      .then(writeRes.bind(this, res), writeRes.bind(this, res));
  }
};

A.prototype.getRevokeFunc = function () {
  var self = this;

  return function (req, res, next) {
    handleRequest(req, res)
      .then(function (data) {
        var acl = new Acl(self.table, self.createOptions_(req));
        return acl.revoke(data.name, data.verbs, req.params.accountid, req)
      })
      .then(writeRes.bind(this, res), writeRes.bind(this, res));
  }
};


// exports
// =======

module.exports = A;
