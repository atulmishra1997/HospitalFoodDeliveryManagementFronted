import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  Tabs,
  Tab,
  TextField,
  Paper,
  Divider
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const DeliveryDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [dietCharts, setDietCharts] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchDietCharts();
    fetchCompletedDeliveries();
  }, []);

  const fetchDietCharts = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/diet-charts');
      const filteredCharts = response.data.filter(chart =>
        chart.meals.some(meal => meal.preparationStatus === 'ready')
      );
      setDietCharts(filteredCharts);
    } catch (error) {
      console.error('Error fetching diet charts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedDeliveries = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/tasks/delivery/completed');
      setCompletedDeliveries(response.data);
    } catch (error) {
      console.error('Error fetching completed deliveries:', error);
    }
  };

  const updateMealStatus = async (chartId, mealId) => {
    try {
      await axios.patch(`http://localhost:5001/api/diet-charts/${chartId}/meals/${mealId}`, {
        status: 'delivered'
      });
      fetchDietCharts();
      fetchCompletedDeliveries();
    } catch (error) {
      console.error('Error updating meal status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
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

  const filterDeliveriesByDate = (deliveries) => {
    return deliveries.filter(delivery => {
      const deliveryDate = new Date(delivery.meals[0].deliveryTime);
      return (
        deliveryDate.getDate() === selectedDate.getDate() &&
        deliveryDate.getMonth() === selectedDate.getMonth() &&
        deliveryDate.getFullYear() === selectedDate.getFullYear()
      );
    });
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold', fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
            Delivery Dashboard
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
            }}>
            <Tab label="Pending Deliveries" sx={{ textTransform: 'none', fontWeight: 'medium' }} />
            <Tab label="Delivery History" sx={{ textTransform: 'none', fontWeight: 'medium' }} />
          </Tabs>
        </Paper>

        {activeTab === 0 ? (
          <Grid container spacing={3}>
            {dietCharts.map((chart) => (
              <Grid item xs={12} md={6} key={chart._id}>
                <Card sx={{ 
                  boxShadow: 3, 
                  '&:hover': { boxShadow: 6 },
                  transition: 'box-shadow 0.3s'
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                      Patient: {chart.patient?.name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Room: {chart.patient?.roomNumber}, Bed: {chart.patient?.bedNumber}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Floor: {chart.patient?.floorNumber}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <List>
                      {chart.meals
                        .filter(meal => meal.preparationStatus === 'ready')
                        .map((meal) => (
                          <ListItem key={meal._id} sx={{ 
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            mb: 1,
                            '&:hover': { bgcolor: 'action.hover' }
                          }}>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                  {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                                </Typography>
                              }
                              secondary={
                                <Box component="span">
                                  <Typography component="span" variant="body2" color="textPrimary">
                                    Special Instructions: {meal.specialInstructions || 'None'}
                                  </Typography>
                                  <Box component="span" sx={{ display: 'block', mt: 1 }}>
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
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => updateMealStatus(chart._id, meal._id)}
                              sx={{
                                minWidth: 140,
                                '&:hover': { transform: 'scale(1.02)' },
                                transition: 'transform 0.2s'
                              }}
                            >
                              Mark as Delivered
                            </Button>
                          </ListItem>
                        ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Filter by Date"
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
            </Box>
            <Grid container spacing={3}>
              {filterDeliveriesByDate(completedDeliveries).map((delivery) => (
                <Grid item xs={12} md={6} key={delivery._id}>
                  <Card sx={{ 
                    boxShadow: 2,
                    bgcolor: 'background.paper',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.3s'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
                        Patient: {delivery.patient?.name}
                      </Typography>
                      <Typography color="textSecondary">
                        Room: {delivery.patient?.roomNumber}, Bed: {delivery.patient?.bedNumber}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <List>
                        {delivery.meals
                          .filter(meal => meal.preparationStatus === 'delivered')
                          .map((meal) => (
                            <ListItem key={meal._id} sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 1 }}>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1">
                                    {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                                  </Typography>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="textSecondary">
                                      Delivered at: {new Date(meal.deliveryTime).toLocaleString()}
                                    </Typography>
                                    <Chip
                                      label="Delivered"
                                      color="success"
                                      size="small"
                                      sx={{ mt: 1 }}
                                    />
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

export default DeliveryDashboard;