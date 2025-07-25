import boto3
import os
from datetime import datetime
from decimal import Decimal

class UserService:
    def __init__(self):
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1'),
            endpoint_url=os.getenv('DYNAMODB_ENDPOINT')
        )
        self.users_table = self.dynamodb.Table(os.getenv('USERS_TABLE'))

    def create_user_profile(self, user_id, username, email=None):
        try:
            item = {
                'user_id': user_id,
                'username': username,
                'email': email,
                'games_played': 0,
                'games_won': 0,
                'win_rate': Decimal('0.0'),
                'user_type': 'registered',
                'created_at': datetime.now().isoformat(),
                'last_active': datetime.now().isoformat()
            }
            
            self.users_table.put_item(Item=item)
            return {'success': True, 'profile': item}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def get_user_profile(self, user_id):
        try:
            response = self.users_table.get_item(Key={'user_id': user_id})
            if 'Item' in response:
                return {'success': True, 'profile': response['Item']}
            return {'success': False, 'error': 'User not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def update_user_stats(self, user_id, games_played_delta, games_won_delta):
        try:
            response = self.users_table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='ADD games_played :gp, games_won :gw SET win_rate = :wr',
                ExpressionAttributeValues={
                    ':gp': games_played_delta,
                    ':gw': games_won_delta,
                    ':wr': Decimal(str((games_won_delta / games_played_delta) * 100)) if games_played_delta > 0 else Decimal('0')
                },
                ReturnValues='UPDATED_NEW'
            )
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

user_service = UserService()