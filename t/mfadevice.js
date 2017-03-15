var assert = require('assert'),
  Engine = require('../pbac');

var policies = require('./policies/mfadevice.json');

var engine = new Engine(policies);

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
          FailedLoginAttempts: 1,
        }
      }
    }));
  });


  it('undefined resource', function() {
    assert.ok(engine.evaluate({
      action: 'iam:ListUsers',
      resource: undefined,
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
          FailedLoginAttempts: 1,
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
          FailedLoginAttempts: 10,
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
