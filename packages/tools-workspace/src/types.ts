/**
 * Workspace Tools Types
 */

/**
 * Workspace 配置
 */
export type WorkspaceConfig = {
  /**
   * Workspace 根目录路径
   */
  readonly rootPath: string;
};

/**
 * 写文件参数
 */
export type WriteFileParams = {
  /**
   * 文件路径（相对于 workspace 根目录）
   */
  readonly path: string;
  /**
   * 文件内容
   */
  readonly content: string;
};

/**
 * 写文件结果
 */
export type WriteFileResult = {
  /**
   * 操作是否成功
   */
  readonly success: boolean;
  /**
   * 文件路径（绝对路径）
   */
  readonly path: string;
  /**
   * 错误信息（如果失败）
   */
  readonly error?: string;
};

/**
 * 读文件参数
 */
export type ReadFileParams = {
  /**
   * 文件路径（相对于 workspace 根目录）
   */
  readonly path: string;
};

/**
 * 读文件结果
 */
export type ReadFileResult = {
  /**
   * 操作是否成功
   */
  readonly success: boolean;
  /**
   * 文件内容（如果成功）
   */
  readonly content?: string;
  /**
   * 错误信息（如果失败）
   */
  readonly error?: string;
};

/**
 * 读文件夹参数
 */
export type ReadDirectoryParams = {
  /**
   * 文件夹路径（相对于 workspace 根目录）
   */
  readonly path: string;
};

/**
 * 目录项类型
 */
export type DirectoryItemType = "file" | "directory";

/**
 * 目录项
 */
export type DirectoryItem = {
  /**
   * 名称
   */
  readonly name: string;
  /**
   * 类型：文件或文件夹
   */
  readonly type: DirectoryItemType;
};

/**
 * 读文件夹结果
 */
export type ReadDirectoryResult = {
  /**
   * 操作是否成功
   */
  readonly success: boolean;
  /**
   * 目录项列表（如果成功）
   */
  readonly items?: readonly DirectoryItem[];
  /**
   * 错误信息（如果失败）
   */
  readonly error?: string;
};

/**
 * 删除文件/文件夹参数
 */
export type DeleteParams = {
  /**
   * 文件或文件夹路径（相对于 workspace 根目录）
   */
  readonly path: string;
  /**
   * 是否递归删除（仅对文件夹有效）
   */
  readonly recursive?: boolean;
};

/**
 * 删除结果
 */
export type DeleteResult = {
  /**
   * 操作是否成功
   */
  readonly success: boolean;
  /**
   * 错误信息（如果失败）
   */
  readonly error?: string;
};
