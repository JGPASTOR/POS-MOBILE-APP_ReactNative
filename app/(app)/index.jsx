import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const [dailySales, setDailySales] = useState(0);

  useEffect(() => {
    const loadDailySales = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const salesData = await AsyncStorage.getItem('sales');
        if (salesData) {
          const sales = JSON.parse(salesData);
          const todaySales = sales.filter(sale => sale.date.startsWith(today));
          const total = todaySales.reduce((sum, sale) => sum + sale.total, 0);
          setDailySales(total);
        }
      } catch (error) {
        console.error('Error loading daily sales:', error);
      }
    };
  
    loadDailySales();
  
    const interval = setInterval(loadDailySales, 3000); 
    return () => clearInterval(interval); 
  }, []);  

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const loadDailySales = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const salesData = await AsyncStorage.getItem('sales');
      if (salesData) {
        const sales = JSON.parse(salesData);
        const todaySales = sales.filter(sale => sale.date.startsWith(today));
        const total = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        setDailySales(total);
      }
    } catch (error) {
      console.error('Error loading daily sales:', error);
    }
  };

  const navigationCards = [
    { id: 'products', title: 'Products', subtitle: 'Manage your inventory', icon: 'cube-outline' },
    { id: 'sales', title: 'Sales', subtitle: 'Process transactions', icon: 'cart-outline' },
    { id: 'categories', title: 'Categories', subtitle: 'Organize products', icon: 'list-outline' },
    { id: 'inventory', title: 'Inventory', subtitle: 'Track stock levels', icon: 'file-tray-stacked-outline' },
    { id: 'reports', title: 'Reports', subtitle: 'View analytics', icon: 'bar-chart-outline' },
  ];

  const handleNavigation = (route) => {
    router.push(route);
  };

  const NavigationCard = ({ id, title, subtitle, icon }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleNavigation(id)} activeOpacity={0.7}>
      <Ionicons name={icon} size={40} color="#7DDA58" />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to POS Mobile Based</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.salesSummary}>  
          <Text style={styles.salesTitle}>Today's Sales</Text>
          <Text style={styles.salesAmount}>{formatCurrency(dailySales)}</Text>
        </View>
        
        <View style={styles.grid}>
          {navigationCards.map((card) => (
            <NavigationCard key={card.id} {...card} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingVertical: 8, paddingHorizontal: 5, backgroundColor: '#f5f5f5', zIndex: 1, width: '100%' },
  header: { flex: 1, paddingRight: 15 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  salesSummary: { backgroundColor: '#16d625', borderRadius: 10, padding: 20, marginBottom: 30 },
  salesTitle: { fontSize: 16, color: 'white', opacity: 0.9 },
  salesAmount: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 20, marginBottom: 20, width: '47%', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, color: '#333' },
  cardSubtitle: { fontSize: 12, color: '#666', marginTop: 5, textAlign: 'center' },
  scrollView: { flex: 1, width: '100%' },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
})