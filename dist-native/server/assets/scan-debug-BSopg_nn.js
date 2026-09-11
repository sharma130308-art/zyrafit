const listeners = /* @__PURE__ */ new Set();
function read() {
  return [];
}
function logScan(step, status = "info", detail) {
  const safeDetail = detail ? String(detail).slice(0, 800) : void 0;
  const fn = status === "error" ? console.error : status === "ok" ? console.info : console.log;
  fn(`[scan] ${step}`, safeDetail ?? "");
  return;
}
function getScanDebug() {
  return read();
}
function clearScanDebug() {
}
function subscribeScanDebug(listener) {
  listeners.add(listener);
  listener(read());
  return () => {
    listeners.delete(listener);
  };
}
export {
  clearScanDebug,
  getScanDebug,
  logScan,
  subscribeScanDebug
};
