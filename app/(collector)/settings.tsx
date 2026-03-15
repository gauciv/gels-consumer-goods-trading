import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';

const RESEARCHERS = [
  'Emily Grace C. Espiritu',
  'Marc Roland C. Gesta',
  'Ashley G. Ybañez',
];

const DEVELOPERS = [
  'Jonna Bohol',
  'Vincent August',
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  async function handleLogout() {
    setShowLogoutModal(false);
    await signOut();
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="items-center">
        <View
          style={isTablet ? { maxWidth: 600, width: '100%' } : { width: '100%' }}
          className="px-4 py-6"
        >
          {/* Profile Section */}
          <View className="bg-surface rounded-xl p-5 mb-4 shadow-sm border border-gray-200">
            <View className="items-center mb-2">
              <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-3">
                <Ionicons name="person" size={32} color="#1060C0" />
              </View>
              <Text className="text-xl font-bold text-gray-800">{user?.full_name}</Text>
              <Text className="text-sm text-gray-500 mt-1">{user?.email}</Text>
              <View className="bg-blue-100 px-3 py-1 rounded-full mt-2">
                <Text className="text-blue-600 text-xs font-semibold capitalize">{user?.role}</Text>
              </View>
            </View>
          </View>

          {/* App Info */}
          <View className="bg-surface rounded-xl p-5 mb-4 shadow-sm border border-gray-200">
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">App Info</Text>
            <View className="flex-row justify-between py-2.5 border-b border-gray-200">
              <Text className="text-gray-600">Version</Text>
              <Text className="text-gray-800 font-semibold">1.0.0</Text>
            </View>
            <View className="flex-row justify-between py-2.5">
              <Text className="text-gray-600">Account Status</Text>
              <Text className="text-green-600 font-semibold">Active</Text>
            </View>
          </View>

          {/* Researchers */}
          <View className="bg-surface rounded-xl p-5 mb-4 shadow-sm border border-gray-200">
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Researchers</Text>
            {RESEARCHERS.map((name, i) => (
              <View
                key={name}
                className={`flex-row items-center py-2.5 ${i < RESEARCHERS.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: '#1060C0' }}
                >
                  <Text className="text-white text-xs font-bold">{name.charAt(0)}</Text>
                </View>
                <Text className="text-gray-700 font-medium flex-1">{name}</Text>
              </View>
            ))}
          </View>

          {/* Developers */}
          <View className="bg-surface rounded-xl p-5 mb-4 shadow-sm border border-gray-200">
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Developers</Text>
            {DEVELOPERS.map((name, i) => (
              <View
                key={name}
                className={`flex-row items-center py-2.5 ${i < DEVELOPERS.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: '#0A2040' }}
                >
                  <Text className="text-white text-xs font-bold">{name.charAt(0)}</Text>
                </View>
                <Text className="text-gray-700 font-medium flex-1">{name}</Text>
              </View>
            ))}
          </View>

          {/* Account */}
          <View className="bg-surface rounded-xl p-5 shadow-sm border border-gray-200">
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Account</Text>
            <TouchableOpacity
              className="flex-row items-center py-2.5"
              onPress={() => setShowLogoutModal(true)}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="text-red-500 font-semibold ml-3">Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-surface rounded-2xl p-6 w-full max-w-sm border border-gray-200">
            <View className="items-center mb-4">
              <View className="w-14 h-14 rounded-full bg-red-100 items-center justify-center mb-3">
                <Ionicons name="warning" size={28} color="#ef4444" />
              </View>
              <Text className="text-lg font-bold text-gray-800 text-center">Are you sure?</Text>
            </View>
            <Text className="text-gray-600 text-center mb-6 leading-5">
              You will need the Admin's QR code or activation code to log back
              in. Make sure you have access before logging out.
            </Text>
            <TouchableOpacity
              className="bg-red-500 rounded-lg py-3.5 items-center mb-3"
              onPress={handleLogout}
            >
              <Text className="text-white font-semibold">Yes, Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-100 rounded-lg py-3.5 items-center"
              onPress={() => setShowLogoutModal(false)}
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
