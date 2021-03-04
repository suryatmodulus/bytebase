import axios from "axios";
import {
  UserId,
  TaskId,
  Task,
  TaskNew,
  TaskPatch,
  TaskState,
  ResourceObject,
} from "../../types";

function convert(task: ResourceObject): Task {
  return {
    id: task.id,
    ...(task.attributes as Omit<Task, "id">),
  };
}

const state: () => TaskState = () => ({
  taskListByUser: new Map(),
  taskById: new Map(),
});

const getters = {
  taskListByUser: (state: TaskState) => (userId: UserId) => {
    return state.taskListByUser.get(userId);
  },

  taskById: (state: TaskState) => (taskId: TaskId) => {
    return state.taskById.get(taskId);
  },
};

const actions = {
  async fetchTaskListForUser({ commit }: any, userId: UserId) {
    const taskList = (
      await axios.get(`/api/task?userid=${userId}`)
    ).data.data.map((task: ResourceObject) => {
      return convert(task);
    });
    commit("setTaskListForUser", { userId, taskList });
    return taskList;
  },

  async fetchTaskById({ commit }: any, taskId: TaskId) {
    const task = convert((await axios.get(`/api/task/${taskId}`)).data.data);
    commit("setTaskById", {
      taskId,
      task,
    });
    return task;
  },

  async createTask({ commit }: any, newTask: TaskNew) {
    const createdTask = convert(
      (
        await axios.post(`/api/task`, {
          data: newTask,
        })
      ).data.data
    );

    commit("setTaskById", {
      taskId: createdTask.id,
      task: createdTask,
    });

    return createdTask;
  },

  async patchTask(
    { commit, dispatch }: any,
    {
      taskId,
      taskPatch,
    }: {
      taskId: TaskId;
      taskPatch: TaskPatch;
    }
  ) {
    const updatedTask = convert(
      (
        await axios.patch(`/api/task/${taskId}`, {
          data: {
            type: "taskpatch",
            attributes: taskPatch,
          },
        })
      ).data.data
    );

    commit("setTaskById", {
      taskId: taskId,
      task: updatedTask,
    });

    dispatch("activity/fetchActivityListForTask", taskId, { root: true });

    return updatedTask;
  },
};

const mutations = {
  setTaskListForUser(
    state: TaskState,
    {
      userId,
      taskList,
    }: {
      userId: UserId;
      taskList: Task[];
    }
  ) {
    state.taskListByUser.set(userId, taskList);
  },

  setTaskById(
    state: TaskState,
    {
      taskId,
      task,
    }: {
      taskId: TaskId;
      task: Task;
    }
  ) {
    state.taskById.set(taskId, task);
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
