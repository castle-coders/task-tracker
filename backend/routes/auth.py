from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from backend.models import User
from backend.database import db, login_manager

auth_bp = Blueprint('auth', __name__)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'error': 'Missing required fields'}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Set first user as admin
    is_first_user = User.query.count() == 0
        
    user = User(name=data['name'], email=data['email'], is_admin=is_first_user)
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.check_password(data['password']):
        if user.totp_secret:
            session['2fa_pending_user_id'] = user.id
            return jsonify({'2fa_required': True}), 200
            
        login_user(user)
        return jsonify({'message': 'Logged in successfully', 'user': {'id': user.id, 'name': user.name, 'email': user.email, 'is_admin': user.is_admin}}), 200
        
    return jsonify({'error': 'Invalid email or password'}), 401

@auth_bp.route('/login/2fa', methods=['POST'])
def login_2fa():
    if '2fa_pending_user_id' not in session:
        return jsonify({'error': 'Session expired or invalid'}), 400
        
    user_id = session['2fa_pending_user_id']
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json()
    code = data.get('code')
    
    if not code:
        return jsonify({'error': 'Missing 2FA code'}), 400
        
    totp = pyotp.TOTP(user.totp_secret)
    if totp.verify(code):
        login_user(user)
        del session['2fa_pending_user_id']
        return jsonify({'message': 'Logged in successfully', 'user': {'id': user.id, 'name': user.name, 'email': user.email, 'is_admin': user.is_admin}}), 200
        
    return jsonify({'error': 'Invalid 2FA code'}), 400

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'id': current_user.id, 
        'name': current_user.name, 
        'email': current_user.email,
        'is_admin': current_user.is_admin,
        'has_totp': bool(current_user.totp_secret)
    }), 200

import pyotp

@auth_bp.route('/totp/setup', methods=['POST'])
@login_required
def totp_setup():
    secret = pyotp.random_base32()
    # Create provisioning URI for Google Authenticator
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name='Task Tracker'
    )
    return jsonify({'secret': secret, 'uri': uri}), 200

@auth_bp.route('/totp/verify', methods=['POST'])
@login_required
def totp_verify():
    data = request.get_json()
    secret = data.get('secret')
    code = data.get('code')
    
    if not secret or not code:
        return jsonify({'error': 'Missing secret or code'}), 400
        
    totp = pyotp.TOTP(secret)
    if totp.verify(code):
        current_user.totp_secret = secret
        db.session.commit()
        return jsonify({'message': 'TOTP enabled successfully'}), 200
        
    return jsonify({'error': 'Invalid code'}), 400

@auth_bp.route('/totp', methods=['DELETE'])
@login_required
def disable_totp():
    current_user.totp_secret = None
    db.session.commit()
    return jsonify({'message': 'TOTP disabled'}), 200

# --- Passkey Implementation ---
from fido2.webauthn import PublicKeyCredentialRpEntity, PublicKeyCredentialUserEntity, PublicKeyCredentialCreationOptions, PublicKeyCredentialParameters, PublicKeyCredentialType, AuthenticatorSelectionCriteria, UserVerificationRequirement, AttestationConveyancePreference
from fido2.server import Fido2Server
# from fido2.features import WebauthnForAll # Deprecated/Removed
from fido2.utils import websafe_encode, websafe_decode
from flask import session
from backend.models import Passkey

# Configure RP (Ralying Party)
rp = PublicKeyCredentialRpEntity(name="Task Tracker", id="localhost")

def verify_origin(origin):
    # Allow localhost development on any port
    return origin.startswith('http://localhost') or origin.startswith('https://localhost')

server = Fido2Server(rp, verify_origin=verify_origin)

@auth_bp.route('/passkey/register/options', methods=['POST'])
@login_required
def passkey_register_options():
    user = PublicKeyCredentialUserEntity(
        id=str(current_user.id).encode('utf-8'),
        name=current_user.email,
        display_name=current_user.name
    )
    
    # Get existing credentials to exclude
    existing_creds = [
        {'type': 'public-key', 'id': websafe_decode(pk.credential_id)}
        for pk in current_user.passkeys
    ]
    
    options, state = server.register_begin(
        user,
        existing_credentials=existing_creds,
        user_verification="preferred",
        authenticator_attachment="platform" # Prefer internal authenticators like TouchID
    )
    
    session['passkey_register_state'] = state
    return jsonify(dict(options)), 200

@auth_bp.route('/passkey/register/verify', methods=['POST'])
@login_required
def passkey_register_verify():
    data = request.get_json()
    if 'passkey_register_state' not in session:
        return jsonify({'error': 'No registration session'}), 400
        
    state = session['passkey_register_state']
    
    try:
        auth_data = server.register_complete(
            state,
            data
        )
        
        credential_id = websafe_encode(auth_data.credential_data.credential_id)
        public_key = websafe_encode(auth_data.credential_data.public_key)
        
        passkey = Passkey(
            user_id=current_user.id,
            credential_id=credential_id,
            public_key=public_key,
            sign_count=auth_data.credential_data.sign_count,
            name="Passkey" # Could allow user to name it
        )
        
        db.session.add(passkey)
        db.session.commit()
        
        del session['passkey_register_state']
        return jsonify({'message': 'Passkey registered'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/passkey/login/options', methods=['POST'])
def passkey_login_options():
    # If email provided, we can look up user to get allowed credentials (conditional UI)
    # For now, simplistic approach: require email first or use Resident Keys (Discoverable Credentials) if implemented.
    # We will implement the flow where user types email first.
    
    data = request.get_json()
    email = data.get('email')
    
    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal user existence? Or return generic error?
        # For passkeys, we usually verify email first in typical flows unless using resident keys.
        return jsonify({'error': 'User not found'}), 404
        
    credentials = [
        {'type': 'public-key', 'id': websafe_decode(pk.credential_id)}
        for pk in user.passkeys
    ]
    
    if not credentials:
        return jsonify({'error': 'No passkeys found for this user'}), 400

    options, state = server.authenticate_begin(
        credentials,
        user_verification="preferred"
    )
    
    session['passkey_login_state'] = state
    session['passkey_login_user_id'] = user.id
    
    return jsonify(dict(options)), 200

@auth_bp.route('/passkey/login/verify', methods=['POST'])
def passkey_login_verify():
    if 'passkey_login_state' not in session or 'passkey_login_user_id' not in session:
        return jsonify({'error': 'No login session'}), 400
        
    state = session['passkey_login_state']
    user_id = session['passkey_login_user_id']
    user = db.session.get(User, user_id)
    
    data = request.get_json()
    
    # Reconstruct credentials list for verification
    credentials = [
        websafe_decode(pk.credential_id) for pk in user.passkeys
    ]
    
    try:
        # Verify the assertion
        # Note: server.authenticate_complete returns the credential_id that matched
        cred_id = server.authenticate_complete(
            state,
            credentials,
            data
        )
        
        # Update sign count
        passkey = Passkey.query.filter_by(user_id=user.id, credential_id=websafe_encode(cred_id.credential_id)).first()
        if passkey:
           passkey.sign_count = cred_id.sign_count
           db.session.commit()

        login_user(user)
        
        # Cleanup session
        del session['passkey_login_state']
        del session['passkey_login_user_id']
        
        return jsonify({'message': 'Logged in with Passkey', 'user': {'id': user.id, 'name': user.name, 'email': user.email, 'is_admin': user.is_admin}}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/users', methods=['GET'])
@login_required
def get_users():
    users = User.query.with_entities(User.id, User.name, User.email).all()
    return jsonify([{'id': u.id, 'name': u.name, 'email': u.email} for u in users]), 200
