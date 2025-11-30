// ============================================================================
// 时间戳生成器
// ============================================================================

/**
 * 创建时间戳生成器
 *
 * 如果在同一毫秒内有多个 Input，自动 +1 避免冲突。
 *
 * @returns 时间戳生成函数
 *
 * @example
 * ```typescript
 * const createTimestamp = createTimestampGenerator();
 *
 * const ts1 = createTimestamp(); // 1234567890000
 * const ts2 = createTimestamp(); // 1234567890001 (如果在同一毫秒内)
 * ```
 */
export const createTimestampGenerator = (): (() => number) => {
  let lastTimestamp = 0;

  return (): number => {
    const now = Date.now();
    if (now <= lastTimestamp) {
      lastTimestamp += 1;
    } else {
      lastTimestamp = now;
    }
    return lastTimestamp;
  };
};

/**
 * 生成消息 ID
 *
 * @returns 唯一的消息 ID
 *
 * @example
 * ```typescript
 * const messageId = generateMessageId();
 * // "msg-1234567890-abcd1234"
 * ```
 */
export const generateMessageId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `msg-${timestamp}-${random}`;
};

