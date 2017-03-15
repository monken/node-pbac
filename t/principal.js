var assert = require('assert'),
  PBAC = require('../pbac');

var tests = [{
  name: 'explicit deny overwrites allow',
  policies: [{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::111122223333:role/roleA",
          "arn:aws:iam::111122223333:role/roleB",
          "arn:aws:iam::111122223333:root",
          "arn:aws:iam::111122223333:user/userWithRoleA",
          "arn:aws:iam::111122223333:user/userWithRoleB"
        ]
      },
      "Action": [
        "iam:CreateUser"
      ],
      "Resource": [
        "*"
      ]
    }, {
      "Effect": "Allow",
      "Action": [
        "iam:CreateUser"
      ],
      "Resource": [
        "*"
      ]
    }]
  }],
  tests: [{
    params: {
      action: 'iam:CreateUser',
      resource: 'abcfoo',
      principal: {
        "AWS": []
      }
    },
    result: false,
  }, {
    params: {
      action: 'iam:UpdateUser',
      resource: 'abcfoo',
    },
    result: true,
  }, {
    params: {
      action: 'iam:UpdateUser',
      resource: 'foo',
    },
    result: false,
  }]
}, {
  name: 'implicit deny with NotAction',
  policies: [{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "NotAction": [
        "iam:CreateUser"
      ],
      "NotResource": [
        "abc*"
      ]
    }]
  }],
  tests: [{
    params: {
      action: 'iam:CreateUser',
    },
    result: false,
  }, {
    params: {
      action: 'iam:UpdateUser',
    },
    result: true,
  }, {
    params: {
      resource: 'abcfoo',
      action: 'iam:UpdateUser',
    },
    result: false,
  }]
}];

describe('principal', function() {
  tests.forEach(function(test, idx) {
    var pbac = new PBAC(test.policies);
    it(test.name, function() {
      test.tests.forEach(function(params) {
        assert.equal(!!pbac.evaluate(params.params), params.result);
      });
    });
  });
});
