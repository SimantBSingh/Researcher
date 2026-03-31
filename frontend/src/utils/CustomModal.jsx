import React, { useState, forwardRef, useEffect } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export default function CustomModal({ type, saveData, closeModal, prepopulate }) {
  const [date, setDate] = useState(null);

  const [labelText1, setLabelText1] = useState("");
  const [labelText2, setLabelText2] = useState("");
  const [labelText3, setLabelText3] = useState("");

  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [text3, setText3] = useState("");
  const [email, setEmail] = useState("");


  useEffect(() => {
    if (prepopulate !== null && prepopulate !== undefined) {
      if (type === "deadline") {
        setText1(prepopulate.name);
        setText2(prepopulate.location);
        setDate(prepopulate.datetime);
      } else if (type === "collaborator") {
        setText1(prepopulate.name);
        setText2(prepopulate.title);
        setText3(prepopulate.zoom_link);
        setEmail(prepopulate.email);
      }
    }
  }, [prepopulate]);

  useEffect(() => {
    if (type === "deadline") {
      setLabelText1("Name of the event");
      setLabelText2("Location");
      setLabelText3("Deadline");
    } else if (type === "collaborator") {
      setLabelText1("Member's name");
      setLabelText2("Position");
      setLabelText3("Zoom Link");
    }
  }, []);

  const handleSave = () => {
    let dateOrTextVal;
    if (type === "deadline") {
      dateOrTextVal = date;
    } else {
      dateOrTextVal = text3;
    }
    if (prepopulate === null || prepopulate === undefined) {
      if (type === "collaborator") {
        if (isValidEmail(email)) {
          saveData([Date.now(), text1, text2, dateOrTextVal, email]); // Pass the data back to the parent component
        } else {
          alert("Invalid email address");
          return;
        }
      } else {
        saveData([Date.now(), text1, text2, dateOrTextVal]); // Deadlines
      }
    } else if (type === "collaborator") {
      saveData([text1, text2, dateOrTextVal, email]);
    } else {
      saveData([text1, text2, dateOrTextVal]);
    }
  };

  return (
    // <div>
    <Dialog
      open={true}
      TransitionComponent={Transition}
      keepMounted
      onClose={closeModal}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle>
        {type === "deadline"
          ? "Add Deadlines Details"
          : "Add Collaborator Details"}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          sx={{ "& > :not(style)": { m: 1, width: "25ch" } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            id="outlined-basic"
            label={labelText1}
            variant="outlined"
            value={text1}
            onChange={(e) => setText1(e.target.value)}
          />
          <TextField
            id="outlined-basic"
            label={labelText2}
            variant="outlined"
            value={text2}
            onChange={(e) => setText2(e.target.value)}
          />
          {type === "deadline" ? (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={date ? dayjs(date) : null}
                label={labelText3}
                onChange={(date) => setDate(date)}
              />
            </LocalizationProvider>
          ) : (
            <TextField
              id="outlined-basic"
              label={labelText3}
              variant="outlined"
              value={text3}
              onChange={(e) => setText3(e.target.value)}
            />
          )}
          {type === "collaborator" && (
            <TextField
              id="outlined-basic"
              label={"Email"}
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal}>Cancel</Button>
        <Button onClick={handleSave}>OK</Button>
      </DialogActions>
    </Dialog>
    // </div>
  );
}
