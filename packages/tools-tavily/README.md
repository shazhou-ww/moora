# @moora/tools-tavily

Tavily tools for Moora toolkit. Provides `tavily-search` and `tavily-browse` capabilities using the [Tavily API](https://tavily.com/).

## Installation

```bash
bun add @moora/tools-tavily
```

## Usage

### Create Tavily Toolkit

```typescript
import { createTavilyToolkit } from "@moora/tools-tavily";

const toolkit = createTavilyToolkit({
  apiKey: process.env.TAVILY_API_KEY!,
});

// Get available tools
console.log(toolkit.getToolNames()); // ["tavily-search", "tavily-browse"]
```

### Tavily Search

Search the web for information:

```typescript
const searchResult = await toolkit.invoke(
  "tavily-search",
  JSON.stringify({
    query: "What is TypeScript?",
    searchDepth: "basic", // or "advanced"
    maxResults: 5,
  })
);

const parsed = JSON.parse(searchResult);
console.log(parsed.results);
// [{ title, url, content, score }, ...]
```

#### Search Parameters

| Parameter         | Type     | Required | Description                           |
| ----------------- | -------- | -------- | ------------------------------------- |
| query             | string   | Yes      | The search query                      |
| searchDepth       | string   | No       | "basic" or "advanced" (default: basic)|
| includeRawContent | boolean  | No       | Include full page content             |
| maxResults        | number   | No       | Max results (1-10, default: 5)        |
| includeDomains    | string[] | No       | Only include these domains            |
| excludeDomains    | string[] | No       | Exclude these domains                 |

### Tavily Browse (Extract)

Extract content from specific URLs:

```typescript
const browseResult = await toolkit.invoke(
  "tavily-browse",
  JSON.stringify({
    urls: [
      "https://www.typescriptlang.org/",
      "https://nodejs.org/",
    ],
  })
);

const parsed = JSON.parse(browseResult);
console.log(parsed.results);
// [{ url, rawContent }, ...]
console.log(parsed.failedResults);
// URLs that failed to extract
```

#### Browse Parameters

| Parameter | Type     | Required | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| urls      | string[] | Yes      | URLs to extract (up to 20)     |

## Creating Individual Tools

You can also create individual tools:

```typescript
import {
  createTavilySearchTool,
  createTavilyBrowseTool,
  createTavilyTools,
} from "@moora/tools-tavily";

const config = { apiKey: "your-api-key" };

// Create individual tools
const searchTool = createTavilySearchTool(config);
const browseTool = createTavilyBrowseTool(config);

// Or create all tools at once
const allTools = createTavilyTools(config);
```

## Merging with Other Toolkits

```typescript
import { mergeToolkits } from "@moora/toolkit";
import { createTavilyToolkit } from "@moora/tools-tavily";
import { createMyCustomToolkit } from "./my-toolkit";

const toolkit = mergeToolkits([
  createTavilyToolkit({ apiKey: process.env.TAVILY_API_KEY! }),
  createMyCustomToolkit(),
]);
```

## Environment Variables

Set your Tavily API key:

```bash
export TAVILY_API_KEY=tvly-YOUR_API_KEY
```

Get your API key from [Tavily](https://tavily.com/).

## License

MIT
