var Engine = require('../pbac');

var policies = require('./policies/mfadevice.json');

var engine = new Engine(policies);

var start = new Date().getTime();

var today = new Date();

var count = 10000;

for (var i = 0; i < count; i++) {
  engine.evaluate({
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
  })
}

var stop = new Date().getTime();

console.log(`took ${stop-start} ms, or ${(stop-start)/count} per evaluation`)
