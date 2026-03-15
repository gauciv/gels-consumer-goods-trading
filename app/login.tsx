import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function ActivationScreen() {
  const { activate, isAuthenticated } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(collector)/products');
    }
  }, [isAuthenticated]);

  const VALID_CHARS = '23456789ACDEFGHJKMNPQRSTUVWXYZ';

  function filterCode(text: string): string {
    return text
      .toUpperCase()
      .split('')
      .filter((c) => VALID_CHARS.includes(c))
      .join('')
      .slice(0, 6);
  }

  async function handleActivate() {
    const trimmed = code.toUpperCase().trim();
    if (trimmed.length !== 6) {
      setError('Activation code must be 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await activate(trimmed);
    } catch (err: any) {
      setError(err.message || 'Activation failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A2040' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center items-center px-4">
        <View style={isTablet ? { maxWidth: 420, width: '100%' } : { width: '100%' }}>

          {/* GELS Gradient Label */}
          <View className="items-center mb-2">
            <MaskedView
              maskElement={
                <Text style={{ fontSize: 52, fontWeight: '900', backgroundColor: 'transparent', textAlign: 'center' }}>
                  GELS
                </Text>
              }
            >
              <LinearGradient
                colors={['#FFFFFF', '#74A7E6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={{ fontSize: 52, fontWeight: '900', opacity: 0, textAlign: 'center' }}>
                  GELS
                </Text>
              </LinearGradient>
            </MaskedView>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 36, fontSize: 14 }}>
            Activate your collector account
          </Text>

          {/* Error */}
          {error ? (
            <View
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)', borderWidth: 1 }}
              className="rounded-lg p-3 mb-4 mx-4"
            >
              <Text style={{ color: '#FCA5A5' }} className="text-sm text-center">{error}</Text>
            </View>
          ) : null}

          {/* Loading */}
          {loading ? (
            <View
              style={{ backgroundColor: 'rgba(16,96,192,0.2)', borderColor: 'rgba(16,96,192,0.4)', borderWidth: 1 }}
              className="rounded-lg p-3 mb-4 mx-4 flex-row items-center justify-center"
            >
              <ActivityIndicator size="small" color="#74A7E6" />
              <Text style={{ color: '#74A7E6' }} className="text-sm ml-2">Activating...</Text>
            </View>
          ) : null}

          {/* Scan QR Button */}
          <TouchableOpacity
            className="mx-4 mb-6 rounded-xl py-4 flex-row items-center justify-center"
            style={{ backgroundColor: '#1060C0' }}
            onPress={() => router.push('/scan')}
            disabled={loading}
          >
            <Ionicons name="qr-code-outline" size={22} color="#ffffff" />
            <Text className="text-white font-semibold text-base ml-2">Scan QR Code</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mx-4 mb-6">
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <Text style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm mx-3">
              or enter code manually
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </View>

          {/* Manual Code Entry */}
          <View className="px-4">
            <Text style={{ color: 'rgba(255,255,255,0.7)' }} className="text-sm font-medium mb-2">
              Activation Code
            </Text>
            <TextInput
              ref={inputRef}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 16,
                textAlign: 'center',
                fontSize: 24,
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                letterSpacing: 6,
                color: '#FFFFFF',
              }}
              value={code}
              onChangeText={(text) => setCode(filterCode(text))}
              placeholder="ABC123"
              placeholderTextColor="rgba(255,255,255,0.25)"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={{ color: 'rgba(255,255,255,0.35)' }} className="text-xs text-center mt-2">
              Enter the 6-character code from your administrator
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: '#1060C0',
                opacity: loading || code.length !== 6 ? 0.45 : 1,
                borderRadius: 10,
                paddingVertical: 16,
                alignItems: 'center',
                marginTop: 20,
              }}
              onPress={handleActivate}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold text-base">Activate</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
