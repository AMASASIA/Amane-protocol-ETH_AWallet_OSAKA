# Pure helper (runs on MicroPython and CPython). Must match server/devices.mjs computeMac():
#   MAC = HMAC-SHA256(secret, b"AW1|" + device_id(raw bytes) + challenge(32 bytes))
import hashlib

DOMAIN = b"AW1|"


def hmac_sha256(key, msg):
    if len(key) > 64:
        key = hashlib.sha256(key).digest()
    key = key + b"\x00" * (64 - len(key))
    o_pad = bytes([b ^ 0x5C for b in key])
    i_pad = bytes([b ^ 0x36 for b in key])
    return hashlib.sha256(o_pad + hashlib.sha256(i_pad + msg).digest()).digest()


def approval_mac(secret, device_id, challenge):
    return hmac_sha256(secret, DOMAIN + device_id + challenge)
