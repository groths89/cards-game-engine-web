import { Amplify } from 'aws-amplify';

const configureAmplify = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
        region: process.env.REACT_APP_AWS_REGION,
      }
    }
  });
};

export default configureAmplify;