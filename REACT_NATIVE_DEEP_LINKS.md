# React Native Deep Links Setup for Password Reset

This guide will help you set up deep links in your React Native app to handle password reset flows.

## 🔗 What are Deep Links?

Deep links allow your app to be opened from external sources (like emails) with specific data or to navigate to specific screens. For password reset, the flow is:

1. User requests password reset in app
2. API sends email with deep link: `roomiesync://reset-password?token=abc123`
3. User taps link in email → App opens directly to password reset screen with token

## 📱 React Native Setup

### Step 1: Install React Navigation (if not already installed)

```bash
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# For iOS
cd ios && pod install
```

### Step 2: Configure URL Scheme

#### **iOS Configuration (ios/YourApp/Info.plist)**

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>roomiesync</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>roomiesync</string>
    </array>
  </dict>
</array>
```

#### **Android Configuration (android/app/src/main/AndroidManifest.xml)**

Add this inside your main activity:

```xml
<activity
  android:name=".MainActivity"
  android:exported="true"
  android:launchMode="singleTop"
  android:theme="@style/LaunchTheme">

  <!-- Existing intent filter -->
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>

  <!-- Add this new intent filter for deep links -->
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="roomiesync" />
  </intent-filter>

</activity>
```

### Step 3: Set up Linking in React Navigation

#### **App.js/App.tsx**

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking } from 'react-native';

// Your screens
import LoginScreen from './screens/LoginScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['roomiesync://'],
  config: {
    screens: {
      ResetPassword: 'reset-password', // This maps to roomiesync://reset-password
      Login: 'login',
      Home: 'home',
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{ title: 'Reset Password' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Step 4: Create Reset Password Screen

#### **screens/ResetPasswordScreen.tsx**

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function ResetPasswordScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Extract token from deep link parameters
  const token = route.params?.token;

  useEffect(() => {
    if (!token) {
      Alert.alert('Error', 'Invalid reset link');
      navigation.navigate('Login');
      return;
    }

    // Verify token is valid when screen loads
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`https://your-api.com/auth/reset-password/${token}`);
      const data = await response.json();

      if (!data.valid) {
        Alert.alert('Error', 'This reset link has expired or is invalid');
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to verify reset link');
      navigation.navigate('Login');
    }
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://your-api.com/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Your password has been reset successfully', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to reset password');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      <Text style={styles.subtitle}>
        Enter your new password below
      </Text>

      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#6b7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Step 5: Add Forgot Password to Login Screen

#### **screens/LoginScreen.tsx** (Add this to your existing login screen)

```tsx
const handleForgotPassword = async () => {
  if (!email) {
    Alert.alert('Error', 'Please enter your email address first');
    return;
  }

  try {
    const response = await fetch('https://your-api.com/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    Alert.alert(
      'Check Your Email',
      'If an account with that email exists, we have sent you a password reset link.'
    );
  } catch (error) {
    Alert.alert('Error', 'Network error. Please try again.');
  }
};

// Add this button to your login form
<TouchableOpacity onPress={handleForgotPassword}>
  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
</TouchableOpacity>
```

## 🧪 Testing Deep Links

### **During Development:**

1. **iOS Simulator:**
   ```bash
   xcrun simctl openurl booted "roomiesync://reset-password?token=test123"
   ```

2. **Android Emulator:**
   ```bash
   adb shell am start \
     -W -a android.intent.action.VIEW \
     -d "roomiesync://reset-password?token=test123" \
     com.yourapp.package
   ```

3. **Real Device:**
   - Send yourself an email with the deep link
   - Tap the link to test

### **Test URLs:**
```
roomiesync://reset-password?token=test123
roomiesync://login
roomiesync://home
```

## 🔒 Security Considerations

1. **Always validate tokens** on the server before allowing password reset
2. **Check token expiry** both client and server side
3. **Use HTTPS** for all API calls
4. **Implement rate limiting** to prevent abuse
5. **Clear sensitive data** from memory after use

## 🌐 Environment Configuration

### **API URLs by Environment:**

```tsx
const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'  // Development
  : 'https://api.roomiesync.com';  // Production

// In your .env file:
REACT_NATIVE_API_URL=http://localhost:3001
REACT_NATIVE_FRONTEND_URL=roomiesync://
```

### **Backend Environment Variables:**

Add these to your NestJS `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@roomiesync.app
APP_NAME=RoomieSync

# Deep Link Configuration
FRONTEND_URL=roomiesync://
WEB_URL=https://app.roomiesync.com

# Development
NODE_ENV=development
```

## 📝 Production Checklist

- [ ] Configure production API URLs
- [ ] Set up proper SendGrid account and API key
- [ ] Test deep links on real devices
- [ ] Verify email deliverability
- [ ] Set up proper error tracking
- [ ] Test with different email clients
- [ ] Verify deep links work when app is closed vs. backgrounded
- [ ] Test token expiry scenarios

## 🚀 Next Steps

1. **Test the password reset flow** end-to-end
2. **Customize the email template** with your branding
3. **Add analytics** to track reset success rates
4. **Consider adding** biometric authentication after reset
5. **Implement proper error tracking** with services like Sentry

## 🔧 Troubleshooting

**Deep link not opening app:**
- Check URL scheme configuration in both iOS and Android
- Verify the app is installed on the device
- Check if another app is claiming the same URL scheme

**Token verification failing:**
- Ensure API URL is correct for your environment
- Check network connectivity
- Verify token hasn't expired (15 minutes)

**Email not arriving:**
- Check SendGrid configuration and API key
- Verify the FROM_EMAIL is properly configured
- Check spam folders
- Test with different email providers