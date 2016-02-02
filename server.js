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

var options = {
  host: 'localhost',
  user: process.env.ADMIN_USER,
  password: process.env.ADMIN_PASSWORD,
  // database : process.env.ADMIN_USER,
};

var handleError = function (req, res, next, err) {
  res.writeHead(406, {
    "Content-Type": "application/json"
  });
  res.write(err);
  res.end();

  error(err);
};

var acl = new ConnectAcl('perms', options, handleError);

mws.use('/:accountid/s/grant', function (req, res, next) {
  var buffer = '';
  req.on('data', function (chunk) {
    chunk = chunk.toString();
    buffer += chunk;
  });
  req.on('end', function () {
    try {
      var json = parseJSON(buffer);
      res.write(JSON.stringify(buffer));
      res.end();

      debug(json);
      acl.grant(json.name, verb, role, req);

    } catch (err) {
      var result = {
        error: 'ERROR parsing input, likely malformed/missing JSON: ' + err
      };
      res.write(JSON.stringify(result));
      res.end();
    }
  });

  log('Matched /help - got request: ', req.url);
});

mws.use(acl.getFunc());

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
