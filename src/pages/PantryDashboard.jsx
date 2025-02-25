import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  TextField,
  Divider
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';

const PantryDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [dietCharts, setDietCharts] = useState([]);
  const [completedPreparations, setCompletedPreparations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchDietCharts();
    fetchCompletedPreparations();
  }, []);

  const fetchDietCharts = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/diet-charts');
      const filteredCharts = response.data.filter(chart => 
        chart.meals.some(meal => 
          meal.preparationStatus === 'pending' || 
          (meal.preparationStatus === 'preparing' && meal.assignedPantry?._id === user.id) ||
          (meal.preparationStatus === 'preparing' && meal.assignedPantry === user.id)
        )
      );
      setDietCharts(filteredCharts);
    } catch (error) {
      console.error('Error fetching diet charts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedPreparations = async () => {
    try {
      if (!selectedDate) return;
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(`http://localhost:5001/api/tasks/pantry/completed?date=${formattedDate}`);
      if (Array.isArray(response.data)) {
        setCompletedPreparations(response.data);
      } else {
        setCompletedPreparations([]);
      }
    } catch (error) {
      console.error('Error fetching completed preparations:', error);
      setCompletedPreparations([]);
    }
  };

  const updateMealStatus = async (chartId, mealId, status) => {
    try {
      await axios.patch(`http://localhost:5001/api/diet-charts/${chartId}/meals/${mealId}`, {
        status
      });
      await fetchDietCharts();
      await fetchCompletedPreparations();
    } catch (error) {
      console.error('Error updating meal status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'preparing':
        return 'warning';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (activeTab === 1 && selectedDate) {
      fetchCompletedPreparations();
    }
  }, [activeTab, selectedDate]);

  // No need for client-side filtering as the backend handles date filtering
  const filterPreparationsByDate = (preparations) => {
    return preparations || [];
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold', fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
            Pantry Dashboard
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 'medium'
            }}
          >
            Logout
          </Button>
        </Box>

        <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                height: 3
              }
            }}
          >
            <Tab label="Pending Preparations" sx={{ textTransform: 'none', fontWeight: 'medium' }} />
            <Tab label="Preparation History" sx={{ textTransform: 'none', fontWeight: 'medium' }} />
          </Tabs>
        </Paper>

        {activeTab === 0 ? (
          <Grid container spacing={3}>
            {dietCharts.length > 0 ? (
              dietCharts.map((chart) => (
                <Grid item xs={12} md={6} key={chart._id}>
                  <Card sx={{ 
                    boxShadow: 3,
                    '&:hover': { boxShadow: 6 },
                    transition: 'box-shadow 0.3s',
                    height: '100%'
                  }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                        Patient: {chart.patient?.name}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        Room: {chart.patient?.roomNumber}, Bed: {chart.patient?.bedNumber}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <List>
                        {chart.meals
                          .filter(meal => 
                            meal.preparationStatus === 'pending' || 
                            (meal.preparationStatus === 'preparing' && 
                              (meal.assignedPantry?._id === user.id || meal.assignedPantry === user.id))
                          )
                          .map((meal) => (
                            <ListItem key={meal._id} sx={{
                              bgcolor: 'background.paper',
                              borderRadius: 1,
                              mb: 1,
                              '&:hover': { bgcolor: 'action.hover' },
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' }
                            }}>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                    {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                                  </Typography>
                                }
                                secondary={
                                  <Box component="div">
                                    <Typography component="div" variant="body2" color="textPrimary">
                                      Ingredients: {meal.ingredients.join(', ')}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                      <Chip
                                        label={meal.preparationStatus}
                                        color={getStatusColor(meal.preparationStatus)}
                                        size="small"
                                        sx={{ mr: 1 }}
                                      />
                                    </Box>
                                  </Box>
                                }
                              />
                              <Box sx={{ mt: { xs: 2, sm: 0 }, ml: { xs: 0, sm: 2 } }}>
                                {meal.preparationStatus === 'pending' && (
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => updateMealStatus(chart._id, meal._id, 'preparing')}
                                    sx={{
                                      minWidth: 140,
                                      '&:hover': { transform: 'scale(1.02)' },
                                      transition: 'transform 0.2s'
                                    }}
                                  >
                                    Start Preparing
                                  </Button>
                                )}
                                {meal.preparationStatus === 'preparing' && 
                                  (meal.assignedPantry?._id === user.id || meal.assignedPantry === user.id) && (
                                  <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => updateMealStatus(chart._id, meal._id, 'ready')}
                                    sx={{
                                      minWidth: 140,
                                      '&:hover': { transform: 'scale(1.02)' },
                                      transition: 'transform 0.2s'
                                    }}
                                  >
                                    Mark as Ready
                                  </Button>
                                )}
                              </Box>
                            </ListItem>
                          ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                  <Typography variant="h6" color="textSecondary">
                    No pending or preparing meals available
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        ) : (
          <Box>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Filter by Date"
                  value={selectedDate}
                  onChange={(newValue) => {
                    setSelectedDate(newValue);
                    fetchCompletedPreparations();
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </LocalizationProvider>
            </Box>
            <Grid container spacing={3}>
              {completedPreparations.map((prep) => (
                <Grid item xs={12} md={6} key={prep._id}>
                  <Card sx={{ 
                    boxShadow: 2,
                    bgcolor: 'background.paper',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.3s',
                    height: '100%'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
                        Patient: {prep.patient?.name}
                      </Typography>
                      <Typography color="textSecondary">
                        Room: {prep.patient?.roomNumber}, Bed: {prep.patient?.bedNumber}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <List>
                        {prep.meals
                          .filter(meal => meal.preparationStatus === 'ready' && 
                            (meal.assignedPantry?._id === user.id || meal.assignedPantry === user.id))
                          .map((meal) => (
                            <ListItem key={meal._id} sx={{ 
                              bgcolor: 'action.hover', 
                              borderRadius: 1, 
                              mb: 1,
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' }
                            }}>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1">
                                    {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                                  </Typography>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="textSecondary">
                                      Prepared at: {new Date(meal.updatedAt).toLocaleString()}
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                      <Chip
                                        label="Ready"
                                        color="success"
                                        size="small"
                                      />
                                      {meal.specialInstructions && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                          Special Instructions: {meal.specialInstructions}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default PantryDashboard;