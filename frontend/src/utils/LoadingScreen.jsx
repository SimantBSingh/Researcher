import * as React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export default function LoadingScreen({ desc, height="60%" }) {
  return (
    // <Box sx={{ display: 'flex' }}>
    //   <CircularProgress />
    // </Box>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: height,
      }}
    >
      <CircularProgress />
      {desc}
    </div>
  );
}
