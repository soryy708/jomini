var Jomini = require('./').Jomini;
var parser = new Jomini();
process.stdin.pipe(parser);
parser.on('finish', function() {
  process.stdout.write('' + parser.count, 'utf8');
});
