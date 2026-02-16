import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PropertyLead,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
} from '../types';
import { formatDateTime } from '../utils/geo';
import { Colors } from '../theme';

interface LeadDetailModalProps {
  lead: PropertyLead;
  visible: boolean;
  onClose: () => void;
  onUpdate: (lead: PropertyLead) => void;
  onDelete: () => void;
}

const STATUSES: PropertyLead['status'][] = [
  'new',
  'contacted',
  'negotiating',
  'closed',
  'passed',
];

export default function LeadDetailModal({
  lead,
  visible,
  onClose,
  onUpdate,
  onDelete,
}: LeadDetailModalProps) {
  const [address, setAddress] = useState(lead.address);
  const [notes, setNotes] = useState(lead.notes);
  const [status, setStatus] = useState(lead.status);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdate({
      ...lead,
      address,
      notes,
      status,
    });
    setIsEditing(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Lead Details</Text>
            <View style={styles.headerActions}>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil" size={22} color={Colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Photo */}
            {lead.photoUri && (
              <Image source={{ uri: lead.photoUri }} style={styles.photo} />
            )}

            {/* Address */}
            <Text style={styles.label}>Address</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address"
                placeholderTextColor={Colors.textSubtle}
              />
            ) : (
              <Text style={styles.value}>{lead.address || 'No address'}</Text>
            )}

            {/* Status */}
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        status === s
                          ? LEAD_STATUS_COLORS[s]
                          : LEAD_STATUS_COLORS[s] + '20',
                    },
                  ]}
                  onPress={() => {
                    setStatus(s);
                    if (!isEditing) {
                      onUpdate({ ...lead, status: s });
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: status === s ? '#fff' : LEAD_STATUS_COLORS[s] },
                    ]}
                  >
                    {LEAD_STATUS_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tags */}
            {lead.tags.length > 0 && (
              <>
                <Text style={styles.label}>Tags</Text>
                <View style={styles.tagsRow}>
                  {lead.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Notes */}
            <Text style={styles.label}>Notes</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes..."
                placeholderTextColor={Colors.textSubtle}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.value}>{lead.notes || 'No notes'}</Text>
            )}

            {/* Metadata */}
            <Text style={styles.label}>Location</Text>
            <Text style={styles.metaValue}>
              {lead.latitude.toFixed(6)}, {lead.longitude.toFixed(6)}
            </Text>

            <Text style={styles.label}>Created</Text>
            <Text style={styles.metaValue}>
              {formatDateTime(lead.createdAt)}
            </Text>

            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actions}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setAddress(lead.address);
                    setNotes(lead.notes);
                    setStatus(lead.status);
                    setIsEditing(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                <Text style={styles.deleteButtonText}>Delete Lead</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  body: {
    paddingHorizontal: 20,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  metaValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.inputBg,
  },
  notesInput: {
    minHeight: 80,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.tagBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#2A1515',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 16,
  },
});
