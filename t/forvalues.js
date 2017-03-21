var assert = require('assert'),
  PBAC = require('../pbac');


/*
http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_multi-value-conditions.html

If the key values in the request resolve to an empty data set (for example, an
empty string), a condition operator modified by ForAllValues returns true, and
a condition operator modified by ForAnyValue returns false.
*/

var tests = [{
  name: 'Allow GetItem',
  policies: [{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["GetItem"],
      "Resource": ["arn:aws:dynamodb:REGION:ACCOUNT-ID-WITHOUT-HYPHENS:table/Thread"],
      "Condition": {
        "ForAllValues:StringLike": {
          "dynamodb:requestedAttributes": [
            "PostDateTime",
            "Message",
            "Tags"
          ]
        }
      }
    }]
  }, {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["PutItem"],
      "Resource": ["arn:aws:dynamodb:REGION:ACCOUNT-ID-WITHOUT-HYPHENS:table/*"]
    }]
  }, {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Deny",
      "Action": ["PutItem"],
      "Resource": ["arn:aws:dynamodb:REGION:ACCOUNT-ID-WITHOUT-HYPHENS:table/Thread"],
      "Condition": {
        "ForAnyValue:StringLike": {
          "dynamodb:requestedAttributes": [
            "ID",
            "PostDateTime"
          ]
        }
      }
    }]
  }],
  tests: [{
    params: {
      action: 'GetItem',
      resource: 'arn:aws:dynamodb:REGION:ACCOUNT-ID-WITHOUT-HYPHENS:table/Thread',
      variables: {
        dynamodb: {
          requestedAttributes: ['PostDateTime', 'Message']
        }
      }
    },
    result: true,
  }, {
    params: {
      action: 'GetItem',
      resource: 'arn:aws:dynamodb:REGION:ACCOUNT-ID-WITHOUT-HYPHENS:table/Thread',
      variables: {
        dynamodb: {
          requestedAttributes: ['PostDateTime', 'Message', 'ID']
        }
      }
    },
    result: false,
  }, {
    params: {
      action: 'PutItem',
      resource: 'arn:aws:dynamodb:REGION:ACCOUNT-ID-WITHOUT-HYPHENS:table/Message',
      variables: {
        dynamodb: {
          requestedAttributes: ['PostDateTime', 'Message']
        }
      }
    },
    result: true,
  }, {
    params: {
      action: 'PutItem',
      resource: 'arn:aws:dynamodb:REGION:ACCOUNT-ID-WITHOUT-HYPHENS:table/Thread',
      variables: {
        dynamodb: {
          requestedAttributes: ['PostDateTime', 'Message']
        }
      }
    },
    result: false,
  }],
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
