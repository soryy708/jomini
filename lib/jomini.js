var Writable = require('stream').Writable;
var util = require('util');
var setProp = require('./setProp');
var toDate = require('./toDate');
var assert = require('assert');

util.inherits(Jomini, Writable);

var S = 0;
var BEGIN = S++;
var IN_QUOTES = S++;
var VALUE = S++;
var LOOKING_FOR_VALUE = S++;
var KEY = S++;
var EQUALS = S++;
var END_PROPERTY = S++;
var COMMENT = S++;

var eq = '='.charCodeAt(0);
var rcurl = '{'.charCodeAt(0);
var lcurl = '}'.charCodeAt(0);
var hash = '#'.charCodeAt(0);
var comma = ','.charCodeAt(0);
var semicolon = ';'.charCodeAt(0);
var quote = '"'.charCodeAt(0);
var tab = '\t'.charCodeAt(0);
var space = ' '.charCodeAt(0);
var newline = '\n'.charCodeAt(0);
var carriage = '\r'.charCodeAt(0);

function Jomini(options) {
  if (!(this instanceof Jomini))
    return new Jomini(options);

  Writable.call(this, options);
  this.state = BEGIN;
  this.obj = {};
  this.stack = [];
  this.tok = new Buffer(256);
  this.tokPos = 0;
  this.on('finish', function() {
    if (this.key) {
      this.strToProp();
    }
  }.bind(this));
}

Jomini.prototype.toString = function() {
  var result = this.tok.toString('ascii', 0, this.tokPos);
  this.tokPos = 0;
  return result;
}

Jomini.isBoundary = function(c) {
  return c === space || c === tab || c === newline || c === carriage ||
    c === eq;
}

Jomini.prototype.strToProp = function() {
  var str = this.toString();
  var date;
  var number;
  if (str === 'yes') {
    setProp(this.obj, this.key, true);
  } else if (str === 'no') {
    setProp(this.obj, this.key, false);
  } else if ((date = toDate(str)) !== undefined) {
    setProp(this.obj, this.key, date);
  } else if (!isNaN(number = +(str))) {
    setProp(this.obj, this.key, number);
  } else {
    setProp(this.obj, this.key, str);
  }  
}

Jomini.prototype._write = function(chunk, enc, cb) {
  for (var i = 0; i < chunk.length; i++) {
    switch (this.state) {

      // The parser is in the comment state and so we check to see if we are
      // looking at a carriage return. If we are, we pick up right where we
      // left off
      case COMMENT:
        if (chunk[i] === carriage) {
          this.state = this.previousState;
        }
        break;

      // The parser is in the IN_QUOTES stage, so we consume the stream until
      // we hit another quote and that is our string. Quotes can only be used
      // as values so
      case IN_QUOTES:
        if (chunk[i] === quote) {
          this.state = END_PROPERTY;
          this.strToProp();
          this.key = undefined;
        } else {
          this.tok[this.tokPos++] = chunk[i];
        }
        break;
      case KEY:
        if (!Jomini.isBoundary(chunk[i])) {
          this.tok[this.tokPos++] = chunk[i];
        } else {
          this.key = this.toString();
          this.state = LOOKING_FOR_VALUE;
        }
        break;
      case VALUE:
        if (Jomini.isBoundary(chunk[i])) {
          this.strToProp();
          this.key = undefined;
          this.state = END_PROPERTY;
        } else {
          this.tok[this.tokPos++] = chunk[i];
        }
        break;
      case EQUALS:
        if (chunk[i] === eq) {
          this.state = LOOKING_FOR_VALUE;
        }
        break;
      case END_PROPERTY:
      case BEGIN:
        if (!Jomini.isBoundary(chunk[i])) {
          this.state = KEY;
          this.tok[this.tokPos++] = chunk[i];
        }
        break;      
      case LOOKING_FOR_VALUE:
        if (!Jomini.isBoundary(chunk[i])) {
          if (chunk[i] === quote) {
            this.state = IN_QUOTES;
          } else {
            this.state = VALUE;
            this.tok[this.tokPos++] = chunk[i];
          }
        }
        break;
    }
  }

  cb();
};

module.exports = Jomini;
