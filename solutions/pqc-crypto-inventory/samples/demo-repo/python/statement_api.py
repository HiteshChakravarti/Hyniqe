import hashlib
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes

def session_key():
    return ec.generate_private_key(ec.SECP256R1())

def file_id(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def legacy_id(data: bytes) -> str:
    # kept for old clients
    return hashlib.sha1(data).hexdigest()
