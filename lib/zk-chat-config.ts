export const CIRCUIT_WASM_PATH = "/zk/message.wasm"
export const CIRCUIT_ZKEY_PATH = "/zk/message.zkey"
// trim whitespace and strip any wrapping quotes
export const ZK_CHAT_API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")