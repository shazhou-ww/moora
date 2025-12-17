import { describe, it, expect, beforeEach } from "vitest";
import {
  createTaskManager,
  initial,
  transition,
  isTerminalStatus,
  isActiveStatus,
  ROOT_TASK_ID,
  type TaskManager,
  type TaskManagerInput,
  type TaskManagerState,
} from "../src/index";

describe("task-manager", () => {
  describe("status helpers", () => {
    describe("isTerminalStatus", () => {
      it("should return true for completed", () => {
        expect(isTerminalStatus("completed")).toBe(true);
      });

      it("should return true for failed", () => {
        expect(isTerminalStatus("failed")).toBe(true);
      });

      it("should return true for suspended", () => {
        expect(isTerminalStatus("suspended")).toBe(true);
      });

      it("should return true for cancelled", () => {
        expect(isTerminalStatus("cancelled")).toBe(true);
      });

      it("should return false for ready", () => {
        expect(isTerminalStatus("ready")).toBe(false);
      });

      it("should return false for pending", () => {
        expect(isTerminalStatus("pending")).toBe(false);
      });

      it("should return false for running", () => {
        expect(isTerminalStatus("running")).toBe(false);
      });
    });

    describe("isActiveStatus", () => {
      it("should return true for ready", () => {
        expect(isActiveStatus("ready")).toBe(true);
      });

      it("should return true for pending", () => {
        expect(isActiveStatus("pending")).toBe(true);
      });

      it("should return true for running", () => {
        expect(isActiveStatus("running")).toBe(true);
      });

      it("should return false for completed", () => {
        expect(isActiveStatus("completed")).toBe(false);
      });

      it("should return false for failed", () => {
        expect(isActiveStatus("failed")).toBe(false);
      });
    });
  });

  describe("automata", () => {
    describe("initial", () => {
      it("should return empty state", () => {
        const state = initial();
        expect(state.creations).toEqual({});
        expect(state.statuses).toEqual({});
        expect(state.results).toEqual({});
        expect(state.children[ROOT_TASK_ID]).toEqual([]);
        expect(state.appendedMessages).toEqual([]);
      });
    });

    describe("transition", () => {
      let state: TaskManagerState;

      beforeEach(() => {
        state = initial();
      });

      describe("task-created", () => {
        it("should create a task with ready status", () => {
          const input: TaskManagerInput = {
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          };

          const newState = transition(input)(state);

          expect(newState.creations["task-1"]).toBeDefined();
          expect(newState.creations["task-1"]?.title).toBe("Task 1");
          expect(newState.statuses["task-1"]).toBe("ready");
          expect(newState.children[ROOT_TASK_ID]).toContain("task-1");
        });

        it("should create child task and set parent to pending if parent is running", () => {
          // Create parent
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "parent",
            title: "Parent",
            goal: "Parent task",
            parentId: ROOT_TASK_ID,
          })(state);

          // Start parent
          state = transition({
            type: "task-started",
            timestamp: 1500,
            taskId: "parent",
          })(state);

          expect(state.statuses["parent"]).toBe("running");

          // Create child
          state = transition({
            type: "task-created",
            timestamp: 2000,
            taskId: "child-1",
            title: "Child 1",
            goal: "Child task 1",
            parentId: "parent",
          })(state);

          // Parent should be pending, child should be ready
          expect(state.statuses["parent"]).toBe("pending");
          expect(state.statuses["child-1"]).toBe("ready");
          expect(state.children["parent"]).toContain("child-1");
        });
      });

      describe("task-started", () => {
        it("should transition ready to running", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          const newState = transition({
            type: "task-started",
            timestamp: 2000,
            taskId: "task-1",
          })(state);

          expect(newState.statuses["task-1"]).toBe("running");
        });

        it("should not transition non-ready task", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          // Start it
          state = transition({
            type: "task-started",
            timestamp: 2000,
            taskId: "task-1",
          })(state);

          // Complete it
          state = transition({
            type: "task-completed",
            timestamp: 3000,
            taskId: "task-1",
            result: "Done",
          })(state);

          // Try to start again - should not change
          const newState = transition({
            type: "task-started",
            timestamp: 4000,
            taskId: "task-1",
          })(state);

          expect(newState.statuses["task-1"]).toBe("completed");
        });
      });

      describe("task-completed", () => {
        it("should mark task as completed with result", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-started",
            timestamp: 2000,
            taskId: "task-1",
          })(state);

          const newState = transition({
            type: "task-completed",
            timestamp: 3000,
            taskId: "task-1",
            result: "Task completed successfully",
          })(state);

          expect(newState.statuses["task-1"]).toBe("completed");
          expect(newState.results["task-1"]).toEqual({
            type: "success",
            result: "Task completed successfully",
          });
        });

        it("should set parent to ready when all children complete", () => {
          // Create and start parent
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "parent",
            title: "Parent",
            goal: "Parent task",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-started",
            timestamp: 1500,
            taskId: "parent",
          })(state);

          // Create child (parent becomes pending)
          state = transition({
            type: "task-created",
            timestamp: 2000,
            taskId: "child-1",
            title: "Child 1",
            goal: "Child task 1",
            parentId: "parent",
          })(state);

          expect(state.statuses["parent"]).toBe("pending");

          // Start and complete child
          state = transition({
            type: "task-started",
            timestamp: 2500,
            taskId: "child-1",
          })(state);

          state = transition({
            type: "task-completed",
            timestamp: 3000,
            taskId: "child-1",
            result: "Done",
          })(state);

          // Parent should be ready again
          expect(state.statuses["parent"]).toBe("ready");
        });
      });

      describe("task-failed", () => {
        it("should mark task as failed with error", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-started",
            timestamp: 2000,
            taskId: "task-1",
          })(state);

          const newState = transition({
            type: "task-failed",
            timestamp: 3000,
            taskId: "task-1",
            error: "Something went wrong",
          })(state);

          expect(newState.statuses["task-1"]).toBe("failed");
          expect(newState.results["task-1"]).toEqual({
            type: "failure",
            error: "Something went wrong",
          });
        });
      });

      describe("task-suspended", () => {
        it("should mark task as suspended with reason", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-started",
            timestamp: 2000,
            taskId: "task-1",
          })(state);

          const newState = transition({
            type: "task-suspended",
            timestamp: 3000,
            taskId: "task-1",
            reason: "Waiting for user input",
          })(state);

          expect(newState.statuses["task-1"]).toBe("suspended");
          expect(newState.results["task-1"]).toEqual({
            type: "suspended",
            reason: "Waiting for user input",
          });
        });
      });

      describe("task-cancelled", () => {
        it("should cancel a task", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          const newState = transition({
            type: "task-cancelled",
            timestamp: 2000,
            taskId: "task-1",
            reason: "Cancelled by user",
          })(state);

          expect(newState.statuses["task-1"]).toBe("cancelled");
          expect(newState.results["task-1"]).toEqual({
            type: "cancelled",
            reason: "Cancelled by user",
          });
        });

        it("should cancel task and its children recursively", () => {
          // Create parent and start it
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "parent",
            title: "Parent",
            goal: "Parent task",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-started",
            timestamp: 1500,
            taskId: "parent",
          })(state);

          // Create children
          state = transition({
            type: "task-created",
            timestamp: 2000,
            taskId: "child-1",
            title: "Child 1",
            goal: "Child task 1",
            parentId: "parent",
          })(state);

          state = transition({
            type: "task-created",
            timestamp: 3000,
            taskId: "child-2",
            title: "Child 2",
            goal: "Child task 2",
            parentId: "parent",
          })(state);

          // Cancel parent
          const newState = transition({
            type: "task-cancelled",
            timestamp: 4000,
            taskId: "parent",
            reason: "Cancelled",
          })(state);

          expect(newState.statuses["parent"]).toBe("cancelled");
          expect(newState.statuses["child-1"]).toBe("cancelled");
          expect(newState.statuses["child-2"]).toBe("cancelled");
        });

        it("should not cancel already terminal tasks", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-started",
            timestamp: 2000,
            taskId: "task-1",
          })(state);

          state = transition({
            type: "task-completed",
            timestamp: 3000,
            taskId: "task-1",
            result: "Done",
          })(state);

          // Try to cancel completed task
          const newState = transition({
            type: "task-cancelled",
            timestamp: 4000,
            taskId: "task-1",
            reason: "Cancelled",
          })(state);

          // Should still be completed
          expect(newState.statuses["task-1"]).toBe("completed");
        });
      });

      describe("message-appended", () => {
        it("should append message to task", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          const newState = transition({
            type: "message-appended",
            timestamp: 2000,
            taskIds: ["task-1"],
            message: "Additional information",
          })(state);

          const messages = newState.appendedMessages.filter(
            (m) => m.taskId === "task-1"
          );
          expect(messages.map((m) => m.message)).toContain(
            "Additional information"
          );
        });

        it("should set non-running tasks to ready", () => {
          // Create and complete a task
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-started",
            timestamp: 2000,
            taskId: "task-1",
          })(state);

          state = transition({
            type: "task-completed",
            timestamp: 3000,
            taskId: "task-1",
            result: "Done",
          })(state);

          expect(state.statuses["task-1"]).toBe("completed");

          // Append message - should become ready
          const newState = transition({
            type: "message-appended",
            timestamp: 4000,
            taskIds: ["task-1"],
            message: "New info",
          })(state);

          expect(newState.statuses["task-1"]).toBe("ready");
        });

        it("should not change running task status", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-started",
            timestamp: 2000,
            taskId: "task-1",
          })(state);

          const newState = transition({
            type: "message-appended",
            timestamp: 3000,
            taskIds: ["task-1"],
            message: "New info",
          })(state);

          // Should still be running
          expect(newState.statuses["task-1"]).toBe("running");
          // But message should be appended
          expect(newState.appendedMessages.length).toBe(1);
        });

        it("should append message to multiple tasks", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-created",
            timestamp: 1500,
            taskId: "task-2",
            title: "Task 2",
            goal: "Do something else",
            parentId: ROOT_TASK_ID,
          })(state);

          const newState = transition({
            type: "message-appended",
            timestamp: 2000,
            taskIds: ["task-1", "task-2"],
            message: "Shared info",
          })(state);

          const targets = newState.appendedMessages
            .filter((m) => m.message === "Shared info")
            .map((m) => m.taskId);

          expect(targets).toEqual(["task-1", "task-2"]);
        });

        it("should set suspended task to ready on message", () => {
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-started",
            timestamp: 2000,
            taskId: "task-1",
          })(state);

          state = transition({
            type: "task-suspended",
            timestamp: 3000,
            taskId: "task-1",
            reason: "Waiting for input",
          })(state);

          expect(state.statuses["task-1"]).toBe("suspended");

          const newState = transition({
            type: "message-appended",
            timestamp: 4000,
            taskIds: ["task-1"],
            message: "User response",
          })(state);

          expect(newState.statuses["task-1"]).toBe("ready");
        });

        it("should set pending task to ready on message", () => {
          // Create and start parent
          state = transition({
            type: "task-created",
            timestamp: 1000,
            taskId: "parent",
            title: "Parent",
            goal: "Parent task",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "task-started",
            timestamp: 1500,
            taskId: "parent",
          })(state);

          // Create child (parent becomes pending)
          state = transition({
            type: "task-created",
            timestamp: 2000,
            taskId: "child-1",
            title: "Child 1",
            goal: "Child task 1",
            parentId: "parent",
          })(state);

          expect(state.statuses["parent"]).toBe("pending");

          // Append message to parent
          const newState = transition({
            type: "message-appended",
            timestamp: 3000,
            taskIds: ["parent"],
            message: "Need to reconsider",
          })(state);

          expect(newState.statuses["parent"]).toBe("ready");
        });
      });
    });
  });

  describe("createTaskManager", () => {
    let manager: TaskManager;

    beforeEach(() => {
      manager = createTaskManager();
    });

    it("should create a task manager with empty state", () => {
      expect(manager.getAllTaskIds()).toEqual([]);
      expect(manager.getNextTask()).toBeNull();
    });

    it("should create and query tasks", () => {
      manager.dispatch({
        type: "task-created",
        timestamp: 1000,
        taskId: "task-1",
        title: "Task 1",
        goal: "Do something",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "task-created",
        timestamp: 2000,
        taskId: "task-2",
        title: "Task 2",
        goal: "Do another thing",
        parentId: ROOT_TASK_ID,
      });

      expect(manager.getAllTaskIds()).toHaveLength(2);
      expect(manager.getActiveTasks()).toHaveLength(2);
      expect(manager.getTerminalTasks()).toHaveLength(0);
    });

    it("should return next task as earliest created ready task", () => {
      manager.dispatch({
        type: "task-created",
        timestamp: 2000,
        taskId: "task-2",
        title: "Task 2",
        goal: "Created second",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "task-created",
        timestamp: 1000,
        taskId: "task-1",
        title: "Task 1",
        goal: "Created first",
        parentId: ROOT_TASK_ID,
      });

      const nextTask = manager.getNextTask();
      expect(nextTask?.id).toBe("task-1");
    });

    it("should get task info correctly", () => {
      manager.dispatch({
        type: "task-created",
        timestamp: 1000,
        taskId: "task-1",
        title: "Task 1",
        goal: "Do something",
        parentId: ROOT_TASK_ID,
      });

      const taskInfo = manager.getTaskInfo("task-1");
      expect(taskInfo?.id).toBe("task-1");
      expect(taskInfo?.title).toBe("Task 1");
      expect(taskInfo?.goal).toBe("Do something");
      expect(taskInfo?.status).toBe("ready");
      expect(taskInfo?.createdAt).toBe(1000);
    });

    it("should return null for non-existent task", () => {
      expect(manager.getTaskInfo("non-existent")).toBeNull();
    });

    it("should track task stats", () => {
      manager.dispatch({
        type: "task-created",
        timestamp: 1000,
        taskId: "parent",
        title: "Parent",
        goal: "Parent task",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "task-started",
        timestamp: 1500,
        taskId: "parent",
      });

      manager.dispatch({
        type: "task-created",
        timestamp: 2000,
        taskId: "child-1",
        title: "Child 1",
        goal: "Child task 1",
        parentId: "parent",
      });

      const stats = manager.getTaskStats();
      expect(stats.total).toBe(2);
      expect(stats.ready).toBe(1); // child-1 is ready
      expect(stats.pending).toBe(1); // parent is pending
      expect(stats.running).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });

    it("should report isAllTerminal correctly", () => {
      manager.dispatch({
        type: "task-created",
        timestamp: 1000,
        taskId: "task-1",
        title: "Task 1",
        goal: "Do something",
        parentId: ROOT_TASK_ID,
      });

      expect(manager.isAllTerminal()).toBe(false);

      manager.dispatch({
        type: "task-started",
        timestamp: 2000,
        taskId: "task-1",
      });

      manager.dispatch({
        type: "task-completed",
        timestamp: 3000,
        taskId: "task-1",
        result: "Done",
      });

      expect(manager.isAllTerminal()).toBe(true);
    });

    it("should subscribe to state changes", () => {
      const outputs: TaskManagerState[] = [];
      manager.subscribe((state) => {
        outputs.push(state);
      });

      manager.dispatch({
        type: "task-created",
        timestamp: 1000,
        taskId: "task-1",
        title: "Task 1",
        goal: "Do something",
        parentId: ROOT_TASK_ID,
      });

      expect(outputs).toHaveLength(1);
      expect(outputs[0]?.creations["task-1"]).toBeDefined();
    });

    it("should get ready and running tasks separately", () => {
      manager.dispatch({
        type: "task-created",
        timestamp: 1000,
        taskId: "task-1",
        title: "Task 1",
        goal: "Do something",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "task-created",
        timestamp: 2000,
        taskId: "task-2",
        title: "Task 2",
        goal: "Do something else",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "task-started",
        timestamp: 3000,
        taskId: "task-1",
      });

      expect(manager.getReadyTasks()).toHaveLength(1);
      expect(manager.getReadyTasks()[0]?.id).toBe("task-2");
      expect(manager.getRunningTasks()).toHaveLength(1);
      expect(manager.getRunningTasks()[0]?.id).toBe("task-1");
    });

    it("should get appended messages", () => {
      manager.dispatch({
        type: "task-created",
        timestamp: 1000,
        taskId: "task-1",
        title: "Task 1",
        goal: "Do something",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "message-appended",
        timestamp: 2000,
        taskIds: ["task-1"],
        message: "Message 1",
      });

      manager.dispatch({
        type: "message-appended",
        timestamp: 3000,
        taskIds: ["task-1"],
        message: "Message 2",
      });

      const messages = manager.getAppendedMessages("task-1");
      expect(messages).toEqual(["Message 1", "Message 2"]);
    });
  });
});
