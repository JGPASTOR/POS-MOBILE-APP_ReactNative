import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { BaseToast } from 'react-native-toast-message';

export default function AppLayout() {
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    try {
      
      await AsyncStorage.multiRemove([
        '@user_session',
        '@user_token',
        '@user_data'
      ]);
      
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully',
        text2: 'You have been logged out',
        position: 'top',
        visibilityTime: 2000,
        autoHide: true,
      });
    
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Toast.show({
        type: 'error',
        text1: 'Logout failed',
        text2: 'There was an error logging out',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
      });
    }
  };

  const renderSettingsModal = () => (
    <Modal
      visible={showSettings}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity
              onPress={() => setShowSettings(false)}
              style={[styles.closeButton, { pointerEvents: 'auto' }]}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity 
              style={[styles.logoutButton, { pointerEvents: 'auto' }]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {renderSettingsModal()}
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#007AFF',
          headerStyle: Platform.select({
            web: {
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
            },
            android: {
              elevation: 4,
            },
          }),
          tabBarStyle: Platform.select({
            web: {
              boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
            },
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 8,
            },
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
            headerRight: () => (
              <TouchableOpacity 
                onPress={() => setShowSettings(true)} 
                style={[{ marginRight: 15 }, { pointerEvents: 'auto' }]}
              >
                <Ionicons name="person-circle-outline" size={30} color="#000000" />
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: 'Products',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sales"
          options={{
            title: 'Sales',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="inventory" options={{ title: 'Inventory', tabBarIcon: ({ color, size }) => <Ionicons name="file-tray-stacked-outline" size={size} color={color} /> }} />
      </Tabs>
      <Toast 
        config={{
          success: (props) => (
            <BaseToast
              {...props}
              style={Platform.select({
                web: {
                  borderLeftColor: '#4CAF50',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                },
                default: {
                  borderLeftColor: '#4CAF50',
                  ...styles.toastShadow,
                },
              })}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              text1Style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#4CAF50',
              }}
              text2Style={{
                fontSize: 14,
                color: '#333',
              }}
            />
          ),
          error: (props) => (
            <BaseToast
              {...props}
              style={Platform.select({
                web: {
                  borderLeftColor: '#FF5252',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                },
                default: {
                  borderLeftColor: '#FF5252',
                  ...styles.toastShadow,
                },
              })}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              text1Style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#FF5252',
              }}
              text2Style={{
                fontSize: 14,
                color: '#333',
              }}
            />
          ),
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  section: {
    width: '100%',
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toastShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});

