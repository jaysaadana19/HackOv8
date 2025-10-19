#!/usr/bin/env python3
"""
Google OAuth Callback Fix Test
Test both query parameters and request body approaches
"""

import requests
import json
import base64
import time
from datetime import datetime, timezone, timedelta

class GoogleOAuthFixTester:
    def __init__(self, base_url="https://hackov8-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        
    def create_mock_jwt_token(self, payload_data):
        """Create a mock JWT token for testing"""
        # Create header
        header = {
            "alg": "RS256",
            "kid": "test-key-id",
            "typ": "JWT"
        }
        
        # Encode header and payload
        header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_encoded = base64.urlsafe_b64encode(json.dumps(payload_data).encode()).decode().rstrip('=')
        
        # Create fake signature (for testing only)
        signature = base64.urlsafe_b64encode(b"fake_signature_for_testing").decode().rstrip('=')
        
        return f"{header_encoded}.{payload_encoded}.{signature}"

    def test_query_parameters_approach(self):
        """Test sending parameters as query parameters"""
        print("🔍 Testing Query Parameters Approach")
        
        google_client_id = "834941712511-hblu5bkb78j0nhi570if3jmv70sk0nef.apps.googleusercontent.com"
        
        # Create valid JWT payload
        valid_payload = {
            "iss": "https://accounts.google.com",
            "aud": google_client_id,
            "sub": "12345678901234567890",
            "email": f"test.query.{int(time.time())}@example.com",
            "name": "Test Query User",
            "picture": "https://lh3.googleusercontent.com/a/test-picture",
            "email_verified": True,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600
        }
        
        jwt_token = self.create_mock_jwt_token(valid_payload)
        
        # Test 1: Query parameters for participant
        url = f"{self.base_url}/auth/google/callback"
        params = {
            "credential": jwt_token,
            "role": "participant"
        }
        
        response = requests.post(url, params=params)
        print(f"   Participant (Query): Status {response.status_code}")
        
        if response.status_code == 422:
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
        elif response.status_code == 200:
            print(f"   ✅ SUCCESS: {response.json()}")
        else:
            print(f"   Status {response.status_code}: {response.text}")
        
        # Test 2: Query parameters for organizer
        params_organizer = {
            "credential": jwt_token,
            "role": "organizer",
            "company_name": "Test Company Inc",
            "company_website": "https://testcompany.com"
        }
        
        response = requests.post(url, params=params_organizer)
        print(f"   Organizer (Query): Status {response.status_code}")
        
        if response.status_code == 422:
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
        elif response.status_code == 200:
            print(f"   ✅ SUCCESS: {response.json()}")
        else:
            print(f"   Status {response.status_code}: {response.text}")

    def test_request_body_approach(self):
        """Test sending parameters in request body (current frontend approach)"""
        print("\n🔍 Testing Request Body Approach (Current Frontend)")
        
        google_client_id = "834941712511-hblu5bkb78j0nhi570if3jmv70sk0nef.apps.googleusercontent.com"
        
        # Create valid JWT payload
        valid_payload = {
            "iss": "https://accounts.google.com",
            "aud": google_client_id,
            "sub": "12345678901234567890",
            "email": f"test.body.{int(time.time())}@example.com",
            "name": "Test Body User",
            "picture": "https://lh3.googleusercontent.com/a/test-picture",
            "email_verified": True,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600
        }
        
        jwt_token = self.create_mock_jwt_token(valid_payload)
        
        # Test 1: Request body for participant
        url = f"{self.base_url}/auth/google/callback"
        data = {
            "credential": jwt_token,
            "role": "participant"
        }
        
        response = requests.post(url, json=data)
        print(f"   Participant (Body): Status {response.status_code}")
        
        if response.status_code == 422:
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
        elif response.status_code == 200:
            print(f"   ✅ SUCCESS: {response.json()}")
        else:
            print(f"   Status {response.status_code}: {response.text}")
        
        # Test 2: Request body for organizer
        data_organizer = {
            "credential": jwt_token,
            "role": "organizer",
            "company_name": "Test Company Inc",
            "company_website": "https://testcompany.com"
        }
        
        response = requests.post(url, json=data_organizer)
        print(f"   Organizer (Body): Status {response.status_code}")
        
        if response.status_code == 422:
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
        elif response.status_code == 200:
            print(f"   ✅ SUCCESS: {response.json()}")
        else:
            print(f"   Status {response.status_code}: {response.text}")

    def run_tests(self):
        """Run all tests"""
        print("🚀 Google OAuth Callback Fix Tests")
        print("=" * 50)
        
        self.test_query_parameters_approach()
        self.test_request_body_approach()
        
        print("\n" + "=" * 50)
        print("🎯 CONCLUSION:")
        print("   - If query parameters work but request body doesn't,")
        print("     the backend expects query parameters")
        print("   - Frontend needs to be updated to send query parameters")
        print("   - OR backend needs to be updated to accept request body")

if __name__ == "__main__":
    tester = GoogleOAuthFixTester()
    tester.run_tests()