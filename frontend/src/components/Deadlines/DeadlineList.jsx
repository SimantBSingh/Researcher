import React, { useState, useEffect, useCallback } from "react";
import Deadline from "./Deadline";
import {
  Button,
  Tabs,
  Tab,
  Box,
  Stack,
  Badge,
  CircularProgress,
  Typography,
  IconButton,
  Popover,
} from "@mui/material";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DayCalendarSkeleton } from "@mui/x-date-pickers/DayCalendarSkeleton";
import CloseIcon from "@mui/icons-material/Close";
import CustomMenu from "../../utils/CustomMenu";
import CustomModal from "../../utils/CustomModal";
import { useParams } from "react-router";
import { useApiHandler } from "../../helpers/useApiHandler";
import { useSnackbar } from "../../utils/SnackbarContext";
import {
  getDeadlines,
  createDeadline as apiCreateDeadline,
  updateDeadline as apiUpdateDeadline,
  deleteDeadline as apiDeleteDeadline,
} from "../../api/deadlines";
import DataObjectIcon from "@mui/icons-material/DataObject";
import BatchDeadlineModal from "./BatchDeadlineModal";

function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const highlightedDay = highlightedDays.find((el) => el.key === day.date());
  const isSelected =
    !outsideCurrentMonth && highlightedDay !== undefined;

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      color="success"
      badgeContent={isSelected ? highlightedDay.val : undefined}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

function CustomTabPanel({ children, value, index, ...other }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      sx={{ height: "100%", width: "100%" }}
      {...other}
    >
      {value === index && children}
    </Box>
  );
}

export default function DeadlineList({ refreshKey }) {
  const [deadlines, setDeadlines] = useState([]);
  const [openDeadlineModal, setOpenDeadlineModal] = useState(false);
  const [deadlineSelected, setDeadlineSelected] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedDays, setHighlightedDays] = useState([]);
  const [currentCalendarMonthYear, setCurrentCalendarMonthYear] = useState([
    dayjs().year(),
    dayjs().month() + 1,
  ]);
  const [deadlinesOnSelectedDate, setDeadlinesOnSelectedDate] = useState([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const { handleApiResponse } = useApiHandler();
  const { showSnackbar } = useSnackbar();
  const { projectId } = useParams();

  // ── data fetching ─────────────────────────────────────────────────────────
  // Must be defined BEFORE the useEffect that lists it as a dependency.
  const fetchDeadlines = useCallback(async () => {
    try {
      const { response, data } = await getDeadlines(projectId);
      if (!response.ok) {
        showSnackbar(data.detail || "Failed to fetch deadlines.", "error");
      } else {
        setDeadlines(data);
      }
    } catch (error) {
      showSnackbar("Network error loading deadlines.", "error");
    }
  }, [projectId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchDeadlines();
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchDeadlines, refreshKey]);

  // ── calendar highlighting ─────────────────────────────────────────────────
  const fetchHighlightedDays = useCallback((yearMonth) => {
    const filtered = deadlines.filter((d) => {
      const date = dayjs(d.datetime);
      return date.month() + 1 === yearMonth[1] && date.year() === yearMonth[0];
    });

    const dayCount = filtered.reduce((acc, d) => {
      const day = dayjs(d.datetime).date();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    setHighlightedDays(
      Object.entries(dayCount).map(([day, val]) => ({ key: parseInt(day, 10), val }))
    );
    setIsLoading(false);
  }, [deadlines]);

  useEffect(() => {
    fetchHighlightedDays(currentCalendarMonthYear);
  }, [deadlines]);

  const handleMonthChange = (date) => {
    setIsLoading(true);
    setHighlightedDays([]);
    const ym = [date.year(), date.month() + 1];
    fetchHighlightedDays(ym);
    setCurrentCalendarMonthYear(ym);
  };

  const handleYearChange = (date) => {
    setIsLoading(true);
    setHighlightedDays([]);
    const ym = [date.year(), date.month() + 1];
    fetchHighlightedDays(ym);
    setCurrentCalendarMonthYear(ym);
  };

  // ── calendar popover ──────────────────────────────────────────────────────
  const handlePopoverClick = (date) => {
    const selectedDayjs = date.startOf("day");
    const matching = deadlines.filter((d) =>
      dayjs(d.datetime).startOf("day").isSame(selectedDayjs)
    );
    setDeadlinesOnSelectedDate(matching);
    if (matching.length > 0) {
      setAnchorEl(document.body);
    }
  };

  const handlePopOverClose = () => {
    setAnchorEl(null);
    setDeadlineSelected(null);
  };

  // ── modal helpers ─────────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setDeadlineSelected(null); // always clear when opening for a new deadline
    setOpenDeadlineModal(true);
  };

  const handleEditModal = (deadline) => {
    setDeadlineSelected(deadline);
    setOpenDeadlineModal(true);
    setAnchorEl(null);
  };

  const handleCloseModal = () => {
    setOpenDeadlineModal(false);
    setDeadlineSelected(null);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addDeadline = async (newDeadline) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiCreateDeadline(newDeadline);
      handleApiResponse(response, data, "Deadline created successfully");
      await fetchDeadlines();
    } catch (error) {
      showSnackbar("Error creating deadline.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchAddDeadlines = async (deadlinesToAdd) => {
    setIsLoading(true);
    let allOk = true;
    try {
      await Promise.all(
        deadlinesToAdd.map(async (deadline) => {
          const { response } = await apiCreateDeadline(deadline);
          if (!response.ok) allOk = false;
        })
      );
      if (allOk) {
        showSnackbar(`Successfully added ${deadlinesToAdd.length} deadlines`);
        await fetchDeadlines();
      } else {
        showSnackbar("Some deadlines could not be added.", "error");
      }
    } catch (error) {
      showSnackbar(`Error adding deadlines: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const updateDeadline = async (deadline) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiUpdateDeadline(deadline.id, deadline);
      handleApiResponse(response, data, "Deadline updated successfully");
      await fetchDeadlines();
      // Sync the popover list if it's open
      setDeadlinesOnSelectedDate((prev) =>
        prev.map((d) => (d.id === deadline.id ? { ...d, name: deadline.name } : d))
      );
    } catch (error) {
      showSnackbar("Error updating deadline.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDeadline = async (id) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiDeleteDeadline(id, projectId);
      handleApiResponse(response, data, "Deadline deleted successfully");
      await fetchDeadlines();
      setDeadlinesOnSelectedDate((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      showSnackbar("Error deleting deadline.", "error");
    } finally {
      setIsLoading(false);
      handlePopOverClose();
    }
  };

  // ── save handler (from CustomModal) ──────────────────────────────────────
  const handleSaveData = async (data) => {
    if (deadlineSelected === null) {
      // Create — data: [fakeId, name, location, dayjsDate]
      const dateVal = data[3];
      if (!dateVal) {
        showSnackbar("Please select a date for the deadline.", "error");
        return;
      }
      await addDeadline({
        name: data[1],
        location: data[2],
        datetime: dayjs(dateVal).toISOString(),
        project_id: projectId,
      });
    } else {
      // Update — data: [name, location, dateValOrString]
      const dateVal = data[2];
      const datetime =
        typeof dateVal === "string" ? dateVal : dayjs(dateVal).toISOString();
      await updateDeadline({
        id: deadlineSelected.id,
        name: data[0],
        location: data[1],
        datetime,
        project_id: projectId,
      });
    }
    handleCloseModal();
  };

  const handleFocusedViewChange = () => [false, false];

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={(theme) => ({
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: theme.spacing(2),
        [theme.breakpoints.down("sm")]: { px: theme.spacing(1) },
      })}
    >
      <Box
        sx={(theme) => ({
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          px: theme.spacing(2),
          [theme.breakpoints.down("sm")]: { px: theme.spacing(1) },
        })}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ mb: 2 }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, v) => {
              setTabValue(v);
              fetchHighlightedDays([dayjs().year(), dayjs().month() + 1]);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider", flex: 1 }}
          >
            <Tab label="Calendar" />
            <Tab label="List View" />
          </Tabs>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenAddModal}
            sx={(theme) => ({
              [theme.breakpoints.up("sm")]: { minWidth: "150px" },
            })}
          >
            Add Deadline
          </Button>
          <IconButton
            onClick={() => setBatchModalOpen(true)}
            sx={{ alignSelf: { xs: "center", sm: "auto" } }}
            title="Batch Add Deadlines"
          >
            <DataObjectIcon color="primary" />
          </IconButton>
        </Stack>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <CustomTabPanel value={tabValue} index={0}>
              <Box
                sx={{
                  height: "100%",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "auto",
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateCalendar
                    loading={isLoading}
                    onMonthChange={handleMonthChange}
                    onYearChange={handleYearChange}
                    renderLoading={() => <DayCalendarSkeleton />}
                    slots={{ day: ServerDay }}
                    slotProps={{ day: { highlightedDays } }}
                    onChange={handlePopoverClick}
                    onFocusedViewChange={handleFocusedViewChange}
                    sx={(theme) => ({
                      "&.MuiDateCalendar-root": {
                        width: "80%",
                        maxHeight: "100%",
                        "& .MuiDayCalendar-weekDayLabel": { fontSize: "1rem" },
                        '& div[role="row"]': { justifyContent: "space-around" },
                      },
                    })}
                  />
                </LocalizationProvider>
              </Box>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={1}>
              <Box sx={{ height: "100%", overflow: "auto", px: { xs: 1, sm: 2 } }}>
                <Stack spacing={2}>
                  {deadlines.length > 0 ? (
                    deadlines.map((deadline) => (
                      <Deadline
                        key={deadline.id}
                        deadline={deadline}
                        deleteDeadline={deleteDeadline}
                        openFieldModal={handleEditModal}
                      />
                    ))
                  ) : (
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                      No deadlines yet. Click "Add Deadline" to get started!
                    </Typography>
                  )}
                </Stack>
              </Box>
            </CustomTabPanel>
          </>
        )}
      </Box>

      {openDeadlineModal && (
        <CustomModal
          type="deadline"
          saveData={handleSaveData}
          closeModal={handleCloseModal}
          prepopulate={deadlineSelected}
        />
      )}

      <BatchDeadlineModal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        onSave={handleBatchAddDeadlines}
        projectId={projectId}
      />

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopOverClose}
        anchorOrigin={{ vertical: "center", horizontal: "center" }}
        transformOrigin={{ vertical: "center", horizontal: "center" }}
        sx={{ "& .MuiPopover-paper": { width: { xs: "90%", sm: 400 }, p: 2 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Deadlines for{" "}
              {deadlinesOnSelectedDate[0]
                ? dayjs(deadlinesOnSelectedDate[0].datetime).format("MMM D, YYYY")
                : ""}
            </Typography>
            <IconButton size="small" onClick={handlePopOverClose}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {deadlinesOnSelectedDate.map((deadline) => (
            <Stack
              key={deadline.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ p: 1, borderRadius: 1, bgcolor: "background.default" }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{deadline.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {deadline.location}
                </Typography>
              </Box>
              <CustomMenu
                iconType="MoreVertIcon"
                options={["Edit", "Delete"]}
                handleDelete={() => deleteDeadline(deadline.id)}
                handleEdit={() => handleEditModal(deadline)}
              />
            </Stack>
          ))}
        </Stack>
      </Popover>
    </Box>
  );
}
