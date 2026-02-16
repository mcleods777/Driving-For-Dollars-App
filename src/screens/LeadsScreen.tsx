import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  PropertyLead,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
} from '../types';
import { getAllLeads, updateLead, deleteLead } from '../services/database';
import { formatDateTime } from '../utils/geo';
import LeadDetailModal from '../components/LeadDetailModal';
import { Colors } from '../theme';

const STATUS_FILTERS: (PropertyLead['status'] | 'all')[] = [
  'all',
  'new',
  'contacted',
  'negotiating',
  'closed',
  'passed',
];

export default function LeadsScreen() {
  const [leads, setLeads] = useState<PropertyLead[]>([]);
  const [filterStatus, setFilterStatus] = useState<PropertyLead['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<PropertyLead | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeads = useCallback(async () => {
    const allLeads = await getAllLeads();
    setLeads(allLeads);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLeads();
    }, [loadLeads])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      lead.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleDeleteLead = (lead: PropertyLead) => {
    Alert.alert('Delete Lead?', `Delete the lead at ${lead.address || 'this location'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteLead(lead.id);
          await loadLeads();
        },
      },
    ]);
  };

  const handleUpdateLead = async (updatedLead: PropertyLead) => {
    await updateLead(updatedLead);
    await loadLeads();
    setSelectedLead(null);
  };

  const renderLead = ({ item }: { item: PropertyLead }) => (
    <TouchableOpacity
      style={styles.leadCard}
      onPress={() => setSelectedLead(item)}
    >
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          {item.photoUri ? (
            <Image source={{ uri: item.photoUri }} style={styles.leadPhoto} />
          ) : (
            <View style={styles.leadPhotoPlaceholder}>
              <Ionicons name="home-outline" size={24} color={Colors.textSubtle} />
            </View>
          )}
          <View style={styles.leadText}>
            <Text style={styles.leadAddress} numberOfLines={1}>
              {item.address || 'No address'}
            </Text>
            <Text style={styles.leadDate}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteLead(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.textSubtle} />
        </TouchableOpacity>
      </View>

      {item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
          )}
        </View>
      )}

      {item.notes ? (
        <Text style={styles.notesPreview} numberOfLines={2}>
          {item.notes}
        </Text>
      ) : null}

      <View style={styles.leadFooter}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: LEAD_STATUS_COLORS[item.status] + '20' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: LEAD_STATUS_COLORS[item.status] },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: LEAD_STATUS_COLORS[item.status] },
            ]}
          >
            {LEAD_STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textSubtle} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          placeholderTextColor={Colors.textSubtle}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textSubtle} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item: status }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status === 'all' ? 'All' : LEAD_STATUS_LABELS[status]}
              </Text>
              {status !== 'all' && (
                <Text
                  style={[
                    styles.filterCount,
                    filterStatus === status && styles.filterCountActive,
                  ]}
                >
                  {leads.filter((l) => l.status === status).length}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={renderLead}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.textMuted}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={64} color={Colors.textSubtle} />
            <Text style={styles.emptyText}>No leads found</Text>
            <Text style={styles.emptySubtext}>
              Flag properties while driving to add them as leads
            </Text>
          </View>
        }
      />

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          visible={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdateLead}
          onDelete={() => {
            handleDeleteLead(selectedLead);
            setSelectedLead(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  filtersContainer: {
    marginTop: 12,
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  filterCountActive: {
    color: Colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  list: {
    padding: 16,
    paddingBottom: 20,
  },
  leadCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  leadPhoto: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  leadPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadText: {
    flex: 1,
  },
  leadAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  leadDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: Colors.tagBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 11,
    color: Colors.textMuted,
    alignSelf: 'center',
    marginLeft: 2,
  },
  notesPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  leadFooter: {
    marginTop: 10,
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSubtle,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSubtle,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
