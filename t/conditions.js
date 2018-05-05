var assert = require('assert'),
  _ = require('lodash');

var conditions = require('../conditions');

var tests = {
  ArnLike: [
    ['arn:aws:s3:::mybucket','arn:aws:s3:*:*:mybucket*', true],
    ['arn:aws:s3:123412341234:eu-west-1:mybucket-test','arn:aws:s3:*:*:mybucket*', true],
    ['arn:aws:s3::::mybucket-test','arn:aws:s3:*:*:mybucket*', false],
  ],
  StringLike: [
    ['foo', 'foo', true],
    ['fooo', 'foo', false],
    ['foo', 'baz', false],
    ['foo', 'fo?o', false],
    ['foo', 'fo?', true],
    ['foo', 'fo*', true],
    ['fooxyqkhwebar', 'fo*bar', true],
    ['', '*', true],
    [undefined, '*', true],
    ['/myapp/users/test', '/myapp/users/*', true],
  ],
  StringLikeIfExists: [
    ['foo', 'foo', true],
    ['fooo', 'foo', false],
    [undefined, 'foo', true],
  ],
  StringNotLike: [
    ['foo', 'foo', false],
    ['foo', 'baz', true],
    ['foo', 'fo*', false],
    [undefined, '*', false],
  ],
  Bool: [
    [true, false, false],
    [false, false, true],
    [false, true, false],
    [false, false, true],
    ['true', 'false', false],
    ['false', 'false', true],
    ['false', 'true', false],
    ['false', 'false', true],
    [1, true, false],
    [1, false, false],
    ['1', 'true', false],
    ['1', 'false', false],
    ['true', true, true],
    ['true', 'true', true],
  ],
  IpAddress: [
    ['127.0.0.1', '127.0.0.1', true],
    ['127.0.0.1', '127.0.0.1/32', true],
    ['127.0.0.0', '127.0.0.122/24', true],
    ['127.0.0.2', '127.0.0.1', false],
    ['127.0.0.2', '127.0.0.1/32', false],
    ['127.0.1.122', '127.0.0.0/24', false],
    ['127.0.1.122', null, false],
    ['test', 'test', false],
  ],
  Null: [
    ['defined', true, false],
    [null, true, false],
    [undefined, true, true],
    [undefined, false, false],
  ],
  NumericLessThan: [
    [2, 3, true],
    [2, Infinity, true],
    [3, 2, false],
    ['foo', 3, false],
    [2, 2, false],
  ],
  NumericGreaterThanEquals: [
    [2, 3, false],
    [2, Infinity, false],
    [3, 2, true],
    ['foo', 3, false],
    [2, 2, true],
  ],
  DateEquals: [
    ['foo', 'foo', false],
    ['foo', 'bar', false],
    ['2015-07-07T14:00:00.123Z', 'foo', false],
    ['2015-07-07T14:00:00.123Z', '2015-07-07T14:00:00.123Z', true],
    ['2015-07-07T14:00:00.123+0000', '2015-07-07T14:00:00.123Z', true],
    ['2015-07-07T15:00:00.123Z', '2015-07-07T14:00:00.123Z', false],
  ],
  DateGreaterThan: [
    ['2015-07-07T14:00:00.123Z', 'foo', false],
    ['2015-07-07T14:00:00.123Z', '2015-07-07T14:00:00.123Z', false],
    ['2015-07-07T15:00:00.123Z', '2015-07-07T14:00:00.123Z', true],
    ['2015-07-07T14 :00:00.123Z', '2015-07-07T15:00:00.123Z', false],
  ],
  DateGreaterThanEquals: [
    ['2015-07-07T14:00:00.123Z', 'foo', false],
    ['2015-07-07T14:00:00.123Z', '2015-07-07T14:00:00.123Z', true],
    ['2015-07-07T15:00:00.123Z', '2015-07-07T14:00:00.123Z', true],
    ['2015-07-07T14 :00:00.123Z', '2015-07-07T15:00:00.123Z', false],
  ],
  BinaryEquals: [
    [new Buffer('SGVsbG8gV29ybGQ=', 'base64'), 'SGVsbG8gV29ybGQ=', true],
    ['SGVsbG8gV29ybGQ=', 'SGVsbG8gV29ybGQ=', false],
  ],
  BinaryNotEquals: [
    [new Buffer('SGVsbG8gV29ybGQ=', 'base64'), 'SGVsbG8gV29ybGQ=', false],
    [new Buffer('SGVsbG8gV29ybGQ=', 'base64'), 'SGVsbG8gV29ybGq=', true],
    ['SGVsbG8gV29ybGQ=', 'SGVsbG8gV29ybGQ=', false],
  ]
};

describe('conditions', function() {
  _.forEach(tests, function(list, fn) {
    it(fn, function() {
      list.forEach(function(args) {
        assert.equal(conditions[fn].call({
          conditions: conditions
        }, args[0], args[1]), args[2], args.join(' '));
      });
    });
  });
});
