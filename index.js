/**
 * @title Access Policy Engine
 * @license MIT
 * @author Moritz Onken
 * @class Engine
 */

var _ = require('lodash'),
  policySchema = require('./schema.json'),
  conditions = require('./conditions');

var Klass = function(policies, options) {
  options = _.isPlainObject(options) ? options : {};
  _.extend(this, {
    policies: [],
    variables: _.isPlainObject(options.variables) ? options.variables : {},
    validate: _.isBoolean(options.validate) ? options.validate : true,
    schema: _.isPlainObject(options.schema) ? options.schema : policySchema,
    logger: console,
    conditions: _.isPlainObject(options.conditions) ? options.conditions : conditions,
  });
  this.add(policies);
};

_.extend(Klass.prototype, {
  add: function add(policies) {
    policies = _.isArray(policies) ? policies : [policies];
    this.policies.push.apply(this.policies, policies);
  },
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
});

module.exports = Klass;
