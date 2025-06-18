// src/screens/UserIdScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share
} from 'react-native';
import { getDeviceId } from '../utils/user-utils';

interface UserIdScreenProps {
  onContinue: () => void;
}

const UserIdScreen: React.FC<UserIdScreenProps> = ({ onContinue }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [followId, setFollowId] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await getDeviceId();
        setUserId(id);
      } catch (err) {
        console.error('Error loading user ID:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserId();
  }, []);

  const handleShare = async () => {
    if (!userId) return;

    try {
      await Share.share({
        message: `Follow me on our app! My user ID is: ${userId}`
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleFollow = async () => {
    if (!followId.trim() || !userId) return;

    setFollowLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/users/${followId}/follow`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ follower_id: userId }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'You are now following this user!');
        setFollowId('');
      } else {
        Alert.alert('Error', 'Could not follow this user. Please check the ID.');
      }
    } catch (err) {
      console.error('Error following user:', err);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text style={styles.text}>Loading your unique ID...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Unique ID</Text>

      <View style={styles.idContainer}>
        <Text style={styles.idText}>{userId}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        This is your unique identifier. Share it with friends so they can follow you!
      </Text>

      <View style={styles.followSection}>
        <Text style={styles.subtitle}>Follow Someone</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a user ID"
          placeholderTextColor="#999"
          value={followId}
          onChangeText={setFollowId}
        />
        <TouchableOpacity
          style={[styles.followButton, followLoading && styles.disabledButton]}
          onPress={handleFollow}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Follow</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.buttonText}>Continue to App</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  idText: {
    color: '#FF5A5F',
    fontSize: 16,
    flex: 1,
  },
  description: {
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 30,
  },
  followSection: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#222',
    color: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  shareButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  followButton: {
    backgroundColor: '#FF5A5F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#888',
  },
  continueButton: {
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  text: {
    color: '#FFF',
    marginTop: 10,
  }
});

export default UserIdScreen;
