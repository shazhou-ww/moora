/**
 * Agent 管理器
 *
 * 管理 Agent 实例的外部存储
 */

import type { TaskId } from "../types";
import type { WorkingAgent } from "./types";
import type { Agent } from "@moora/agent-worker";

/**
 * Agent 管理器接口
 */
export type AgentManager = {
  /**
   * 创建 Agent
   */
  create: (taskId: TaskId, agent: Agent, unsubscribe: () => void) => void;
  
  /**
   * 销毁 Agent
   */
  destroy: (taskId: TaskId) => void;
  
  /**
   * 获取 Agent
   */
  get: (taskId: TaskId) => WorkingAgent | undefined;
  
  /**
   * 获取所有 Agent
   */
  getAll: () => WorkingAgent[];
  
  /**
   * 销毁所有 Agent
   */
  destroyAll: () => void;
};

/**
 * 创建 Agent 管理器
 */
export function createAgentManager(): AgentManager {
  const agentMap = new Map<TaskId, WorkingAgent>();

  return {
    create: (taskId: TaskId, agent: Agent, unsubscribe: () => void) => {
      agentMap.set(taskId, { agent, taskId, unsubscribe });
    },

    destroy: (taskId: TaskId) => {
      const workingAgent = agentMap.get(taskId);
      if (workingAgent) {
        workingAgent.unsubscribe();
        agentMap.delete(taskId);
      }
    },

    get: (taskId: TaskId) => {
      return agentMap.get(taskId);
    },

    getAll: () => {
      return Array.from(agentMap.values());
    },

    destroyAll: () => {
      for (const workingAgent of agentMap.values()) {
        workingAgent.unsubscribe();
      }
      agentMap.clear();
    },
  };
}
