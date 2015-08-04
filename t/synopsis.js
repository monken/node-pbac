var assert = require('assert'),
  Engine = require('../pbac');

var policies = [{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowUsersToCreateEnableResyncTheirOwnVirtualMFADevice",
    "Effect": "Allow",
    "Action": [
      "iam:CreateUser",
      "iam:UpdateUser",
      "iam:DeleteUser"
    ],
    "Resource": [
      "arn:aws:iam:::user/${req:UserName}"
    ],
    "Condition": {
      "IpAddress": {
        "req:IpAddress": "10.0.20.0/24"
      }
    }
  }]
}];

var engine = new Engine(policies, {
  variables: {
    req: {
      UserName: 'testuser',
      IpAddress: '10.0.20.51',
    }
  }
});

describe('synopsis', function() {
  it('good ip', function() {
    assert.ok(engine.evaluate({
      action: 'iam:CreateUser',
      resource: 'arn:aws:iam:::user/testuser',
      variables: {
        req: {
          IpAddress: '10.0.20.51',
          UserName: 'testuser',
        }
      }
    }));
  });

  it('bad ip', function() {
    assert.ok(!engine.evaluate({
      action: 'iam:CreateUser',
      resource: 'arn:aws:iam:::user/testuser',
      variables: {
        req: {
          IpAddress: '10.0.21.51',
          UserName: 'testuser',
        }
      }
    }));
  });
});
