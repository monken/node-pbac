var assert = require('assert'),
  Engine = require('../index');

var policies = [{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowUsersToCreateEnableResyncTheirOwnVirtualMFADevice",
    "Effect": "Allow",
    "Action": [
      "iam:CreateVirtualMFADevice",
      "iam:EnableMFADevice",
      "iam:ResyncMFADevice"
    ],
    "Resource": [
      "arn:aws:iam:::mfa/${aws:username}",
      "arn:aws:iam:::user/${aws:username}"
    ]
  }, {
    "Sid": "AllowUsersToDeactivateDeleteTheirOwnVirtualMFADevice",
    "Effect": "Allow",
    "Action": [
      "iam:DeactivateMFADevice",
      "iam:DeleteVirtualMFADevice"
    ],
    "Resource": [
      "arn:aws:iam:::mfa/${aws:username}",
      "arn:aws:iam:::user/${aws:username}"
    ],
    "Condition": {
      "Bool": {
        "aws:MultiFactorAuthPresent": true
      }
    }
  }]
}, {
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowUsersToListMFADevicesandUsersForConsole",
    "Effect": "Allow",
    "Action": [
      "iam:ListMFADevices",
      "iam:ListVirtualMFADevices",
      "iam:ListUsers"
    ],
    "Resource": "*"
  }]
}];

var engine = new Engine(policies);

//engine.validate(policies);
//engine.validate(policies[0]);
//engine.validate(policies[1]);

describe('policies', function() {
  it('evaluate', function() {
    assert.ok(engine.evaluate({
      action: 'iam:CreateVirtualMFADevice',
      resource: 'arn:aws:iam:::mfa/moritzonken',
      variables: {
        aws: {
          CurrentTime: new Date(),
          MultiFactorAuthPresent: false,
          username: 'moritzonken',
        }
      }
    }));
  });

  it('evaluate condition', function() {
    assert.ok(engine.evaluate({
      action: 'iam:DeactivateMFADevice',
      resource: 'arn:aws:iam:::mfa/moritzonken',
      variables: {
        aws: {
          CurrentTime: new Date(),
          MultiFactorAuthPresent: true,
          username: 'moritzonken',
        }
      }
    }));

    assert.ok(!engine.evaluate({
      action: 'iam:DeactivateMFADevice',
      resource: 'arn:aws:iam:::mfa/moritzonken',
      variables: {
        aws: {
          CurrentTime: new Date(),
          MultiFactorAuthPresent: false,
          username: 'moritzonken',
        }
      }
    }));
  });

  it('embedded regex in variable', function() {
    assert.ok(engine.evaluate({
      action: 'iam:CreateVirtualMFADevice',
      resource: 'arn:aws:iam:::mfa/moritzonken',
      variables: {
        aws: {
          CurrentTime: new Date(),
          MultiFactorAuthPresent: true,
          username: 'moritz*',
        }
      }
    }));
  });
});
