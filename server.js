// imports
// =======

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

var mws = express();

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

var acl = new ConnectAcl('perms', {
  host: 'localhost'
}, handleError);

// next is *not* called here, no further processing is required
mws.use('/:accountid/s/grant', acl.getGrantFunc());

// next is *not* called here, no further processing is required
mws.use('/:accountid/s/revoke', acl.getRevokeFunc());

// check permissions
mws.use('/:accountid/:object', acl.getIsAllowedFunc());

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
