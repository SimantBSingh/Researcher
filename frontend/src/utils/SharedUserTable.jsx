import * as React from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Checkbox from "@mui/material/Checkbox";
import { IconButton } from "@mui/material";
import { Delete, Edit, Share } from "@mui/icons-material";
import { useEffect } from "react";
import { useState } from "react";
import hasWriteAccess from "../helpers/ProjectAccess";
import { AccessLevel } from "../constants/enums";
import { getSharedUsers, deleteSharedUser, updateAccessLevel } from "../api/projects";
import { useSnackbar } from "./SnackbarContext";
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // Hide the last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));


const changeAccessLevel = (accessLevel) => {
  if (hasWriteAccess(accessLevel)) {
    return AccessLevel.READ;
  } else {
    return AccessLevel.WRITE;
  }
} 


export default function SharedUserTable({ project_id }) {
  const [sharedUsers, setSharedUsers] = useState([]);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    fetchSharedUsers();
  }, []);

  const fetchSharedUsers = async () => {
    try {
      const { response, data } = await getSharedUsers(project_id);
      if (!response.ok) {
        alert(`Failed to fetch shared users: ${response.statusText}`);
        return;
      }
      setSharedUsers(data);
    } catch (error) {
      alert("Error fetching shared projects: " + error.message);
    }
  };

  const deleteCollaborator = async (user) => {
    try {
      const { response, data } = await deleteSharedUser(project_id, user.email);
      if (!response.ok) {
        alert(data.detail);
      } else {
        showSnackbar("Collaborator removed successfully");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Error updating project: " + error.message);
    }
    await fetchSharedUsers();
  };

  const toggleAccessLevel = async (user) => {
    const accessLevel = changeAccessLevel(user.access_level);
    try {
      const { response, data } = await updateAccessLevel(project_id, user.email, accessLevel);
      if (!response.ok) {
        alert(data.detail);
      } else {
        showSnackbar(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      await fetchSharedUsers();
    }
  };



  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 400 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell>Email</StyledTableCell>
            <StyledTableCell align="right">Access Level</StyledTableCell>
            <StyledTableCell align="right">Delete</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sharedUsers.map((row, index) => (
            <StyledTableRow key={index}>
              <StyledTableCell component="th" scope="row">
                {row.email}
              </StyledTableCell>
              <StyledTableCell align="right">
                <FormControlLabel
                  control={<Switch checked={hasWriteAccess(row.access_level)} onChange={() => toggleAccessLevel(row)}/>}
                  // label="Required"
                />
              </StyledTableCell>
              <StyledTableCell align="right">
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => deleteCollaborator(row)}
                //   onClick={(e) => handleTemplateDelete(template.id, e)}
                  size="small"
                  sx={{ mr: -1 }}
                >
                  <Delete />
                </IconButton>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
