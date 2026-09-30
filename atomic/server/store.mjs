import fs from "node:fs";
import path from "node:path";

/** Tiny JSON-file store (demo scale: <= 20 members). Writes are atomic (tmp + rename). */
export function createStore(file) {
  let data = { users: {}, devices: {}, mints: {} };
  if (file && fs.existsSync(file)) data = { ...data, ...JSON.parse(fs.readFileSync(file, "utf8")) };

  const persist = () => {
    if (!file) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file);
  };

  const key = (a) => a.toLowerCase();
  return {
    getUser: (address) => data.users[key(address)] || null,
    saveUser(address, user) {
      data.users[key(address)] = user;
      persist();
    },
    getDevice: (id) => data.devices[id.toLowerCase()] || null,
    saveDevice(id, device) {
      data.devices[id.toLowerCase()] = device;
      persist();
    },
    getMint: (address) => data.mints[key(address)] || null,
    saveMint(address, mint) {
      data.mints[key(address)] = mint;
      persist();
    },
  };
}
