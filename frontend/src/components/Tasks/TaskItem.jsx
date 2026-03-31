import React, { useEffect } from "react";
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Checkbox from '@mui/material/Checkbox';
import { AccessLevel } from "../../constants/enums";

const label = { inputProps: { 'aria-label': 'Task Checkbox' } };

function TaskItem({ task, deleteTask, toggleCompleted, accessLevel }) {
  function handleChange() {
    toggleCompleted(task.id);
  }

  return (
    <div className="todo-item" style={localStyles.taskContainer}>
      <Checkbox
        {...label}
        disabled={accessLevel === AccessLevel.READ}
        checked={task.status === "complete"}
        color="success"
        onChange={handleChange}
      />
      <p
        style={
          task.status === "pending"
            ? { ...localStyles.taskItem }
            : { ...localStyles.taskItem, ...localStyles.completedTaskItem }
        }
      >
        {task.title}
      </p>
      <IconButton
        aria-label="delete"
        size="large"
        color="error"
        onClick={() => deleteTask(task.id)}
        disabled={accessLevel === AccessLevel.READ}
      >
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    </div>
  );
}


const localStyles = {
  taskContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",  // ensures vertical centering
    width: "100%",
    gap: 8,
  },
  taskItem: {
    flexGrow: 1,
    textAlign: "left",
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap",
    margin: 0, // remove default <p> margin
  },
  completedTaskItem: {
    color: "#888",
    textDecoration: "line-through",
  },
};

export default TaskItem;
