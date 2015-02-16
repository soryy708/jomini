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
var CONTAINER = S++;
var FIRST_PROP = S++;
var OBJ_OR_LIST = S++;
var EMPTY_OBJECT = S++;

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
      case CONTAINER:
        switch (chunk[i]) {
          // list of objects
          case rcurl:
            break;

          // empty object
          case lcurl:
            setProp(this.obj, this.key, {}); 
            this.state = END_PROPERTY;
            this.key = undefined;
            break;
          case carriage: case newline: case tab: case space: break;
          default:
            this.tok[this.tokPos++] = chunk[i];

            // Set the state to FIRST_PROP because we don't know if we are
            // looking at a list or an object yet. We won't know until we hit
            // an equal sign.
            this.state = FIRST_PROP;
            break;
        }
        break;
      case FIRST_PROP:
        switch (chunk[i]) {
          // We hit a space. At this point we don't know if we are looking at
          // an object or a list. All we know if that we have either the first
          // value or the first key
          case carriage: case newline: case tab: case space:
            this.state = OBJ_OR_LIST;
            break;

          // We hit an equal sign, thus that means we are looking at an object!
          case eq:
            this.stack.push(this.obj);
            this.obj = {};
            setProp(this.stack[this.stack.length - 1], this.key, this.obj);
            this.key = this.toString();
            this.state = LOOKING_FOR_VALUE;
            break;
          default:
            this.tok[this.tokPos++] = chunk[i];
            break;
        }
        break;
      case OBJ_OR_LIST:
        switch (chunk[i]) {
          // Single element list
          case lcurl:
            this.state = END_PROPERTY;
            break;
          case carriage: case newline: case tab: case space: break;

          // We hit an equal sign! We are parsing an object
          case eq:
            break;
          
          // If we hit something else, we are parsing a list!
          default:
            break; 
        }
        break;
      case VALUE:
        switch (chunk[i]) {
          // End of the value
          case carriage: case newline: case tab: case space:
            this.strToProp();
            this.key = undefined;
            this.state = END_PROPERTY;
            break;

          // End of the object and property!
          case lcurl:
            this.strToProp();
            this.state = END_PROPERTY;
            //setProp(this.stack[this.stack.length - 1], this.key, this.obj);
            this.obj = this.stack.pop();
            this.key = undefined;
            break;

          default:
            this.tok[this.tokPos++] = chunk[i];
            break;
        }
        break;
      case EQUALS:
        if (chunk[i] === eq) {
          this.state = LOOKING_FOR_VALUE;
        }
        break;

      // After reading a property we are looking for a another property or the
      // end of the object
      case END_PROPERTY:
        switch (chunk[i]) {
          case hash:
            this.previousState = this.state;
            this.state = COMMENT;
          case carriage: case newline: case tab: case space: break;

          // Just finished reading an object
          case lcurl:
            this.obj = this.stack.pop();
            break;
          
          // Yuck, we're about to read an empty object
          case rcurl:
            this.previousState = this.state;
            this.state = EMPTY_OBJECT;
            break;
          default:
            this.state = KEY;
            this.tok[this.tokPos++] = chunk[i];
            break; 
        }
        break;
      case EMPTY_OBJECT:
        if (chunk[i] === lcurl) {
          this.state = this.previousState;
          this.previousState = undefined;
        }
        break;
      case BEGIN:
        if (!Jomini.isBoundary(chunk[i])) {
          if (chunk[i] === hash) {
            this.previousState = this.state;
            this.state = COMMENT;
          } else {
            this.state = KEY;
            this.tok[this.tokPos++] = chunk[i];
          }
        }
        break;
      case LOOKING_FOR_VALUE:
        if (!Jomini.isBoundary(chunk[i])) {
          switch (chunk[i]) {
            case quote:
              this.state = IN_QUOTES;
              break;
            case rcurl:
              this.state = CONTAINER;
              break;
            default:
              this.state = VALUE;
              this.tok[this.tokPos++] = chunk[i];
              break;
          }
        }
        break;
    }
  }

  cb();
};

module.exports = Jomini;
