var assert = require('assert');
var _ = require('lodash');
var Engine = require('../pbac');

var policies = [{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "doAction"
    ],
    "Resource": [
      "*"
    ],
    "Condition": {
      "LaxEquals": {
        "grano:customField": [null, "", "custom_${grano:otherField}"]
      }
    }
  }]
}];

var engine = new Engine(policies, {
  conditions: {
    LaxEquals: function LaxEquals(a, b) {
      return a === b;
    }
  },
});

describe('grano changes - pbac evaluate', function () {
  it('should work with falsy values in conditions', function () {
    assert.ok(!engine.evaluate({
      action: 'doAction',
      variables: {},
    }));
    assert.ok(engine.evaluate({
      action: 'doAction',
      variables: { grano: {
        customField: null,
      }},
    }));
    assert.ok(engine.evaluate({
      action: 'doAction',
      variables: { grano: {
        customField: "",
      }},
    }));
  });

  it('should support value interpolation in conditions', function () {
    var options = {
      action: 'doAction',
      variables: { grano: {
        customField: "custom_otherFieldValue",
        otherField: "otherFieldValue",
      }},
    }
    assert.ok(engine.evaluate(options));
  });
});
