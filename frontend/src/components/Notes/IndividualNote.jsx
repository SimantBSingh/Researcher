import React, { useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import Textarea from "@mui/joy/Textarea";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

export default function IndividualNote({ note, editNote, deleteNote }) {
  const [noteValue, setNoteValue] = useState(note.content);
  const [textFocus, setTextFocus] = useState(false);

  const handleOnBlur = () => {
    setTimeout(() => {
      setTextFocus(false);
    }, 500);
  };
  return (
    <FormControl
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
    >
      {/* <div style={{ width: "90%" }}> */}
      <Textarea
        placeholder="Type something here…"
        value={noteValue}
        onChange={(e) => setNoteValue(e.target.value)}
        onFocus={() => setTextFocus(true)}
        onBlur={() => handleOnBlur()}
        endDecorator={
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "right",
              flexWrap: "wrap",
            }}
          >
            {textFocus && (
              <div>
                <Button
                  sx={{ ml: "auto" }}
                  onClick={() => editNote(note.id, noteValue)}
                >
                  Edit
                </Button>
                <IconButton color="error" onClick={() => deleteNote(note.id)}>
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </div>
            )}
          </div>
        }
        sx={[
          {
            width: "100%",
          },
        ]}
      />
    </FormControl>
  );
}
