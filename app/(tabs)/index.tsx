import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useSubscription } from '../../contexts/SubscriptionContext';
import Paywall from '../../components/Paywall';

type GoalType = 'progress' | 'checklist' | 'yesno' | 'numeric';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}


const FREE_AFFIRMATION_LIMIT = 5;

export default function AffirmationsScreen() {
  const router = useRouter();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const [affirmations, setAffirmations] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [newAffirmationText, setNewAffirmationText] = useState('');

  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalType, setNewGoalType] = useState<GoalType>('progress');
  const [newGoalTarget, setNewGoalTarget] = useState('100');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [goalLoading, setGoalLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const affirmationsResult = await supabase
        .from('affirmations')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (affirmationsResult.error) throw affirmationsResult.error;
      setAffirmations(affirmationsResult.data || []);

      const goalsResult = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsResult.error) throw goalsResult.error;
      setGoals(goalsResult.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAffirmation = async (id: string) => {
    Alert.alert('Delete Affirmation', 'Are you sure you want to delete this affirmation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('affirmations').delete().eq('id', id);
            if (error) throw error;
            await loadData();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete affirmation');
          }
        },
      },
    ]);
  };

  const handleEditAffirmation = (affirmation: any) => {
    setEditingItem(affirmation);
    setEditText(affirmation.text);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }
    if (!editingItem?.id) {
      Alert.alert('Error', 'Could not identify which affirmation to update.');
      return;
    }

    setSavingEdit(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('affirmations')
        .update({ text: editText.trim() })
        .eq('id', editingItem.id)
        .eq('user_id', session.user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('This affirmation could not be updated. It may have been deleted.');
      }

      setAffirmations((prev) =>
        prev.map((a) => (a.id === editingItem.id ? { ...a, ...data[0] } : a))
      );

      setEditModalVisible(false);
      setEditingItem(null);
      setEditText('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddAffirmation = async () => {
    if (!newAffirmationText.trim()) {
      Alert.alert('Error', 'Please enter an affirmation');
      return;
    }

    if (!isPremium && affirmations.length >= FREE_AFFIRMATION_LIMIT) {
      setShowPaywall(true);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('affirmations')
        .insert({
          user_id: session.user.id,
          text: newAffirmationText.trim(),
          timestamp: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      setNewAffirmationText('');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add affirmation');
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
            await loadData();
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
      await loadData();
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
      await loadData();
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
        .update({ milestones: updatedMilestones, current: completedCount })
        .eq('id', goal.id);
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update checklist');
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklistItems([
      ...checklistItems,
      { id: Date.now().toString(), text: newChecklistItem.trim(), completed: false },
    ]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
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

    setGoalLoading(true);
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
      setShowAddGoalModal(false);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add goal');
    } finally {
      setGoalLoading(false);
    }
  };

  const renderGoalRow = (goal: any) => {
    const progress = goal.target ? (goal.current / goal.target) * 100 : 0;
    return (
      <View key={goal.id} style={styles.goalRow}>
        <View style={styles.goalRowHeader}>
          <View style={styles.goalRowLeft}>
            <View style={styles.goalIcon}>
              <Ionicons name="flag-outline" size={15} color="#7C4DEE" />
            </View>
            <View style={styles.goalRowText}>
              <Text style={styles.goalRowTitle} numberOfLines={1}>{goal.title}</Text>
              <Text style={styles.goalRowType}>
                {goal.type === 'progress' && 'Progress'}
                {goal.type === 'checklist' && 'Checklist'}
                {goal.type === 'yesno' && 'Yes/No'}
                {goal.type === 'numeric' && 'Numeric'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)} style={styles.goalDelete}>
            <Ionicons name="trash-outline" size={15} color="#A39BAE" />
          </TouchableOpacity>
        </View>

        {goal.type === 'progress' && (
          <View style={styles.goalProgressRow}>
            <View style={styles.miniProgressBar}>
              <View style={[styles.miniProgressFill, { width: `${Math.min(100, progress)}%` }]} />
            </View>
            <Text style={styles.goalProgressText}>{Math.round(progress)}%</Text>
            <View style={styles.goalStepButtons}>
              <TouchableOpacity style={styles.goalStepBtn} onPress={() => handleUpdateProgress(goal, -1)}>
                <Text style={styles.goalStepBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.goalStepBtn} onPress={() => handleUpdateProgress(goal, 1)}>
                <Text style={styles.goalStepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {goal.type === 'yesno' && (
          <TouchableOpacity
            style={[styles.goalYesNo, goal.current === 1 && styles.goalYesNoDone]}
            onPress={() => handleToggleYesNo(goal)}
          >
            <Text style={[styles.goalYesNoText, goal.current === 1 && styles.goalYesNoTextDone]}>
              {goal.current === 1 ? 'Completed' : 'Mark Complete'}
            </Text>
          </TouchableOpacity>
        )}

        {goal.type === 'numeric' && (
          <View style={styles.goalProgressRow}>
            <Text style={styles.goalNumericValue}>{goal.current} / {goal.target}</Text>
            <View style={styles.miniProgressBar}>
              <View style={[styles.miniProgressFill, { width: `${Math.min(100, progress)}%` }]} />
            </View>
            <View style={styles.goalStepButtons}>
              <TouchableOpacity style={styles.goalStepBtn} onPress={() => handleUpdateProgress(goal, -1)}>
                <Text style={styles.goalStepBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.goalStepBtn} onPress={() => handleUpdateProgress(goal, 1)}>
                <Text style={styles.goalStepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {goal.type === 'checklist' && (
          <View>
            {(goal.milestones || []).map((item: ChecklistItem) => (
              <TouchableOpacity
                key={item.id}
                style={styles.goalChecklistItem}
                onPress={() => handleToggleChecklistItem(goal, item.id)}
              >
                <View style={[styles.goalCheckbox, item.completed && styles.goalCheckboxChecked]}>
                  {item.completed && <Text style={styles.goalCheckmark}>✓</Text>}
                </View>
                <Text style={[styles.goalChecklistText, item.completed && styles.goalChecklistTextDone]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.goalChecklistProgress}>{goal.current} of {goal.target} done</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#FFFFFF', '#F6F2FF', '#EDE5FF']} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.headerIconRow}>
            <View style={styles.headerIcon}><Ionicons name="person-outline" size={20} color="#33215E" /></View>
            <View style={styles.notificationIcon}><Ionicons name="notifications-outline" size={20} color="#33215E" /><View style={styles.notificationDot} /></View>
          </View>
          <View style={styles.brandMark}><Ionicons name="sparkles" size={30} color="#9B6DFF" /></View>
          <Text style={styles.title}>NextSelf</Text>
          <Text style={styles.subtitle}>Your AI Partner in Growth</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* My Affirmations Section */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}><Ionicons name="sparkles-outline" size={18} color="#7C4DEE" /></View>
                <Text style={styles.sectionTitle}>My Affirmations</Text>
              </View>
              <Text style={styles.sectionCount}>{affirmations.length}</Text>
            </View>

            <View style={styles.scrollBox}>
              {affirmations.length === 0 ? (
                <View style={styles.innerEmpty}>
                  <Ionicons name="sparkles-outline" size={36} color="#C9B8F0" />
                  <Text style={styles.innerEmptyText}>No affirmations yet</Text>
                  <Text style={styles.innerEmptySub}>Add your first one below</Text>
                </View>
              ) : (
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBoxContent}>
                  {affirmations.map((affirmation) => (
                    <View key={affirmation.id} style={styles.affirmationRow}>
                      <Ionicons name="sparkles" size={18} color="#9B6DFF" />
                      <Text style={styles.affirmationText}>{affirmation.text}</Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => handleEditAffirmation(affirmation)} style={styles.cardAction}>
                          <Ionicons name="create-outline" size={16} color="#A39BAE" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteAffirmation(affirmation.id)} style={styles.cardAction}>
                          <Ionicons name="trash-outline" size={16} color="#A39BAE" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.addInlineRow}>
              <TextInput
                style={styles.addInlineInput}
                value={newAffirmationText}
                onChangeText={setNewAffirmationText}
                placeholder="Write an affirmation..."
                placeholderTextColor="#B5A8D0"
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.addInlineBtn, !newAffirmationText.trim() && styles.addInlineBtnDisabled]}
                onPress={handleAddAffirmation}
                disabled={!newAffirmationText.trim()}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Goals Section — premium only */}
          {isPremium && (
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionIcon}><Ionicons name="flag-outline" size={18} color="#7C4DEE" /></View>
                  <Text style={styles.sectionTitle}>Today's Goals</Text>
                </View>
                <Text style={styles.sectionCount}>{goals.length}</Text>
              </View>

              <View style={styles.scrollBox}>
                {goals.length === 0 ? (
                  <View style={styles.innerEmpty}>
                    <Ionicons name="flag-outline" size={36} color="#C9B8F0" />
                    <Text style={styles.innerEmptyText}>No goals yet</Text>
                    <Text style={styles.innerEmptySub}>Add your first one below</Text>
                  </View>
                ) : (
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBoxContent}>
                    {goals.map(renderGoalRow)}
                  </ScrollView>
                )}
              </View>

              <TouchableOpacity style={styles.addGoalBtn} onPress={() => setShowAddGoalModal(true)}>
                <Ionicons name="add-circle-outline" size={20} color="#7C4DEE" />
                <Text style={styles.addGoalBtnText}>Add New Goal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* AI Coach shortcut — premium only */}
          {isPremium && (
            <TouchableOpacity style={styles.coachCard} onPress={() => router.push('/(tabs)/chat')} activeOpacity={0.85}>
              <View style={styles.coachLeft}>
                <View style={styles.coachIcon}><Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" /></View>
                <View>
                  <Text style={styles.coachTitle}>AI Coach</Text>
                  <Text style={styles.coachSub}>Talk to your wellness guide</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#B5A8D0" />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Paywall Modal — shown when free user hits affirmation limit */}
        <Modal
          visible={showPaywall}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPaywall(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.paywallOverlay}
            onPress={() => setShowPaywall(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <Paywall featureLabel="Unlimited affirmations" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Edit Affirmation Modal */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Edit Affirmation</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Affirmation Text</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={editText}
                      onChangeText={setEditText}
                      placeholder="Enter affirmation"
                      multiline
                      maxLength={500}
                    />
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButtonCancel}
                      onPress={() => { setEditModalVisible(false); setEditingItem(null); setEditText(''); }}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleSaveEdit} disabled={savingEdit}>
                      <LinearGradient colors={['#7C4DEE', '#9B6DFF']} style={styles.buttonGradient}>
                        <Text style={styles.buttonText}>{savingEdit ? 'Saving...' : 'Save'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

        {/* Add Goal Modal */}
        <Modal
          visible={showAddGoalModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddGoalModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalOverlay}
              onPress={() => { setShowAddGoalModal(false); setNewGoalTitle(''); setNewGoalDescription(''); }}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>New Goal</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput style={styles.input} value={newGoalTitle} onChangeText={setNewGoalTitle} placeholder="Enter goal title" />
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
                      <TouchableOpacity style={[styles.typeButton, newGoalType === 'progress' && styles.typeButtonActive]} onPress={() => setNewGoalType('progress')}>
                        <Text style={[styles.typeButtonText, newGoalType === 'progress' && styles.typeButtonTextActive]}>% Progress</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.typeButton, newGoalType === 'numeric' && styles.typeButtonActive]} onPress={() => setNewGoalType('numeric')}>
                        <Text style={[styles.typeButtonText, newGoalType === 'numeric' && styles.typeButtonTextActive]}>Numeric</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.typeButton, newGoalType === 'yesno' && styles.typeButtonActive]} onPress={() => setNewGoalType('yesno')}>
                        <Text style={[styles.typeButtonText, newGoalType === 'yesno' && styles.typeButtonTextActive]}>Yes/No</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.typeButton, newGoalType === 'checklist' && styles.typeButtonActive]} onPress={() => setNewGoalType('checklist')}>
                        <Text style={[styles.typeButtonText, newGoalType === 'checklist' && styles.typeButtonTextActive]}>Checklist</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {newGoalType === 'numeric' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Target Number</Text>
                      <TextInput style={styles.input} value={newGoalTarget} onChangeText={setNewGoalTarget} placeholder="Enter target number" keyboardType="numeric" />
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
                        <TouchableOpacity style={styles.addItemButton} onPress={addChecklistItem}>
                          <Text style={styles.addItemButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButtonCancel}
                      onPress={() => {
                        setShowAddGoalModal(false);
                        setNewGoalTitle(''); setNewGoalDescription(''); setNewGoalType('progress');
                        setNewGoalTarget('100'); setChecklistItems([]); setNewChecklistItem('');
                      }}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleAddGoal} disabled={goalLoading}>
                      <LinearGradient colors={['#7C4DEE', '#9B6DFF']} style={styles.buttonGradient}>
                        <Text style={styles.buttonText}>{goalLoading ? 'Adding...' : 'Add Goal'}</Text>
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

const PURPLE = '#7C4DEE';
const PURPLE_LIGHT = '#9B6DFF';
const INK = '#33215E';
const INK_SOFT = '#6B6480';
const BORDER = '#EDE5FF';

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: 'center',
  },
  headerIconRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  notificationIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    borderWidth: 1, borderColor: BORDER,
  },
  notificationDot: {
    position: 'absolute', top: 8, right: 8,
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: PURPLE,
  },
  brandMark: { marginBottom: -2 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '700', color: PURPLE },
  subtitle: { fontSize: 13, color: INK_SOFT, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 130 },

  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#7C4DEE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F4EEFF',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: INK },
  sectionCount: {
    fontSize: 13, fontWeight: '600', color: PURPLE,
    backgroundColor: '#F4EEFF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
    overflow: 'hidden',
  },

  scrollBox: {
    height: 220,
    backgroundColor: '#FAF7FF',
    borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden',
  },
  scrollBoxContent: { padding: 10, paddingBottom: 14 },
  innerEmpty: { alignItems: 'center', justifyContent: 'center', height: '100%', paddingHorizontal: 20 },
  innerEmptyText: { fontSize: 15, fontWeight: '600', color: INK, marginTop: 8 },
  innerEmptySub: { fontSize: 13, color: INK_SOFT, marginTop: 2 },

  affirmationRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  affirmationText: {
    flex: 1, fontSize: 14, fontWeight: '500', color: INK,
    lineHeight: 20, marginHorizontal: 10,
  },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  cardAction: { padding: 4, marginLeft: 4 },

  addInlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  addInlineInput: {
    flex: 1, backgroundColor: '#FAF7FF',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 14, color: INK,
    borderWidth: 1, borderColor: BORDER,
  },
  addInlineBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  addInlineBtnDisabled: { opacity: 0.4 },

  goalRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  goalRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  goalIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F4EEFF',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  goalRowText: { flex: 1 },
  goalRowTitle: { fontSize: 14, fontWeight: '600', color: INK },
  goalRowType: { fontSize: 11, color: PURPLE, marginTop: 2 },
  goalDelete: { padding: 4 },

  goalProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniProgressBar: {
    flex: 1, height: 6, backgroundColor: '#EDE5FF', borderRadius: 3, overflow: 'hidden',
  },
  miniProgressFill: { height: '100%', backgroundColor: PURPLE, borderRadius: 3 },
  goalProgressText: { fontSize: 12, fontWeight: '600', color: PURPLE, minWidth: 34 },
  goalStepButtons: { flexDirection: 'row', gap: 6 },
  goalStepBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#F4EEFF',
    alignItems: 'center', justifyContent: 'center',
  },
  goalStepBtnText: { fontSize: 16, fontWeight: '700', color: PURPLE },

  goalYesNo: {
    backgroundColor: '#F4EEFF', paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  goalYesNoDone: { backgroundColor: PURPLE },
  goalYesNoText: { fontSize: 13, fontWeight: '600', color: PURPLE },
  goalYesNoTextDone: { color: '#FFFFFF' },

  goalNumericValue: { fontSize: 14, fontWeight: '700', color: PURPLE, minWidth: 50 },

  goalChecklistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  goalCheckbox: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 2, borderColor: BORDER,
    marginRight: 8, alignItems: 'center', justifyContent: 'center',
  },
  goalCheckboxChecked: { backgroundColor: PURPLE, borderColor: PURPLE },
  goalCheckmark: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  goalChecklistText: { fontSize: 13, color: INK, flex: 1 },
  goalChecklistTextDone: { textDecorationLine: 'line-through', color: '#B5A8D0' },
  goalChecklistProgress: { fontSize: 11, color: INK_SOFT, marginTop: 4, textAlign: 'right' },

  addGoalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 12, paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#F4EEFF', gap: 8,
  },
  addGoalBtnText: { fontSize: 14, fontWeight: '600', color: PURPLE },

  coachCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#7C4DEE', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  coachLeft: { flexDirection: 'row', alignItems: 'center' },
  coachIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: PURPLE,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  coachTitle: { fontSize: 16, fontWeight: '700', color: INK },
  coachSub: { fontSize: 13, color: INK_SOFT, marginTop: 2 },

  paywallOverlay: { flex: 1, backgroundColor: 'rgba(50,30,90,0.5)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(50,30,90,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: INK, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: INK, marginBottom: 8 },
  input: {
    backgroundColor: '#FAF7FF', borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, padding: 12, fontSize: 16, color: INK,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButtonCancel: {
    flex: 1, padding: 16, backgroundColor: '#F4EEFF', borderRadius: 14, alignItems: 'center',
  },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: PURPLE },
  modalButtonConfirm: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  buttonGradient: { padding: 16, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  typeSelector: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeButton: {
    minWidth: '47%', paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: '#FAF7FF', borderRadius: 10, borderWidth: 2, borderColor: 'transparent',
  },
  typeButtonActive: { backgroundColor: '#F4EEFF', borderColor: PURPLE },
  typeButtonText: { fontSize: 14, fontWeight: '600', color: INK, textAlign: 'center' },
  typeButtonTextActive: { color: PURPLE },
  checklistItemInput: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FAF7FF', padding: 12, borderRadius: 10, marginBottom: 8,
  },
  checklistItemText: { fontSize: 14, color: INK, flex: 1 },
  removeItemButton: { fontSize: 18, color: PURPLE_LIGHT, fontWeight: 'bold', paddingHorizontal: 8 },
  addItemContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addItemInput: { flex: 1, marginBottom: 0 },
  addItemButton: {
    width: 44, height: 44, backgroundColor: PURPLE, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  addItemButtonText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
});
