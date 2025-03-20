import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const CASHIER = {
  email: 'pastorjester@pos.com',
  password: 'cashier2025',
  name: 'POS Cashier'
};

const toastConfig = {
  success: (props) => (
    <View
      style={{
        width: '90%',
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        flexDirection: 'row',
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
      }}>
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
          {props.text1}
        </Text>
        <Text style={{ color: '#fff', fontSize: 14, marginTop: 4 }}>
          {props.text2}
        </Text>
      </View>
    </View>
  ),
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);

      if (!email.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Email Required',
          text2: 'Please enter your email address',
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }

      if (!password.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Password Required',
          text2: 'Please enter your password',
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }

      if (email.toLowerCase() === CASHIER.email && password === CASHIER.password) {
        
        await AsyncStorage.multiSet([
          ['@user_session', 'active'],
          ['@user_token', `session_${Date.now()}`],
          ['@user_data', JSON.stringify({
            email: CASHIER.email,
            name: CASHIER.name,
            lastLogin: new Date().toISOString()
          })],
        ]);

        Toast.show({
          type: 'success',
          text1: ` Welcome back, ${CASHIER.name}!`,
          text2: `Successfully logged in at ${new Date().toLocaleTimeString()}`,
          position: 'top',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 30,
        });

        setTimeout(() => {
          router.replace('/(app)');
        }, 1000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: 'Invalid email or password',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: 'An error occurred during login',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>POS Mobile App</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.inputContainer}>
      
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.loginButton,
            { pointerEvents: 'auto', opacity: isLoading ? 0.7 : 1 }
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <View style={styles.helpText}>
          <Text style={styles.helpTextContent}>
            Login Credentials:{'\n'}
            Email: pastorjester@pos.com{'\n'}
            Password: cashier2025
          </Text>
        </View>
      </View>
      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 30,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  helpText: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: '100%',
  },
  helpTextContent: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 