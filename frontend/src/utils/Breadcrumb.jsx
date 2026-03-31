import React, { useMemo, useState } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Button } from '@mui/material';

export default function BreadCrumb({ path, navigateToFolder }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    if (event) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const renderBreadcrumbs = useMemo(() =>
    path.map((crumb, index) => (
      <Button
        key={index}
        color="inherit"
        onClick={() => navigateToFolder(crumb.id, index)}
      >
        {crumb.name}
      </Button>
    )),
    [path, navigateToFolder]
  );

  return (
    <React.Fragment>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        aria-labelledby="with-menu-demo-breadcrumbs"
      >
        {path.slice(1, path.length - 1).map((crumb, index) => (
          <MenuItem key={index} onClick={handleClose}>
            {crumb}
          </MenuItem>
        ))}
      </Menu>

      <Breadcrumbs aria-label="breadcrumbs">
        {renderBreadcrumbs}
      </Breadcrumbs>
    </React.Fragment>
  );
}
