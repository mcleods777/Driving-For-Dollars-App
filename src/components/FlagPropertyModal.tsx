import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PropertyLead } from '../types';
import { Colors } from '../theme';

const COMMON_TAGS = [
  'Vacant',
  'Overgrown',
  'Boarded Up',
  'Fire Damage',
  'For Sale',
  'Pre-Foreclosure',
  'Distressed',
  'Absentee Owner',
  'Code Violation',
  'Roof Damage',
];

interface FlagPropertyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (lead: Omit<PropertyLead, 'id' | 'createdAt' | 'latitude' | 'longitude' | 'sessionId'>) => void;
  initialAddress?: string;
  initialCoords?: { latitude: number; longitude: number };
}

export default function FlagPropertyModal({ visible, onClose, onSave, initialAddress, initialCoords }: FlagPropertyModalProps) {
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Pre-fill address when modal opens with initial data
  useEffect(() => {
    if (visible && initialAddress) {
      setAddress(initialAddress);
    }
  }, [visible, initialAddress]);

  const resetForm = () => {
    setAddress('');
    setNotes('');
    setPhotoUri(null);
    setSelectedTags([]);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is needed.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    onSave({
      address,
      notes,
      photoUri,
      tags: selectedTags,
      status: 'new',
    });
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Flag Property</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Location info */}
            {initialCoords && (
              <View style={styles.locationBanner}>
                <Ionicons name="location" size={18} color="#FFD600" />
                <Text style={styles.locationText}>
                  {initialCoords.latitude.toFixed(6)}, {initialCoords.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {/* Address */}
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St"
              placeholderTextColor={Colors.textSubtle}
            />

            {/* Photo */}
            <Text style={styles.label}>Photo</Text>
            <View style={styles.photoRow}>
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={24} color={Colors.primary} />
                <Text style={styles.photoButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
                <Ionicons name="images" size={24} color={Colors.primary} />
                <Text style={styles.photoButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            {photoUri && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setPhotoUri(null)}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            )}

            {/* Tags */}
            <Text style={styles.label}>Property Tags</Text>
            <View style={styles.tagsContainer}>
              {COMMON_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagSelected,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.tagTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any details about the property..."
              placeholderTextColor={Colors.textSubtle}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.bottomSpacer} />
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="flag" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Lead</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.inputBg,
  },
  notesInput: {
    minHeight: 80,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  photoButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreview: {
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.inputBg,
  },
  tagSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 16,
  },
});
