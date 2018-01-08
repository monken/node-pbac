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
  NumericLessThan: function NumericLessThan(a, b) {
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
  ArnLike: function ArnLike(a, b) {
    if (!_.isString(b)) return false;
    return new RegExp('^' +
        b.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&")
        .replace(/\*/g, '[^:]*') // TODO: check if last part of ARN can contain ':'
        .replace(/\?/g, '.') + '$')
        .test(a);
  },
  ArnNotLike: function StringNotLike(a, b) {
    if (!_.isString(b)) return false;
    return !this.conditions.ArnLike.apply(this, arguments);
  },
  /*
  ArnEquals
  ArnNotEquals
  */
  Null: function(a, b) {
    if (!_.isBoolean(b)) return false;
    return b ? _.isUndefined(a) : !_.isUndefined(a);
  },
  IpAddress: function IpAddress(a, b) {
    return ipcheck.match(a, b);
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
    if (!_.isString(b)) return false;
    return new RegExp('^' +
        b.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&")
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') + '$')
      .test(a);
  },
  StringNotLike: function StringNotLike(a, b) {
    if (!_.isString(b)) return false;
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
  conditions['ForAllValues:' + condition] = function(a, b) {
    if (!_.isArray(a)) a = [a];
    return _.every(a, function(value) {
      return _.find(b, function(key) {
        return fn.apply(this, [value, key]);
      }.bind(this));
    }.bind(this));
  };
  conditions['ForAnyValue:' + condition] = function(a, b) {
    if (!_.isArray(a)) a = [a];
    return _.find(a, function(value) {
      return _.find(b, function(key) {
        return fn.apply(this, [value, key]);
      }.bind(this));
    }.bind(this));
  };

});

module.exports = conditions;
