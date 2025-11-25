# TaskRunner 核心概念

本文档说明 TaskRunner、Channel、Message 之间的关系以及它们的 ID 计算规则。

## 核心实体

### 1. TaskRunner

TaskRunner 是一个 moorex 自动机，代表 AI Agent 为达成特定任务目标而进行的一系列心理活动。

**ID 规则：**
- 每个 TaskRunner 有一个唯一的 `TaskRunnerId`，表示为 128 位 hash 值的 16 进制字符串（32 个字符）
- 顶层 TaskRunner 的 ID 通过 `computeTopLevelTaskRunnerId(seed)` 计算，使用唯一整数种子值生成
- 子 TaskRunner 的 ID 通过 `computeSubTaskRunnerId(parentId, ordinal)` 计算：
  - 输入：父 TaskRunner 的 ID（128 位）+ 子 TaskRunner 的序数（64 位）
  - 输出：128 位 hash 的 16 进制字符串
  - 只要确保顶层 TaskRunner 的 ID 是唯一的，那么每个 TaskRunner 的 ID 就是唯一的（忽略 hash 冲突的情况）

**示例：**
```typescript
// 顶层 TaskRunner
const topLevelId = computeTopLevelTaskRunnerId(12345);
// 返回: "a1b2c3d4e5f6789012345678901234abcd"

// 第一个子 TaskRunner（序数 0）
const childId0 = computeSubTaskRunnerId(topLevelId, 0);
// 返回: "f6e5d4c3b2a1987654321098765432fedc"

// 第二个子 TaskRunner（序数 1）
const childId1 = computeSubTaskRunnerId(topLevelId, 1);
// 返回: "1234567890abcdef1234567890abcdef12"
```

### 2. Channel

Channel 是 TaskRunner 之间或 TaskRunner 与外部系统之间的通信通道。每个 Channel 都是双向交替通讯的。

**Channel 的两端：**
- **主动端（Active End）**：主动发起通信的一端
- **从动端（Passive End）**：被动接收通信的一端

**Channel 与 TaskRunner 的关系：**
- 每个 TaskRunner 都有一个 0 号 Channel（上游 channel），连接到上游系统（不一定是 TaskRunner）
- 每个 TaskRunner 可以有多个非 0 号 Channel（下游 channels），连接到下游 TaskRunners
- **关键规则：**
  - 每个 TaskRunner 都是它的 **0 号 Channel 的从动端**
  - 每个 TaskRunner 是它的 **非 0 号 Channel 的主动端**

**ID 规则：**
- Channel 的 ID 等于其**从动端的 TaskRunner ID**
- 因此：
  - TaskRunner 的 0 号 Channel 的 ID = 该 TaskRunner 的 ID
  - TaskRunner 的非 0 号 Channel 的 ID = 对应子 TaskRunner 的 ID

**示例：**
```typescript
// 假设有一个 TaskRunner，ID 为 "a1b2c3d4..."
const taskRunnerId = "a1b2c3d4e5f6789012345678901234abcd";

// 该 TaskRunner 的 0 号 Channel 的 ID（从动端是自己）
const channel0Id = computeChannelId(taskRunnerId);
// channel0Id === taskRunnerId === "a1b2c3d4e5f6789012345678901234abcd"

// 假设该 TaskRunner 创建了一个子 TaskRunner，ID 为 "f6e5d4c3..."
const childId = "f6e5d4c3b2a1987654321098765432fedc";

// 父 TaskRunner 连接到该子 TaskRunner 的 Channel 的 ID（从动端是子 TaskRunner）
const channelToChildId = computeChannelId(childId);
// channelToChildId === childId === "f6e5d4c3b2a1987654321098765432fedc"
```

### 3. Message

Message 是在 Channel 上传输的消息。每个 Channel 都是先主动端，再从动端，交替发送消息。

**ID 规则：**
- 每个 Message 有一个全局唯一的 `MessageId`
- 格式：`[channel id]-[message index]`
- `message index` 是自然数序号（从 0 开始），表示消息在 Channel 中的顺序
- 由于 Channel ID 是全局唯一的，且每个 Channel 内的消息序号是递增的，因此 Message ID 也是全局唯一的

**示例：**
```typescript
const channelId = "a1b2c3d4e5f6789012345678901234abcd";

// 第一条消息（主动端发送）
const messageId0 = computeMessageId(channelId, 0);
// 返回: "a1b2c3d4e5f6789012345678901234abcd-0"

// 第二条消息（从动端回复）
const messageId1 = computeMessageId(channelId, 1);
// 返回: "a1b2c3d4e5f6789012345678901234abcd-1"

// 第三条消息（主动端再次发送）
const messageId2 = computeMessageId(channelId, 2);
// 返回: "a1b2c3d4e5f6789012345678901234abcd-2"
```

## 关系总结

```
顶层 TaskRunner (ID: "top123...")
├── 0 号 Channel (ID: "top123...", 从动端: 顶层 TaskRunner)
│   ├── Message 0 (ID: "top123...-0")
│   ├── Message 1 (ID: "top123...-1")
│   └── ...
│
└── 子 TaskRunner 1 (ID: "child1...")
    ├── 0 号 Channel (ID: "child1...", 从动端: 子 TaskRunner 1)
    │   ├── Message 0 (ID: "child1...-0")
    │   └── ...
    │
    └── 子 TaskRunner 2 (ID: "child2...")
        └── 0 号 Channel (ID: "child2...", 从动端: 子 TaskRunner 2)
            └── ...
```

## ID 唯一性保证

1. **TaskRunner ID 唯一性：**
   - 顶层 TaskRunner 的 ID 通过唯一种子值生成，确保唯一性
   - 子 TaskRunner 的 ID 通过父 ID + 序数计算，由于父 ID 唯一且序数在父节点内唯一，因此子 ID 也唯一

2. **Channel ID 唯一性：**
   - Channel ID = 从动端 TaskRunner ID
   - 由于 TaskRunner ID 唯一，因此 Channel ID 也唯一

3. **Message ID 唯一性：**
   - Message ID = `[Channel ID]-[消息序号]`
   - 由于 Channel ID 唯一，且消息序号在 Channel 内递增，因此 Message ID 全局唯一

## 实现细节

### Hash 算法

- 使用 `xxh3-ts` 库的 `XXH3_128` 函数生成 128 位 hash
- Hash 结果转换为 16 进制字符串（32 个字符）

### 顶层 TaskRunner ID 计算

顶层 TaskRunner ID 的计算过程：
1. 将整数种子值（number，64 位）转换为 8 字节的 little-endian 格式
2. 对字节数据计算 128 位 hash
3. 将 hash 结果转换为 16 进制字符串

### 子 TaskRunner ID 计算

子 TaskRunner ID 的计算过程：
1. 将父 ID（16 进制字符串）转换为字节数组（16 字节）
2. 将序数（number，64 位）转换为 8 字节的 little-endian 格式
3. 将两者拼接（共 24 字节）
4. 对拼接后的数据计算 128 位 hash
5. 将 hash 结果转换为 16 进制字符串

这样可以确保：
- 相同的父 ID + 相同的序数 → 相同的子 ID
- 不同的父 ID 或不同的序数 → 不同的子 ID（忽略 hash 冲突）

## 使用示例

```typescript
import {
  computeTopLevelTaskRunnerId,
  computeSubTaskRunnerId,
  computeChannelId,
  computeMessageId,
  parseMessageId,
} from './id-utils';

// 1. 创建顶层 TaskRunner
const topLevelId = computeTopLevelTaskRunnerId(12345);

// 2. 创建子 TaskRunner
const childId = computeSubTaskRunnerId(topLevelId, 0);

// 3. 获取 Channel ID
const channelId = computeChannelId(childId); // 等于 childId

// 4. 创建消息 ID
const messageId = computeMessageId(channelId, 0);

// 5. 解析消息 ID
const { channelId: parsedChannelId, messageIndex } = parseMessageId(messageId);
```

