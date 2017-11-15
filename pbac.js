'use strict';
var _ = require('lodash'),
  policySchema = require('./schema.json'),
  conditions = require('./conditions'),
  ZSchema = require('z-schema'),
  util = require('util');

var PBAC = function constructor(policies, options) {
  options = _.isPlainObject(options) ? options : {};
  var myconditions = _.isPlainObject(options.conditions) ? _.extend(options.conditions, conditions) : conditions;
  _.extend(this, {
    policies: [],
    validateSchema: _.isBoolean(options.validateSchema) ? options.validateSchema : true,
    validatePolicies: _.isBoolean(options.validatePolicies) ? options.validatePolicies : true,
    schema: _.isPlainObject(options.schema) ? options.schema : policySchema,
    conditions: myconditions,
  });
  this.addConditionsToSchema();
  if (this.validateSchema) this._validateSchema();
  this.add(policies);
};

_.extend(PBAC.prototype, {
  add: function add(policies) {
    policies = _.isArray(policies) ? policies : [policies];
    if (this.validatePolicies) this.validate(policies);
    this.policies.push.apply(this.policies, policies);
  },
  addConditionsToSchema: function addConditionsToSchema() {
    var definition = _.get(this.schema, 'definitions.Condition');
    if (!definition) return;
    var props = definition.properties = {};
    _.forEach(this.conditions, function(condition, name) {
      props[name] = {
        type: 'object'
      };
    }, this);
  },
  _validateSchema: function() {
    var validator = new ZSchema();
    if (!validator.validateSchema(this.schema))
      this.throw('schema validation failed with', validator.getLastError());
  },
  validate: function validate(policies) {
    policies = _.isArray(policies) ? policies : [policies];
    var validator = new ZSchema({
      noExtraKeywords: true,
    });
    return _.all(policies, function(policy) {
      var result = validator.validate(policy, this.schema);
      if (!result)
        this.throw('policy validation failed with', validator.getLastError());
      return result;
    }.bind(this));
  },
  evaluate: function evaluate(options) {
    options = _.extend({
      action: '',
      resource: '',
      principal: {},
      variables: {},
    }, options || {});
    if (this.filterPoliciesBy({
        effect: 'Deny',
        resource: options.resource,
        action: options.action,
        variables: options.variables,
        principal: options.principal,
      })) return false;
    if (this.filterPoliciesBy({
        effect: 'Allow',
        resource: options.resource,
        action: options.action,
        variables: options.variables,
        principal: options.principal,
      })) return true;
    return false;

  },
  filterPoliciesBy: function filterPoliciesBy(options) {
    return _(this.policies).pluck('Statement').flatten().find(function(statement, idx) {
      if (statement.Effect !== options.effect) return false;
      if (statement.Principal && !this.evaluatePrincipal(statement.Principal, options.principal, options.variables))
        return false;
      if (statement.NotPrincipal && this.evaluateNotPrincipal(statement.NotPrincipal, options.principal, options.variables))
        return false;
      if (statement.Resource && !this.evaluateResource(statement.Resource, options.resource, options.variables))
        return false;
      if (statement.NotResource && this.evaluateResource(statement.NotResource, options.resource, options.variables))
        return false;
      if (statement.Action && !this.evaluateAction(statement.Action, options.action))
        return false;
      if (statement.NotAction && this.evaluateAction(statement.NotAction, options.action))
        return false;
      return this.evaluateCondition(statement.Condition, options.variables);
    }.bind(this));
  },
  interpolateValue: function interpolateValue(value, variables) {
    return value.replace(/\${(.+?)}/g, function(match, variable) {
      return this.getVariableValue(variable, variables);
    }.bind(this));
  },
  getVariableValue: function getVariableValue(variable, variables) {
    var parts = variable.split(':');
    if (_.isPlainObject(variables[parts[0]]) && !_.isUndefined(variables[parts[0]][parts[1]]))
      return variables[parts[0]][parts[1]];
    else return variable;
  },
  evaluateNotPrincipal: function evaluateNotPrincipal(principals, reference) {
    return _(reference).keys().find(function(key) {
      return this.conditions['ForAllValues:StringEquals'].call(this, principals[key], reference[key]);
    }.bind(this));
  },
  evaluatePrincipal: function evaluatePrincipal(principals, reference) {
    return _(reference).keys().find(function(key) {
      if(_.isEmpty(reference[key])) return false;
      return this.conditions['ForAnyValue:StringEquals'].call(this, principals[key], reference[key]);
    }.bind(this));
  },
  evaluateAction: function evaluateAction(actions, reference) {
    return _.find(actions, function(action) {
      return this.conditions.StringLike.call(this, reference, action);
    }.bind(this));
  },
  evaluateResource: function evaluateResource(resources, reference, variables) {
    resources = _.isArray(resources) ? resources : [resources];
    return _.find(resources, function(resource) {
      var value = this.interpolateValue(resource, variables);
      return this.conditions.StringLike.call(this, reference, value);
    }.bind(this));
  },
  evaluateCondition: function evaluateCondition(condition, variables) {
    if (!_.isPlainObject(condition)) return true;
    var conditions = this.conditions;
    return _.every(_.keys(condition), function(key) {
      var expression = condition[key],
        variable = _.keys(expression)[0],
        values = _.values(expression)[0],
        prefix;
      values = _.isArray(values) ? values : [values];
      if (key.indexOf(':') !== -1) {
        prefix = key.substr(0, key.indexOf(':'));
      }
      if (prefix === 'ForAnyValue' || prefix === 'ForAllValues') {
        return conditions[key].call(this, this.getVariableValue(variable, variables), values);
      } else {
        return _.find(values, function(value) {
          return conditions[key].call(this, this.getVariableValue(variable, variables), this.interpolateValue(value, variables));
        }.bind(this));
      }
    }.bind(this));
  },
  throw: function(name, message) {
    var args = [].slice.call(arguments, 2);
    args.unshift(message);
    var e = new Error();
    _.extend(e, {
      name: name,
      message: util.format.apply(util, args)
    });
    throw e;
  },
});

module.exports = PBAC;
