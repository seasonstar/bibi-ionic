var static = require('node-static');

var r_match_vendor = /^\/(?:bower|dist)/;

var vendor = new static.Server('./');
var examples = new static.Server('./examples');

require('http').createServer(function (req, res) {
  req.addListener('end', function () {
    if (r_match_vendor.test(req.url)) {
      return vendor.serve(req, res);
    }

    examples.serve(req, res);
  }).resume();
}).listen(8181);

console.log('Running jr-crop example server. Visit http://localhost:8181');