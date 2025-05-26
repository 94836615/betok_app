// src/screens/UserIdentificationScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  TextInput
} from 'react-native';
import { getDeviceId, formatUUID } from '../utils/user-utils';

interface UserIdentificationScreenProps {
  onContinue: () => void;
}

const UserIdentificationScreen: React.FC<UserIdentificationScreenProps> = ({ onContinue }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [followUserId, setFollowUserId] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await getDeviceId();
        setUserId(id);
      } catch (error) {
        console.error('Error loading user ID:', error);
        Alert.alert('Error', 'Could not load your user ID. Please restart the app.');
      } finally {
        setLoading(false);
      }
    };

    loadUserId();
  }, []);

  const handleShareUserId = async () => {
    if (!userId) return;

    try {
      await Share.share({
        message: `Follow me on Betok! My user ID is: ${userId}`
      });
    } catch (error) {
      console.error('Error sharing user ID:', error);
    }
  };

  const handleFollowUser = async () => {
    if (!followUserId.trim() || !userId) return;

    setFollowLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/users/${followUserId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ follower_id: userId }),
      });

      if (response.ok) {
        Alert.alert('Success', `You are now following user ${followUserId}`);
        setFollowUserId('');
      } else {
        Alert.alert('Error', 'Could not follow this user. Please check the ID and try again.');
      }
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text style={styles.loadingText}>Loading your unique ID...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Betok ID</Text>

      <View style={styles.idContainer}>
        <Text style={styles.idText}>{formatUUID(userId || '')}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareUserId}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.instructions}>
        This is your unique ID. Share it with friends so they can follow you!
      </Text>

      <View style={styles.followContainer}>
        <Text style={styles.followTitle}>Follow Someone</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter User ID"
          placeholderTextColor="#999"
          value={followUserId}
          onChangeText={setFollowUserId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.followButton, followLoading && styles.followButtonDisabled]}
          onPress={handleFollowUser}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.followButtonText}>Follow</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueButtonText}>Continue to Videos</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  idText: {
    color: '#FF5A5F',
    fontSize: 16,
    flex: 1,
    fontFamily: 'monospace',
  },
  shareButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  shareButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  instructions: {
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 14,
  },
  followContainer: {
    width: '100%',
    marginBottom: 40,
  },
  followTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#222',
    color: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  followButton: {
    backgroundColor: '#FF5A5F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  followButtonDisabled: {
    backgroundColor: '#888',
  },
  followButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 15,
  }
});

export default UserIdentificationScreen;
