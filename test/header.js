var Header = require('../').Header;
var stream = require('stream');
var expect = require('chai').expect

describe('Header', function() {
  it('detect expected header', function(done) {
    var s = new stream.Readable();
    s.push('EU4txtblah');
    s.push(null);
    var head = new Header({header: 'EU4txt'});
    s.pipe(head);
    head.on('data', function(data) {
      expect(data.toString()).to.equal('blah');
      done();
    });
  });

  it('error on unexpected header', function(done) {
    var s = new stream.Readable();
    s.push('EU4binblah');
    s.push(null);
    var head = new Header({header: 'EU4txt'});
    s.pipe(head);
    head.on('error', function(err) {
      expect(err.message).to.equal('Expected EU4txt but received EU4bin');
      done();
    });
  });
});