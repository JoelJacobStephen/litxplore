import pytest
import jwt
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.core.auth import get_current_user, get_jwks, validate_token_claims, extract_user_data_from_token
from app.utils.error_utils import ErrorCode
from sqlalchemy.orm import Session


def create_mock_token(
    sub="test_clerk_id",
    exp=None,
    iat=None,
    iss="https://clerk.litxplore.com",
    email="test@example.com",
    first_name="Test",
    last_name="User",
    kid="test_kid"
):
    """Create a mock JWT token for testing"""
    now = datetime.utcnow()
    payload = {
        "sub": sub,
        "exp": int((now + timedelta(hours=1)).timestamp()) if exp is None else exp,
        "iat": int(now.timestamp()) if iat is None else iat,
        "iss": iss,
        "email": email,
        "firstName": first_name,
        "lastName": last_name
    }
    
    # Create a mock token without actually signing it (we'll mock the verification)
    token = "header.{}.signature".format(jwt.encode(payload, "test_secret", algorithm="HS256").split(".")[1])
    
    # Return both the token and the mock header with kid
    return token, {"kid": kid}


class TestAuthentication:
    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        return MagicMock(spec=Session)
    
    @pytest.fixture
    def mock_user(self):
        """Create a mock user object"""
        user = MagicMock()
        user.id = 1
        user.clerk_id = "test_clerk_id"
        user.email = "test@example.com"
        return user
    
    @pytest.fixture
    def mock_credentials(self):
        """Create mock credentials with a valid token"""
        token, _ = create_mock_token()
        credentials = MagicMock()
        credentials.credentials = token
        return credentials
    
    @patch("app.core.auth.PyJWT.get_unverified_header")
    @patch("app.core.auth.get_jwks")
    @patch("app.core.auth.PyJWT.decode")
    @patch("app.core.auth.PyJWT.algorithms.RSAAlgorithm.from_jwk")
    @patch("app.core.auth.get_or_create_user")
    async def test_get_current_user_success(
        self, 
        mock_get_or_create_user,
        mock_from_jwk,
        mock_decode,
        mock_get_jwks,
        mock_get_unverified_header,
        mock_db_session,
        mock_user,
        mock_credentials
    ):
        """Test successful user authentication"""
        # Set up mocks
        token, header = create_mock_token()
        mock_get_unverified_header.return_value = header
        
        # Mock JWKS response
        mock_jwks = {"keys": [{"kid": "test_kid", "n": "test", "e": "test"}]}
        mock_get_jwks.return_value = mock_jwks
        
        # Mock RSA key
        mock_key = MagicMock()
        mock_from_jwk.return_value = mock_key
        
        # Mock JWT decode
        mock_payload = {
            "sub": "test_clerk_id",
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
            "iat": int(datetime.utcnow().timestamp()),
            "email": "test@example.com",
            "firstName": "Test",
            "lastName": "User"
        }
        mock_decode.return_value = mock_payload
        
        # Mock user creation/retrieval
        mock_get_or_create_user.return_value = mock_user
        
        # Call the function
        user = await get_current_user(mock_credentials, mock_db_session)
        
        # Verify results
        assert user == mock_user
        mock_get_unverified_header.assert_called_once_with(mock_credentials.credentials)
        mock_get_jwks.assert_called_once()
        mock_from_jwk.assert_called_once()
        mock_decode.assert_called_once()
        mock_get_or_create_user.assert_called_once_with(
            db=mock_db_session,
            clerk_id="test_clerk_id",
            email="test@example.com",
            first_name="Test",
            last_name="User"
        )
    
    @patch("app.core.auth.PyJWT.get_unverified_header")
    async def test_missing_kid(
        self,
        mock_get_unverified_header,
        mock_credentials,
        mock_db_session
    ):
        """Test error handling when kid is missing from token header"""
        # Set up mock to return header without kid
        mock_get_unverified_header.return_value = {}
        
        # Call the function and check for exception
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(mock_credentials, mock_db_session)
        
        # Verify exception details
        assert exc_info.value.status_code == 401
        assert "Invalid token format" in str(exc_info.value.detail)
        assert ErrorCode.INVALID_TOKEN in str(exc_info.value.detail)
    
    @patch("app.core.auth.PyJWT.get_unverified_header")
    @patch("app.core.auth.get_jwks")
    @patch("app.core.auth.PyJWT.algorithms.RSAAlgorithm.from_jwk")
    async def test_key_not_found(
        self,
        mock_from_jwk,
        mock_get_jwks,
        mock_get_unverified_header,
        mock_credentials,
        mock_db_session
    ):
        """Test error handling when key is not found in JWKS"""
        # Set up mocks
        mock_get_unverified_header.return_value = {"kid": "unknown_kid"}
        
        # Mock JWKS response with no matching kid
        mock_jwks = {"keys": [{"kid": "different_kid", "n": "test", "e": "test"}]}
        mock_get_jwks.return_value = mock_jwks
        
        # Call the function and check for exception
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(mock_credentials, mock_db_session)
        
        # Verify exception details
        assert exc_info.value.status_code == 401
        assert "Key not found in JWKS" in str(exc_info.value.detail)
        assert ErrorCode.JWKS_ERROR in str(exc_info.value.detail)
    
    @patch("app.core.auth.PyJWT.get_unverified_header")
    @patch("app.core.auth.get_jwks")
    @patch("app.core.auth.PyJWT.algorithms.RSAAlgorithm.from_jwk")
    @patch("app.core.auth.PyJWT.decode")
    async def test_expired_token(
        self,
        mock_decode,
        mock_from_jwk,
        mock_get_jwks,
        mock_get_unverified_header,
        mock_credentials,
        mock_db_session
    ):
        """Test error handling for expired token"""
        # Set up mocks
        mock_get_unverified_header.return_value = {"kid": "test_kid"}
        
        # Mock JWKS response
        mock_jwks = {"keys": [{"kid": "test_kid", "n": "test", "e": "test"}]}
        mock_get_jwks.return_value = mock_jwks
        
        # Mock RSA key
        mock_key = MagicMock()
        mock_from_jwk.return_value = mock_key
        
        # Mock JWT decode to raise ExpiredSignatureError
        mock_decode.side_effect = jwt.exceptions.ExpiredSignatureError("Token has expired")
        
        # Call the function and check for exception
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(mock_credentials, mock_db_session)
        
        # Verify exception details
        assert exc_info.value.status_code == 401
        assert "Token has expired" in str(exc_info.value.detail)
        assert ErrorCode.TOKEN_EXPIRED in str(exc_info.value.detail)
    
    def test_validate_token_claims_success(self):
        """Test successful validation of token claims"""
        # Create payload with all required claims
        payload = {
            "sub": "test_clerk_id",
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
            "iat": int(datetime.utcnow().timestamp())
        }
        
        # This should not raise an exception
        validate_token_claims(payload)
    
    def test_validate_token_claims_missing(self):
        """Test validation failure when required claims are missing"""
        # Create payload missing required claims
        payload = {
            "sub": "test_clerk_id"
            # Missing exp and iat
        }
        
        # Should raise an exception
        with pytest.raises(HTTPException) as exc_info:
            validate_token_claims(payload)
        
        # Verify exception details
        assert exc_info.value.status_code == 401
        assert "Missing required claims" in str(exc_info.value.detail)
        assert "exp" in str(exc_info.value.detail)
        assert "iat" in str(exc_info.value.detail)
    
    def test_extract_user_data_from_token(self):
        """Test extraction of user data from token payload"""
        # Test with standard format
        payload1 = {
            "sub": "test_clerk_id",
            "email": "test@example.com",
            "firstName": "Test",
            "lastName": "User"
        }
        user_data1 = extract_user_data_from_token(payload1)
        assert user_data1["email"] == "test@example.com"
        assert user_data1["first_name"] == "Test"
        assert user_data1["last_name"] == "User"
        
        # Test with OpenID format
        payload2 = {
            "sub": "test_clerk_id",
            "email": "test@example.com",
            "given_name": "Test",
            "family_name": "User"
        }
        user_data2 = extract_user_data_from_token(payload2)
        assert user_data2["email"] == "test@example.com"
        assert user_data2["first_name"] == "Test"
        assert user_data2["last_name"] == "User"
        
        # Test with missing email
        payload3 = {
            "sub": "test_clerk_id"
        }
        user_data3 = extract_user_data_from_token(payload3)
        assert user_data3["email"] == "test_clerk_id@litxplore.generated"
        assert user_data3["first_name"] == ""
        assert user_data3["last_name"] == ""
