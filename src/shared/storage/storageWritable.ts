/** True when the browser lets us write to localStorage. */
export function storageWritable(): boolean {
  try {
    localStorage.setItem("membetter.probe", "1");
    localStorage.removeItem("membetter.probe");
    return true;
  } catch {
    return false;
  }
}
