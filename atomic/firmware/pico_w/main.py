# AWallet hardware approval key - Raspberry Pi Pico W (MicroPython >= 1.22, BLE peripheral)
#
# Flow (Tier 2 approval):
#   1. The phone (Web Bluetooth) writes the 32-byte action challenge from the server.
#   2. The LED turns on. The user must RELEASE, then PRESS the physical button on GP15
#      (button between GP15 and GND) within 30 s. A held-down / taped button is ignored.
#   3. The device replies with MAC = HMAC-SHA256(device_secret, "AW1|" + device_id + challenge)
#      as three notifications: [0x00]+mac[0:16], [0x01]+mac[16:32], [0x02]+device_id(8).
#      Timeout / released BLE link: [0xFF].
#   4. The phone forwards the MAC to POST /api/approvals/:id/device; the server verifies it.
#
# The secret is generated on first boot (os.urandom) and printed ONCE on the USB serial console:
#   ENROLL deviceId=<hex> secret=<hex>
# Register it with:  curl -X POST $SERVER/api/devices/enroll -H "X-Admin-Token: $ADMIN_TOKEN" \
#   -H "content-type: application/json" -d '{"deviceId":"<hex>","secret":"<hex>"}'
import bluetooth
import machine
import os
import time
import ubinascii
from micropython import const

from hmac_util import approval_mac

_IRQ_CENTRAL_CONNECT = const(1)
_IRQ_CENTRAL_DISCONNECT = const(2)
_IRQ_GATTS_WRITE = const(3)

SERVICE_UUID = "a3f1c0de-7a11-4e5b-9c1d-0a17a11e7001"
RX_UUID = "a3f1c0de-7a11-4e5b-9c1d-0a17a11e7002"  # phone -> device: challenge (write)
TX_UUID = "a3f1c0de-7a11-4e5b-9c1d-0a17a11e7003"  # device -> phone: MAC chunks (notify)
NAME = "AWallet-Key"

BUTTON_PIN = 15
APPROVE_WINDOW_MS = 30_000
SECRET_FILE = "device_secret.bin"

led = machine.Pin("LED", machine.Pin.OUT)
button = machine.Pin(BUTTON_PIN, machine.Pin.IN, machine.Pin.PULL_UP)  # pressed = 0

device_id = machine.unique_id()
device_id_hex = ubinascii.hexlify(device_id).decode()


def load_secret():
    try:
        with open(SECRET_FILE, "rb") as f:
            s = f.read()
        if len(s) == 32:
            return s
    except OSError:
        pass
    s = os.urandom(32)
    with open(SECRET_FILE, "wb") as f:
        f.write(s)
    print("ENROLL deviceId=%s secret=%s" % (device_id_hex, ubinascii.hexlify(s).decode()))
    return s


secret = load_secret()
print("device_id", device_id_hex)


def uuid_bytes(u):
    return bytes(reversed(ubinascii.unhexlify(u.replace("-", ""))))


def adv_field(t, value):
    return bytes([len(value) + 1, t]) + value


ble = bluetooth.BLE()
ble.active(True)
((h_rx, h_tx),) = ble.gatts_register_services(
    (
        (
            bluetooth.UUID(SERVICE_UUID),
            (
                (bluetooth.UUID(RX_UUID), bluetooth.FLAG_WRITE),
                (bluetooth.UUID(TX_UUID), bluetooth.FLAG_NOTIFY),
            ),
        ),
    )
)
ble.gatts_set_buffer(h_rx, 64)

conn = None
incoming = None  # challenge written by the phone (handled in main loop, not in the IRQ)


def advertise():
    adv = adv_field(0x01, b"\x06") + adv_field(0x09, NAME.encode())
    resp = adv_field(0x07, uuid_bytes(SERVICE_UUID))  # complete list of 128-bit UUIDs
    ble.gap_advertise(100_000, adv_data=adv, resp_data=resp)


def irq(event, data):
    global conn, incoming
    if event == _IRQ_CENTRAL_CONNECT:
        conn = data[0]
    elif event == _IRQ_CENTRAL_DISCONNECT:
        conn = None
        advertise()
    elif event == _IRQ_GATTS_WRITE and data[1] == h_rx:
        incoming = ble.gatts_read(h_rx)


ble.irq(irq)
advertise()


def notify(payload):
    if conn is not None:
        ble.gatts_notify(conn, h_tx, payload)


def wait_for_press(challenge):
    """True only after a fresh release -> press cycle inside the approval window."""
    led.on()
    start = time.ticks_ms()
    armed = False
    while time.ticks_diff(time.ticks_ms(), start) < APPROVE_WINDOW_MS:
        if conn is None:
            break
        if button.value() == 1:
            armed = True  # released: now a real press can count
        elif armed:
            time.sleep_ms(30)  # debounce
            if button.value() == 0:
                return True
        time.sleep_ms(10)
    return False


while True:
    if incoming is not None:
        ch, incoming = bytes(incoming), None
        if len(ch) == 32 and wait_for_press(ch):
            mac = approval_mac(secret, device_id, ch)
            notify(b"\x00" + mac[:16])
            time.sleep_ms(60)
            notify(b"\x01" + mac[16:])
            time.sleep_ms(60)
            notify(b"\x02" + device_id)
            for _ in range(3):  # confirmation blink
                led.off(); time.sleep_ms(80); led.on(); time.sleep_ms(80)
        else:
            notify(b"\xff")
        led.off()
    time.sleep_ms(20)
