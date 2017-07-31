'use strict';
const ipcheck = require('ipcheck');
const bufferEquals = require('./lib/bufferequals');

const isString = require('lodash/isString');
const isBoolean = require('lodash/isBoolean');
const isNumber = require('lodash/isNumber');
const isArray = require('lodash/isArray');
const isUndefined = require('lodash/isUndefined');
const isEmpty = require('lodash/isEmpty');
const forEach = require('lodash/forEach');
const every = require('lodash/every');


const conditions = {
  NumericEquals(a, b) {
    if (!isNumber(a) || !isNumber(b)) return false;
    return a === b;
  },
  NumericNotEquals(a, b) {
    if (!isNumber(a) || !isNumber(b)) return false;
    return !this.conditions.NumericEquals.apply(this, arguments);
  },
  NumericLessThan(a, b) {
    if (!isNumber(a) || !isNumber(b)) return false;
    return a < b;
  },
  NumericGreaterThanEquals(a, b) {
    if (!isNumber(a) || !isNumber(b)) return false;
    return !this.conditions.NumericLessThan.apply(this, arguments);
  },
  NumericGreaterThan(a, b) {
    if (!isNumber(a) || !isNumber(b)) return false;
    return a > b;
  },
  NumericLessThanEquals(a, b) {
    if (!isNumber(a) || !isNumber(b)) return false;
    return !this.conditions.NumericGreaterThan.apply(this, arguments);
  },
  DateEquals(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return a >= b && a <= b;
  },
  DateNotEquals(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return !this.conditions.DateEquals.apply(this, arguments);
  },
  DateLessThan(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return a < b;
  },
  DateGreaterThanEquals(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return !this.conditions.DateLessThan.apply(this, arguments);
  },
  DateGreaterThan(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return a > b;
  },
  DateLessThanEquals(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return !this.conditions.DateGreaterThan.apply(this, arguments);
  },
  BinaryEquals(a, b) {
    if(!isString(b) || !(a instanceof Buffer)) return false;
    return bufferEquals(a, new Buffer(b, 'base64'));
  },
  BinaryNotEquals(a, b) {
    if(!isString(b) || !(a instanceof Buffer)) return false;
    return !bufferEquals(a, new Buffer(b, 'base64'));
  },
  ArnLike: function ArnLike(a, b) {
    if (!isString(b)) return false;
    return new RegExp('^' +
        b.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&")
        .replace(/\*/g, '[^:]*') // TODO: check if last part of ARN can contain ':'
        .replace(/\?/g, '.') + '$')
        .test(a);
  },
  ArnNotLike: function StringNotLike(a, b) {
    if (!isString(b)) return false;
    return !this.conditions.ArnLike.apply(this, arguments);
  },
  ArnEquals: function ArnEquals(a, b) {
    return this.conditions.ArnLike(a, b);
  },
  ArnNotEquals: function ArnEquals(a, b) {
    return this.conditions.ArnNotLike(a, b);
  },
  Null(a, b) {
    if (!isBoolean(b)) return false;
    return b ? isUndefined(a) : !isUndefined(a);
  },
  IpAddress(a, b) {
    return ipcheck.match(a, b);
  },
  NotIpAddress() {
    return !this.conditions.IpAddress.apply(this, arguments);
  },
  StringEquals(a, b) {
    if (!isString(a) || !isString(b)) return false;
    return a === b;
  },
  StringNotEquals(a, b) {
    if (!isString(a) || !isString(b)) return false;
    return a !== b;
  },
  StringEqualsIgnoreCase(a, b) {
    if (!isString(a) || !isString(b)) return false;
    return a.toLowerCase() === b.toLowerCase();
  },
  StringNotEqualsIgnoreCase(a, b) {
    if (!isString(a) || !isString(b)) return false;
    return a.toLowerCase() !== b.toLowerCase();
  },
  StringLike(a, b) {
    if (!isString(b)) return false;
    return new RegExp('^' +
        b.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&")
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') + '$')
      .test(a);
  },
  StringNotLike(a, b) {
    if (!isString(b)) return false;
    return !this.conditions.StringLike.apply(this, arguments);
  },
  Bool(a, b) {
    if (!isBoolean(a) || !isBoolean(b)) return false;
    return a === b;
  },
};

forEach(conditions, function(fn, condition) {
  conditions[condition + 'IfExists'] = function(a, b) {
    if (isUndefined(a)) return true;
    else return fn.apply(this, arguments);
  };
  conditions['ForAllValues:' + condition] = function(a, b) {
    if (!isArray(a)) a = [a];
    return every(a, value => {
      return b.find(key => {
        return fn.call(this, value, key);
      });
    });
  };
  conditions['ForAnyValue:' + condition] = function(a, b) {
    if (!isArray(a)) a = [a];
    return a.find(value => {
      return b.find(key => {
        return fn.call(this, value, key);
      });
    });
  };

});

module.exports = conditions;
