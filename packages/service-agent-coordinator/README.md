# @moora/service-agent-coordinator

基于 ElysiaJS 的 Coordinator Agent Service 实现

## 概述

这个包提供了一个基于 ElysiaJS 的 Coordinator Agent Service，使用 MOOREX 方法论实现多 Actor 协调系统。

## 安装

```bash
bun add @moora/service-agent-coordinator
```

## 快速开始

```typescript
import { createService } from '@moora/service-agent-coordinator';

const app = createService({
  openai: {
    endpoint: {
      url: 'https://api.openai.com/v1',
      key: process.env.OPENAI_API_KEY!,
    },
    model: 'gpt-4',
  },
  prompt: 'You are a coordinator assistant.',
});

app.listen(3000);
```

## License

MIT
