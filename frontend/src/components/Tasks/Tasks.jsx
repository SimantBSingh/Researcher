import { React, useState } from "react";
import TaskItem from "./TaskItem";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { AccessLevel } from "../../constants/enums";
import { CircularProgress } from "@mui/material";
import { useApiHandler } from "../../helpers/useApiHandler";
import { createTask as apiCreateTask, getTasks, updateTask, deleteTask as apiDeleteTask } from "../../api/tasks";

export default function Tasks({ accessLevel, tasks, updateTasks, projectId }) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { handleApiResponse } = useApiHandler();

  const createTask = async (task) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiCreateTask(task);

      handleApiResponse(response, data, "Task created successfully");
      setText("");

      if (response.ok) {
        const { response: fetchResponse, data: fetchedTasks } = await getTasks(projectId);
        if (fetchResponse.ok) {
          updateTasks(fetchedTasks);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      // Using the existing API handler for consistency
      const mockResponse = { ok: false, status: 400 };
      const mockData = { detail: "Task title cannot be empty" };
      handleApiResponse(mockResponse, mockData);
      return;
    }

    const newTask = {
      title: text.trim(),
      status: "pending",
      project_id: projectId,
    };

    createTask(newTask);
  };

  const deleteTask = async (id) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiDeleteTask(id, projectId);

      if (response.ok) {
        updateTasks(tasks.filter((task) => task.id !== id));
      }

      handleApiResponse(response, data, "Task deleted successfully");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCompleted = async (id) => {
    const task = tasks.find((task) => task.id === id);
    if (!task) return;

    // Optimistic UI update
    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? { ...t, status: t.status === "pending" ? "complete" : "pending" }
        : t
    );
    updateTasks(updatedTasks);

    setIsLoading(true);
    try {
      const { response, data } = await updateTask(id, {
        title: null,
        task_status: task.status === "pending" ? "complete" : "pending",
        project_id: projectId,
      });

      if (!response.ok) {
        updateTasks(tasks);
      } else {
        handleApiResponse(response, data, "Task status updated successfully");
      }
    } catch (error) {
      updateTasks(tasks);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isReadOnly = accessLevel === AccessLevel.READ;

  return (
    <div style={styles.taskListContainer}>
      <h1>Tasks</h1>
      <div style={styles.tasks}>
        {isLoading && tasks.length === 0 ? (
          <div style={styles.loadingContainer}>
            <CircularProgress />
          </div>
        ) : (
          <div style={styles.taskListContent}>
            <div style={styles.tasksContainer}>
              {tasks.length > 0 ? (
                tasks
                  .slice()
                  .reverse()
                  .map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      deleteTask={deleteTask}
                      toggleCompleted={toggleCompleted}
                      accessLevel={accessLevel}
                    />
                  ))
              ) : (
                <div style={styles.emptyState}>
                  No tasks yet. Create one below!
                </div>
              )}
            </div>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={styles.formContainer}
            >
              <TextField
                id="task-input"
                label="Add Task"
                variant="outlined"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isReadOnly || isLoading}
                sx={{ width: "80%" }}
                autoComplete="off"
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isReadOnly || isLoading}
                endIcon={<SendIcon />}
              >
                Add
              </Button>
            </Box>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  taskListContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
    padding: 0,
  },
  tasks: {
    width: "100%",
    height: "90%",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
    padding: 0,
  },
  taskListContent: {
    overflow: "auto",
    width: "100%",
    height: "90%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tasksContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "85%",
    overflow: "auto",
    padding: "16px 0",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60%",
    width: "100%",
  },
  emptyState: {
    textAlign: "center",
    padding: "24px",
    color: "#757575",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 3,
    gap: 2,
    width: "100%",
    marginTop: "auto",
  },
};