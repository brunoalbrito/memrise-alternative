import { AiError } from "./errors";

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function wavHeader(dataLength: number): Uint8Array {
  const sampleRate = 24000;
  const channels = 1;
  const bits = 16;
  const header = new DataView(new ArrayBuffer(44));
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) header.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, "RIFF");
  header.setUint32(4, 36 + dataLength, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, channels, true);
  header.setUint32(24, sampleRate, true);
  header.setUint32(28, (sampleRate * channels * bits) / 8, true);
  header.setUint16(32, (channels * bits) / 8, true);
  header.setUint16(34, bits, true);
  writeText(36, "data");
  header.setUint32(40, dataLength, true);
  return new Uint8Array(header.buffer);
}

/** WAV blob from base64 audio. Raw 24 kHz mono 16-bit PCM is wrapped in a WAV header. */
export function audioBlobFromBase64(base64: string): Blob {
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(base64);
  } catch {
    throw new AiError("audio");
  }
  if (bytes.length === 0) throw new AiError("audio");
  const isWav =
    bytes.length > 12 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF";
  const parts: BlobPart[] = isWav
    ? [bytes as BlobPart]
    : [wavHeader(bytes.length) as BlobPart, bytes as BlobPart];
  return new Blob(parts, { type: "audio/wav" });
}
