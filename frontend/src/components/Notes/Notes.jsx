import React, { useState } from "react";
import IndividualNote from "./IndividualNote";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import Textarea from "@mui/joy/Textarea";
import Box from "@mui/joy/Box";
import { CircularProgress } from "@mui/material";
import { useApiHandler } from "../../helpers/useApiHandler";
import { getNotes, createNote, updateNote as apiUpdateNote, deleteNote as apiDeleteNote } from "../../api/notes";

export default function Notes({ accessLevel, notes, updateNotes, projectId }) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { handleApiResponse } = useApiHandler();

  const addNote = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const { response, data } = await createNote(content, projectId);
      handleApiResponse(response, data, "New Note added successfully");

      if (response.ok) {
        setContent("");
        const { response: fetchResponse, data: fetchedNotes } = await getNotes(projectId);
        if (fetchResponse.ok) {
          updateNotes(fetchedNotes);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiDeleteNote(id, projectId);
      handleApiResponse(response, data, "Note deleted successfully");

      if (response.ok) {
        updateNotes(notes.filter(note => note.id !== id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateNote = async (id, newContent) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiUpdateNote(id, newContent, projectId);
      handleApiResponse(response, data, "Note updated successfully");

      if (response.ok) {
        const updatedNotes = notes.map(note =>
          note.id === id ? { ...note, content: newContent } : note
        );
        updateNotes(updatedNotes);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={localStyles.notesContainer}>
      <h1>Notes</h1>
      <div style={localStyles.notes}>
        {isLoading && notes.length === 0 ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            height: "60%",
          }}>
            <CircularProgress />
          </div>
        ) : (
          <div style={localStyles.noteContent}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              overflow: "auto",
              width: "85%",
            }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                width: "100%",
                overflow: "auto",
              }}>
                {notes &&
                  notes.length > 0 &&
                  notes.map((note) => {
                    return (
                      <IndividualNote
                        key={note.id}
                        note={note}
                        editNote={updateNote}
                        deleteNote={deleteNote}
                      />
                    );
                  })}
              </div>
            </div>

            <FormControl style={{ marginTop: "5%", width: "80%" }}>
              <Textarea
                placeholder="Type something here…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                endDecorator={
                  <Box
                    sx={{
                      display: "flex",
                      gap: "var(--Textarea-paddingBlock)",
                      pt: "var(--Textarea-paddingBlock)",
                      borderTop: "1px solid",
                      borderColor: "divider",
                      flex: "auto",
                    }}
                  >
                    <Button sx={{ ml: "auto" }} onClick={addNote} disabled={isLoading}>
                      Send
                    </Button>
                  </Box>
                }
                sx={[
                  {
                    minWidth: "80%",
                  },
                ]}
              />
            </FormControl>
          </div>
        )}
      </div>
    </div>
  );
}

const localStyles = {
  notesContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
    padding: 0,
  },
  notes: {
    width: "100%",
    height: "90%",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
    padding: 0,
  },
  noteContent: {
    overflow: "auto",
    width: "100%",
    height: "90%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },
};