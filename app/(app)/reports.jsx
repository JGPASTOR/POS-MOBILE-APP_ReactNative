import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';

export default function ReportsScreen() {
  const router = useRouter();
  const [salesData, setSalesData] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    totalItems: 0,
    averageOrderValue: 0,
    topSellingItems: [],
  });

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      const storedSales = await AsyncStorage.getItem('@sales');
      if (storedSales) {
        const sales = JSON.parse(storedSales);
        setSalesData(sales);
        calculateDailyStats(sales);
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
      Alert.alert('Error', 'Failed to load sales data');
    }
  };

  const calculateDailyStats = (sales) => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => sale.date.startsWith(today));

    const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);

    const totalItems = todaySales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    const averageOrderValue = todaySales.length > 0 ? totalSales / todaySales.length : 0;

    const itemSales = {};
    todaySales.forEach(sale => {
      sale.items.forEach(item => {
        if (itemSales[item.name]) {
          itemSales[item.name].quantity += item.quantity;
          itemSales[item.name].total += item.price * item.quantity;
        } else {
          itemSales[item.name] = {
            name: item.name,
            quantity: item.quantity,
            total: item.price * item.quantity
          };
        }
      });
    });

    const topSellingItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    setDailyStats({
      totalSales,
      totalItems,
      averageOrderValue,
      topSellingItems,
    });
  };

  const formatToPeso = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const generateDailyReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaySales = salesData.filter(sale => sale.date.startsWith(today));

      const reportHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="text-align: center;">Daily Sales Report</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <hr/>

            <h2>Summary</h2>
            <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px;"><strong>Total Sales:</strong></td>
                <td style="padding: 8px;">${formatToPeso(dailyStats.totalSales)}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Total Items Sold:</strong></td>
                <td style="padding: 8px;">${dailyStats.totalItems}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Average Order Value:</strong></td>
                <td style="padding: 8px;">${formatToPeso(dailyStats.averageOrderValue)}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Number of Transactions:</strong></td>
                <td style="padding: 8px;">${todaySales.length}</td>
              </tr>
            </table>

            <h2>Top Selling Items</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Item</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Quantity</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total</th>
              </tr>
              ${dailyStats.topSellingItems.map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${formatToPeso(item.total)}</td>
                </tr>
              `).join('')}
            </table>

            <h2>Transactions</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Time</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Items</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total</th>
              </tr>
              ${todaySales.map(sale => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(sale.date).toLocaleTimeString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    ${sale.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                  </td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${formatToPeso(sale.total)}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;

      await Print.printAsync({ html: reportHtml });
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate daily report');
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialIcons name={icon} size={24} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sales Reports</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateDailyReport}
        >
          <MaterialIcons name="file-download" size={24} color="#FFF" />
          <Text style={styles.generateButtonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Sales"
            value={formatToPeso(dailyStats.totalSales)}
            icon="payments"
            color="#4CAF50"
          />
          <StatCard
            title="Items Sold"
            value={dailyStats.totalItems}
            icon="shopping-cart"
            color="#2196F3"
          />
          <StatCard
            title="Avg Order"
            value={formatToPeso(dailyStats.averageOrderValue)}
            icon="trending-up"
            color="#9C27B0"
          />
          <StatCard
            title="Transactions"
            value={salesData.filter(sale => 
              sale.date.startsWith(new Date().toISOString().split('T')[0])
            ).length}
            icon="receipt"
            color="#FF9800"
          />
        </View>

        <Text style={styles.sectionTitle}>Top Selling Items</Text>
        <View style={styles.topItemsContainer}>
          {dailyStats.topSellingItems.map((item, index) => (
            <View key={item.name} style={styles.topItemRow}>
              <Text style={styles.topItemRank}>#{index + 1}</Text>
              <View style={styles.topItemInfo}>
                <Text style={styles.topItemName}>{item.name}</Text>
                <Text style={styles.topItemDetails}>
                  {item.quantity} units · {formatToPeso(item.total)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  generateButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    borderLeftWidth: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  topItemsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topItemRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    width: 40,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  topItemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
}); 