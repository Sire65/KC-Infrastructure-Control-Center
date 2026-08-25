# KC Assistant Contract 1.0

KC Assistant is a shared assistant layer designed first for KICC and later reusable by other KC products.

## Capabilities
- Answer questions about registered KC products, devices, databases, versions, flows, incidents, journals and tests.
- Run allow-listed diagnostic/read operations.
- Prepare permitted actions and request confirmation according to risk class.
- Perform external web research through a controlled adapter for weather, provider documentation/status and general questions.
- Distinguish internal measured facts from external research in every combined answer.
- Offer contextual suggested actions so users can select instead of typing.

## Safety/availability
KICC core operation does not depend on AI. AI provider failure must not affect monitoring or productive KC applications. No unrestricted database, shell or secret access is given to the model.

## Provider model
KCAssistantCore uses replaceable providers. Local/free options can be added. Paid API dependency is not required.

## Example tools
getSystemHealth, findProgram, traceDataFlow, compareStores, runHealthTest, getIncidentHistory, checkVersions, prepareUpdate and prepareFailover. Actual execution remains subject to KICC authorization.