var assert = require('assert'),
  PBAC = require('../pbac');

var tests = [{
  name: 'Principal',
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
    }]
  }],
  tests: [{
    params: {
      action: 'iam:CreateUser',
      resource: 'abcfoo',
      principal: {
        AWS: []
      }
    },
    result: false,
  }, {
    params: {
      action: 'iam:CreateUser',
      resource: 'abcfoo',
      principal: {
        Service: ['s3.amazonaws.com']
      }
    },
    result: false,
  }, {
    params: {
      action: 'iam:CreateUser',
      resource: 'abcfoo',
      principal: {
        AWS: ["arn:aws:iam::111122223333:root", "arn:aws:iam::111122223333:role/roleB"]
      }
    },
    result: true,
  }, {
    params: {
      action: 'iam:CreateUser',
      resource: 'abcfoo',
      principal: {
        AWS: ["arn:aws:iam::111122223333:root", "arn:aws:iam::111122223333:role/roleB", "arn:aws:iam::111122223333:role/roleC"]
      }
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
  name: 'NotPrincipal',
  policies: [{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "iam:CreateUser"
      ],
      "Resource": [
        "*"
      ]
    }, {
      "Effect": "Deny",
      "Action": [
        "iam:CreateUser"
      ],
      "NotPrincipal": {
        "AWS": [
          "arn:aws:iam::444455556666:user/Bob",
          "arn:aws:iam::444455556666:root"
        ]
      },
      "Resource": [
        "*"
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
      action: 'iam:CreateUser',
      principal: {
        AWS: ['arn:aws:iam::444455556666:root']
      }
    },
    result: false,
  }, {
    params: {
      action: 'iam:CreateUser',
      principal: {
        AWS: ['arn:aws:iam::444455556666:user/Bob', 'arn:aws:iam::444455556666:root']
      }
    },
    result: true,
  }, {
    params: {
      action: 'iam:CreateUser',
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
