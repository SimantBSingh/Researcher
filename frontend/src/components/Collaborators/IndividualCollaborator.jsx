import React, { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Grid from "@mui/material/Grid2";
import Link from "@mui/material/Link";

const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&::before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, .05)"
      : "rgba(0, 0, 0, .03)",
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)",
  },
  "& .MuiAccordionSummary-content": {
    // marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

export default function IndividualCollaborator({
  member,
  currExpanded,
  handleChange,
  deleteCollaborator,
  openFieldModal,
}) {
  const [zoomLink, setZoomLink] = useState("");

  const handleFieldModal = () => {
    openFieldModal(member);
  };

  useEffect(() => {
    if (member.zoom_link) {
      const formattedLink = member.zoom_link.startsWith("http")
        ? member.zoomLink
        : `https://${member.zoom_link}`;
      setZoomLink(formattedLink);
    }
  }, [member.zoom_link]);

  return (
    <Accordion
      expanded={currExpanded}
      onChange={handleChange}
      style={localStyles.container}
    >
      <AccordionSummary
        aria-controls="panel1d-content"
        id={`${member.name}-header`}
      >
        <Typography style={localStyles.title} component="div">
          {member.name} - {member.title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid size={8}>
            <Typography>
              Institution:
              {member.institution}
            </Typography>
            <Typography>
              Zoom Link:
              <a
                href={zoomLink}
                target="_blank"
                underline="hover"
                rel="noopener noreferrer"
              >
                {zoomLink}
              </a>
            </Typography>
            <Typography>
              Email Address:
              <a href={`mailto:${member.email}`}> {member.email}</a>
            </Typography>
          </Grid>
          <Grid
            size={2}
            sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}
          >
            <IconButton
              size="small"
              color="success"
              onClick={() => deleteCollaborator(member.email)}
            >
              <DeleteIcon fontSize="inherit" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="edit"
              onClick={() => handleFieldModal()}
            >
              <EditIcon fontSize="inherit" />
            </IconButton>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

const localStyles = {
  container: {
    margin: 0,
    padding: 0,
  },
  title: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
};
