# @moora/tools-workspace

Workspace tools for Moora toolkit. Provides file and directory operations within a secure workspace directory.

## Installation

```bash
bun add @moora/tools-workspace
```

## Usage

### Create Workspace Toolkit

```typescript
import { createWorkspaceToolkit } from "@moora/tools-workspace";

const toolkit = createWorkspaceToolkit({
  rootPath: "./workspace", // Required: workspace root directory path
});

// Get available tools
console.log(toolkit.getToolNames());
// ["workspace-write-file", "workspace-read-file", "workspace-read-directory", "workspace-delete"]
```

### Write File

Write content to a file in the workspace. If the file doesn't exist, it will be created. If the directory doesn't exist, it will be created automatically.

```typescript
const writeResult = await toolkit.invoke(
  "workspace-write-file",
  JSON.stringify({
    path: "example.txt",
    content: "Hello, World!",
  })
);

const parsed = JSON.parse(writeResult);
console.log(parsed);
// { success: true, path: "/absolute/path/to/workspace/example.txt" }
```

#### Write File Parameters

| Parameter | Type   | Required | Description                                    |
| --------- | ------ | -------- | ---------------------------------------------- |
| path      | string | Yes      | File path relative to workspace root directory |
| content   | string | Yes      | File content to write                           |

### Read File

Read content from a file in the workspace.

```typescript
const readResult = await toolkit.invoke(
  "workspace-read-file",
  JSON.stringify({
    path: "example.txt",
  })
);

const parsed = JSON.parse(readResult);
if (parsed.success) {
  console.log(parsed.content); // "Hello, World!"
} else {
  console.error(parsed.error);
}
```

#### Read File Parameters

| Parameter | Type   | Required | Description                                    |
| --------- | ------ | -------- | ---------------------------------------------- |
| path      | string | Yes      | File path relative to workspace root directory |

### Read Directory

Read directory contents in the workspace. Returns a list of files and subdirectories.

```typescript
const dirResult = await toolkit.invoke(
  "workspace-read-directory",
  JSON.stringify({
    path: ".",
  })
);

const parsed = JSON.parse(dirResult);
if (parsed.success) {
  console.log(parsed.items);
  // [{ name: "example.txt", type: "file" }, { name: "subdir", type: "directory" }, ...]
}
```

#### Read Directory Parameters

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| path      | string | Yes      | Directory path relative to workspace root directory |

### Delete File or Directory

Delete a file or directory in the workspace. For directories, set `recursive` to `true` to delete recursively.

```typescript
// Delete a file
const deleteResult = await toolkit.invoke(
  "workspace-delete",
  JSON.stringify({
    path: "example.txt",
  })
);

// Delete a directory recursively
const deleteDirResult = await toolkit.invoke(
  "workspace-delete",
  JSON.stringify({
    path: "subdir",
    recursive: true,
  })
);

const parsed = JSON.parse(deleteResult);
if (parsed.success) {
  console.log("Deleted successfully");
} else {
  console.error(parsed.error);
}
```

#### Delete Parameters

| Parameter | Type    | Required | Description                                      |
| --------- | ------- | -------- | ------------------------------------------------ |
| path      | string  | Yes      | File or directory path relative to workspace root |
| recursive | boolean | No       | Whether to delete recursively (default: false)    |

## Security

All file operations are restricted to the workspace directory. The toolkit prevents path traversal attacks (e.g., using `../` to access files outside the workspace) by:

1. Normalizing all paths
2. Validating that resolved paths are within the workspace root
3. Preventing deletion of the workspace root directory itself

## Configuration

The workspace root path must be provided when creating the toolkit. Services should read from environment variables and pass it to the toolkit:

```typescript
// In your service code
const workspacePath = process.env.WORKSPACE_PATH;
if (workspacePath) {
  const toolkit = createWorkspaceToolkit({ rootPath: workspacePath });
}
```

Set the workspace root directory path via environment variable:

```bash
export WORKSPACE_PATH=/path/to/workspace
```

## Creating Individual Tools

You can also create individual tools:

```typescript
import {
  createWriteFileTool,
  createReadFileTool,
  createReadDirectoryTool,
  createDeleteTool,
  createWorkspaceTools,
} from "@moora/tools-workspace";

const config = { rootPath: "./workspace" };

// Create individual tools
const writeTool = createWriteFileTool(config);
const readTool = createReadFileTool(config);
const readDirTool = createReadDirectoryTool(config);
const deleteTool = createDeleteTool(config);

// Or create all tools at once
const allTools = createWorkspaceTools(config);
```

## Merging with Other Toolkits

```typescript
import { mergeToolkits } from "@moora/toolkit";
import { createWorkspaceToolkit } from "@moora/tools-workspace";
import { createTavilyToolkit } from "@moora/tools-tavily";

const toolkit = mergeToolkits([
  createWorkspaceToolkit({ rootPath: process.env.WORKSPACE_PATH! }),
  createTavilyToolkit({ apiKey: process.env.TAVILY_API_KEY! }),
]);
```

## License

MIT
