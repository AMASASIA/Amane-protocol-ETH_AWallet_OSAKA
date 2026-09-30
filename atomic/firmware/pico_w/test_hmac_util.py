"""Run on a PC:  python3 firmware/pico_w/test_hmac_util.py
Checks the firmware HMAC against (a) the stdlib and (b) the vector produced by the Node server code
(server/test/firmware-vector.test.mjs asserts the same constant)."""
import hashlib, hmac, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from hmac_util import approval_mac, hmac_sha256

SECRET = bytes.fromhex("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
DEVICE_ID = bytes.fromhex("e6614103e7a5a237")
CHALLENGE = bytes(range(32))
NODE_VECTOR = "c724c5214fed46bb23801b97ecc66319c0306ba0ab5f909de208869c4a99dea8"

for key in (b"k", os.urandom(32), os.urandom(64), os.urandom(100)):
    msg = os.urandom(77)
    assert hmac_sha256(key, msg) == hmac.new(key, msg, hashlib.sha256).digest()

mac = approval_mac(SECRET, DEVICE_ID, CHALLENGE).hex()
assert mac == NODE_VECTOR, (mac, NODE_VECTOR)
print("OK firmware HMAC == stdlib == server vector:", mac)
