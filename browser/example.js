checkPolicies();

function checkPolicies() {
  try {
    const policies = JSON.parse(document.all.policies.value);
    const action = document.all.action.value;
    const resource = document.all.resource.value;
    const context = JSON.parse(document.all.context.value);

    var pbac = new PBAC(policies, {
      validateSchema: false,
      validatePolicies: false,
    });

    var result = pbac.evaluate({
      action,
      resource,
      context,
    });

    document.all.result.textContent = JSON.stringify(result);
  } catch (error) {
    console.error(error);

    document.all.result.textContent = error.message;
  }
}
