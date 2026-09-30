// Web Bluetooth client for the Pico W approval key (see firmware/pico_w/main.py).
// Requires a secure context (https or localhost) and a Chromium-based browser.

export const PICO_SERVICE_UUID = 'a3f1c0de-7a11-4e5b-9c1d-0a17a11e7001';
const RX_UUID = 'a3f1c0de-7a11-4e5b-9c1d-0a17a11e7002'; // phone -> device (challenge)
const TX_UUID = 'a3f1c0de-7a11-4e5b-9c1d-0a17a11e7003'; // device -> phone (MAC chunks)

interface GattCharacteristic {
  value?: DataView;
  startNotifications(): Promise<GattCharacteristic>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
  addEventListener(type: 'characteristicvaluechanged', listener: (e: Event) => void): void;
  removeEventListener(type: 'characteristicvaluechanged', listener: (e: Event) => void): void;
}
interface GattServer {
  connected: boolean;
  disconnect(): void;
  getPrimaryService(uuid: string): Promise<{ getCharacteristic(uuid: string): Promise<GattCharacteristic> }>;
}
interface BluetoothLike {
  requestDevice(opts: { filters: { services: string[] }[] }): Promise<{ gatt?: { connect(): Promise<GattServer> } }>;
}

const bluetooth = (): BluetoothLike | undefined =>
  typeof navigator === 'undefined' ? undefined : (navigator as unknown as { bluetooth?: BluetoothLike }).bluetooth;

export const isPicoSupported = (): boolean => Boolean(bluetooth());

const hexToBytes = (hex: string): Uint8Array => {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2) throw new Error('invalid hex');
  return Uint8Array.from(hex.match(/../g)!.map((b) => parseInt(b, 16)));
};
const toHex = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

/**
 * Sends the server challenge to the key and waits (up to `timeoutMs`) for the physical button press.
 * Resolves with the device MAC + id which the server verifies (POST /api/approvals/:id/device).
 */
export async function requestPicoApproval(
  challengeHex: string,
  timeoutMs = 35_000,
): Promise<{ deviceId: string; mac: string }> {
  const bt = bluetooth();
  if (!bt) throw new Error('このブラウザはWeb Bluetoothに対応していません');
  const challenge = hexToBytes(challengeHex);
  if (challenge.length !== 32) throw new Error('invalid challenge');

  const device = await bt.requestDevice({ filters: [{ services: [PICO_SERVICE_UUID] }] });
  if (!device.gatt) throw new Error('GATTに接続できません');
  const server = await device.gatt.connect();

  try {
    const service = await server.getPrimaryService(PICO_SERVICE_UUID);
    const tx = await service.getCharacteristic(TX_UUID);
    const rx = await service.getCharacteristic(RX_UUID);

    const chunks = new Map<number, Uint8Array>();
    let listener!: (e: Event) => void;

    const result = new Promise<{ deviceId: string; mac: string }>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Pico Wのボタン承認がタイムアウトしました')), timeoutMs);
      listener = (e: Event) => {
        const v = (e.target as unknown as GattCharacteristic).value;
        if (!v) return;
        const bytes = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
        if (bytes[0] === 0xff) {
          clearTimeout(timer);
          return reject(new Error('Pico Wで承認されませんでした（時間切れ／未押下）'));
        }
        chunks.set(bytes[0], bytes.slice(1));
        if (chunks.has(0) && chunks.has(1) && chunks.has(2)) {
          clearTimeout(timer);
          const mac = new Uint8Array(32);
          mac.set(chunks.get(0)!, 0);
          mac.set(chunks.get(1)!, 16);
          resolve({ mac: toHex(mac), deviceId: toHex(chunks.get(2)!) });
        }
      };
      tx.addEventListener('characteristicvaluechanged', listener);
    });

    await tx.startNotifications();
    await rx.writeValueWithResponse(challenge);
    try {
      return await result;
    } finally {
      tx.removeEventListener('characteristicvaluechanged', listener);
    }
  } finally {
    if (server.connected) server.disconnect();
  }
}
