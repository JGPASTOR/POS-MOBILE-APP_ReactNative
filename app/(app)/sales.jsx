import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ScrollView,Platform,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const ProductCard = React.memo(({ product, onAdd }) => (
  <TouchableOpacity 
    style={[styles.productCard, product.stock === 0 && styles.disabledProduct]} 
    onPress={() => onAdd(product)}
    disabled={product.stock <= 0}
  >
    <Text style={styles.productName}>{product.name}</Text>
    <Text style={styles.productPrice}>₱{product.price.toFixed(2)}</Text>
    <Text style={styles.stockText}>Stock: {product.stock}</Text>
  </TouchableOpacity>
));

const CartItem = React.memo(({ item, onAdd, onRemove }) => (
  <View style={styles.cartItem}>
    <Text style={styles.cartItemName}>{item.name}</Text>
    <View style={styles.cartItemControls}>
      <TouchableOpacity onPress={onRemove}>
        <Ionicons name="remove-circle" size={20} color="#FF4444" />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{item.quantity}</Text>
      <TouchableOpacity onPress={onAdd}>
        <Ionicons name="add-circle" size={20} color="#00C853" />
      </TouchableOpacity>
    </View>
  </View>
));

const generateReceiptHTML = (cart, subtotal, total, receiptNumber) => {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const items = cart.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align: center">${item.quantity}</td>
      <td style="text-align: right">₱${item.price.toFixed(2)}</td>
      <td style="text-align: right">₱${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Helvetica', sans-serif;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
            background-color: white;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px dashed #000;
          }
          .receipt-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .store-info {
            margin-bottom: 10px;
          }
          .receipt-details {
            margin-bottom: 20px;
            padding: 10px 0;
            border-bottom: 1px dashed #000;
          }
          .receipt-number {
            font-size: 16px;
            font-weight: bold;
          }
          .date-time {
            color: #444;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            padding: 8px;
            border-bottom: 2px solid #000;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          .item-name {
            width: 40%;
          }
          .quantity {
            text-align: center;
            width: 15%;
          }
          .price {
            text-align: right;
            width: 20%;
          }
          .line-total {
            text-align: right;
            width: 25%;
          }
          .totals {
            text-align: right;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          .total-row {
            margin: 5px 0;
          }
          .final-total {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #000;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px dashed #000;
            font-size: 12px;
            color: #666;
          }
          .barcode {
            text-align: center;
            margin-top: 20px;
            font-family: monospace;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="receipt-title">Sales Receipt</div>
          <div class="store-info">
            <div style="font-size: 18px; font-weight: bold;">JGP Trading & Construction Supply</div>
            <div>Pedro Coleto St. Brgy. San Juan, Surigao City 8400</div>
            <div>#: 09453467938</div>
          </div>
        </div>

        <div class="receipt-details">
          <div class="receipt-number">Receipt #: ${receiptNumber.toString().padStart(6, '0')}</div>
          <div class="date-time">
            <div>Date: ${date}</div>
            <div>Time: ${time}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="item-name">Item</th>
              <th class="quantity">Qty</th>
              <th class="price">Price</th>
              <th class="line-total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items}
          </tbody>
        </table>

        <div class="totals">
          <div class="final-total">
            <span>Total:</span>
            <span style="margin-left: 20px;">₱${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Please keep this receipt for your records.</p>
        </div>
      </body>
    </html>
  `;
};

const formatCurrency = (amount) => {
  return `₱${amount.toFixed(2)}`;
};

export default function SalesScreen() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [lastRemoved, setLastRemoved] = useState(null);
  const [receiptNumber, setReceiptNumber] = useState(1);

  useEffect(() => {
    loadProducts();
    loadCartAndReceipt();
  }, []);

  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('@cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };
    saveCart();
  }, [cart]);

  useEffect(() => {
    const saveReceiptNumber = async () => {
      try {
        await AsyncStorage.setItem('@receiptNumber', JSON.stringify(receiptNumber));
      } catch (error) {
        console.error('Error saving receipt number:', error);
      }
    };
    saveReceiptNumber();
  }, [receiptNumber]);

  useEffect(() => {
    const checkForProductUpdates = async () => {
      try {
        const updatedProducts = await AsyncStorage.getItem('@products');
        if (updatedProducts) {
          setProducts(JSON.parse(updatedProducts));
        }
      } catch (error) {
        console.error('Error checking for product updates:', error);
      }
    };
    
    const interval = setInterval(checkForProductUpdates, 0);
    return () => clearInterval(interval);
  }, []);

  const loadProducts = async () => {
    try {
      const data = await AsyncStorage.getItem('@products');
      if (data) setProducts(JSON.parse(data));
    } catch (error) {
      Alert.alert('Error', 'Failed to load products');
    }
  };

  const loadCartAndReceipt = async () => {
    try {
      const cartData = await AsyncStorage.getItem('@cart');
      if (cartData) setCart(JSON.parse(cartData));

      const receiptData = await AsyncStorage.getItem('@receiptNumber');
      if (receiptData) setReceiptNumber(JSON.parse(receiptData));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addToCart = useCallback((product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          Alert.alert('Error', 'Not enough stock');
          return prev;
        }
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => {
      const item = prev.find(i => i.id === productId);
      if (item.quantity === 1) {
        setLastRemoved(item);
        return prev.filter(i => i.id !== productId);
      }
      return prev.map(i =>
        i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const undoRemove = () => {
    if (lastRemoved) {
      addToCart(lastRemoved);
      setLastRemoved(null);
    }
  };

  const getTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { subtotal, total: subtotal };
  };

  const generateReceipt = async () => {
    try {
      const { subtotal, total } = getTotal();
      const html = generateReceiptHTML(cart, subtotal, total, receiptNumber);
      
      if (Platform.OS === 'web') {
        
        const receiptWindow = window.open('', '_blank');
        if (receiptWindow) {
          receiptWindow.document.write(html);
          receiptWindow.document.close();
          setReceiptNumber(prev => prev + 1);
        } else {
          Alert.alert('Error', 'Please allow pop-ups to view the receipt');
        }
      } else {

        const { uri } = await Print.printToFileAsync({
          html,
          base64: false
        });
        
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'View your receipt',
          UTI: 'com.adobe.pdf'
        });

        setReceiptNumber(prev => prev + 1);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate receipt');
      console.error('Receipt generation error:', error);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
  
    try {
      const { subtotal, total } = getTotal();
      const now = new Date();
      const saleData = {
        id: Date.now().toString(),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal,
        total,
        date: now.toISOString()
      };
  
      const salesData = await AsyncStorage.getItem('sales');
      const sales = salesData ? JSON.parse(salesData) : [];
      
      const updatedSales = [...sales, saleData];
      await AsyncStorage.setItem('sales', JSON.stringify(updatedSales));
      await AsyncStorage.setItem('salesUpdated', Date.now().toString());
  
      setCart([]);
  
      const today = now.toISOString().split('T')[0];
      const todaySales = updatedSales.filter(sale => sale.date.startsWith(today));
      const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
      
      Alert.alert(
        'Sale Complete',
        `Sale recorded successfully!\nToday's total sales: ${formatCurrency(todayTotal)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error processing sale:', error);
      Alert.alert('Error', 'Failed to process sale');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const { subtotal, total } = getTotal();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.productsContainer}>
          <FlatList
            data={filteredProducts}
            renderItem={({ item }) => <ProductCard product={item} onAdd={addToCart} />}
            numColumns={2}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.productGrid}
            scrollEnabled={false} // Disable FlatList scroll since we're using ScrollView
          />
        </View>

        <View style={styles.cartContainer}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Shopping Cart</Text>
          </View>
          
          <View style={styles.cartItemsContainer}>
            {cart.length === 0 ? (
              <Text style={styles.emptyCartText}>Cart is empty</Text>
            ) : (
              cart.map(item => (
                <CartItem 
                  key={item.id}
                  item={item} 
                  onAdd={() => addToCart(item)} 
                  onRemove={() => removeFromCart(item.id)} 
                />
              ))
            )}
          </View>

          {cart.length > 0 && (
            <View style={styles.totalContainer}>
              <View style={[styles.totalRow, styles.finalTotal]}>
                <Text style={[styles.totalLabel, styles.finalTotalLabel]}>Total:</Text>
                <Text style={[styles.totalValue, styles.finalTotalValue]}>₱{total.toFixed(2)}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.checkoutButton}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutButtonText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {lastRemoved && (
        <TouchableOpacity 
          onPress={undoRemove} 
          style={styles.undoButton}
        >
          <Text style={styles.undoText}>Undo Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  productsContainer: {
    marginBottom: 16,
  },
  productGrid: {
    paddingBottom: 16,
  },
  cartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cartHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cartItemsContainer: {
    padding: 16,
  },
  productCard: {
    flex: 1,
    padding: 12,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '700',
    marginBottom: 4,
  },
  stockText: {
    fontSize: 14,
    color: '#757575',
  },
  disabledProduct: {
    opacity: 0.6,
  },
  emptyCartText: {
    textAlign: 'center',
    padding: 16,
    color: '#757575',
    fontSize: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  totalContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: '#757575',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  finalTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  finalTotalLabel: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  finalTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
  checkoutButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    elevation: 2,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  undoButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 12,
    backgroundColor: '#FF5252',
    alignItems: 'center',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  undoText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
});
