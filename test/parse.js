var parse = require('../').parse;
var expect = require('chai').expect;

function check(str, obj, cb) {
  parse(str, function(actual) {
    expect(actual).to.deep.equal(obj);
    cb();
  });
}

describe('parse', function() {
  it('should handle the simple parse case', function(done) {
    check('foo=bar', {foo: 'bar'}, done);
  });

  // it('should handle the simple header case', function(done) {
  //   check('EU4txt\nfoo=bar', {foo: 'bar'}, done);
  // });

  it('should handle empty quoted strings', function(done) {
    check('foo=""', {foo: ''}, done);
  });

  it('should handle whitespace', function(done) {
    check('\tfoo = bar ', {'foo':'bar'}, done);
  });

  it('should handle the simple quoted case', function(done) {
    check('foo="bar"', {'foo':'bar'}, done);
  });

  it('should handle string list accumulation', function(done) {
    check('foo=bar\nfoo=qux', {'foo':['bar', 'qux']}, done);
  });

  it('should handle string list accumulation long', function(done) {
    check('foo=bar\nfoo=qux\nfoo=baz', {'foo':['bar', 'qux', 'baz']}, done);
  });

  it('should handle quoted string list accumulation', function(done) {
    check('foo="bar"\nfoo="qux"', {'foo':['bar', 'qux']}, done);
  });

  it('should handle boolen', function(done) {
    check('foo=yes', {'foo': true}, done);
  });

  // it('should handle boolen list', function(done) {
  //   check('foo={yes no}', {'foo': [true, false]}, done);
  // });

  it('should handle whole numbers', function(done) {
    check('foo=1', {'foo': 1}, done);
  });

  it('should handle zero', function(done) {
    check('foo=0', {'foo': 0}, done);
  });

  it('should handle negative whole numbers', function(done) {
    check('foo=-1', {'foo': -1}, done);
  });

  it('should handle decimal number', function(done) {
    check('foo=1.23', {'foo': 1.23}, done);
  });

  it('should handle negative decimal number', function(done) {
    check('foo=-1.23', {'foo': -1.23}, done);
  });

  it('should handle number list accumulation', function(done) {
    check('foo=1\nfoo=-1.23', {'foo':[1, -1.23]}, done);
  });

  it('should handle dates', function(done) {
    check('date=1821.1.1', {'date': new Date(Date.UTC(1821, 0, 1))}, done);
  });

  it('should deceptive dates', function(done) {
    check('date=1821.a.1', {date: '1821.a.1'}, done);
  });

  it('should handle quoted dates', function(done) {
    check('date="1821.1.1"', {'date': new Date(Date.UTC(1821, 0, 1))}, done);
  });

  it('should handle accumulated dates', function(done) {
    check('date="1821.1.1"\ndate=1821.2.1',
      {'date':[
        new Date(Date.UTC(1821, 0, 1)), new Date(Date.UTC(1821, 1, 1))
      ]}, done);
  });

  it('should handle numbers as identifiers', function(done) {
    check('158=10', {'158': 10}, done);
  });

  it('should handle periods in identifiers', function(done) {
    check('flavor_tur.8=yes', {'flavor_tur.8': true}, done);
  });

  // it('should handle empty objects for dates', function(done) {
  //   check('1920.1.1={}', {'1920.1.1': {}}, done);
  // });

  // it('should handle consecutive strings', function(done) {
  //   check('foo = { bar baz }', {'foo': ['bar', 'baz']}, done);
  // });

  // it('should handle consecutive strings no space', function(done) {
  //   check('foo={bar baz}', {'foo': ['bar', 'baz']}, done);
  // });

  // it('should handle consecutive quoted strings', function(done) {
  //   check('foo = { "bar" "baz" }', {'foo': ['bar', 'baz']}, done);
  // });

  // it('should handle empty object', function(done) {
  //   check('foo = {}', {'foo': {}}, done);
  // });

  // it('should handle space empty object', function(done) {
  //   check('foo = { }', {'foo': {}}, done);
  // });

  // it('should handle the object after empty object', function(done) {
  //   var obj = {
  //     foo: {},
  //     catholic: {
  //       defender: 'me'
  //     }
  //   };

  //   check('foo={} catholic={defender="me"}', obj, done);
  // });

  // it('should handle the object after empty object nested', function(done) {
  //   var obj = {
  //     religion: {
  //       foo: {},
  //       catholic: {
  //         defender: 'me'
  //       }
  //     }
  //   };

  //   check('religion={foo={} catholic={defender="me"}}', obj, done);
  // });

  // it('should ignore empty objects with no identifier at end', function(done) {
  //   check('foo={bar=val {}}  { } me=you', {foo: {bar: 'val'}, me: 'you'}, done);
  // });

  // it('should understand a list of objects', function(done) {
  //   var str = 'attachments={ { id=258579 type=4713 } ' +
  //     ' { id=258722 type=4713 } }';
  //   var obj = {
  //     attachments: [{
  //       id: 258579,
  //       type: 4713
  //     }, {
  //       id: 258722,
  //       type: 4713
  //     }]
  //   };

  //   check(str, obj, done);
  // });

  // it('should parse minimal spacing for objects', function(done) {
  //   var str = 'nation={ship={name="ship1"} ship={name="ship2"}}';
  //   var obj = {
  //     nation: {
  //       ship: [{name: 'ship1'}, {name: 'ship2'}]
  //     }
  //   };

  //   check(str, obj, done);
  // });

  // it('should understand a simple EU4 header', function(done) {
  //   var str = 'date=1640.7.1\r\nplayer="FRA"\r\nsavegame_version=' +
  //     '\r\n{\r\n\tfirst=1\r\n\tsecond=9\r\n\tthird=2\r\n\tforth=0\r\n}';
  //   var obj = {
  //     date: new Date(Date.UTC(1640, 6, 1)),
  //     player: 'FRA',
  //     savegame_version: {
  //       first: 1,
  //       second: 9,
  //       third: 2,
  //       forth: 0
  //     }
  //   };
  //   check(str, obj, done);
  // });

  // it('should understand EU4 gameplay settings', function(done) {
  //   var str = 'gameplaysettings=\r\n{\r\n\tsetgameplayoptions=' +
  //     '\r\n\t{\r\n\t\t1 1 2 0 1 0 0 0 1 1 1 1 \r\n\t}\r\n}';
  //   var obj = {
  //     gameplaysettings: {
  //       setgameplayoptions: [1, 1, 2, 0, 1, 0, 0, 0, 1, 1, 1, 1]
  //     }
  //   };
  //   check(str, obj, done);
  // });

  // it('should parse multiple objects accumulated', function(done) {
  //   var str = 'army=\r\n{\r\n\tname="1st army"\r\n\tunit={\r\n\t\t' +
  //     'name="1st unit"\r\n\t}\r\n}\r\narmy=\r\n{\r\n\tname="2nd army"' +
  //     '\r\n\tunit={\r\n\t\tname="1st unit"\r\n\t}\r\n\tunit={\r\n\t\t' +
  //     'name="2nd unit"\r\n\t}\r\n}';

  //   var obj = {
  //     army: [{
  //       name: '1st army',
  //       unit: {
  //           name: '1st unit'
  //       }
  //     }, {
  //       name: '2nd army',
  //       unit: [{
  //           name: '1st unit'
  //       }, {
  //           name: '2nd unit'
  //       }]
  //     }]
  //   };

  //   check(str, obj, done);
  // });

  // it('should handle back to backs', function(done) {
  //   var str1 = 'POR={type=0 max_demand=2.049 t_in=49.697 t_from=\r\n' +
  //     '{ C00=5.421 C18=44.276 } }';
  //   var str2 = 'SPA= { type=0 val=3.037 max_pow=1.447 max_demand=2.099 ' +
  //     'province_power=1.447 t_in=44.642 t_from= { C01=1.794 C17=42.848 } }';

  //   var expected = {
  //     POR: {
  //       type: 0,
  //       max_demand: 2.049,
  //       t_in: 49.697,
  //       t_from: {'C00': 5.421, 'C18': 44.276}
  //     },
  //     SPA: {
  //       type: 0,
  //       val: 3.037,
  //       max_pow: 1.447,
  //       max_demand: 2.099,
  //       province_power: 1.447,
  //       t_in: 44.642,
  //       t_from: {'C01': 1.794, 'C17': 42.848}
  //     }
  //   };

  //   check(str1 + str2, expected, done);
  // });

  // it('should handle dates as identifiers', function(done) {
  //   check('1480.1.1=yes', {'1480.1.1': true}, done);
  // });

  // it('should handle consecutive numbers', function(done) {
  //   check('foo = { 1 -1.23 }', {'foo': [1, -1.23]}, done);
  // });

  // it('should handle consecutive dates', function(done) {
  //   check('foo = { 1821.1.1 1821.2.1 }', {'foo':
  //     [new Date(Date.UTC(1821, 0, 1)), new Date(Date.UTC(1821, 1, 1))]}, done);
  // });

  // it('should understand comments mean skip line', function(done) {
  //   check('# boo\r\n# baa\r\nfoo=a\r\n# bee', {'foo': 'a'}, done);
  // });

  // it('should understand simple objects', function(done) {
  //   check('foo={bar=val}', {'foo': {'bar': 'val'}}, done);
  // });

  // it('should understand nested list objects', function(done) {
  //   check('foo={bar={val}}', {'foo': {'bar': ['val']}}, done);
  // });

  // it('should understand objects with start spaces', function(done) {
  //   check('foo= { bar=val}', {'foo': {'bar': 'val'}}, done);
  // });

  // it('should understand objects with end spaces', function(done) {
  //   check('foo={bar=val }', {'foo': {'bar': 'val'}}, done);
  // });

  // it('should ignore empty objects with no identifier', function(done) {
  //   check('foo={bar=val} {} { } me=you', {foo: {bar: 'val'}, me: 'you'}, done);
  // });
});
