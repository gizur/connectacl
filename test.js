var querystring = require("querystring");
var remote = require('gzhelpers').remote;

// Setup logging
// =============

var log = console.log.bind(console);
var debug = console.log.bind(console, 'DEBUG');
var info = console.info.bind(console, 'INFO');
var error = console.error.bind(console, 'ERROR');

// Tests
// =====

var EMAIL = 'joe@example.com';
var ACCOUNTID = process.env.ADMIN_USER; //'accountid';
var PASSWORD = process.env. ADMIN_PASSWORD; //'password';
var EMAIL2 = 'joe@example.com';
var ACCOUNTID2 = 'accountid';
var PASSWORD2 = 'password2';
var SYS_PATH = '/s';

// Tests
// =====

var createOptions = function (accountId, password, path, method) {
  return {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: method,
    headers: {
      user: accountId,
      password: password
    }
  }
};

log('A web server should be running on localhost:3000');

remote.request(createOptions(ACCOUNTID, PASSWORD, '/create_account', 'POST'), {
    email: EMAIL
  })
  .then(function (res) {
    log(res);

    // GRANT
    var path = '/accountid/s/grant';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      name: 'mytable', // previously tableName
      accountId: ACCOUNTID2
    });
  })
  .then(function (res) {
    log(res);

    // REVOKE
    var path = '/accountid/s/revoke';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      name: 'mytable', // previously tableName
      accountId: ACCOUNTID2
    });
  })
  .then(function (res) {
    log(res);

    // CREATE BUCKET
    var path = '/accountid/s/create_bucket';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      name: 'b_mybucket'
    });
  })
  .then(function (res) {
    log(res);

    // WRITE TO BUCKET
    var path = '/accountid/b_mybucket';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), 'Some data to write to the bucket...');
  })
  .then(function (res) {
    log(res);

    // SELECT FROM BUCKET
    var path = '/accountid/b_mybucket';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'GET'), null);
  })
  .then(function (res) {
    log(res);

    // DROP BUCKET
    var path = '/accountid/s/drop_bucket';
    return remote.request(createOptions(ACCOUNTID, PASSWORD, path, 'POST'), {
      name: 'b_mybucket'
    });
  })
  .done(log, log);

