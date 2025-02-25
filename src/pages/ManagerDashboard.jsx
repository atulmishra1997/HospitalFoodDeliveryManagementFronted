import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [patients, setPatients] = useState([]);
  const [dietCharts, setDietCharts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    roomNumber: '',
    bedNumber: '',
    floorNumber: '',
    diseases: [],
    allergies: [],
    contactNumber: '',
    emergencyContact: {
      name: '',
      relationship: '',
      contactNumber: ''
    }
  });

  useEffect(() => {
    fetchPatients();
    fetchDietCharts();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchDietCharts = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/diet-charts');
      setDietCharts(response.data);
    } catch (error) {
      console.error('Error fetching diet charts:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setSelectedItem(item);
    if (type === 'patient') {
      if (item) {
        setFormData({
          ...item,
          diseases: Array.isArray(item.diseases) ? item.diseases.join(', ') : '',
          allergies: Array.isArray(item.allergies) ? item.allergies.join(', ') : '',
          emergencyContact: item.emergencyContact || {
            name: '',
            relationship: '',
            contactNumber: ''
          }
        });
      } else {
        setFormData({
          name: '',
          age: '',
          gender: '',
          roomNumber: '',
          bedNumber: '',
          floorNumber: '',
          diseases: '',
          allergies: '',
          contactNumber: '',
          emergencyContact: {
            name: '',
            relationship: '',
            contactNumber: ''
          }
        });
      }
    } else if (type === 'dietChart') {
      if (item) {
        setFormData({
          ...item,
          meals: item.meals || []
        });
      } else {
        setFormData({
          patient: '',
          date: new Date().toISOString().split('T')[0],
          meals: [],
          dietaryRestrictions: []
        });
      }
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormData({
      name: '',
      age: '',
      gender: '',
      roomNumber: '',
      bedNumber: '',
      floorNumber: '',
      diseases: [],
      allergies: [],
      contactNumber: '',
      emergencyContact: {
        name: '',
        relationship: '',
        contactNumber: ''
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogType === 'patient') {
        const patientData = {
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          roomNumber: formData.roomNumber,
          bedNumber: formData.bedNumber,
          floorNumber: parseInt(formData.floorNumber),
          diseases: typeof formData.diseases === 'string' ? 
            formData.diseases.split(',').map(d => d.trim()).filter(Boolean) : 
            formData.diseases,
          allergies: typeof formData.allergies === 'string' ? 
            (formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean) : []) : 
            formData.allergies,
          contactNumber: formData.contactNumber,
          emergencyContact: {
            name: formData.emergencyContact?.name,
            relationship: formData.emergencyContact?.relationship,
            phone: formData.emergencyContact?.contactNumber
          }
        };
    
        if (selectedItem) {
          const response = await axios.patch(`http://localhost:5001/api/patients/${selectedItem._id}`, patientData);
          setPatients(prevPatients => 
            prevPatients.map(patient => 
              patient._id === selectedItem._id ? response.data : patient
            )
          );
        } else {
          const response = await axios.post('http://localhost:5001/api/patients', patientData);
          setPatients(prevPatients => [...prevPatients, response.data]);
        }
        handleCloseDialog();
        // Refresh the patients list after successful submission
        await fetchPatients();
      } else {
        if (selectedItem) {
          const response = await axios.patch(`http://localhost:5001/api/diet-charts/${selectedItem._id}`, formData);
          setDietCharts(prevCharts => 
            prevCharts.map(chart => 
              chart._id === selectedItem._id ? response.data : chart
            )
          );
        } else {
          const response = await axios.post('http://localhost:5001/api/diet-charts', formData);
          setDietCharts(prevCharts => [...prevCharts, response.data]);
        }
        handleCloseDialog();
        // Refresh the diet charts list after successful submission
        await fetchDietCharts();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while submitting the form';
      alert(errorMessage);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'patient') {
        await axios.delete(`http://localhost:5001/api/patients/${id}`);
        fetchPatients();
      } else {
        await axios.delete(`http://localhost:5001/api/diet-charts/${id}`);
        fetchDietCharts();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Manager Dashboard
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Logout
          </Button>
        </Box>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Patients" />
            <Tab label="Diet Charts" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('patient')}
              sx={{ mb: 2 }}
            >
              Add Patient
            </Button>
            <List>
              {patients.map((patient) => (
                <ListItem
                  key={patient._id}
                  secondaryAction={
                    <Box>
                      <IconButton onClick={() => handleOpenDialog('patient', patient)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete('patient', patient._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={patient.name}
                    secondary={`Room: ${patient.roomNumber}, Bed: ${patient.bedNumber}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('dietChart')}
              sx={{ mb: 2 }}
            >
              Add Diet Chart
            </Button>
            <List>
              {dietCharts.map((chart) => (
                <ListItem
                  key={chart._id}
                  secondaryAction={
                    <Box>
                      <IconButton onClick={() => handleOpenDialog('dietChart', chart)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete('dietChart', chart._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={`Diet Chart for ${chart.patient?.name || 'Unknown Patient'}`}
                    secondary={
                      <>
                        <Typography variant="body2" component="div">
                          Created: {new Date(chart.createdAt).toLocaleDateString()}
                        </Typography>
                        {chart.meals && chart.meals.map((meal, index) => (
                          <Box key={index} sx={{ mt: 1 }}>
                            <Typography variant="body2" component="div" color="textSecondary">
                              {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}:
                              <Chip
                                size="small"
                                label={meal.preparationStatus}
                                color={
                                  meal.preparationStatus === 'delivered' ? 'success' :
                                  meal.preparationStatus === 'ready' ? 'primary' :
                                  meal.preparationStatus === 'preparing' ? 'warning' : 'default'
                                }
                                sx={{ ml: 1 }}
                              />
                              {meal.assignedPantry && (
                                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                                  Pantry: {meal.assignedPantry.name}
                                </Typography>
                              )}
                              {meal.assignedDelivery && meal.preparationStatus === 'delivered' && (
                                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                                  Delivered by: {meal.assignedDelivery.name}
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {dialogType === 'patient'
              ? `${selectedItem ? 'Edit' : 'Add'} Patient`
              : `${selectedItem ? 'Edit' : 'Add'} Diet Chart`}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              {dialogType === 'patient' ? (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Patient Name"
                    name="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Age"
                    name="age"
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  />
                  <TextField
                    select
                    margin="normal"
                    required
                    fullWidth
                    label="Gender"
                    name="gender"
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    {['male', 'female', 'other'].map((option) => (
                      <MenuItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Room Number"
                    name="roomNumber"
                    value={formData.roomNumber || ''}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Bed Number"
                    name="bedNumber"
                    value={formData.bedNumber || ''}
                    onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Floor Number"
                    name="floorNumber"
                    type="number"
                    value={formData.floorNumber || ''}
                    onChange={(e) => setFormData({ ...formData, floorNumber: parseInt(e.target.value) })}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Diseases (comma separated)"
                    name="diseases"
                    value={Array.isArray(formData.diseases) ? formData.diseases.join(', ') : ''}
                    onChange={(e) => setFormData({ ...formData, diseases: e.target.value.split(',').map(d => d.trim()) })}
                    helperText="Enter diseases separated by commas"
                  />
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Allergies (comma separated)"
                    name="allergies"
                    value={Array.isArray(formData.allergies) ? formData.allergies.join(', ') : ''}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value.split(',').map(a => a.trim()) })}
                    helperText="Enter allergies separated by commas"
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Contact Number"
                    name="contactNumber"
                    value={formData.contactNumber || ''}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    Emergency Contact
                  </Typography>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Emergency Contact Name"
                    name="emergencyContactName"
                    value={formData.emergencyContact.name || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                    })}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Emergency Contact Relationship"
                    name="emergencyContactRelationship"
                    value={formData.emergencyContact.relationship || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                    })}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Emergency Contact Number"
                    name="emergencyContactNumber"
                    value={formData.emergencyContact.contactNumber || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, contactNumber: e.target.value }
                    })}
                  />
                </>
              ) : (
                <>
                  <TextField
                    select
                    margin="normal"
                    required
                    fullWidth
                    label="Patient"
                    name="patient"
                    value={formData.patient || ''}
                    onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                  >
                    {patients.map((patient) => (
                      <MenuItem key={patient._id} value={patient._id}>
                        {patient.name} - Room {patient.roomNumber}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Date"
                    name="date"
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    Meals
                  </Typography>
                  {['breakfast', 'lunch', 'dinner'].map((mealType) => (
                    <Box key={mealType} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                      </Typography>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Ingredients (comma separated)"
                        name={`${mealType}Ingredients`}
                        value={formData.meals?.find(m => m.type === mealType)?.ingredients?.join(', ') || ''}
                        onChange={(e) => {
                          const meals = formData.meals || [];
                          const mealIndex = meals.findIndex(m => m.type === mealType);
                          const ingredients = e.target.value.split(',').map(i => i.trim()).filter(Boolean);
                          
                          if (mealIndex >= 0) {
                            meals[mealIndex] = { ...meals[mealIndex], ingredients };
                          } else {
                            meals.push({ type: mealType, ingredients, preparationStatus: 'pending' });
                          }
                          
                          setFormData({ ...formData, meals });
                        }}
                        helperText="Enter ingredients separated by commas"
                      />
                      <TextField
                        margin="normal"
                        fullWidth
                        label="Special Instructions"
                        name={`${mealType}Instructions`}
                        multiline
                        rows={2}
                        value={formData.meals?.find(m => m.type === mealType)?.specialInstructions || ''}
                        onChange={(e) => {
                          const meals = formData.meals || [];
                          const mealIndex = meals.findIndex(m => m.type === mealType);
                          const specialInstructions = e.target.value;
                          
                          if (mealIndex >= 0) {
                            meals[mealIndex] = { ...meals[mealIndex], specialInstructions };
                          } else {
                            meals.push({ type: mealType, ingredients: [], specialInstructions, preparationStatus: 'pending' });
                          }
                          
                          setFormData({ ...formData, meals });
                        }}
                      />
                    </Box>
                  ))}
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Dietary Restrictions (comma separated)"
                    name="dietaryRestrictions"
                    value={formData.dietaryRestrictions?.join(', ') || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      dietaryRestrictions: e.target.value.split(',').map(r => r.trim())
                    })}
                    helperText="Enter dietary restrictions separated by commas"
                  />
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Calories"
                    name="calories"
                    type="number"
                    value={formData.calories || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      calories: parseInt(e.target.value)
                    })}
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedItem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ManagerDashboard;