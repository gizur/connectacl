// imports
// =======

var ConnectLight = require('connectlight');
var ConnectAcl = require('./connectacl.js');
var express = require('express');


// Setup logging
// =============

var log = console.log.bind(console);
var info = console.log.bind(console, 'INFO');
var error = console.log.bind(console, 'ERROR');
var debug = console.log.bind(console, 'DEBUG');

// Main
// ====

var mws = express(); // the main app
//var mws = new ConnectLight();

// Just testing that the server is running
mws.use('/help', function (req, res, next) {
  res.write('/help matched!!');
  res.end();
  log('Matched /help - got request: ', req.url);
});

// Setup acl
// ---------

var handleError = function (req, res, next, err) {
  res.writeHead(406, {
    "Content-Type": "application/json"
  });
  res.write(err);
  res.end();

  error(err);
};

var checkHeadersAndParams = function (headers, params) {
  return (headers.user && headers.password && params.accountid && params.accountid === headers.user);
}

// next is *not* called here, no further processing is required
mws.use('/:accountid/s/grant', function (req, res, next) {

  if (!checkHeadersAndParams(req.headers, req.params)) {
    handleError(req, res, next, 'Incorrect request headers or accountid! Make sure that the account' +
      ' id of the object equals the credentials used! ' +
      JSON.stringify(req.headers) + ":" +
      JSON.stringify(req.params));
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

      var acl = new ConnectAcl('perms', {
        host: 'localhost',
        user: data.accountId,
        password: data.password
      }, handleError);

      var writeRes = function (result) {
        debug(result)
        res.write(JSON.stringify(result));
        res.end();
      };

      acl.grant(data.name, data.verbs, req.params.accountid, req)
        .then(writeRes, writeRes);

    } catch (err) {
      var result = {
        error: 'ERROR parsing input, likely malformed/missing JSON: ' + err
      };
      res.write(JSON.stringify(result));
      res.end();
    }
  });

});

mws.use('/', function (req, res, next) {
  res.write('Unmatched request:' + req.url);
  res.end();
});

// Start the server
// ----------------

mws.listen(3000);

process.on('SIGINT', function () {
  log("Caught interrupt signal");
  mws.close();
  setTimeout(process.exit, 1000);
});

process.on('exit', function (code) {
  log('About to exit with code:', code);
});

log('server running on port 3000');
