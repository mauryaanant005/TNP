from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from base.models import User, UserOTP
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch

class PasswordRecoverySystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="teststudent@tcetmumbai.in",
            password="OldPassword123!",
            full_name="Test Student",
            role="student",
        )

    def test_user_otp_creation_and_hashing(self):
        """Test OTP generation, PBKDF2/SHA256 hashing, and 2-minute expiration timestamp."""
        otp_obj, raw_otp = UserOTP.create_otp_for_user(self.user, ttl_seconds=120)
        
        self.assertEqual(len(raw_otp), 6)
        self.assertTrue(raw_otp.isdigit())
        self.assertNotEqual(otp_obj.otp_hash, raw_otp)
        self.assertFalse(otp_obj.is_expired())
        self.assertFalse(otp_obj.is_used)

    def test_verify_otp_code_success(self):
        """Test verifying valid 6-digit OTP code issues a single-use reset_token."""
        otp_obj, raw_otp = UserOTP.create_otp_for_user(self.user, ttl_seconds=120)
        
        success, reset_token = otp_obj.verify_otp_code(raw_otp)
        self.assertTrue(success)
        self.assertIsNotNone(reset_token)
        self.assertTrue(otp_obj.is_used)

    def test_verify_otp_code_failure_and_lockout(self):
        """Test entering incorrect OTP code 5 times locks out the OTP."""
        otp_obj, raw_otp = UserOTP.create_otp_for_user(self.user, ttl_seconds=120)
        
        for i in range(5):
            success, msg = otp_obj.verify_otp_code("000000")
            self.assertFalse(success)
        
        # 6th attempt locks out
        success, msg = otp_obj.verify_otp_code("000000")
        self.assertFalse(success)
        self.assertIn("Too many failed attempts", msg)
        self.assertTrue(otp_obj.is_used)

    @patch("base.views.send_otp_email")
    def test_api_password_reset_request(self, mock_send_email):
        """Test POST /auth/api/password_reset/request/ sends OTP email."""
        mock_send_email.return_value = (True, "")
        
        url = reverse("api_password_reset_request")
        response = self.client.post(url, {"email": "teststudent@tcetmumbai.in"}, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "otp_sent")
        self.assertEqual(response.data["expires_in_seconds"], 120)
        mock_send_email.assert_called_once()

    @patch("base.views.send_otp_email")
    def test_api_password_reset_resend_cooldown(self, mock_send_email):
        """Test resending OTP within 2 minutes is rejected due to cooldown."""
        mock_send_email.return_value = (True, "")
        
        url_req = reverse("api_password_reset_request")
        url_resend = reverse("api_password_reset_resend_otp")

        # Initial request
        self.client.post(url_req, {"email": "teststudent@tcetmumbai.in"}, format="json")
        
        # Immediate resend attempt
        resend_resp = self.client.post(url_resend, {"email": "teststudent@tcetmumbai.in"}, format="json")
        self.assertEqual(resend_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Please wait", resend_resp.data["error"])

    @patch("base.views.send_otp_email")
    def test_full_password_reset_workflow(self, mock_send_email):
        """Test complete flow: Request -> Verify -> Reset Confirm -> Login with new password."""
        mock_send_email.return_value = (True, "")
        
        # 1. Request OTP
        req_resp = self.client.post(reverse("api_password_reset_request"), {"email": "teststudent@tcetmumbai.in"}, format="json")
        self.assertEqual(req_resp.status_code, status.HTTP_200_OK)

        # Get generated raw OTP from DB
        otp_obj = UserOTP.objects.get(user=self.user, is_used=False)
        # Extract raw OTP from mock call
        raw_otp = mock_send_email.call_args[0][1]

        # 2. Verify OTP
        verify_resp = self.client.post(reverse("api_password_reset_verify_otp"), {
            "email": "teststudent@tcetmumbai.in",
            "otp": raw_otp,
        }, format="json")
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        reset_token = verify_resp.data["reset_token"]

        # 3. Confirm New Password
        confirm_resp = self.client.post(reverse("api_password_reset_confirm"), {
            "reset_token": reset_token,
            "new_password": "NewSecurePassword123!",
            "confirm_password": "NewSecurePassword123!",
        }, format="json")
        self.assertEqual(confirm_resp.status_code, status.HTTP_200_OK)

        # 4. Verify user can log in with new password
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePassword123!"))
        self.assertFalse(self.user.check_password("OldPassword123!"))
