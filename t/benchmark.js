var Engine = require('../pbac');

var policies = require('./policies/mfadevice.json');

var engine = new Engine(policies);

var start = new Date().getTime();

var today = new Date();

for (var i = 0; i < 100000; i++) {
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

console.log(`took ${stop-start} ms, or ${(stop-start)/1000000} per ms second`)
