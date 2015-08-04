var _ = require('lodash'),
  ipcheck = require('ipcheck'),
  bufferEquals = require('./lib/bufferequals');

var conditions = {
  NumericEquals: function NumericEquals(a, b) {
    if (!_.isNumber(a) || !_.isNumber(b)) return false;
    return a === b;
  },
  NumericNotEquals: function NumericNotEquals(a, b) {
    if (!_.isNumber(a) || !_.isNumber(b)) return false;
    return !this.conditions.NumericEquals.apply(this, arguments);
  },
  NumericLessThan: function NumericEquals(a, b) {
    if (!_.isNumber(a) || !_.isNumber(b)) return false;
    return a < b;
  },
  NumericGreaterThanEquals: function NumericGreaterThanEquals(a, b) {
    if (!_.isNumber(a) || !_.isNumber(b)) return false;
    return !this.conditions.NumericLessThan.apply(this, arguments);
  },
  NumericGreaterThan: function NumericGreaterThan(a, b) {
    if (!_.isNumber(a) || !_.isNumber(b)) return false;
    return a > b;
  },
  NumericLessThanEquals: function NumericLessThanEquals(a, b) {
    if (!_.isNumber(a) || !_.isNumber(b)) return false;
    return !this.conditions.NumericGreaterThan.apply(this, arguments);
  },
  DateEquals: function DateEquals(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return a >= b && a <= b;
  },
  DateNotEquals: function DateNotEquals(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return !this.conditions.DateEquals.apply(this, arguments);
  },
  DateLessThan: function DateLessThan(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return a < b;
  },
  DateGreaterThanEquals: function DateGreaterThanEquals(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return !this.conditions.DateLessThan.apply(this, arguments);
  },
  DateGreaterThan: function DateGreaterThan(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return a > b;
  },
  DateLessThanEquals: function DateLessThanEquals(a, b) {
    a = new Date(a), b = new Date(b);
    if (a == 'Invalid Date' || b == 'Invalid Date') return false;
    return !this.conditions.DateGreaterThan.apply(this, arguments);
  },
  BinaryEquals: function BinaryEquals(a, b) {
    if(!_.isString(b) || !(a instanceof Buffer)) return false;
    return bufferEquals(a, new Buffer(b, 'base64'));
  },
  BinaryNotEquals: function BinaryEquals(a, b) {
    if(!_.isString(b) || !(a instanceof Buffer)) return false;
    return !bufferEquals(a, new Buffer(b, 'base64'));
  },
  /*
  ArnEquals
  ArnNotEquals
  ArnLike
  ArnNotLike
  */
  Null: function(a, b) {
    if (!_.isBoolean(b)) return false;
    return b ? _.isUndefined(a) : !_.isUndefined(a);
  },
  IpAddress: function IpAddress(a, b) {
    return ipcheck.match(b, a);
  },
  NotIpAddress: function NotIpAddress() {
    return !this.conditions.IpAddress.apply(this, arguments);
  },
  StringEquals: function StringEquals(a, b) {
    if (!_.isString(a) || !_.isString(b)) return false;
    return a === b;
  },
  StringNotEquals: function StringNotEquals(a, b) {
    if (!_.isString(a) || !_.isString(b)) return false;
    return a !== b;
  },
  StringEqualsIgnoreCase: function StringEqualsIgnoreCase(a, b) {
    if (!_.isString(a) || !_.isString(b)) return false;
    return a.toLowerCase() === b.toLowerCase();
  },
  StringNotEqualsIgnoreCase: function StringNotEqualsIgnoreCase(a, b) {
    if (!_.isString(a) || !_.isString(b)) return false;
    return a.toLowerCase() !== b.toLowerCase();
  },
  StringLike: function StringLike(a, b) {
    if (!_.isString(a) || !_.isString(b)) return false;
    return new RegExp('^' +
        a.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&")
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') + '$')
      .test(b);
  },
  StringNotLike: function StringNotLike(a, b) {
    if (!_.isString(a) || !_.isString(b)) return false;
    return !this.conditions.StringLike.apply(this, arguments);
  },
  Bool: function Bool(a, b) {
    if (!_.isBoolean(a) || !_.isBoolean(b)) return false;
    return a === b;
  },
};

_.forEach(conditions, function(fn, condition) {
  conditions[condition + 'IfExists'] = function(a, b) {
    if (_.isUndefined(a)) return true;
    else return fn.apply(this, arguments);
  };
});

module.exports = conditions;
