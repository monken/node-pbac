var assert = require('assert'),
  PBAC = require('../pbac');

var tests = [{
  name: 'explicit deny overwrites allow',
  policies: [{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Deny",
      "Action": [
        "iam:CreateUser"
      ],
      "Resource": [
        "*"
      ]
    }, {
      "Effect": "Allow",
      "Action": [
        "iam:*User"
      ],
      "Resource": [
        "abc*"
      ]
    }]
  }],
  tests: [{
    params: {
      action: 'iam:CreateUser',
      resource: 'abcfoo',
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


describe(__filename, function() {
  tests.forEach(function(test, idx) {
    var pbac = new PBAC(test.policies);
    test.tests.forEach(function(params) {
      it(test.name, function() {
        assert.equal(!!pbac.evaluate(params.params), params.result);
      });
    });
  });
});
