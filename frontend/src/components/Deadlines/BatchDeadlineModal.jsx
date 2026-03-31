import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
  Box,
  Stack,
  Paper,
  Chip,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Grid2,
  Collapse
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';
import InfoIcon from '@mui/icons-material/Info';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Add custom parse format plugin to dayjs
dayjs.extend(customParseFormat);

const BatchDeadlineModal = ({ open, onClose, onSave, projectId }) => {
  const [batchText, setBatchText] = useState('');
  const [parsedDeadlines, setParsedDeadlines] = useState([]);
  const [confirmMode, setConfirmMode] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(null);

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setBatchText('');
      setParsedDeadlines([]);
      setConfirmMode(false);
      setError('');
      setEditingDeadline(null);
    }
  }, [open]);

  const handleTextChange = (e) => {
    setBatchText(e.target.value);
  };

  const tryParseDate = (dateStr) => {
    // Try various date formats
    const formats = [
      'YYYY-MM-DD',           // 2025-04-23
      'DD-MM-YYYY',           // 05-08-2025
      'MM-DD-YYYY',           // 04-23-2025
      'MM/DD/YYYY',           // 04/23/2025
      'MMMM D YYYY',          // April 23 2025
      'D MMMM YYYY',          // 23 April 2025
      'D MMM YYYY'            // 23 Apr 2025
    ];
  
    for (const format of formats) {
      const parsed = dayjs(dateStr, format);
      if (parsed.isValid()) {
        return parsed;
      }
    }
    return null;
  };

  const parseDeadlines = () => {
    setIsProcessing(true);
    setError('');
  
    try {
      const lines = batchText.trim().split('\n');
      const parsed = [];
      const invalidLines = [];
  
      lines.forEach((line, index) => {
        if (!line.trim()) return;
  
        // Try both formats with updated date patterns
        // Format 1: Date first - "(date) (event)"
        const dateFirstMatch = line.match(/^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}-\d{1,2}-\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})(?:\s+)(.+)$/i);
        
        // Format 2: Event name first - "(event) (date)"
        const eventFirstMatch = line.match(/^(.+?)(?:\s+)(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}-\d{1,2}-\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})$/i);
  
        if (dateFirstMatch) {
          const dateStr = dateFirstMatch[1].trim();
          const eventName = dateFirstMatch[2].trim();
          const parsedDate = tryParseDate(dateStr);
          
          if (parsedDate) {
            parsed.push({
              id: Date.now() + index,
              name: eventName,
              location: '',
              datetime: parsedDate.toISOString(),
              project_id: projectId
            });
          } else {
            invalidLines.push({ line, reason: 'Invalid date format' });
          }
        } else if (eventFirstMatch) {
          const eventName = eventFirstMatch[1].trim();
          const dateStr = eventFirstMatch[2].trim();
          const parsedDate = tryParseDate(dateStr);
          
          if (parsedDate) {
            parsed.push({
              id: Date.now() + index,
              name: eventName,
              location: '',
              datetime: parsedDate.toISOString(),
              project_id: projectId
            });
          } else {
            invalidLines.push({ line, reason: 'Invalid date format' });
          }
        } else {
          // Fallback: Try to find a date anywhere in the line
          const dateFormats = [
            /\d{4}-\d{1,2}-\d{1,2}/,    // YYYY-MM-DD
            /\d{1,2}-\d{1,2}-\d{4}/,    // MM-DD-YYYY or DD-MM-YYYY
            /\d{1,2}\/\d{1,2}\/\d{4}/, // MM/DD/YYYY or DD/MM/YYYY
            /\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i // 12 May 2025
          ];
  
          let dateFound = false;
          for (const format of dateFormats) {
            const match = line.match(format);
            if (match) {
              const dateStr = match[0];
              const parsedDate = tryParseDate(dateStr);
              if (parsedDate) {
                const eventName = line.replace(dateStr, '').trim();
                if (eventName) {
                  parsed.push({
                    id: Date.now() + index,
                    name: eventName,
                    location: '',
                    datetime: parsedDate.toISOString(),
                    project_id: projectId
                  });
                  dateFound = true;
                  break;
                }
              }
            }
          }
  
          if (!dateFound) {
            invalidLines.push({ line, reason: 'Could not identify date and event' });
          }
        }
      });
  
      if (invalidLines.length > 0) {
        setError(`Could not parse ${invalidLines.length} line(s). Please check the format.`);
      }
  
      if (parsed.length === 0) {
        setError('No valid deadlines found. Please check the format and try again.');
        setConfirmMode(false);
      } else {
        setParsedDeadlines(parsed);
        setConfirmMode(true);
      }
    } catch (err) {
      setError('Error parsing deadlines. Please check your input and try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };


  const handleParse = () => {
    if (!batchText.trim()) {
      setError('Please enter some deadlines.');
      return;
    }
    parseDeadlines();
  };

  const handleCancel = () => {
    if (confirmMode) {
      // Go back to edit mode
      setConfirmMode(false);
    } else {
      // Close the modal
      onClose();
    }
  };

  const handleConfirm = () => {
    onSave(parsedDeadlines);
    onClose();
  };

  const handleRemoveDeadline = (id) => {
    setParsedDeadlines(parsedDeadlines.filter(deadline => deadline.id !== id));
    if (parsedDeadlines.length <= 1) {
      setConfirmMode(false);
    }
  };

  const handleEditDeadline = (deadline) => {
    setEditingDeadline({ ...deadline });
  };

  const handleUpdateName = (e) => {
    setEditingDeadline({
      ...editingDeadline,
      name: e.target.value
    });
  };

  const handleUpdateLocation = (e) => {
    setEditingDeadline({
      ...editingDeadline,
      location: e.target.value
    });
  };

  const handleUpdateDate = (newDate) => {
    // Keep the same time but update the date
    const currentTime = dayjs(editingDeadline.datetime);
    const updatedDateTime = newDate
      .hour(currentTime.hour())
      .minute(currentTime.minute())
      .second(0)
      .millisecond(0);
    
    setEditingDeadline({
      ...editingDeadline,
      datetime: updatedDateTime.toISOString()
    });
  };

  const handleSaveEdit = () => {
    setParsedDeadlines(
      parsedDeadlines.map(d => 
        d.id === editingDeadline.id ? editingDeadline : d
      )
    );
    setEditingDeadline(null);
  };

  const handleCancelEdit = () => {
    setEditingDeadline(null);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        {confirmMode ? 'Confirm Deadlines' : 'Add Multiple Deadlines'}
        <IconButton edge="end" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent>
        {!confirmMode ? (
          <>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
              <InfoIcon color="info" />
              <DialogContentText>
                Enter one deadline per line in either format:<br />
                <Typography variant="mono" component="span" sx={{ fontFamily: 'monospace' }}>
                  Event name YYYY-MM-DD<br />
                  YYYY-MM-DD Event name
                </Typography>
              </DialogContentText>
            </Box>
            
            <TextField
              autoFocus
              multiline
              rows={10}
              variant="outlined"
              fullWidth
              value={batchText}
              onChange={handleTextChange}
              placeholder="Team Meeting 2025-04-10
2025-04-15 Client Presentation
Final Deadline 2025-05-01"
              sx={{ mb: 2 }}
            />
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Supported date formats:
              </Typography>
              <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                Team Meeting 2025-04-10<br />
                2025-04-10 Team Meeting<br />
                Client Presentation 04/15/2025<br />
                04/15/2025 Client Presentation<br />
                Final Deadline April 1 2025<br />
                April 1 2025 Final Deadline<br />
                Project Review 23 April 2025<br />
                23 April 2025 Project Review
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <DialogContentText sx={{ mb: 2 }}>
              Please review the following deadlines. Click the edit icon to modify any details.
            </DialogContentText>
            
            <Stack spacing={2} sx={{ maxHeight: editingDeadline ? '30vh' : '50vh', overflow: 'auto' }}>
              {parsedDeadlines.map((deadline) => (
                <Paper key={deadline.id} elevation={1} sx={{ p: 2, position: 'relative' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1">{deadline.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(deadline.datetime).format('MMM D, YYYY')}
                      </Typography>
                      {deadline.location && (
                        <Typography variant="body2" color="text.secondary">
                          Location: {deadline.location}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditDeadline(deadline)}
                        sx={{ ml: 1 }}
                        title="Edit deadline"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveDeadline(deadline.id)}
                        title="Remove deadline"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
            
            {/* Edit Deadline Form */}
            <Collapse in={editingDeadline !== null}>
              {editingDeadline && (
                <Paper elevation={3} sx={{ mt: 2, p: 3, border: '1px solid', borderColor: 'primary.main' }}>
                  <Typography variant="h6" gutterBottom>
                    Edit Deadline
                  </Typography>
                  <Grid2 container spacing={3}>
                    <Grid2 item xs={12}>
                      <TextField
                        label="Deadline Name"
                        fullWidth
                        value={editingDeadline.name}
                        onChange={handleUpdateName}
                        variant="outlined"
                      />
                    </Grid2>
                    <Grid2 item xs={12}>
                      <TextField
                        label="Location (Optional)"
                        fullWidth
                        value={editingDeadline.location}
                        onChange={handleUpdateLocation}
                        variant="outlined"
                      />
                    </Grid2>
                    <Grid2 item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Date
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateCalendar
                          value={dayjs(editingDeadline.datetime)}
                          onChange={handleUpdateDate}
                          sx={{ width: '100%' }}
                        />
                      </LocalizationProvider>
                    </Grid2>
                    <Grid2 item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button color="inherit" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSaveEdit}
                      >
                        Save Changes
                      </Button>
                    </Grid2>
                  </Grid2>
                </Paper>
              )}
            </Collapse>
            
            {error && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total deadlines to add: <Chip label={parsedDeadlines.length} size="small" color="primary" />
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleCancel} color="inherit">
          {confirmMode ? 'Back' : 'Cancel'}
        </Button>
        
        {confirmMode ? (
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            color="primary"
            disabled={parsedDeadlines.length === 0 || editingDeadline !== null}
          >
            Add {parsedDeadlines.length} Deadline{parsedDeadlines.length !== 1 ? 's' : ''}
          </Button>
        ) : (
          <Button 
            onClick={handleParse} 
            variant="contained" 
            color="primary"
            disabled={!batchText.trim() || isProcessing}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Preview Deadlines'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BatchDeadlineModal;