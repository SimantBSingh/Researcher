import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import formatDate from "../../helpers/ConvertDateFormat";
import dayjs from "dayjs";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

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

export default function Deadline({ deadline, deleteDeadline, openFieldModal }) {
  const [open, setOpen] = React.useState(false);
  const handleOpenModal = () => setOpen(!open);

  const handleFieldModal = () => {
    openFieldModal(deadline);
  };

  return (
    <Box margin={0}>
      <CardActions>
        <Button onClick={handleOpenModal} width={"100%"}>
          {deadline.name}
        </Button>
        <IconButton
          aria-label="delete"
          size="large"
          color="error"
          onClick={() => deleteDeadline(deadline.id)}
        >
          <DeleteIcon fontSize="inherit" />
        </IconButton>
        <IconButton
          aria-label="edit"
          size="large"
          color="success"
          onClick={() => handleFieldModal()}
        >
          <EditIcon fontSize="inherit" />
        </IconButton>
      </CardActions>
      <Modal
        open={open}
        onClose={handleOpenModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography variant="h7" component="div" onClick={handleOpenModal}>
            {deadline.name}
          </Typography>
          <Typography color="text.secondary">{deadline.location}</Typography>
          <Typography variant="body2">
            {formatDate(dayjs(deadline.datetime))}
          </Typography>
        </Box>
      </Modal>
    </Box>
  );
}
