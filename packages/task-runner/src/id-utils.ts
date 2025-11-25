import { XXH3_128 } from 'xxh3-ts';

// ============================================================================
// ID 计算工具
// ============================================================================

/**
 * TaskRunner ID 类型
 * 
 * 128 位 hash 值的 16 进制字符串表示（32 个字符）
 */
export type TaskRunnerId = string;

/**
 * Channel ID 类型
 * 
 * Channel 的 ID 等于其从动端的 TaskRunner ID
 */
export type ChannelId = TaskRunnerId;

/**
 * Message ID 类型
 * 
 * 格式：`[channel id]-[message index]`
 * 例如：`"a1b2c3d4e5f6...-0"`, `"a1b2c3d4e5f6...-1"`
 */
export type MessageId = string;

/**
 * 计算顶层 TaskRunner 的 ID
 * 
 * 使用提供的整数种子值生成 128 位 hash，返回 16 进制字符串。
 * 
 * @param seed - 用于生成顶层 TaskRunner ID 的唯一整数种子值（通常是随机生成或基于某些唯一标识）
 * @returns 128 位 hash 的 16 进制字符串（32 个字符）
 * 
 * @example
 * ```typescript
 * const topLevelId = computeTopLevelTaskRunnerId(12345);
 * // 返回: "a1b2c3d4e5f6789012345678901234abcd"
 * ```
 */
export function computeTopLevelTaskRunnerId(seed: number): TaskRunnerId {
  // 将整数转换为 8 字节的 little-endian 格式（64 位）
  const seedBytes = new Uint8Array(8);
  const dataView = new DataView(seedBytes.buffer);
  dataView.setBigUint64(0, BigInt(seed), true); // true = little-endian
  
  // XXH3_128 需要 Buffer 类型，但为了跨平台兼容性，我们直接传递 Uint8Array
  // 在 Node.js 中，Buffer 是 Uint8Array 的子类，所以可以直接使用
  // 在浏览器中，我们需要确保 xxh3-ts 支持 Uint8Array，或者使用 buffer polyfill
  const hash = XXH3_128(seedBytes as any);
  // 将 bigint 转换为 16 进制字符串（128 位 = 32 个 16 进制字符）
  return hash.toString(16).padStart(32, '0');
}

/**
 * 计算子 TaskRunner 的 ID
 * 
 * 使用父 TaskRunner 的 ID（128 位）和子 TaskRunner 的序数（64 位）计算 128 位 hash。
 * 
 * 计算方式：
 * 1. 将父 ID（16 进制字符串）转换为字节
 * 2. 将序数（number，64 位）转换为 8 字节的 little-endian 格式
 * 3. 将两者拼接后计算 hash
 * 
 * @param parentId - 父 TaskRunner 的 ID（128 位 hash 的 16 进制字符串）
 * @param ordinal - 子 TaskRunner 的序数（64 位整数，从 0 开始）
 * @returns 128 位 hash 的 16 进制字符串（32 个字符）
 * 
 * @example
 * ```typescript
 * const parentId = "a1b2c3d4e5f6789012345678901234abcd";
 * const childId = computeSubTaskRunnerId(parentId, 0); // 第一个子 TaskRunner
 * const childId2 = computeSubTaskRunnerId(parentId, 1); // 第二个子 TaskRunner
 * ```
 */
export function computeSubTaskRunnerId(
  parentId: TaskRunnerId,
  ordinal: number,
): TaskRunnerId {
  // 将父 ID（16 进制字符串）转换为字节数组
  const parentBytes = hexStringToBytes(parentId);
  
  // 将序数转换为 8 字节的 little-endian 格式（64 位）
  const ordinalBytes = new Uint8Array(8);
  const dataView = new DataView(ordinalBytes.buffer);
  dataView.setBigUint64(0, BigInt(ordinal), true); // true = little-endian
  
  // 拼接父 ID 字节和序数字节
  const combined = new Uint8Array(parentBytes.length + ordinalBytes.length);
  combined.set(parentBytes, 0);
  combined.set(ordinalBytes, parentBytes.length);
  
  // 计算 128 位 hash
  // XXH3_128 需要 Buffer 类型，但为了跨平台兼容性，我们直接传递 Uint8Array
  // 在 Node.js 中，Buffer 是 Uint8Array 的子类，所以可以直接使用
  // 在浏览器中，我们需要确保 xxh3-ts 支持 Uint8Array，或者使用 buffer polyfill
  const hash = XXH3_128(combined as any);
  
  // 将 bigint 转换为 16 进制字符串（128 位 = 32 个 16 进制字符）
  return hash.toString(16).padStart(32, '0');
}

/**
 * 计算 Channel 的 ID
 * 
 * Channel 的 ID 等于其从动端的 TaskRunner ID。
 * 
 * 规则：
 * - 每个 TaskRunner 都是它的 0 号 Channel 的从动端
 * - 每个 TaskRunner 是它的非 0 号 Channel 的主动端
 * - 因此，Channel ID = 从动端 TaskRunner ID
 * 
 * @param passiveEndTaskRunnerId - 从动端 TaskRunner 的 ID
 * @returns Channel ID（等于从动端 TaskRunner ID）
 * 
 * @example
 * ```typescript
 * const taskRunnerId = "a1b2c3d4e5f6789012345678901234abcd";
 * const channelId = computeChannelId(taskRunnerId);
 * // channelId === taskRunnerId
 * ```
 */
export function computeChannelId(
  passiveEndTaskRunnerId: TaskRunnerId,
): ChannelId {
  // Channel ID 直接等于从动端的 TaskRunner ID
  return passiveEndTaskRunnerId;
}

/**
 * 计算 Message 的 ID
 * 
 * Message ID 格式：`[channel id]-[message index]`
 * 
 * 规则：
 * - 每个 Channel 都是先主动端，再从动端，交替发送消息
 * - 给每个消息一个自然数序号（从 0 开始）
 * - Message ID = `[channel id]-[message index]`
 * 
 * @param channelId - Channel 的 ID
 * @param messageIndex - 消息在 Channel 中的序号（自然数，从 0 开始）
 * @returns Message ID
 * 
 * @example
 * ```typescript
 * const channelId = "a1b2c3d4e5f6789012345678901234abcd";
 * const messageId0 = computeMessageId(channelId, 0); // "a1b2c3d4e5f6789012345678901234abcd-0"
 * const messageId1 = computeMessageId(channelId, 1); // "a1b2c3d4e5f6789012345678901234abcd-1"
 * ```
 */
export function computeMessageId(
  channelId: ChannelId,
  messageIndex: number,
): MessageId {
  return `${channelId}-${messageIndex}`;
}

/**
 * 从 Message ID 解析出 Channel ID 和消息序号
 * 
 * @param messageId - Message ID
 * @returns 包含 channelId 和 messageIndex 的对象
 * 
 * @example
 * ```typescript
 * const parsed = parseMessageId("a1b2c3d4e5f6789012345678901234abcd-5");
 * // { channelId: "a1b2c3d4e5f6789012345678901234abcd", messageIndex: 5 }
 * ```
 */
export function parseMessageId(messageId: MessageId): {
  channelId: ChannelId;
  messageIndex: number;
} {
  const lastDashIndex = messageId.lastIndexOf('-');
  if (lastDashIndex === -1) {
    throw new Error(`Invalid message ID format: ${messageId}`);
  }
  
  const channelId = messageId.substring(0, lastDashIndex);
  const messageIndex = parseInt(messageId.substring(lastDashIndex + 1), 10);
  
  if (isNaN(messageIndex)) {
    throw new Error(`Invalid message index in message ID: ${messageId}`);
  }
  
  return { channelId, messageIndex };
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 将 16 进制字符串转换为字节数组
 * 
 * @param hexString - 16 进制字符串（必须是偶数长度）
 * @returns Uint8Array 字节数组
 */
function hexStringToBytes(hexString: string): Uint8Array {
  if (hexString.length % 2 !== 0) {
    throw new Error(`Hex string must have even length: ${hexString}`);
  }
  
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return bytes;
}

