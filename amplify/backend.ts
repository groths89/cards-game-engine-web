import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

const backend = defineBackend({
  auth,
  data,
});

// Add custom DynamoDB configuration if needed
backend.data.resources.cfnResources.cfnGraphqlApi.addPropertyOverride(
  'AdditionalAuthenticationProviders.0.AuthenticationType',
  'AWS_IAM'
);

