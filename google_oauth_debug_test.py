#!/usr/bin/env python3
"""
Google OAuth Callback Debug Test
Specifically designed to identify the exact validation error causing 422 responses
"""

import requests
import json
import base64
import time
from datetime import datetime, timezone, timedelta

class GoogleOAuthDebugTester:
    def __init__(self, base_url="https://hackov8-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.test_results = []
        
    def log_test(self, name, success, details="", response_data=None):
        """Log test result with detailed information"""
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} {name}")
        if details:
            print(f"   Details: {details}")
        if response_data:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response": response_data
        })

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

    def test_google_callback_validation(self):
        """Test Google OAuth callback with various scenarios to identify validation errors"""
        print("🔍 DEBUGGING Google OAuth Callback Validation Errors\n")
        
        # Get Google Client ID from environment
        google_client_id = "834941712511-hblu5bkb78j0nhi570if3jmv70sk0nef.apps.googleusercontent.com"
        
        # Test 1: Valid JWT with participant role (minimal data)
        print("Test 1: Valid JWT with participant role (minimal required data)")
        valid_payload = {
            "iss": "https://accounts.google.com",
            "aud": google_client_id,
            "sub": "12345678901234567890",
            "email": f"test.participant.{int(time.time())}@example.com",
            "name": "Test Participant User",
            "picture": "https://lh3.googleusercontent.com/a/test-picture",
            "email_verified": True,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600
        }
        
        jwt_token = self.create_mock_jwt_token(valid_payload)
        
        # Test with participant role
        test_data = {
            "credential": jwt_token,
            "role": "participant"
        }
        
        response = self.make_request("POST", "auth/google/callback", test_data)
        
        if response.status_code == 422:
            try:
                error_detail = response.json()
                self.log_test(
                    "Participant Role - Minimal Data", 
                    False, 
                    f"422 Unprocessable Entity: {error_detail}",
                    error_detail
                )
            except:
                self.log_test(
                    "Participant Role - Minimal Data", 
                    False, 
                    f"422 Unprocessable Entity: {response.text}",
                    {"raw_response": response.text}
                )
        elif response.status_code == 200:
            self.log_test("Participant Role - Minimal Data", True, "Success", response.json())
        else:
            self.log_test(
                "Participant Role - Minimal Data", 
                False, 
                f"Unexpected status {response.status_code}: {response.text}",
                {"status_code": response.status_code, "response": response.text}
            )
        
        # Test 2: Valid JWT with organizer role (should require company_name)
        print("Test 2: Valid JWT with organizer role (with company_name)")
        test_data_organizer = {
            "credential": jwt_token,
            "role": "organizer",
            "company_name": "Test Company Inc",
            "company_website": "https://testcompany.com"
        }
        
        response = self.make_request("POST", "auth/google/callback", test_data_organizer)
        
        if response.status_code == 422:
            try:
                error_detail = response.json()
                self.log_test(
                    "Organizer Role - With Company", 
                    False, 
                    f"422 Unprocessable Entity: {error_detail}",
                    error_detail
                )
            except:
                self.log_test(
                    "Organizer Role - With Company", 
                    False, 
                    f"422 Unprocessable Entity: {response.text}",
                    {"raw_response": response.text}
                )
        elif response.status_code == 200:
            self.log_test("Organizer Role - With Company", True, "Success", response.json())
        else:
            self.log_test(
                "Organizer Role - With Company", 
                False, 
                f"Unexpected status {response.status_code}: {response.text}",
                {"status_code": response.status_code, "response": response.text}
            )
        
        # Test 3: Organizer role without company_name (should this fail?)
        print("Test 3: Valid JWT with organizer role (without company_name)")
        test_data_organizer_no_company = {
            "credential": jwt_token,
            "role": "organizer"
        }
        
        response = self.make_request("POST", "auth/google/callback", test_data_organizer_no_company)
        
        if response.status_code == 422:
            try:
                error_detail = response.json()
                self.log_test(
                    "Organizer Role - No Company", 
                    False, 
                    f"422 Unprocessable Entity: {error_detail}",
                    error_detail
                )
            except:
                self.log_test(
                    "Organizer Role - No Company", 
                    False, 
                    f"422 Unprocessable Entity: {response.text}",
                    {"raw_response": response.text}
                )
        elif response.status_code == 200:
            self.log_test("Organizer Role - No Company", True, "Success", response.json())
        else:
            self.log_test(
                "Organizer Role - No Company", 
                False, 
                f"Unexpected status {response.status_code}: {response.text}",
                {"status_code": response.status_code, "response": response.text}
            )
        
        # Test 4: Test different request formats
        print("Test 4: Testing different request formats")
        
        # Test with form data instead of JSON
        response = self.make_request("POST", "auth/google/callback", test_data, use_form=True)
        
        if response.status_code == 422:
            try:
                error_detail = response.json()
                self.log_test(
                    "Form Data Format", 
                    False, 
                    f"422 Unprocessable Entity: {error_detail}",
                    error_detail
                )
            except:
                self.log_test(
                    "Form Data Format", 
                    False, 
                    f"422 Unprocessable Entity: {response.text}",
                    {"raw_response": response.text}
                )
        elif response.status_code == 200:
            self.log_test("Form Data Format", True, "Success", response.json())
        else:
            self.log_test(
                "Form Data Format", 
                False, 
                f"Unexpected status {response.status_code}: {response.text}",
                {"status_code": response.status_code, "response": response.text}
            )
        
        # Test 5: Test with missing fields
        print("Test 5: Testing with missing credential field")
        test_data_missing_credential = {
            "role": "participant"
        }
        
        response = self.make_request("POST", "auth/google/callback", test_data_missing_credential)
        
        if response.status_code == 422:
            try:
                error_detail = response.json()
                self.log_test(
                    "Missing Credential Field", 
                    True,  # This should fail with 422
                    f"Expected 422 for missing credential: {error_detail}",
                    error_detail
                )
            except:
                self.log_test(
                    "Missing Credential Field", 
                    True,  # This should fail with 422
                    f"Expected 422 for missing credential: {response.text}",
                    {"raw_response": response.text}
                )
        else:
            self.log_test(
                "Missing Credential Field", 
                False, 
                f"Expected 422, got {response.status_code}: {response.text}",
                {"status_code": response.status_code, "response": response.text}
            )
        
        # Test 6: Test with invalid JWT format
        print("Test 6: Testing with invalid JWT format")
        test_data_invalid_jwt = {
            "credential": "invalid.jwt.token",
            "role": "participant"
        }
        
        response = self.make_request("POST", "auth/google/callback", test_data_invalid_jwt)
        
        if response.status_code == 400:
            self.log_test("Invalid JWT Format", True, "Expected 400 for invalid JWT", response.json() if response.content else {"raw": response.text})
        elif response.status_code == 422:
            try:
                error_detail = response.json()
                self.log_test(
                    "Invalid JWT Format", 
                    False, 
                    f"Got 422 instead of 400: {error_detail}",
                    error_detail
                )
            except:
                self.log_test(
                    "Invalid JWT Format", 
                    False, 
                    f"Got 422 instead of 400: {response.text}",
                    {"raw_response": response.text}
                )
        else:
            self.log_test(
                "Invalid JWT Format", 
                False, 
                f"Unexpected status {response.status_code}: {response.text}",
                {"status_code": response.status_code, "response": response.text}
            )
        
        # Test 7: Test with wrong audience in JWT
        print("Test 7: Testing with wrong audience in JWT")
        wrong_audience_payload = {
            "iss": "https://accounts.google.com",
            "aud": "wrong-client-id",  # Wrong audience
            "sub": "12345678901234567890",
            "email": f"test.wrong.audience.{int(time.time())}@example.com",
            "name": "Test Wrong Audience User",
            "picture": "https://lh3.googleusercontent.com/a/test-picture",
            "email_verified": True,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600
        }
        
        wrong_jwt_token = self.create_mock_jwt_token(wrong_audience_payload)
        
        test_data_wrong_audience = {
            "credential": wrong_jwt_token,
            "role": "participant"
        }
        
        response = self.make_request("POST", "auth/google/callback", test_data_wrong_audience)
        
        if response.status_code == 400:
            self.log_test("Wrong JWT Audience", True, "Expected 400 for wrong audience", response.json() if response.content else {"raw": response.text})
        elif response.status_code == 422:
            try:
                error_detail = response.json()
                self.log_test(
                    "Wrong JWT Audience", 
                    False, 
                    f"Got 422 instead of 400: {error_detail}",
                    error_detail
                )
            except:
                self.log_test(
                    "Wrong JWT Audience", 
                    False, 
                    f"Got 422 instead of 400: {response.text}",
                    {"raw_response": response.text}
                )
        else:
            self.log_test(
                "Wrong JWT Audience", 
                False, 
                f"Unexpected status {response.status_code}: {response.text}",
                {"status_code": response.status_code, "response": response.text}
            )

    def make_request(self, method, endpoint, data=None, use_form=False):
        """Make HTTP request to the API"""
        url = f"{self.base_url}/{endpoint}"
        
        headers = {}
        if use_form:
            # Send as form data
            response = requests.post(url, data=data)
        else:
            # Send as JSON
            headers['Content-Type'] = 'application/json'
            if method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'GET':
                response = requests.get(url, headers=headers)
            else:
                response = requests.request(method, url, json=data, headers=headers)
        
        return response

    def run_debug_tests(self):
        """Run all debug tests"""
        print("🚀 Starting Google OAuth Callback Debug Tests")
        print("=" * 60)
        
        self.test_google_callback_validation()
        
        print("=" * 60)
        print("📊 DEBUG TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['details']}")
                    if result.get('response'):
                        print(f"     Response: {json.dumps(result['response'], indent=6)}")
        
        print("\n🎯 KEY FINDINGS:")
        print("   - Check the specific error messages above to identify the exact validation issue")
        print("   - Look for 422 responses and their detailed error messages")
        print("   - Compare working vs failing request formats")
        
        return self.test_results

if __name__ == "__main__":
    tester = GoogleOAuthDebugTester()
    results = tester.run_debug_tests()