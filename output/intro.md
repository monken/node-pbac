[![npm](http://img.shields.io/npm/v/pbac.svg?style=flat-square)](https://npmjs.org/package/pbac) [![npm](http://img.shields.io/npm/dm/pbac.svg?style=flat-square)](https://npmjs.org/package/pbac) [![Build Status](https://img.shields.io/travis/monken/node-pbac/master.svg?style=flat-square)](https://travis-ci.org/monken/node-pbac) ![license](https://img.shields.io/badge/license-mit-blue.svg?style=flat-square)

# Policy Based Access Control

**AWS IAM Policy inspired and (mostly) compatible evaluation engine**

Use the power and flexibility of the AWS IAM Policy syntax in your own application to manage access control. For more details on AWS IAM Policies have a look at https://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html.

**Note:** Conditions `ArnEquals`, `ArnNotEquals`, `ArnLike`, `ArnNotLike` are not supported at the moment.

## Installation

```
npm install pbac
```

<!-- START doctoc -->
<!-- END doctoc -->

## Synopsis

```javascript
var PBAC = require('pbac');

var policies = [{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "OptionalDescription",
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

var pbac = new PBAC(policies);

// returns true
pbac.evaluate({
  action: 'iam:CreateUser',
  resource: 'arn:aws:iam:::user/testuser',
  variables: {
    req: {
      IpAddress: '10.0.20.51',
      UserName: 'testuser',
    }
  }
});
```

## Constructor

```javascript
var pbac = new PBAC(policies, [options]);
```

Constructs a policy evaluator.

### Properties


* **`policies`** (Array|Object)
  Either an array of policies or a single policy document. Have a look at https://docs.aws.amazon.com/IAM/latest/UserGuide/AccessPolicyLanguage_ElementDescriptions.html for a description of the policy syntax.
* **`options`** (Object)
    * `schema` (Object) - JSON schema that describes the policies. Defaults to the contents of schema.json that ships with this module.
    * `validateSchema` (Boolean) - Validate the schema when the object is constructed. This can be disabled in production environment if it can be assumed that the schema is valid to improve performance when constructing new objects.
    * `validatePolicies` (Boolean) - Policies passed to the constructor will be validated against the `schema`. Defaults to `true`. Can be disabled to improve performance if the policies can be assumed to be valid.
    * `conditions` (Object) - Object of conditions that are supported in the `Conditions` attribute of policies. Defaults to `conditions.js` in this module. If conditions are passed to the constructor they will be merged with the conditions of the `conditions.js` module (with `conditions.js` taking precedence).


## Methods


### evaluate(params)

Tests an object against the policies and determines if the object passes.
The method will first try to find a policy with an explicit `Deny` for the combination of
`resource`, `action` and `condition` (matching policy). If such policy exists, `evaluate` returns false.
If there is no explicit deny the method will look for a matching policy with an explicit `Allow`.
`evaluate` will return `true` if such a policy is found. If no matching can be found at all,
`evaluate` will return `false`. Please find a more thorough explanation of this process at https://docs.aws.amazon.com/IAM/latest/UserGuide/AccessPolicyLanguage_EvaluationLogic.html.

```javascript
pbac.evaluate({
  action: 'iam:CreateUser',
  resource: 'arn:aws:iam:::user/testuser',
  variables: {
    req: {
      IpAddress: '10.0.20.51',
      UserName: 'testuser',
    }
  }
});
```

**Parameters**

* **`params`** (Object)
    * `action` (String) - Action to validate
    * `resource` (String) - Resource to validate
    * `variables` (Object) - Nested object of variables for interpolation of policy variables. See [Variables](#variables).

**Returns**: `boolean`, Returns `true` if `params` passes the policies, `false` otherwise

### validate(policy)

Validates one or many policies against the schema provided in the constructor.
Will throw an error if validation fails.

**Parameters**

* **`policy`** (Array|Object)
  Array of policies or a single policy object

**Returns**: `boolean`, Returns `true` if the policies are valid


## Reference

### Variables

Have a look at https://docs.aws.amazon.com/IAM/latest/UserGuide/PolicyVariables.html to understand what policy variables are, where they can be used and how they are interpreted. The `evaluate` method expects a `variables` parameter which is a nested object that translates to colon-separated variables.

**Example:**

```javascript
var variables = {
    req: {
      IpAddress: '10.0.20.51',
      UserName: 'testuser',
    },
    session: {
      LoggedInDate: '20150929T15:12:42Z',
  },
};
```

This would translate to the variables `req:IpAddress`, `req:UserName` and `session:LoggedInDate`.


* * *
