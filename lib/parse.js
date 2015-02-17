var Jomini = require('./jomini');

function parse(str, cb) {
  var parser = new Jomini();
  parser.end(str, 'ascii', function() {
    cb(parser.obj);
  });
}

module.exports = parse;
