'use strict';
const policySchema = require('./schema.json');
const conditions = require('./conditions');
const ZSchema = require('z-schema');

const {
  isPlainObject,
  isBoolean,
  isArray,
  isUndefined,
  isEmpty,
  forEach,
  every,
  get,
} = require('lodash');

const { flow, map, flatten, find } = require('lodash/fp');

const PBAC = function constructor(policies, options) {
  options = isPlainObject(options) ? options : {};
  const myconditions = isPlainObject(options.conditions) ? Object.assign(options.conditions, conditions) : conditions;

  this.policies = [];
  this.validateSchema = isBoolean(options.validateSchema) ? options.validateSchema : true;
  this.validatePolicies = isBoolean(options.validatePolicies) ? options.validatePolicies : true;
  this.schema = isPlainObject(options.schema) ? options.schema : policySchema;
  this.conditions = myconditions;

  this.addConditionsToSchema();
  if (this.validateSchema) this._validateSchema();
  this.add(policies);
};

Object.assign(PBAC.prototype, {
  add: function add(policies) {
    policies = isArray(policies) ? policies : [policies];
    if (this.validatePolicies) this.validate(policies);
    this.policies.push.apply(this.policies, policies);
  },
  addConditionsToSchema: function addConditionsToSchema() {
    const definition = get(this.schema, 'definitions.Condition');
    if (!definition) return;
    const props = definition.properties = {};
    forEach(this.conditions, function(condition, name) {
      props[name] = {
        type: 'object'
      };
    }, this);
  },
  _validateSchema() {
    const validator = new ZSchema();
    if (!validator.validateSchema(this.schema))
      this.throw('schema validation failed with ' + validator.getLastError());
  },
  validate(policies) {
    policies = isArray(policies) ? policies : [policies];
    const validator = new ZSchema({
      noExtraKeywords: true,
    });
    return every(policies, policy => {
      const result = validator.validate(policy, this.schema);
      if (!result) this.throw('policy validation failed with ' + validator.getLastError());
      return result;
    });
  },
  evaluate(options) {
    options = Object.assign({
      action: '',
      resource: '',
      principal: {},
      context: options.variables || {},
    }, options || {});
    if (this.filterPoliciesBy({
        effect: 'Deny',
        resource: options.resource,
        action: options.action,
        context: options.context,
        principal: options.principal,
      })) return false;
    return !!this.filterPoliciesBy({
      effect: 'Allow',
      resource: options.resource,
      action: options.action,
      context: options.context,
      principal: options.principal,
    });
  },
  filterPoliciesBy(options) {
    return flow(
      map('Statement'),
      flatten,
      find(statement => {
        if (statement.Effect !== options.effect) return false;
        if (statement.Principal && !this.evaluatePrincipal(statement.Principal, options.principal, options.context))
          return false;
        if (statement.NotPrincipal && this.evaluateNotPrincipal(statement.NotPrincipal, options.principal, options.context))
          return false;
        if (statement.Resource && !this.evaluateResource(statement.Resource, options.resource, options.context))
          return false;
        if (statement.NotResource && this.evaluateResource(statement.NotResource, options.resource, options.context))
          return false;
        if (statement.Action && !this.evaluateAction(statement.Action, options.action))
          return false;
        if (statement.NotAction && this.evaluateAction(statement.NotAction, options.action))
          return false;
        return this.evaluateCondition(statement.Condition, options.context);
    })
  )(this.policies);
  },
  interpolateValue(value, variables) {
    return value.replace(/\${(.+?)}/g, (match, variable) => {
      return this.getVariableValue(variable, variables);
    });
  },
  getContextValue(key, context) {
    var parts = key.split(':');
    if (isPlainObject(context[parts[0]]) && !isUndefined(context[parts[0]][parts[1]]))
      return context[parts[0]][parts[1]];
    else return key;
  },
  getVariableValue(variable, variables) {
    const parts = variable.split(':');
    if (isPlainObject(variables[parts[0]]) && !isUndefined(variables[parts[0]][parts[1]]))
      return variables[parts[0]][parts[1]];
    else return variable;
  },
  evaluateNotPrincipal(principals, reference) {
    return Object.keys(reference).find(key => {
      return this.conditions['ForAllValues:StringEquals'].call(this, principals[key], reference[key]);
    });
  },
  evaluatePrincipal(principals, reference) {
    return Object.keys(reference).find(key => {
      if(isEmpty(reference[key])) return false;
      return this.conditions['ForAnyValue:StringEquals'].call(this, principals[key], reference[key]);
    });
  },
  evaluateAction(actions, reference) {
    return actions.find(action => {
      return this.conditions.StringLike.call(this, reference, action);
    });
  },
  evaluateResource(resources, reference, context) {
    resources = isArray(resources) ? resources : [resources];
    return resources.find(resource => {
      const value = this.interpolateValue(resource, context);
      return this.conditions.StringLike.call(this, reference, value);
    });
  },
  evaluateCondition(condition, context) {
    if (!isPlainObject(condition)) return true;
    const conditions = this.conditions;
    return every(Object.keys(condition), key => {
      const expression = condition[key];
      const contextKey = Object.keys(expression)[0];
      let values = expression[contextKey];
      values = isArray(values) ? values : [values];

      let prefix;
      if (key.indexOf(':') !== -1) {
        prefix = key.substr(0, key.indexOf(':'));
      }
      if (prefix === 'ForAnyValue' || prefix === 'ForAllValues') {
        return conditions[key].call(this, this.getContextValue(contextKey, context), values);
      } else {
        return values.find(value => conditions[key].call(this, this.getContextValue(contextKey, context), value));
      }
    });
  },
  throw(name, message) {
    const e = new Error();
    e.name = name;
    e.message = message;
    throw e;
  },
});

module.exports = PBAC;
