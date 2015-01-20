var util = require('util');
var Writable = require('stream').Writable
util.inherits(Para, Writable);


function Para(options) {
    if (!(this instanceof Para))
        return new Para(options);

    Writable.call(this, options);
    this.on('finish', function() {
        this.isEnding = true;
        this._parse(function() { });
    }.bind(this));

    this.obj = {};
    this.current = '';
    this.eoc = false;
}

var eq = '='.charCodeAt(0),
    rcurl = '{'.charCodeAt(0),
    lcurl = '}'.charCodeAt(0),
    hash = '#'.charCodeAt(0),
    comma = ','.charCodeAt(0),
    semicolon = ';'.charCodeAt(0),
    quote = '"'.charCodeAt(0),
    tab = '\t'.charCodeAt(0),
    space = ' '.charCodeAt(0),
    newline = '\n'.charCodeAt(0),
    carriage = '\r'.charCodeAt(0);

Para._untyped = function(c) {
    return !(c === eq || c === rcurl || c === lcurl || c === hash || c === comma || c === semicolon);
}

Para.prototype._trim = function() {
    while (this._read() && (!Para._untyped(this.current) || Para._isspace(this.current))) {
    }

    // We probably read too far so backup by one if the current character is
    // something we probably want to be looking at.
    if (Para._untyped(this.current)) {
        this.bufPos--;
    }
}

Para._isspace = function(c) {
    return c === space || c === tab || c === newline || c === carriage;
}

Para.prototype._read = function() {
    if (this.eoc === true) {
        return false;
    }

    if (this.bufPos < this.buf.length) {
        this.current = this.buf[this.bufPos++];
        return true;
    }
    
    this.eoc = true;
    return false;
}

Para._number = function(str) {
    var result = +str;
    if (isNaN(result)) {
        return undefined;
    }

    return result;
}

Para.prototype._sliceIdentifier = function() {
    if (this.eoc === true) {
        return undefined;
    }

    this._trim();

    var pos = this.bufPos;
    var quoted, endPos;
    if (quoted = (this.current === quote)) {
        this._read();
        while (this._read() && this.current !== quote) {
        }

        // We have read the quote, so we want to end the new string one before
        endPos = this.bufPos - 1;
        this._read();
        pos++;
    }
    else {
        while (this._read() && Para._untyped(this.current) && !Para._isspace(this.current)) {
        }

        if (this.eoc === false) {
            this.bufPos--;
        }

        var endPos = this.bufPos;
    }

    if (pos >= endPos || (this.eoc && !this.isEnding)) {
        return undefined;
    }

    var result = this.buf.toString('utf8', pos, endPos);
    return result;
}

Para.prototype._parse = function(cb) {
    while (this.eoc === false) {
        var identifier = this._sliceIdentifier();
        var value = this._sliceIdentifier();
        value = Para._number(value) || value;
        if (identifier === undefined || value === undefined) {
            this.bufPos = this.realBufPos;
            this.eoc = false;
            cb();
            return;
        }
        else {
            this.realBufPos = this.bufPos;
        }

        if (this.obj.hasOwnProperty(identifier)) {
            // Since the object has the key, we need to check if the value is an
            // array or is single valued. If the property is already an array, push
            // the new value to the end
            if (util.isArray(this.obj[identifier])) {
                this.obj[identifier].push(value);
            }

            // Else if the property is still single valued, then create a list with
            // the two elements
            else {
                this.obj[identifier] = [this.obj[identifier], value];
            }
        }
        else {
            // New property so we just shove it into the object
            this.obj[identifier] = value; 
        }
    }
    cb();
}

Para.prototype._write = function(chunk, enc, cb) {
    this.buf = chunk;
    this.bufPos = 0;
    this.realBufPos = 0;
    this._parse(cb);
}

module.exports = Para;
