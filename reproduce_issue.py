
from passlib.context import CryptContext
import sys

print("Initializing CryptContext...")
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    print("Hashing password...")
    hash = pwd_context.hash("password123")
    print(f"Hash: {hash}")
    print("Verifying...")
    valid = pwd_context.verify("password123", hash)
    print(f"Valid: {valid}")
except Exception as e:
    print(f"CRASHED: {e}")
    import traceback
    traceback.print_exc()

import bcrypt
print(f"Bcrypt version: {bcrypt.__version__}")
