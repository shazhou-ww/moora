import { describe, it, expect, beforeEach } from "vitest";
import {
  createTaskManager,
  initial,
  transition,
  isCompleted,
  isActive,
  type TaskManager,
  type Actuation,
  type TaskManagerState,
} from "../src/index";

describe("task-manager", () => {
  describe("types", () => {
    describe("isCompleted", () => {
      it("should return true for succeeded status", () => {
        expect(isCompleted({ type: "succeeded", result: "done" })).toBe(true);
      });

      it("should return true for failed status", () => {
        expect(isCompleted({ type: "failed", error: "error" })).toBe(true);
      });

      it("should return false for ready status", () => {
        expect(isCompleted({ type: "ready" })).toBe(false);
      });

      it("should return false for pending status", () => {
        expect(isCompleted({ type: "pending" })).toBe(false);
      });
    });

    describe("isActive", () => {
      it("should return true for ready status", () => {
        expect(isActive({ type: "ready" })).toBe(true);
      });

      it("should return true for pending status", () => {
        expect(isActive({ type: "pending" })).toBe(true);
      });

      it("should return false for succeeded status", () => {
        expect(isActive({ type: "succeeded", result: "done" })).toBe(false);
      });

      it("should return false for failed status", () => {
        expect(isActive({ type: "failed", error: "error" })).toBe(false);
      });
    });
  });

  describe("automata", () => {
    describe("initial", () => {
      it("should return empty state", () => {
        const state = initial();
        expect(state.tasks).toEqual({});
        expect(state.topLevelTaskIds).toEqual([]);
      });
    });

    describe("transition", () => {
      let state: TaskManagerState;

      beforeEach(() => {
        state = initial();
      });

      describe("schedule", () => {
        it("should add a single task", () => {
          const actuation: Actuation = {
            type: "schedule",
            tasks: [{ id: "task-1", title: "Task 1", goal: "Do something" }],
            timestamp: 1000,
          };

          const newState = transition(actuation)(state);

          expect(newState.tasks["task-1"]).toBeDefined();
          expect(newState.tasks["task-1"]?.title).toBe("Task 1");
          expect(newState.tasks["task-1"]?.status).toEqual({ type: "ready" });
          expect(newState.topLevelTaskIds).toContain("task-1");
        });

        it("should add multiple tasks", () => {
          const actuation: Actuation = {
            type: "schedule",
            tasks: [
              { id: "task-1", title: "Task 1", goal: "Do something" },
              { id: "task-2", title: "Task 2", goal: "Do another thing" },
            ],
            timestamp: 1000,
          };

          const newState = transition(actuation)(state);

          expect(Object.keys(newState.tasks)).toHaveLength(2);
          expect(newState.topLevelTaskIds).toHaveLength(2);
        });

        it("should handle dependencies correctly", () => {
          const actuation: Actuation = {
            type: "schedule",
            tasks: [
              { id: "task-1", title: "Task 1", goal: "Do something" },
              {
                id: "task-2",
                title: "Task 2",
                goal: "Depends on task-1",
                dependencies: ["task-1"],
              },
            ],
            timestamp: 1000,
          };

          const newState = transition(actuation)(state);

          expect(newState.tasks["task-1"]?.status).toEqual({ type: "ready" });
          expect(newState.tasks["task-2"]?.status).toEqual({ type: "pending" });
        });
      });

      describe("complete", () => {
        it("should mark task as succeeded", () => {
          // Schedule a task first
          state = transition({
            type: "schedule",
            tasks: [{ id: "task-1", title: "Task 1", goal: "Do something" }],
            timestamp: 1000,
          })(state);

          // Complete the task
          const newState = transition({
            type: "complete",
            taskId: "task-1",
            result: "Task completed successfully",
            timestamp: 2000,
          })(state);

          expect(newState.tasks["task-1"]?.status).toEqual({
            type: "succeeded",
            result: "Task completed successfully",
          });
        });

        it("should update dependent task status when dependency completes", () => {
          // Schedule tasks with dependency
          state = transition({
            type: "schedule",
            tasks: [
              { id: "task-1", title: "Task 1", goal: "Do something" },
              {
                id: "task-2",
                title: "Task 2",
                goal: "Depends on task-1",
                dependencies: ["task-1"],
              },
            ],
            timestamp: 1000,
          })(state);

          expect(state.tasks["task-2"]?.status).toEqual({ type: "pending" });

          // Complete the dependency
          const newState = transition({
            type: "complete",
            taskId: "task-1",
            result: "Done",
            timestamp: 2000,
          })(state);

          expect(newState.tasks["task-2"]?.status).toEqual({ type: "ready" });
        });
      });

      describe("fail", () => {
        it("should mark task as failed", () => {
          state = transition({
            type: "schedule",
            tasks: [{ id: "task-1", title: "Task 1", goal: "Do something" }],
            timestamp: 1000,
          })(state);

          const newState = transition({
            type: "fail",
            taskId: "task-1",
            error: "Something went wrong",
            timestamp: 2000,
          })(state);

          expect(newState.tasks["task-1"]?.status).toEqual({
            type: "failed",
            error: "Something went wrong",
          });
        });
      });

      describe("cancel", () => {
        it("should cancel a task", () => {
          state = transition({
            type: "schedule",
            tasks: [{ id: "task-1", title: "Task 1", goal: "Do something" }],
            timestamp: 1000,
          })(state);

          const newState = transition({
            type: "cancel",
            taskIds: ["task-1"],
            error: "Cancelled by user",
            timestamp: 2000,
          })(state);

          expect(newState.tasks["task-1"]?.status).toEqual({
            type: "failed",
            error: "Cancelled by user",
          });
        });

        it("should cancel task and its children recursively", () => {
          // Schedule parent task
          state = transition({
            type: "schedule",
            tasks: [{ id: "parent", title: "Parent", goal: "Parent task" }],
            timestamp: 1000,
          })(state);

          // Break down into children
          state = transition({
            type: "break-down",
            taskId: "parent",
            subTasks: [
              { id: "child-1", title: "Child 1", goal: "Child task 1" },
              { id: "child-2", title: "Child 2", goal: "Child task 2" },
            ],
            timestamp: 2000,
          })(state);

          // Cancel parent
          const newState = transition({
            type: "cancel",
            taskIds: ["parent"],
            error: "Cancelled",
            timestamp: 3000,
          })(state);

          expect(newState.tasks["parent"]?.status.type).toBe("failed");
          expect(newState.tasks["child-1"]?.status.type).toBe("failed");
          expect(newState.tasks["child-2"]?.status.type).toBe("failed");
        });
      });

      describe("append-info", () => {
        it("should append info to a task", () => {
          state = transition({
            type: "schedule",
            tasks: [{ id: "task-1", title: "Task 1", goal: "Do something" }],
            timestamp: 1000,
          })(state);

          const newState = transition({
            type: "append-info",
            taskIds: ["task-1"],
            info: "Additional information",
            timestamp: 2000,
          })(state);

          expect(newState.tasks["task-1"]?.appendedInfos).toContain(
            "Additional information"
          );
        });

        it("should append info to multiple tasks", () => {
          state = transition({
            type: "schedule",
            tasks: [
              { id: "task-1", title: "Task 1", goal: "Do something" },
              { id: "task-2", title: "Task 2", goal: "Do another thing" },
            ],
            timestamp: 1000,
          })(state);

          const newState = transition({
            type: "append-info",
            taskIds: ["task-1", "task-2"],
            info: "Shared info",
            timestamp: 2000,
          })(state);

          expect(newState.tasks["task-1"]?.appendedInfos).toContain("Shared info");
          expect(newState.tasks["task-2"]?.appendedInfos).toContain("Shared info");
        });
      });

      describe("break-down", () => {
        it("should create sub-tasks under a parent task", () => {
          state = transition({
            type: "schedule",
            tasks: [{ id: "parent", title: "Parent", goal: "Parent task" }],
            timestamp: 1000,
          })(state);

          const newState = transition({
            type: "break-down",
            taskId: "parent",
            subTasks: [
              { id: "child-1", title: "Child 1", goal: "Child task 1" },
              { id: "child-2", title: "Child 2", goal: "Child task 2" },
            ],
            timestamp: 2000,
          })(state);

          expect(newState.tasks["parent"]?.childIds).toEqual(["child-1", "child-2"]);
          expect(newState.tasks["child-1"]?.parentId).toBe("parent");
          expect(newState.tasks["child-2"]?.parentId).toBe("parent");
        });

        it("should handle dependencies between sub-tasks", () => {
          state = transition({
            type: "schedule",
            tasks: [{ id: "parent", title: "Parent", goal: "Parent task" }],
            timestamp: 1000,
          })(state);

          const newState = transition({
            type: "break-down",
            taskId: "parent",
            subTasks: [
              { id: "child-1", title: "Child 1", goal: "Child task 1" },
              {
                id: "child-2",
                title: "Child 2",
                goal: "Child task 2",
                dependencies: ["child-1"],
              },
            ],
            timestamp: 2000,
          })(state);

          expect(newState.tasks["child-1"]?.status).toEqual({ type: "ready" });
          expect(newState.tasks["child-2"]?.status).toEqual({ type: "pending" });
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

    it("should schedule and query tasks", () => {
      manager.dispatch({
        type: "schedule",
        tasks: [
          { id: "task-1", title: "Task 1", goal: "Do something" },
          { id: "task-2", title: "Task 2", goal: "Do another thing" },
        ],
        timestamp: 1000,
      });

      expect(manager.getAllTaskIds()).toHaveLength(2);
      expect(manager.getActiveTasks()).toHaveLength(2);
      expect(manager.getCompletedTasks()).toHaveLength(0);
    });

    it("should return next executable task", () => {
      manager.dispatch({
        type: "schedule",
        tasks: [
          { id: "task-1", title: "Task 1", goal: "Do something" },
          {
            id: "task-2",
            title: "Task 2",
            goal: "Do another thing",
            dependencies: ["task-1"],
          },
        ],
        timestamp: 1000,
      });

      const nextTask = manager.getNextTask();
      expect(nextTask?.id).toBe("task-1");
    });

    it("should update next task after completion", () => {
      manager.dispatch({
        type: "schedule",
        tasks: [
          { id: "task-1", title: "Task 1", goal: "Do something" },
          {
            id: "task-2",
            title: "Task 2",
            goal: "Do another thing",
            dependencies: ["task-1"],
          },
        ],
        timestamp: 1000,
      });

      manager.dispatch({
        type: "complete",
        taskId: "task-1",
        result: "Done",
        timestamp: 2000,
      });

      const nextTask = manager.getNextTask();
      expect(nextTask?.id).toBe("task-2");
    });

    it("should prioritize child tasks over parent", () => {
      manager.dispatch({
        type: "schedule",
        tasks: [{ id: "parent", title: "Parent", goal: "Parent task" }],
        timestamp: 1000,
      });

      manager.dispatch({
        type: "break-down",
        taskId: "parent",
        subTasks: [{ id: "child-1", title: "Child 1", goal: "Child task 1" }],
        timestamp: 2000,
      });

      const nextTask = manager.getNextTask();
      expect(nextTask?.id).toBe("child-1");
    });

    it("should return parent after all children complete", () => {
      manager.dispatch({
        type: "schedule",
        tasks: [{ id: "parent", title: "Parent", goal: "Parent task" }],
        timestamp: 1000,
      });

      manager.dispatch({
        type: "break-down",
        taskId: "parent",
        subTasks: [{ id: "child-1", title: "Child 1", goal: "Child task 1" }],
        timestamp: 2000,
      });

      manager.dispatch({
        type: "complete",
        taskId: "child-1",
        result: "Done",
        timestamp: 3000,
      });

      const nextTask = manager.getNextTask();
      expect(nextTask?.id).toBe("parent");
    });

    it("should get task info correctly", () => {
      manager.dispatch({
        type: "schedule",
        tasks: [{ id: "task-1", title: "Task 1", goal: "Do something" }],
        timestamp: 1000,
      });

      const taskInfo = manager.getTaskInfo("task-1");
      expect(taskInfo?.id).toBe("task-1");
      expect(taskInfo?.title).toBe("Task 1");
      expect(taskInfo?.goal).toBe("Do something");
      expect(taskInfo?.status).toEqual({ type: "ready" });
    });

    it("should return null for non-existent task", () => {
      expect(manager.getTaskInfo("non-existent")).toBeNull();
    });

    it("should track task stats", () => {
      manager.dispatch({
        type: "schedule",
        tasks: [
          { id: "task-1", title: "Task 1", goal: "Do something" },
          {
            id: "task-2",
            title: "Task 2",
            goal: "Do another thing",
            dependencies: ["task-1"],
          },
        ],
        timestamp: 1000,
      });

      const stats = manager.getTaskStats();
      expect(stats.total).toBe(2);
      expect(stats.ready).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.succeeded).toBe(0);
      expect(stats.failed).toBe(0);
    });

    it("should report isAllCompleted correctly", () => {
      manager.dispatch({
        type: "schedule",
        tasks: [{ id: "task-1", title: "Task 1", goal: "Do something" }],
        timestamp: 1000,
      });

      expect(manager.isAllCompleted()).toBe(false);

      manager.dispatch({
        type: "complete",
        taskId: "task-1",
        result: "Done",
        timestamp: 2000,
      });

      expect(manager.isAllCompleted()).toBe(true);
    });

    it("should subscribe to state changes", () => {
      const outputs: TaskManagerState[] = [];
      manager.subscribe((state) => {
        outputs.push(state);
      });

      manager.dispatch({
        type: "schedule",
        tasks: [{ id: "task-1", title: "Task 1", goal: "Do something" }],
        timestamp: 1000,
      });

      expect(outputs).toHaveLength(1);
      expect(outputs[0]?.tasks["task-1"]).toBeDefined();
    });
  });
});
