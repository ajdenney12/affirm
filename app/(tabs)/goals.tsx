import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

type GoalType = 'progress' | 'checklist' | 'yesno' | 'numeric';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalType, setNewGoalType] = useState<GoalType>('progress');
  const [newGoalTarget, setNewGoalTarget] = useState('100');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      console.error('Error loading goals:', error);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    if (newGoalType === 'checklist' && checklistItems.length === 0) {
      Alert.alert('Error', 'Please add at least one checklist item');
      return;
    }

    if (newGoalType === 'numeric' && (!newGoalTarget || parseInt(newGoalTarget) <= 0)) {
      Alert.alert('Error', 'Please enter a valid target number');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let goalData: any = {
        user_id: user.id,
        title: newGoalTitle.trim(),
        description: newGoalDescription.trim(),
        type: newGoalType,
        status: 'active',
      };

      if (newGoalType === 'progress') {
        goalData.current = 0;
        goalData.target = 100;
      } else if (newGoalType === 'checklist') {
        goalData.milestones = checklistItems;
        goalData.current = 0;
        goalData.target = checklistItems.length;
      } else if (newGoalType === 'yesno') {
        goalData.current = 0;
        goalData.target = 1;
      } else if (newGoalType === 'numeric') {
        goalData.current = 0;
        goalData.target = parseInt(newGoalTarget);
      }

      const { error } = await supabase.from('goals').insert([goalData]);

      if (error) throw error;

      setNewGoalTitle('');
      setNewGoalDescription('');
      setNewGoalType('progress');
      setNewGoalTarget('100');
      setChecklistItems([]);
      setNewChecklistItem('');
      setShowAddModal(false);
      await loadGoals();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            await loadGoals();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete goal');
          }
        },
      },
    ]);
  };

  const handleUpdateProgress = async (goal: any, increment: number) => {
    try {
      const newCurrent = Math.max(0, Math.min(goal.target, goal.current + increment));
      const { error } = await supabase
        .from('goals')
        .update({ current: newCurrent })
        .eq('id', goal.id);

      if (error) throw error;
      await loadGoals();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update progress');
    }
  };

  const handleToggleYesNo = async (goal: any) => {
    try {
      const newCurrent = goal.current === 1 ? 0 : 1;
      const { error } = await supabase
        .from('goals')
        .update({ current: newCurrent })
        .eq('id', goal.id);

      if (error) throw error;
      await loadGoals();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update goal');
    }
  };

  const handleToggleChecklistItem = async (goal: any, itemId: string) => {
    try {
      const milestones = goal.milestones || [];
      const updatedMilestones = milestones.map((item: ChecklistItem) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      const completedCount = updatedMilestones.filter((item: ChecklistItem) => item.completed).length;

      const { error } = await supabase
        .from('goals')
        .update({
          milestones: updatedMilestones,
          current: completedCount
        })
        .eq('id', goal.id);

      if (error) throw error;
      await loadGoals();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update checklist');
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;

    setChecklistItems([
      ...checklistItems,
      {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false,
      },
    ]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#E9D5FF', '#FECDD3']} style={styles.gradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Goals</Text>
            <Text style={styles.subtitle}>Track your progress</Text>
          </View>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>No goals yet</Text>
              <Text style={styles.emptySubtext}>Create your first goal above</Text>
            </View>
          ) : (
            goals.map((goal) => {
              const progress = (goal.current / goal.target) * 100;
              return (
                <View key={goal.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.cardTitle}>{goal.title}</Text>
                      <Text style={styles.goalTypeLabel}>
                        {goal.type === 'progress' && '% Progress'}
                        {goal.type === 'checklist' && 'Checklist'}
                        {goal.type === 'yesno' && 'Yes/No'}
                        {goal.type === 'numeric' && 'Numeric'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)}>
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  {goal.description ? (
                    <Text style={styles.cardDescription}>{goal.description}</Text>
                  ) : null}

                  {goal.type === 'progress' && (
                    <>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                      </View>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleUpdateProgress(goal, -1)}
                        >
                          <Text style={styles.actionButtonText}>-</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleUpdateProgress(goal, 1)}
                        >
                          <Text style={styles.actionButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {goal.type === 'yesno' && (
                    <TouchableOpacity
                      style={[styles.yesNoButton, goal.current === 1 && styles.yesNoButtonCompleted]}
                      onPress={() => handleToggleYesNo(goal)}
                    >
                      <Text style={[styles.yesNoText, goal.current === 1 && styles.yesNoTextCompleted]}>
                        {goal.current === 1 ? '✓ Completed' : 'Mark Complete'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {goal.type === 'numeric' && (
                    <>
                      <View style={styles.numericContainer}>
                        <Text style={styles.numericValue}>
                          {goal.current} / {goal.target}
                        </Text>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                      </View>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleUpdateProgress(goal, -1)}
                        >
                          <Text style={styles.actionButtonText}>-</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleUpdateProgress(goal, 1)}
                        >
                          <Text style={styles.actionButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {goal.type === 'checklist' && (
                    <View style={styles.checklistContainer}>
                      {(goal.milestones || []).map((item: ChecklistItem) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.checklistItem}
                          onPress={() => handleToggleChecklistItem(goal, item.id)}
                        >
                          <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                            {item.completed && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <Text style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}>
                            {item.text}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <Text style={styles.checklistProgress}>
                        {goal.current} of {goal.target} completed
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalOverlay}
              onPress={() => {
                setShowAddModal(false);
                setNewGoalTitle('');
                setNewGoalDescription('');
              }}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>New Goal</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                      style={styles.input}
                      value={newGoalTitle}
                      onChangeText={setNewGoalTitle}
                      placeholder="Enter goal title"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description (optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newGoalDescription}
                      onChangeText={setNewGoalDescription}
                      placeholder="Enter description"
                      multiline
                      maxLength={500}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Goal Type</Text>
                    <View style={styles.typeSelector}>
                      <TouchableOpacity
                        style={[styles.typeButton, newGoalType === 'progress' && styles.typeButtonActive]}
                        onPress={() => setNewGoalType('progress')}
                      >
                        <Text style={[styles.typeButtonText, newGoalType === 'progress' && styles.typeButtonTextActive]}>
                          % Progress
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.typeButton, newGoalType === 'numeric' && styles.typeButtonActive]}
                        onPress={() => setNewGoalType('numeric')}
                      >
                        <Text style={[styles.typeButtonText, newGoalType === 'numeric' && styles.typeButtonTextActive]}>
                          Numeric
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.typeButton, newGoalType === 'yesno' && styles.typeButtonActive]}
                        onPress={() => setNewGoalType('yesno')}
                      >
                        <Text style={[styles.typeButtonText, newGoalType === 'yesno' && styles.typeButtonTextActive]}>
                          Yes/No
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.typeButton, newGoalType === 'checklist' && styles.typeButtonActive]}
                        onPress={() => setNewGoalType('checklist')}
                      >
                        <Text style={[styles.typeButtonText, newGoalType === 'checklist' && styles.typeButtonTextActive]}>
                          Checklist
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {newGoalType === 'numeric' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Target Number</Text>
                      <TextInput
                        style={styles.input}
                        value={newGoalTarget}
                        onChangeText={setNewGoalTarget}
                        placeholder="Enter target number"
                        keyboardType="numeric"
                      />
                    </View>
                  )}

                  {newGoalType === 'checklist' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Checklist Items</Text>
                      {checklistItems.map((item) => (
                        <View key={item.id} style={styles.checklistItemInput}>
                          <Text style={styles.checklistItemText}>{item.text}</Text>
                          <TouchableOpacity onPress={() => removeChecklistItem(item.id)}>
                            <Text style={styles.removeItemButton}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <View style={styles.addItemContainer}>
                        <TextInput
                          style={[styles.input, styles.addItemInput]}
                          value={newChecklistItem}
                          onChangeText={setNewChecklistItem}
                          placeholder="Add item"
                          onSubmitEditing={addChecklistItem}
                        />
                        <TouchableOpacity
                          style={styles.addItemButton}
                          onPress={addChecklistItem}
                        >
                          <Text style={styles.addItemButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButtonCancel}
                      onPress={() => {
                        setShowAddModal(false);
                        setNewGoalTitle('');
                        setNewGoalDescription('');
                        setNewGoalType('progress');
                        setNewGoalTarget('100');
                        setChecklistItems([]);
                        setNewChecklistItem('');
                      }}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButtonConfirm}
                      onPress={handleAddGoal}
                      disabled={loading}
                    >
                      <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.buttonGradient}>
                        <Text style={styles.buttonText}>
                          {loading ? 'Adding...' : 'Add Goal'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#1F2937',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#A855F7',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  goalTypeLabel: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: '#A855F7',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(233, 213, 255, 0.4)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  progressText: {
    fontSize: 12,
    color: '#A855F7',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  deleteIcon: {
    fontSize: 20,
  },
  yesNoButton: {
    backgroundColor: 'rgba(233, 213, 255, 0.3)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  yesNoButtonCompleted: {
    backgroundColor: '#8B5CF6',
  },
  yesNoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  yesNoTextCompleted: {
    color: '#FFFFFF',
  },
  numericContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  numericValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 8,
  },
  checklistContainer: {
    marginTop: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E9D5FF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checklistText: {
    fontSize: 16,
    color: '#7C3AED',
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#C4B5FD',
  },
  checklistProgress: {
    fontSize: 12,
    color: '#A855F7',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#7C3AED',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(233, 213, 255, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  modalButtonConfirm: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(233, 213, 255, 0.3)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: '#8B5CF6',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#8B5CF6',
  },
  checklistItemInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(233, 213, 255, 0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  checklistItemText: {
    fontSize: 14,
    color: '#7C3AED',
    flex: 1,
  },
  removeItemButton: {
    fontSize: 18,
    color: '#EC4899',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  addItemContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addItemInput: {
    flex: 1,
    marginBottom: 0,
  },
  addItemButton: {
    width: 44,
    height: 44,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addItemButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
