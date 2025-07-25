import boto3
import jwt
import os
from botocore.exceptions import ClientError

class AuthService:
    def __init__(self):
        self.cognito_client = boto3.client(
            'cognito-idp',
            region_name=os.getenv('COGNITO_REGION', 'us-east-1')
        )
        self.user_pool_id = os.getenv('COGNITO_USER_POOL_ID')
        self.client_id = os.getenv('COGNITO_APP_CLIENT_ID')

    def register_user(self, username, password, email):
        try:
            response = self.cognito_client.admin_create_user(
                UserPoolId=self.user_pool_id,
                Username=username,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    {'Name': 'email_verified', 'Value': 'true'}
                ],
                TemporaryPassword=password,
                MessageAction='SUPPRESS'
            )
            return {'success': True, 'user_id': response['User']['Username']}
        except ClientError as e:
            return {'success': False, 'error': str(e)}

    def authenticate_user(self, username, password):
        try:
            response = self.cognito_client.admin_initiate_auth(
                UserPoolId=self.user_pool_id,
                ClientId=self.client_id,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters={
                    'USERNAME': username,
                    'PASSWORD': password
                }
            )
            return {
                'success': True,
                'access_token': response['AuthenticationResult']['AccessToken'],
                'id_token': response['AuthenticationResult']['IdToken']
            }
        except ClientError as e:
            return {'success': False, 'error': str(e)}

auth_service = AuthService()