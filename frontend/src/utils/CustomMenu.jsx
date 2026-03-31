import React from "react";
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { ActionTypes, AccessLevel } from '../constants/enums'


export default function CustomMenu({
  iconType,
  options,
  document,
  documentType = null,
  handleCreate,
  handleDelete,
  handleEdit,
  handleFileDownload=null,
  handleFileView = null,
}) {
  const ITEM_HEIGHT = 48;

  const handleMenuItemClick = (item) => {
    // console.log("item" + item)
    if (item.toLowerCase() === ActionTypes.NEW_FOLDER) {
      handleCreate(ActionTypes.NEW_FOLDER);
    } else if (item.toLowerCase() === ActionTypes.UPLOAD_FOLDER) {
      handleCreate(ActionTypes.UPLOAD_FOLDER);
    } else if (item.toLowerCase() === ActionTypes.UPLOAD_FILE) {
      handleCreate(ActionTypes.UPLOAD_FILE);
    } else if (item.toLowerCase() === ActionTypes.DELETE) {
      handleDelete(ActionTypes.DELETE);
    } else if (item.toLowerCase() === ActionTypes.EDIT) {
      handleEdit(ActionTypes.EDIT, document, documentType);
    } else if (item.toLowerCase() === ActionTypes.DOWNLOAD) {
      handleFileDownload(ActionTypes.DOWNLOAD, document, documentType);
    }
  };

  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={openMenu ? "long-menu" : undefined}
        aria-expanded={openMenu ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleMenuClick}
      >
        {/* <MoreVertIcon /> */}
        {iconType === "MoreVertIcon" ? <MoreVertIcon /> : <AddIcon />}
        {/* <AddIcon /> */}
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{
          "aria-labelledby": "long-button",
        }}
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            style: {
              maxHeight: ITEM_HEIGHT * 4.5,
              width: "20ch",
            },
          },
        }}
      >
        {(options && options.length > 0) && options.map((option) => (
          <MenuItem key={option} onClick={() => handleMenuItemClick(option, )}>
            {option}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
