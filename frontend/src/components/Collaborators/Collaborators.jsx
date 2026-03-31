import { React, useState, useEffect, useCallback } from "react";
import IndividualCollaborator from "./IndividualCollaborator";
import { PlusIcon } from "../../constants/PlusIcon";
import CustomModal from "../../utils/CustomModal";
import {
  TextField,
  Box,
  Button,
  Modal,
  Stack,
  CircularProgress,
  Typography,
  Paper,
  IconButton,
  Checkbox,
  List,
  ListItem,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import EmailIcon from "@mui/icons-material/Email";

import { useParams } from "react-router";
import { useApiHandler } from "../../helpers/useApiHandler";
import {
  getCollaborators,
  getAllCollaborators,
  createCollaborator as apiCreateCollaborator,
  updateCollaborator as apiUpdateCollaborator,
  deleteCollaborator as apiDeleteCollaborator,
  inviteCollaborator,
  correctCollaborators,
} from "../../api/collaborators";

export default function Collaborators({ refreshKey }) {
  const [members, setMembers] = useState([]);
  const [allCollaborators, setAllCollaborators] = useState([]);

  const [expanded, setExpanded] = useState(null);
  const [memberSelected, setMemberSelected] = useState(null);
  const [checkedCollaborators, setCheckedCollaborators] = useState([]);

  const [inviteModal, setInviteModal] = useState(false);
  const [allCollaboratorsModal, setAllCollaboratorsModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const { handleApiResponse } = useApiHandler();

  const { projectId } = useParams();

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCollaborators();
        await fetchAllCollaborators();
      } catch (e) {
        alert("Error loading data: " + e.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchCollaborators, fetchAllCollaborators, refreshKey]);

  const fetchAllCollaborators = useCallback(async () => {
    try {
      const { response, data } = await getAllCollaborators(projectId);
      if (!response.ok) {
        alert(data.message);
      } else {
        setAllCollaborators(data);
      }
    } catch (error) {
      alert(error);
    }
  }, [projectId]);

  const fetchCollaborators = useCallback(async () => {
    try {
      const { response, data } = await getCollaborators(projectId);
      if (!response.ok) {
        alert(data.message);
      } else {
        setMembers(data);
      }
    } catch (error) {
      alert(error);
    }
  }, [projectId]);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };
  const [openModal, setOpenModal] = useState(false);

  const handleEditModal = (member = null) => {
    if (member) {
      setMemberSelected(member);
    }
    setOpenModal(!openModal);
  };

  const handleToggle = (collaborator) => {
    setCheckedCollaborators((prev) => {
      const isSelected = prev.some((item) => item.id === collaborator.id);

      return isSelected
        ? prev.filter((item) => item.id !== collaborator.id)
        : [...prev, collaborator];
    });
  };

  const addCollaborator = async (newCollaborator) => {
    setIsLoading(true);
    if (!newCollaborator.name) {
      alert("Please enter a name");
      return;
    }
    try {
      const { response, data } = await apiCreateCollaborator(newCollaborator);
      handleApiResponse(response, data, "New Collaborator added successfully");
      await fetchCollaborators();
      await fetchAllCollaborators();
    } catch (error) {
      alert(error);
    } finally {
      setIsLoading(false);
    }
    setMemberSelected(null);
  };

  const updateCollaborator = async (collaborator) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiUpdateCollaborator(collaborator.id, collaborator);
      handleApiResponse(response, data, "Collaborator updated successfully");
      await fetchCollaborators();
    } catch (error) {
      alert(error);
    } finally {
      setIsLoading(false);
    }
    setMemberSelected(null);
  };

  async function deleteCollaborator(collaborator_email) {
    setIsLoading(true);
    try {
      const { response, data } = await apiDeleteCollaborator(collaborator_email, projectId);
      handleApiResponse(response, data, "Collaborator deleted successfully");
      await fetchCollaborators();
      await fetchAllCollaborators();
    } catch (error) {
      alert(error);
    } finally {
      setIsLoading(false);
    }
    setMemberSelected(null);
  }

  const handleCreateModal = () => {
    setOpenModal(!openModal);
  };

  const handleInviteMember = async (targetedInviteEmail) => {
    setIsLoading(true);
    try {
      const { response, data } = await inviteCollaborator(targetedInviteEmail, projectId);
      handleApiResponse(response, data, "Collaborator Invited successfully");
      await fetchCollaborators();
      await fetchAllCollaborators();
    } catch (error) {
      alert(error);
    } finally {
      setIsLoading(false);
      setMemberSelected(null);
      setInviteEmail("");
      setInviteModal(false);
    }
  };

  const handleSaveData = async (data) => {
    if (memberSelected === null) {
      const newMember = {
        id: Date.now(),
        name: data[1],
        title: data[2],
        zoom_link: data[3],
        email: data[4],
        project_id: projectId,
      };
      await addCollaborator(newMember);
    } else {
      const newMember = {
        id: memberSelected.id,
        name: data[0],
        title: data[1],
        zoom_link: data[2],
        email: data[3],
        project_id: projectId,
      };
      await updateCollaborator(newMember);
      setMemberSelected(null);
    }
    handleCreateModal();
  };
  const handleSubmitAllCollaborators = async (e) => {
    e.preventDefault(); // Prevent default form submission

    for (const checkedCollaborator of checkedCollaborators) {
      if (checkedCollaborator.user_id !== null) {
        await handleInviteMember(checkedCollaborator.email);
      } else {
        const member = {
          id: Date.now(),
          name: checkedCollaborator.name,
          title: checkedCollaborator.title,
          institution: checkedCollaborator.institution,
          zoom_link: checkedCollaborator.zoom_link,
          email: checkedCollaborator.email,
          project_id: projectId,
        };
        await addCollaborator(member);
      }
    }
  };

  const cleanDuplicateCollaborators = async () => {
    setIsLoading(true);
    try {
      const { response, data } = await correctCollaborators(projectId);
      handleApiResponse(response, data, "Collaborator List corrected successfully");
      await fetchCollaborators();
      await fetchAllCollaborators();
    } catch (error) {
      alert(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={(theme) => ({
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: theme.spacing(2),
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(1),
        },
      })}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 4 }}
      >
        {/* Left side - Title */}
        <Typography variant="h5" component="h1" fontWeight="medium">
          Collaborators
        </Typography>

        {/* Right side - Action buttons */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Add collaborator">
            <IconButton size="medium" color="primary" onClick={handleCreateModal}>
              <PlusIcon />
            </IconButton>
          </Tooltip>

          <Tooltip>
            <IconButton size="medium" onClick={() => setInviteModal(true)}>
              <EmailIcon color="primary" />
            </IconButton>
          </Tooltip>

          <Tooltip>
            <IconButton
              size="medium"
              onClick={() => setAllCollaboratorsModal(true)}
            >
              <GroupAddIcon color="secondary" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Update">
            <Button
              variant="outlined"
              size="small"
              onClick={cleanDuplicateCollaborators}
              sx={{ ml: 1 }}
            >
              Update
            </Button>
          </Tooltip>
        </Stack>
      </Stack>
      <Box
        // elevation={2}
        sx={(theme) => ({
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        })}
      >
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              // width: '100%',
            }}
          >
            <Stack spacing={2}>
              {members && members.length > 0 ? (
                members.map((collaborator) => (
                  <IndividualCollaborator
                    key={collaborator.id}
                    member={collaborator}
                    currExpanded={expanded === collaborator.id}
                    handleChange={handleChange(collaborator.id)}
                    deleteCollaborator={deleteCollaborator}
                    openFieldModal={handleEditModal}
                  />
                ))
              ) : (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  align="center"
                  sx={{ py: 4 }}
                >
                  No collaborators yet. Invite team members to get started!
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </Box>

      {/* <AllCollaborators project_id={projectId} /> */}

      {/* Modals */}
      {openModal && (
        <CustomModal
          type="collaborator"
          saveData={handleSaveData}
          closeModal={handleCreateModal}
          prepopulate={memberSelected}
        />
      )}

      <Modal
        open={inviteModal}
        onClose={() => [setInviteModal(false), setInviteEmail("")]}
        aria-labelledby="invite-modal"
      >
        <Box
          sx={(theme) => ({
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: {
              xs: "calc(100% - 32px)",
              sm: "400px",
            },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: theme.spacing(3),
            borderRadius: 1,
          })}
        >
          <Stack spacing={3}>
            <Typography variant="h6">Invite Member</Typography>

            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => [setInviteModal(false), setInviteEmail("")]}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => handleInviteMember(inviteEmail)}
                disabled={!inviteEmail.trim()}
              >
                Invite
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={allCollaboratorsModal}
        onClose={() => [
          setAllCollaboratorsModal(false),
          setCheckedCollaborators([]),
        ]}
        aria-labelledby="all-collaborators-modal"
      >
        <Box
          sx={(theme) => ({
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: "400px" },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
          })}
          component={"form"}
          onSubmit={handleSubmitAllCollaborators}
        >
          <Stack spacing={3}>
            {/* Header */}
            <Typography variant="h6" align="center">
              Select Collaborators
            </Typography>

            {/* Collaborators List */}
            <Paper
              variant="outlined"
              sx={{
                maxHeight: "300px",
                overflowY: "auto",
                borderRadius: 2,
                p: 1,
              }}
            >
              <List>
                {allCollaborators && allCollaborators.length > 0 ? (
                  allCollaborators.map((collaborator) => (
                    <ListItem
                      key={collaborator.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body1">
                        {collaborator.name}
                      </Typography>
                      <Checkbox
                        // checked={checkedCollaborators.includes(collaborator.id)}
                        checked={checkedCollaborators.some(
                          (item) => item.id === collaborator.id
                        )}
                        onChange={() => handleToggle(collaborator)}

                        // onChange={() => setCheckedCollaborators((prev) =>
                        //   prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                        // )
                        // }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    align="center"
                    color="text.secondary"
                  >
                    No collaborators available.
                  </Typography>
                )}
              </List>
            </Paper>

            {/* Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => [
                  setAllCollaboratorsModal(false),
                  setCheckedCollaborators([]),
                ]}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!checkedCollaborators}
              >
                Add
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
