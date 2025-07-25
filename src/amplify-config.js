import { Amplify } from 'aws-amplify';

const configureAmplify = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: 'YOUR_COGNITO_USER_POOL_ID', // e.g., 'us-east-1_xxxxxxxxx'
        userPoolClientId: 'YOUR_COGNITO_APP_CLIENT_ID', // e.g., 'xxxxxxxxxxxxxxxxx'
        region: 'us-east-1',
      }
    }
  });
};

export default configureAmplify;