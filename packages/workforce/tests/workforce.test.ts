/**
 * Workforce 测试
 */

import { describe, it, expect } from "vitest";
import { ROOT_TASK_ID } from "../src/types";
import {
  WF_TASK_SUCCEED,
  WF_TASK_FAIL,
  WF_TASK_BREAKDOWN,
  isPseudoTool,
  parsePseudoToolCall,
} from "../src/impl/pseudo-tools";
import { createTaskTree } from "../src/impl/task-tree";

describe("Workforce", () => {
  describe("pseudo-tools", () => {
    it("should identify pseudo tools correctly", () => {
      expect(isPseudoTool(WF_TASK_SUCCEED)).toBe(true);
      expect(isPseudoTool(WF_TASK_FAIL)).toBe(true);
      expect(isPseudoTool(WF_TASK_BREAKDOWN)).toBe(true);
      expect(isPseudoTool("some-other-tool")).toBe(false);
    });

    it("should parse wf-task-succeed call", () => {
      const result = parsePseudoToolCall(
        WF_TASK_SUCCEED,
        JSON.stringify({ conclusion: "Task completed" })
      );
      expect(result).toEqual({
        type: "succeed",
        params: { conclusion: "Task completed" },
      });
    });

    it("should parse wf-task-fail call", () => {
      const result = parsePseudoToolCall(
        WF_TASK_FAIL,
        JSON.stringify({ error: "Something went wrong" })
      );
      expect(result).toEqual({
        type: "fail",
        params: { error: "Something went wrong" },
      });
    });

    it("should parse wf-task-breakdown call", () => {
      const result = parsePseudoToolCall(
        WF_TASK_BREAKDOWN,
        JSON.stringify({
          subtasks: [
            { title: "Subtask 1", description: "Do something" },
            { title: "Subtask 2", description: "Do something else" },
          ],
        })
      );
      expect(result).toEqual({
        type: "breakdown",
        params: {
          subtasks: [
            { title: "Subtask 1", description: "Do something" },
            { title: "Subtask 2", description: "Do something else" },
          ],
        },
      });
    });

    it("should return undefined for non-pseudo tool", () => {
      const result = parsePseudoToolCall("some-tool", "{}");
      expect(result).toBeUndefined();
    });

    it("should return undefined for invalid JSON", () => {
      const result = parsePseudoToolCall(WF_TASK_SUCCEED, "invalid json");
      expect(result).toBeUndefined();
    });
  });

  describe("ROOT_TASK_ID", () => {
    it("should be a valid UUID of all zeros", () => {
      expect(ROOT_TASK_ID).toBe("00000000-0000-0000-0000-000000000000");
    });
  });

  describe("TaskTree", () => {
    it("should create a task and retrieve it", () => {
      const tree = createTaskTree();
      
      tree.createTask({
        id: "task-1",
        title: "Test Task",
        goal: "Complete the test",
        parentId: ROOT_TASK_ID,
      });

      const task = tree.getTask("task-1");
      expect(task).toBeDefined();
      expect(task?.id).toBe("task-1");
      expect(task?.title).toBe("Test Task");
      expect(task?.status).toBe("ready");
      expect(task?.worldscape.userMessages.length).toBe(1);
      expect(task?.worldscape.userMessages[0]?.content).toBe("Complete the test");
    });

    it("should track parent-child relationships", () => {
      const tree = createTaskTree();
      
      tree.createTask({
        id: "parent-task",
        title: "Parent",
        goal: "Parent goal",
        parentId: ROOT_TASK_ID,
      });

      tree.createTask({
        id: "child-task",
        title: "Child",
        goal: "Child goal",
        parentId: "parent-task",
      });

      const children = tree.getChildTaskIds("parent-task");
      expect(children).toContain("child-task");
      expect(tree.getChildTaskIds(ROOT_TASK_ID)).toContain("parent-task");
    });

    it("should return ready tasks in FIFO order", () => {
      const tree = createTaskTree();
      
      tree.createTask({
        id: "task-1",
        title: "Task 1",
        goal: "Goal 1",
        parentId: ROOT_TASK_ID,
      });

      tree.createTask({
        id: "task-2",
        title: "Task 2",
        goal: "Goal 2",
        parentId: ROOT_TASK_ID,
      });

      const nextTask = tree.getNextReadyTask();
      expect(nextTask).toBe("task-1"); // First created should be first
    });

    it("should update task status correctly", () => {
      const tree = createTaskTree();
      
      tree.createTask({
        id: "task-1",
        title: "Task 1",
        goal: "Goal 1",
        parentId: ROOT_TASK_ID,
      });

      tree.startProcessing("task-1");
      expect(tree.getTaskStatus("task-1")?.status).toBe("processing");

      tree.succeedTask("task-1", "Done!");
      expect(tree.getTaskStatus("task-1")?.status).toBe("succeeded");
      expect(tree.getTaskStatus("task-1")?.result).toEqual({
        success: true,
        conclusion: "Done!",
      });
    });

    it("should fail task correctly", () => {
      const tree = createTaskTree();
      
      tree.createTask({
        id: "task-1",
        title: "Task 1",
        goal: "Goal 1",
        parentId: ROOT_TASK_ID,
      });

      tree.startProcessing("task-1");
      tree.failTask("task-1", "Oops!");
      
      expect(tree.getTaskStatus("task-1")?.status).toBe("failed");
      expect(tree.getTaskStatus("task-1")?.result).toEqual({
        success: false,
        error: "Oops!",
      });
    });

    it("should emit task events", () => {
      const tree = createTaskTree();
      const events: unknown[] = [];
      
      tree.taskEventPubSub.sub((event) => events.push(event));

      tree.createTask({
        id: "task-1",
        title: "Task 1",
        goal: "Goal 1",
        parentId: ROOT_TASK_ID,
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toMatchObject({
        type: "task-created",
        task: {
          id: "task-1",
          title: "Task 1",
        },
      });
    });
  });
});
