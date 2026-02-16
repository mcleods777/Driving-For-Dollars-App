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
              <Ionicons name="home-outline" size={24} color="#ccc" />
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
          <Ionicons name="trash-outline" size={18} color="#ccc" />
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
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={64} color="#ccc" />
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
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterChipActive: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  filterCountActive: {
    color: '#4A90D9',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  list: {
    padding: 16,
    paddingBottom: 20,
  },
  leadCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadText: {
    flex: 1,
  },
  leadAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  leadDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#f0f4f8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: '#4A90D9',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'center',
    marginLeft: 2,
  },
  notesPreview: {
    fontSize: 13,
    color: '#777',
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
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
