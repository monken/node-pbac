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
  if(this.validateSchema) this._validateSchema();
  this.add(policies);
};

_.extend(PBAC.prototype, {
  add: function add(policies) {
    policies = _.isArray(policies) ? policies : [policies];
    if(this.validatePolicies) this.validate(policies);
    this.policies.push.apply(this.policies, policies);
  },
  addConditionsToSchema: function addConditionsToSchema() {
    var definition = _.get(this.schema, 'definitions.Condition');
    if(!definition) return;
    var props = definition.properties = {};
    _.forEach(this.conditions, function(condition, name) {
      props[name] = { type: 'object' };
    }, this);
  },
  _validateSchema: function() {
    var validator = new ZSchema();
    if (!validator.validateSchema(this.schema))
      this.throw('schema validation failed with', validator.getLastError());
  },
  /**
   * Validates one or many policies against the schema provided in the constructor.
   * Will throw an error if validation fails.
   *
   * @param {object} policy - Array of policies or single policy object
   * @return {boolean} Returns `true` if the policies are valid
   */
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
  /**
   * Tests an object against the policies and determines if the object passes.
   * The method will first try to find a policy with an explicit `Deny` for the combination of
   * `resource`, `action` and `condition` (matching policy). If such policy exists, `evaulate` returns false.
   * If there is no explicit deny the method will look for a matching policy with an explicit `Allow`.
   * `evaulate` will return `true` if such a policy is found. If no matching can be found at all,
   * `evaluate` will return `false`.
   *
   * @param {object} object - Object to test against the policies
   * @return {boolean} Returns `true` if the object passes, `false` otherwise
   */
  evaluate: function evaluate(options) {
    options = _.extend({
      action: '',
      resource: '',
      variables: {},
    }, options || {});
    if (this.filterPoliciesBy({
        effect: 'Deny',
        resource: options.resource,
        action: options.action,
        variables: options.variables,
      })) return false;
    if (this.filterPoliciesBy({
        effect: 'Allow',
        resource: options.resource,
        action: options.action,
        variables: options.variables,
      })) return true;
    return false;

  },
  filterPoliciesBy: function filterPoliciesBy(options) {
    return _(this.policies).pluck('Statement').flatten().find(function(statement, idx) {
      if (statement.Effect !== options.effect) return false;
      var actionApplies = false;
      if (!this.evaluateResource(statement.Resource, options.resource, options.variables))
        return false;
      if (statement.Action) actionApplies = _.find(statement.Action, function(action) {
        return this.conditions.StringLike(action, options.action);
      }.bind(this)) ? true : false;
      if (statement.NotAction) actionApplies = _.all(statement.NotAction, function(action) {
        return this.conditions.StringNotLike(action, options.action);
      }.bind(this));
      if (!actionApplies) return false;
      return this.evaluateCondition(statement.Condition, options.variables);
    }.bind(this));
  },
  interpolateValue: function interpolateValue(value, variables) {
    return value.replace(/\${(.+?)}/g, function(match, variable) {
      return this.getVariableValue(variable, variables);
    }.bind(this));
  },
  getVariableValue: function(variable, variables) {
    var parts = variable.split(':');
    if (_.isPlainObject(variables[parts[0]]) && !_.isUndefined(variables[parts[0]][parts[1]]))
      return variables[parts[0]][parts[1]];
    else return variable;
  },
  evaluateResource: function evaluateResource(resources, reference, variables) {
    resources = _.isArray(resources) ? resources : [resources];
    return _.find(resources, function(resource) {
      var value = this.interpolateValue(resource, variables);
      return this.conditions.StringLike.call(this, value, reference);
    }.bind(this));
  },
  evaluateCondition: function evaluateCondition(condition, variables) {
    if (!_.isPlainObject(condition)) return true;
    var conditions = this.conditions;
    return _.all(_.keys(condition), function(key) {
      var expression = condition[key],
        variable = _.keys(expression)[0],
        values = _.values(expression)[0];
      values = _.isArray(values) ? values : [values];
      return _.find(values, function(value) {
        return conditions[key].call(this, value, this.getVariableValue(variable, variables));
      }.bind(this));
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
