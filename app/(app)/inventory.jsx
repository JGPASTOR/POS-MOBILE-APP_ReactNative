import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { showToast } from '../../utils/toast';

export default function InventoryScreen() {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('name'); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentModal, setAdjustmentModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('add'); 
  const [showReports, setShowReports] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    price: '',
    category: '',
    stock: '',
    minStock: '',
  });
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData, adjustmentsData] = await Promise.all([
        AsyncStorage.getItem('@products'),
        AsyncStorage.getItem('@categories'),
        AsyncStorage.getItem('stockAdjustments')
      ]);

      const products = productsData ? JSON.parse(productsData) : [];
      const categories = categoriesData ? JSON.parse(categoriesData) : [];
      const adjustments = adjustmentsData ? JSON.parse(adjustmentsData) : [];

      const inventoryItems = products.map(product => ({
        ...product,
        stock: product.stock || 0,
        minStock: product.minStock || 0,
        category: product.category || 'Uncategorized',
        price: product.price || 0,
        adjustments: adjustments.filter(adj => adj.productId === product.id)
      }));

      setInventory(inventoryItems);
      setCategories(categories);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedItem || !adjustmentQuantity || !adjustmentReason) {
      showToast.warning('Please fill in all fields');
      return;
    }

    const quantity = parseInt(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      showToast.warning('Please enter a valid quantity');
      return;
    }

    try {
      const adjustment = {
        id: Date.now().toString(),
        productId: selectedItem.id,
        type: adjustmentType,
        quantity: quantity,
        reason: adjustmentReason,
        date: new Date().toISOString(),
      };

      const adjustmentsData = await AsyncStorage.getItem('stockAdjustments');
      const adjustments = adjustmentsData ? JSON.parse(adjustmentsData) : [];
      await AsyncStorage.setItem('stockAdjustments', JSON.stringify([...adjustments, adjustment]));

      const productsData = await AsyncStorage.getItem('@products');
      const products = JSON.parse(productsData);
      const updatedProducts = products.map(product => {
        if (product.id === selectedItem.id) {
          const newStock = adjustmentType === 'add'
            ? (product.stock || 0) + quantity
            : Math.max(0, (product.stock || 0) - quantity);
          return { ...product, stock: newStock };
        }
        return product;
      });

      await AsyncStorage.setItem('@products', JSON.stringify(updatedProducts));
      await loadData();
      setAdjustmentModal(false);
      resetAdjustmentForm();
      showToast.success('Stock adjusted successfully');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      showToast.error('Failed to adjust stock');
    }
  };

  const resetAdjustmentForm = () => {
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setSelectedItem(null);
    setAdjustmentType('add');
  };

  const getInventoryStats = () => {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.stock <= item.minStock);
    const totalValue = inventory.reduce((sum, item) => sum + (item.stock * item.price), 0);
    
    return {
      totalItems,
      lowStockItems: lowStockItems.length,
      totalValue,
      averageStock: totalItems > 0 ? inventory.reduce((sum, item) => sum + item.stock, 0) / totalItems : 0
    };
  };

  const sortInventory = (items) => {
    switch (sortBy) {
      case 'stock':
        return [...items].sort((a, b) => a.stock - b.stock);
      default:
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const handleAddProduct = () => {
    setIsEditMode(false);
    setProductForm({
      id: Date.now().toString(),
      name: '',
      price: '',
      category: '',
      stock: '',
      minStock: '',
    });
    setProductModal(true);
  };

  const handleEditProduct = (item) => {
    setIsEditMode(true);
    setProductForm({
      id: item.id,
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      stock: item.stock.toString(),
      minStock: item.minStock.toString(),
    });
    setProductModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (!productForm.name || !productForm.price) {
        showToast.warning('Please fill in all required fields');
        return;
      }

      const productData = {
        id: productForm.id,
        name: productForm.name,
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: parseInt(productForm.stock) || 0,
        minStock: parseInt(productForm.minStock) || 0,
      };

      const productsData = await AsyncStorage.getItem('@products');
      const products = productsData ? JSON.parse(productsData) : [];
      
      const updatedProducts = isEditMode
        ? products.map(p => p.id === productData.id ? productData : p)
        : [...products, productData];

      await AsyncStorage.setItem('@products', JSON.stringify(updatedProducts));
      await loadData();
      setProductModal(false);
      showToast.success(`Product ${isEditMode ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error saving product:', error);
      showToast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const productsData = await AsyncStorage.getItem('@products');
      let products = productsData ? JSON.parse(productsData) : [];
  
      if (!Array.isArray(products)) {
        products = [];
      }
  
      const updatedProducts = products.filter(p => p.id !== productId);
      await AsyncStorage.setItem('@products', JSON.stringify(updatedProducts));
  
      const adjustmentsData = await AsyncStorage.getItem('stockAdjustments');
      if (adjustmentsData) {
        let adjustments = JSON.parse(adjustmentsData);
        if (!Array.isArray(adjustments)) {
          adjustments = [];
        }
        const updatedAdjustments = adjustments.filter(adj => adj.productId !== productId);
        await AsyncStorage.setItem('stockAdjustments', JSON.stringify(updatedAdjustments));
      }

      setInventory(updatedProducts);
      showToast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error in handleDeleteProduct:', error);
      showToast.error('Failed to delete product');
    }
  };  
  
  const renderAdjustmentModal = () => (
    <Modal
      visible={adjustmentModal}
      transparent
      animationType="slide"
      onRequestClose={() => setAdjustmentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Stock Adjustment</Text>
          <Text style={styles.modalSubtitle}>{selectedItem?.name}</Text>
          
          <View style={styles.adjustmentTypes}>
            <TouchableOpacity
              style={[styles.adjustmentType, adjustmentType === 'add' && styles.adjustmentTypeActive]}
              onPress={() => setAdjustmentType('add')}
            >
              <Text style={[styles.adjustmentTypeText, adjustmentType === 'add' && styles.adjustmentTypeTextActive]}>Add Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adjustmentType, adjustmentType === 'remove' && styles.adjustmentTypeActive]}
              onPress={() => setAdjustmentType('remove')}
            >
              <Text style={[styles.adjustmentTypeText, adjustmentType === 'remove' && styles.adjustmentTypeTextActive]}>Remove Stock</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Quantity"
            keyboardType="numeric"
            value={adjustmentQuantity}
            onChangeText={setAdjustmentQuantity}
          />
          
          <TextInput
            style={[styles.input, styles.reasonInput]}
            placeholder="Reason for adjustment"
            value={adjustmentReason}
            onChangeText={setAdjustmentReason}
            multiline
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setAdjustmentModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleStockAdjustment}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderReportsModal = () => {
    const stats = getInventoryStats();
    
    return (
      <Modal
        visible={showReports}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReports(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Inventory Reports</Text>
            
            <ScrollView style={styles.reportsContainer}>
              <View style={styles.reportCard}>
                <Text style={styles.reportLabel}>Total Items</Text>
                <Text style={styles.reportValue}>{stats.totalItems}</Text>
              </View>
              
              <View style={styles.reportCard}>
                <Text style={styles.reportLabel}>Low Stock Items</Text>
                <Text style={[styles.reportValue, { color: '#FF3B30' }]}>{stats.lowStockItems}</Text>
              </View>
              
              <View style={styles.reportCard}>
                <Text style={styles.reportLabel}>Total Inventory Value</Text>
                <Text style={styles.reportValue}>{formatCurrency(stats.totalValue)}</Text>
              </View>
              
              <View style={styles.reportCard}>
                <Text style={styles.reportLabel}>Average Stock Level</Text>
                <Text style={styles.reportValue}>{Math.round(stats.averageStock)}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => setShowReports(false)}
            >
              <Text style={styles.confirmButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderProductModal = () => (
    <Modal
      visible={productModal}
      transparent
      animationType="slide"
      onRequestClose={() => setProductModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={productForm.name}
            onChangeText={(text) => setProductForm({...productForm, name: text})}
          />

          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="numeric"
            value={productForm.price}
            onChangeText={(text) => setProductForm({...productForm, price: text})}
          />

          <TextInput
            style={styles.input}
            placeholder="Initial Stock"
            keyboardType="numeric"
            value={productForm.stock}
            onChangeText={(text) => setProductForm({...productForm, stock: text})}
          />

          <TextInput
            style={styles.input}
            placeholder="Minimum Stock Level"
            keyboardType="numeric"
            value={productForm.minStock}
            onChangeText={(text) => setProductForm({...productForm, minStock: text})}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setProductModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleSaveProduct}
            >
              <Text style={styles.confirmButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderInventoryItem = ({ item }) => {
    const isLowStock = item.stock <= item.minStock;
    const stockStatus = isLowStock ? 'Low Stock' : 'In Stock';
    const stockIcon = isLowStock ? 'alert-circle' : 'checkmark-circle';
    const stockColor = isLowStock ? '#FF3B30' : '#34C759';

    return (
      <View style={[styles.itemContainer, isLowStock && styles.lowStockItem]}>
        <TouchableOpacity 
          style={styles.itemInfo}
          onPress={() => handleEditProduct(item)}
        >
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category || 'Uncategorized'}</Text>
          <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
        </TouchableOpacity>

        <View style={styles.stockInfo}>
          <View style={styles.stockStatus}>
            <Ionicons name={stockIcon} size={16} color={stockColor} style={styles.stockIcon} />
            <Text style={[styles.stockStatusText, { color: stockColor }]}>{stockStatus}</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              setSelectedItem(item);
              setAdjustmentModal(true);
            }}
          >
            <Text style={[styles.stockText, isLowStock && styles.lowStockText]}>
              {item.stock} in stock
            </Text>
            <Text style={styles.minStockText}>
              Min: {item.minStock}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditProduct(item)}
            accessibilityLabel={`Edit ${item.name}`}
          >
            <MaterialIcons name="edit" size={26} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteProduct(item.id)}
          >
            <MaterialIcons name="delete" size={26} color="#E4080A" />
          </TouchableOpacity>
        </View>
      </View> 
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Product Inventory</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.reportsButton}
            onPress={() => setShowReports(true)}
          >
            <Ionicons name="bar-chart-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddProduct}
          >
            <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const sortedInventory = sortInventory(inventory);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Settings</Text>
      </View>
      <FlatList
        data={sortedInventory}
        renderItem={renderInventoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}w
        ListHeaderComponent={renderHeader}
      />
      {renderAdjustmentModal()}
      {renderReportsModal()}
      {renderProductModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  lowStockItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  itemInfo: {
    flex: 1.2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  stockInfo: {
    alignItems: 'flex-end',
    flex: 0.8,
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockIcon: {
    marginRight: 4,
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  stockText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  lowStockText: {
    color: '#FF3B30',
  },
  minStockText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  adjustmentTypes: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  adjustmentType: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  adjustmentTypeActive: {
    backgroundColor: '#007AFF',
  },
  adjustmentTypeText: {
    color: '#666',
    fontWeight: '500',
  },
  adjustmentTypeTextActive: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  reasonInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reportsButton: {
    padding: 8,
  },
  reportsContainer: {
    maxHeight: 400,
    marginBottom: 16,
  },
  reportCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  reportLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  categoryPicker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
}); 