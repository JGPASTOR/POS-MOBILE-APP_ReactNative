import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal, FlatList,} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { showToast } from '../../utils/toast';

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    minStock: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
    
      const storedProducts = await AsyncStorage.getItem('@products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
      
      const storedCategories = await AsyncStorage.getItem('@categories');
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast.error('Failed to load data');
    }
  };

  const saveProducts = async (newProducts) => {
    try {
      await AsyncStorage.setItem('@products', JSON.stringify(newProducts));
      setProducts(newProducts);
      return true;
    } catch (error) {
      console.error('Error saving products:', error);
      showToast.error('Failed to save products');
      return false;
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category: '',
      stock: '',
      minStock: '',
    });
    setModalVisible(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
    });
    setModalVisible(true);
  };
  const handleDeleteProduct = async (productId) => {
    try {
      const storedProducts = await AsyncStorage.getItem('@products');
      let productsArray = storedProducts ? JSON.parse(storedProducts) : [];
  
      const updatedProducts = productsArray.filter((product) => product.id !== productId);
  
      await AsyncStorage.setItem('@products', JSON.stringify(updatedProducts));
  
      setProducts(updatedProducts);
      showToast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast.error('Failed to delete product');
    }
  };     

  const handleSaveProduct = () => {
    if (!formData.name || !formData.price || !formData.stock) {
      showToast.warning('Please fill in all required fields');
      return;
    }
  
    const productData = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock) || 0,
    };
  
    const newProducts = editingProduct
      ? products.map((p) => (p.id === editingProduct.id ? productData : p))
      : [...products, productData];
  
    if (saveProducts(newProducts)) {
      setModalVisible(false);
      showToast.success(`Product ${editingProduct ? 'updated' : 'added'} successfully`);
    }
  };  

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !filterCategory || product.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetails}>
          Price: ₱{item.price.toFixed(2)} | Stock: {item.stock}
        </Text>
        <Text style={styles.productCategory}>Category: {item.category}</Text>
      </View>
      
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditProduct(item)}
          accessibilityLabel={`Edit ${item.name}`}
        >
          <MaterialIcons name="edit" size={26} color="#2196F3" />
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <MaterialIcons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.subHeader}>
        <TouchableOpacity 
          style={styles.categoriesButton}
          onPress={() => router.push('/categories')}
        >
          <MaterialIcons name="category" size={20} color="#2196F3" />
          <Text style={styles.categoriesButtonText}>Manage Categories</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <View style={styles.priceInputContainer}>
              <Text style={styles.pesoCurrency}>₱</Text>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="Price"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="decimal-pad"
              />
            </View>
            <Picker
              selectedValue={formData.category}
              style={styles.input}
              onValueChange={(itemValue) =>
                setFormData({ ...formData, category: itemValue })
              }
            >
              <Picker.Item label="Select Category" value="" />
              {categories.map((category) => (
                <Picker.Item
                  key={category.id}
                  label={category.name}
                  value={category.id}
                />
              ))}
            </Picker>
            <TextInput
              style={styles.input}
              placeholder="Stock Quantity"
              value={formData.stock}
              onChangeText={(text) => setFormData({ ...formData, stock: text })}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Minimum Stock Level"
              value={formData.minStock}
              onChangeText={(text) => setFormData({ ...formData, minStock: text })}
              keyboardType="number-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProduct}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 0.5  ,
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 8,
  },
  subHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  categoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriesButtonText: {
    marginLeft: 8,
    color: '#2196F3',
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryPicker: {
    height: 60,
  },
  list: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pesoCurrency: {
    fontSize: 16,
    marginRight: 8,
    color: '#333',
  },
  priceInput: {
    flex: 1,
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E4080A',
  },
  saveButton: {
    backgroundColor: '#64D518',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
  },
  editButton: {
    backgroundColor: '#F0F9FF',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
}); 