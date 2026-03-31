import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { ActionTypes } from "../constants/enums";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function FileFolderModal({
  saveData,
  closeModal,
  currentDocumentName,
  actionType,
}) {
  const [name, setName] = useState("");
  // const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (currentDocumentName && currentDocumentName.length > 0) {
      if (currentDocumentName.includes(".")) {
        setName(
          currentDocumentName.substring(0, currentDocumentName.lastIndexOf("."))
        );
      } else {
        setName(currentDocumentName);
      }
    }
  }, [currentDocumentName]);

  const handleSaveData = () => {
    // if (!prepopulate || prepopulate.length === 0 ) {
    //     saveData([name, type, 'create']);
    // } else if (prepopulate !== name) {
    //     saveData([name+fullName.substring(fullName.lastIndexOf('.'), fullName.length), type, 'update']);
    // }

    // if (actionType === ActionTypes.CREATE) {
    //     saveData(name, actionType)
    // } else if (actionType === ActionTypes.EDIT) {
    saveData(name);
    // }
    closeModal();
  };

  return (
    <div>
      <Modal
        open={true}
        onClose={closeModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} component={"form"} onSubmit={handleSaveData}>
          <TextField
            id="outlined-basic"
            label={"Document Name"}
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={closeModal}>Cancel</Button>
          <Button type="submit">OK</Button>
        </Box>
        {/* <Box> */}

        {/* </Box> */}
      </Modal>
    </div>
  );
}
