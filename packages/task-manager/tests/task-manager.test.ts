import { describe, it, expect, beforeEach } from "vitest";
import {
  createTaskManager,
  initial,
  transition,
  isCompleted,
  isActive,
  deriveTaskStatus,
  ROOT_TASK_ID,
  type TaskManager,
  type Input,
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
        expect(state.creations).toEqual({});
        expect(state.appendedInfos).toEqual([]);
        expect(state.completions).toEqual({});
        expect(state.children[ROOT_TASK_ID]).toEqual([]);
      });
    });

    describe("transition", () => {
      let state: TaskManagerState;

      beforeEach(() => {
        state = initial();
      });

      describe("create", () => {
        it("should create a single task", () => {
          const input: Input = {
            type: "create",
            timestamp: 1000,
            id: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          };

          const newState = transition(input)(state);

          expect(newState.creations["task-1"]).toBeDefined();
          expect(newState.creations["task-1"]?.title).toBe("Task 1");
          expect(newState.creations["task-1"]?.createdAt).toBe(1000);
          expect(deriveTaskStatus(newState, "task-1")).toEqual({ type: "ready" });
          expect(newState.children[ROOT_TASK_ID]).toContain("task-1");
        });

        it("should create multiple tasks", () => {
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "create",
            timestamp: 2000,
            id: "task-2",
            title: "Task 2",
            goal: "Do another thing",
            parentId: ROOT_TASK_ID,
          })(state);

          expect(Object.keys(state.creations)).toHaveLength(2);
          expect(state.children[ROOT_TASK_ID]).toHaveLength(2);
        });

        it("should create child tasks under parent", () => {
          // Create parent
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "parent",
            title: "Parent",
            goal: "Parent task",
            parentId: ROOT_TASK_ID,
          })(state);

          // Create children
          state = transition({
            type: "create",
            timestamp: 2000,
            id: "child-1",
            title: "Child 1",
            goal: "Child task 1",
            parentId: "parent",
          })(state);

          state = transition({
            type: "create",
            timestamp: 3000,
            id: "child-2",
            title: "Child 2",
            goal: "Child task 2",
            parentId: "parent",
          })(state);

          expect(state.children["parent"]).toEqual(["child-1", "child-2"]);
          expect(state.creations["child-1"]?.parentId).toBe("parent");
          expect(state.creations["child-2"]?.parentId).toBe("parent");
        });

        it("should derive parent status as pending when has incomplete children", () => {
          // Create parent
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "parent",
            title: "Parent",
            goal: "Parent task",
            parentId: ROOT_TASK_ID,
          })(state);

          // Create child
          state = transition({
            type: "create",
            timestamp: 2000,
            id: "child-1",
            title: "Child 1",
            goal: "Child task 1",
            parentId: "parent",
          })(state);

          // Parent should be pending because child is not complete
          expect(deriveTaskStatus(state, "parent")).toEqual({ type: "pending" });
          expect(deriveTaskStatus(state, "child-1")).toEqual({ type: "ready" });
        });
      });

      describe("complete", () => {
        it("should mark task as succeeded", () => {
          // Create a task first
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          // Complete the task
          const newState = transition({
            type: "complete",
            timestamp: 2000,
            taskId: "task-1",
            result: "Task completed successfully",
          })(state);

          expect(deriveTaskStatus(newState, "task-1")).toEqual({
            type: "succeeded",
            result: "Task completed successfully",
          });
        });

        it("should update parent status when all children complete", () => {
          // Create parent with children
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "parent",
            title: "Parent",
            goal: "Parent task",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "create",
            timestamp: 2000,
            id: "child-1",
            title: "Child 1",
            goal: "Child task 1",
            parentId: "parent",
          })(state);

          expect(deriveTaskStatus(state, "parent")).toEqual({ type: "pending" });

          // Complete the child
          const newState = transition({
            type: "complete",
            timestamp: 3000,
            taskId: "child-1",
            result: "Done",
          })(state);

          expect(deriveTaskStatus(newState, "parent")).toEqual({ type: "ready" });
        });
      });

      describe("fail", () => {
        it("should mark task as failed", () => {
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          const newState = transition({
            type: "fail",
            timestamp: 2000,
            taskId: "task-1",
            error: "Something went wrong",
          })(state);

          expect(deriveTaskStatus(newState, "task-1")).toEqual({
            type: "failed",
            error: "Something went wrong",
          });
        });
      });

      describe("cancel", () => {
        it("should cancel a task", () => {
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          const newState = transition({
            type: "cancel",
            timestamp: 2000,
            taskId: "task-1",
            error: "Cancelled by user",
          })(state);

          expect(deriveTaskStatus(newState, "task-1")).toEqual({
            type: "failed",
            error: "Cancelled by user",
          });
        });

        it("should cancel task and its children recursively", () => {
          // Create parent task
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "parent",
            title: "Parent",
            goal: "Parent task",
            parentId: ROOT_TASK_ID,
          })(state);

          // Create children
          state = transition({
            type: "create",
            timestamp: 2000,
            id: "child-1",
            title: "Child 1",
            goal: "Child task 1",
            parentId: "parent",
          })(state);

          state = transition({
            type: "create",
            timestamp: 3000,
            id: "child-2",
            title: "Child 2",
            goal: "Child task 2",
            parentId: "parent",
          })(state);

          // Cancel parent
          const newState = transition({
            type: "cancel",
            timestamp: 4000,
            taskId: "parent",
            error: "Cancelled",
          })(state);

          expect(deriveTaskStatus(newState, "parent").type).toBe("failed");
          expect(deriveTaskStatus(newState, "child-1").type).toBe("failed");
          expect(deriveTaskStatus(newState, "child-2").type).toBe("failed");
        });
      });

      describe("append", () => {
        it("should append info to a task", () => {
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          const newState = transition({
            type: "append",
            timestamp: 2000,
            taskIds: ["task-1"],
            info: "Additional information",
          })(state);

          const infos = newState.appendedInfos.filter(
            (i) => i.taskId === "task-1"
          );
          expect(infos.map((i) => i.info)).toContain("Additional information");
        });

        it("should append multiple infos to a task", () => {
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "append",
            timestamp: 2000,
            taskIds: ["task-1"],
            info: "Info 1",
          })(state);

          state = transition({
            type: "append",
            timestamp: 3000,
            taskIds: ["task-1"],
            info: "Info 2",
          })(state);

          const infos = state.appendedInfos
            .filter((i) => i.taskId === "task-1")
            .map((i) => i.info);
          expect(infos).toEqual(["Info 1", "Info 2"]);
        });

        it("should append info to multiple tasks in one input", () => {
          state = transition({
            type: "create",
            timestamp: 1000,
            id: "task-1",
            title: "Task 1",
            goal: "Do something",
            parentId: ROOT_TASK_ID,
          })(state);

          state = transition({
            type: "create",
            timestamp: 1500,
            id: "task-2",
            title: "Task 2",
            goal: "Do something else",
            parentId: ROOT_TASK_ID,
          })(state);

          const newState = transition({
            type: "append",
            timestamp: 2000,
            taskIds: ["task-1", "task-2"],
            info: "Shared info",
          })(state);

          const targets = newState.appendedInfos
            .filter((i) => i.info === "Shared info")
            .map((i) => i.taskId);

          expect(targets).toEqual(["task-1", "task-2"]);
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
        type: "create",
        timestamp: 1000,
        id: "task-1",
        title: "Task 1",
        goal: "Do something",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "create",
        timestamp: 2000,
        id: "task-2",
        title: "Task 2",
        goal: "Do another thing",
        parentId: ROOT_TASK_ID,
      });

      expect(manager.getAllTaskIds()).toHaveLength(2);
      expect(manager.getActiveTasks()).toHaveLength(2);
      expect(manager.getCompletedTasks()).toHaveLength(0);
    });

    it("should return next task as earliest created ready task", () => {
      // Create task-2 first (earlier timestamp)
      manager.dispatch({
        type: "create",
        timestamp: 1000,
        id: "task-2",
        title: "Task 2",
        goal: "Created first",
        parentId: ROOT_TASK_ID,
      });

      // Create task-1 later (later timestamp)
      manager.dispatch({
        type: "create",
        timestamp: 2000,
        id: "task-1",
        title: "Task 1",
        goal: "Created second",
        parentId: ROOT_TASK_ID,
      });

      // Should return task-2 because it was created first
      const nextTask = manager.getNextTask();
      expect(nextTask?.id).toBe("task-2");
    });

    it("should return child as next task when parent has children", () => {
      manager.dispatch({
        type: "create",
        timestamp: 1000,
        id: "parent",
        title: "Parent",
        goal: "Parent task",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "create",
        timestamp: 2000,
        id: "child-1",
        title: "Child 1",
        goal: "Child task 1",
        parentId: "parent",
      });

      // Parent is pending, child is ready
      // Child should be returned as it's the only ready task
      const nextTask = manager.getNextTask();
      expect(nextTask?.id).toBe("child-1");
    });

    it("should return parent after all children complete", () => {
      manager.dispatch({
        type: "create",
        timestamp: 1000,
        id: "parent",
        title: "Parent",
        goal: "Parent task",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "create",
        timestamp: 2000,
        id: "child-1",
        title: "Child 1",
        goal: "Child task 1",
        parentId: "parent",
      });

      manager.dispatch({
        type: "complete",
        timestamp: 3000,
        taskId: "child-1",
        result: "Done",
      });

      // Now parent should be next (it's the only ready task)
      const nextTask = manager.getNextTask();
      expect(nextTask?.id).toBe("parent");
    });

    it("should get task info correctly", () => {
      manager.dispatch({
        type: "create",
        timestamp: 1000,
        id: "task-1",
        title: "Task 1",
        goal: "Do something",
        parentId: ROOT_TASK_ID,
      });

      const taskInfo = manager.getTaskInfo("task-1");
      expect(taskInfo?.id).toBe("task-1");
      expect(taskInfo?.title).toBe("Task 1");
      expect(taskInfo?.goal).toBe("Do something");
      expect(taskInfo?.status).toEqual({ type: "ready" });
      expect(taskInfo?.createdAt).toBe(1000);
    });

    it("should return null for non-existent task", () => {
      expect(manager.getTaskInfo("non-existent")).toBeNull();
    });

    it("should track task stats", () => {
      manager.dispatch({
        type: "create",
        timestamp: 1000,
        id: "parent",
        title: "Parent",
        goal: "Parent task",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "create",
        timestamp: 2000,
        id: "child-1",
        title: "Child 1",
        goal: "Child task 1",
        parentId: "parent",
      });

      const stats = manager.getTaskStats();
      expect(stats.total).toBe(2);
      expect(stats.ready).toBe(1); // child-1 is ready
      expect(stats.pending).toBe(1); // parent is pending
      expect(stats.succeeded).toBe(0);
      expect(stats.failed).toBe(0);
    });

    it("should report isAllCompleted correctly", () => {
      manager.dispatch({
        type: "create",
        timestamp: 1000,
        id: "task-1",
        title: "Task 1",
        goal: "Do something",
        parentId: ROOT_TASK_ID,
      });

      expect(manager.isAllCompleted()).toBe(false);

      manager.dispatch({
        type: "complete",
        timestamp: 2000,
        taskId: "task-1",
        result: "Done",
      });

      expect(manager.isAllCompleted()).toBe(true);
    });

    it("should subscribe to state changes", () => {
      const outputs: TaskManagerState[] = [];
      manager.subscribe((state) => {
        outputs.push(state);
      });

      manager.dispatch({
        type: "create",
        timestamp: 1000,
        id: "task-1",
        title: "Task 1",
        goal: "Do something",
        parentId: ROOT_TASK_ID,
      });

      expect(outputs).toHaveLength(1);
      expect(outputs[0]?.creations["task-1"]).toBeDefined();
    });

    it("should return earliest ready task among multiple ready tasks", () => {
      // Create three tasks with different timestamps
      manager.dispatch({
        type: "create",
        timestamp: 3000,
        id: "task-c",
        title: "Task C",
        goal: "Created last",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "create",
        timestamp: 1000,
        id: "task-a",
        title: "Task A",
        goal: "Created first",
        parentId: ROOT_TASK_ID,
      });

      manager.dispatch({
        type: "create",
        timestamp: 2000,
        id: "task-b",
        title: "Task B",
        goal: "Created second",
        parentId: ROOT_TASK_ID,
      });

      // Should return task-a because it has the earliest createdAt
      const nextTask = manager.getNextTask();
      expect(nextTask?.id).toBe("task-a");
    });
  });
});
