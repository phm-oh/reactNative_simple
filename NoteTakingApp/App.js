import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Share,
  Dimensions,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Categories/Tags ที่มีให้เลือก
const DEFAULT_CATEGORIES = [
  { id: 'personal', name: 'ส่วนตัว', icon: '👤', color: '#3498db' },
  { id: 'work', name: 'งาน', icon: '💼', color: '#e74c3c' },
  { id: 'study', name: 'เรียน', icon: '📚', color: '#9b59b6' },
  { id: 'idea', name: 'ไอเดีย', icon: '💡', color: '#f39c12' },
  { id: 'todo', name: 'สิ่งที่ต้องทำ', icon: '✅', color: '#2ecc71' },
  { id: 'journal', name: 'ไดอารี่', icon: '📔', color: '#e67e22' },
  { id: 'recipe', name: 'สูตรอาหาร', icon: '🍳', color: '#1abc9c' },
  { id: 'travel', name: 'ท่องเที่ยว', icon: '✈️', color: '#34495e' },
  { id: 'other', name: 'อื่นๆ', icon: '📝', color: '#95a5a6' },
];

export default function NoteTakingApp() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [storedPin, setStoredPin] = useState(null);

  // Form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('personal');
  const [noteTags, setNoteTags] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  useEffect(() => {
    loadNotes();
    loadSettings();
    checkPinProtection();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchText, selectedCategory]);

  // โหลดข้อมูล notes
  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem('notes_data');
      if (stored) {
        const parsedNotes = JSON.parse(stored);
        setNotes(parsedNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  // บันทึกข้อมูล notes
  const saveNotes = async (newNotes) => {
    try {
      await AsyncStorage.setItem('notes_data', JSON.stringify(newNotes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  // โหลดการตั้งค่า
  const loadSettings = async () => {
    try {
      const darkMode = await AsyncStorage.getItem('dark_mode');
      const pin = await AsyncStorage.getItem('app_pin');
      
      if (darkMode) {
        setIsDarkMode(JSON.parse(darkMode));
      }
      if (pin) {
        setStoredPin(pin);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // บันทึกการตั้งค่า
  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('dark_mode', JSON.stringify(isDarkMode));
      if (storedPin) {
        await AsyncStorage.setItem('app_pin', storedPin);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // เช็คการป้องกันด้วย PIN
  const checkPinProtection = async () => {
    try {
      const pin = await AsyncStorage.getItem('app_pin');
      if (pin) {
        setStoredPin(pin);
        setIsLocked(true);
        setShowPinModal(true);
      }
    } catch (error) {
      console.error('Error checking PIN:', error);
    }
  };

  // ตั้งค่า PIN
  const setupPin = () => {
    Alert.prompt(
      'ตั้งค่า PIN',
      'ใส่ PIN 4 หลักเพื่อป้องกันแอป (ถ้าไม่ต้องการใส่เว้นว่าง)',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ตั้งค่า',
          onPress: async (pin) => {
            if (pin && pin.length === 4 && /^\d{4}$/.test(pin)) {
              setStoredPin(pin);
              await AsyncStorage.setItem('app_pin', pin);
              Alert.alert('สำเร็จ! 🔒', 'ตั้งค่า PIN เรียบร้อยแล้ว');
            } else if (!pin || pin.trim() === '') {
              setStoredPin(null);
              await AsyncStorage.removeItem('app_pin');
              Alert.alert('ลบ PIN แล้ว! 🔓', 'ไม่มีการป้องกันด้วย PIN');
            } else {
              Alert.alert('ผิดพลาด', 'PIN ต้องเป็นตัวเลข 4 หลัก');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // ตรวจสอบ PIN
  const verifyPin = () => {
    if (pinInput === storedPin) {
      setIsLocked(false);
      setShowPinModal(false);
      setPinInput('');
    } else {
      Alert.alert('PIN ผิด!', 'กรุณาใส่ PIN ให้ถูกต้อง');
      setPinInput('');
    }
  };

  // กรองข้อมูล notes
  const filterNotes = () => {
    let filtered = notes;

    // กรองตามการค้นหา
    if (searchText.trim()) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchText.toLowerCase()) ||
        note.content.toLowerCase().includes(searchText.toLowerCase()) ||
        note.tags.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // กรองตามหมวดหมู่
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'important') {
        filtered = filtered.filter(note => note.isImportant);
      } else {
        filtered = filtered.filter(note => note.category === selectedCategory);
      }
    }

    // เรียงตามความสำคัญและวันที่
    filtered.sort((a, b) => {
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    setFilteredNotes(filtered);
  };

  // เพิ่ม/แก้ไข note
  const saveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและเนื้อหา! 📝');
      return;
    }

    const now = new Date().toISOString();
    const noteData = {
      id: editingNote ? editingNote.id : Date.now().toString(),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      category: noteCategory,
      tags: noteTags.trim(),
      isImportant,
      createdAt: editingNote ? editingNote.createdAt : now,
      updatedAt: now,
    };

    let updatedNotes;
    if (editingNote) {
      updatedNotes = notes.map(note => 
        note.id === editingNote.id ? noteData : note
      );
      Alert.alert('อัปเดตแล้ว! ✅', 'แก้ไข note เรียบร้อยแล้ว');
    } else {
      updatedNotes = [noteData, ...notes];
      Alert.alert('บันทึกแล้ว! ✅', 'เพิ่ม note ใหม่เรียบร้อยแล้ว');
    }

    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
    closeModal();
  };

  // ลบ note
  const deleteNote = (noteId) => {
    Alert.alert(
      'ลบ Note',
      'แน่ใจมั้ยว่าจะลบ note นี้? 🗑️',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบเลย!',
          style: 'destructive',
          onPress: async () => {
            const updatedNotes = notes.filter(note => note.id !== noteId);
            setNotes(updatedNotes);
            await saveNotes(updatedNotes);
            Alert.alert('ลบแล้ว! 🗑️', 'ลบ note เรียบร้อยแล้ว');
          },
        },
      ]
    );
  };

  // แชร์ note
  const shareNote = async (note) => {
    try {
      const category = DEFAULT_CATEGORIES.find(cat => cat.id === note.category);
      const shareContent = `📝 ${note.title}\n\n${note.content}\n\n` +
        `🏷️ หมวดหมู่: ${category ? category.name : 'ไม่ระบุ'}\n` +
        `${note.tags ? `🔖 แท็ก: ${note.tags}\n` : ''}` +
        `📅 อัปเดต: ${new Date(note.updatedAt).toLocaleDateString('th-TH')}\n\n` +
        `📱 สร้างจาก Note Taking App`;

      await Share.share({
        message: shareContent,
        title: note.title,
      });
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };

  // เปิด modal เพื่อแก้ไข
  const editNote = (note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCategory(note.category);
    setNoteTags(note.tags);
    setIsImportant(note.isImportant);
    setModalVisible(true);
  };

  // เปิด modal เพื่อเพิ่มใหม่
  const createNewNote = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('personal');
    setNoteTags('');
    setIsImportant(false);
    setModalVisible(true);
  };

  // ปิด modal
  const closeModal = () => {
    setModalVisible(false);
    setEditingNote(null);
  };

  // toggle Dark Mode
  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    await AsyncStorage.setItem('dark_mode', JSON.stringify(newDarkMode));
  };

  // จัดรูปแบบวันที่
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // หาหมวดหมู่ตาม ID
  const getCategoryById = (categoryId) => {
    return DEFAULT_CATEGORIES.find(cat => cat.id === categoryId) || DEFAULT_CATEGORIES[8];
  };

  // สีธีม
  const theme = {
    background: isDarkMode ? '#1a1a1a' : '#f8f9fa',
    surface: isDarkMode ? '#2d2d2d' : '#ffffff',
    primary: isDarkMode ? '#4a9eff' : '#3498db',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    textSecondary: isDarkMode ? '#cccccc' : '#7f8c8d',
    border: isDarkMode ? '#404040' : '#ecf0f1',
    accent: isDarkMode ? '#ff6b6b' : '#e74c3c',
  };

  // Component: Note Item
  const NoteItem = ({ item }) => {
    const category = getCategoryById(item.category);
    
    return (
      <View style={[styles.noteItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          style={styles.noteContent}
          onPress={() => editNote(item)}
          activeOpacity={0.7}
        >
          <View style={styles.noteHeader}>
            <View style={styles.noteTitleRow}>
              <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>
                {item.isImportant && '⭐ '}{item.title}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
              </View>
            </View>
            <Text style={[styles.noteDate, { color: theme.textSecondary }]}>
              {formatDate(item.updatedAt)}
            </Text>
          </View>
          
          <Text style={[styles.notePreview, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.content}
          </Text>
          
          {item.tags && (
            <Text style={[styles.noteTags, { color: theme.primary }]} numberOfLines={1}>
              🔖 {item.tags}
            </Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.noteActions}>
          <TouchableOpacity onPress={() => shareNote(item)} style={styles.actionButton}>
            <Text style={styles.actionIcon}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteNote(item.id)} style={styles.actionButton}>
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Component: Category Filter
  const CategoryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
      <TouchableOpacity
        style={[
          styles.categoryFilterItem,
          { backgroundColor: selectedCategory === 'all' ? theme.primary : theme.surface },
          { borderColor: theme.border }
        ]}
        onPress={() => setSelectedCategory('all')}
      >
        <Text style={[
          styles.categoryFilterText,
          { color: selectedCategory === 'all' ? '#fff' : theme.text }
        ]}>
          🗂️ ทั้งหมด
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.categoryFilterItem,
          { backgroundColor: selectedCategory === 'important' ? theme.accent : theme.surface },
          { borderColor: theme.border }
        ]}
        onPress={() => setSelectedCategory('important')}
      >
        <Text style={[
          styles.categoryFilterText,
          { color: selectedCategory === 'important' ? '#fff' : theme.text }
        ]}>
          ⭐ สำคัญ
        </Text>
      </TouchableOpacity>
      
      {DEFAULT_CATEGORIES.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryFilterItem,
            { backgroundColor: selectedCategory === category.id ? category.color : theme.surface },
            { borderColor: theme.border }
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Text style={[
            styles.categoryFilterText,
            { color: selectedCategory === category.id ? '#fff' : theme.text }
          ]}>
            {category.icon} {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Component: Empty State
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>ยังไม่มี Note เลย!</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        เริ่มเขียน note แรกกันเถอะ! ✨
      </Text>
    </View>
  );

  // PIN Modal
  if (showPinModal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.pinContainer}>
          <Text style={styles.pinTitle}>🔒</Text>
          <Text style={[styles.pinSubtitle, { color: theme.text }]}>
            ใส่ PIN เพื่อเข้าใช้งาน
          </Text>
          <TextInput
            style={[styles.pinInput, { backgroundColor: theme.surface, color: theme.text }]}
            placeholder="PIN 4 หลัก"
            placeholderTextColor={theme.textSecondary}
            value={pinInput}
            onChangeText={setPinInput}
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.pinButton, { backgroundColor: theme.primary }]}
            onPress={verifyPin}
            disabled={pinInput.length !== 4}
          >
            <Text style={styles.pinButtonText}>เข้าใช้งาน</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>📝 My Notes</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {filteredNotes.length} notes
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleDarkMode} style={styles.headerButton}>
            <Text style={styles.headerButtonIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={setupPin} style={styles.headerButton}>
            <Text style={styles.headerButtonIcon}>🔒</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="ค้นหา notes... 🔍"
          placeholderTextColor={theme.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
      </View>

      {/* Category Filter */}
      <CategoryFilter />

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NoteItem item={item} />}
        style={styles.notesList}
        contentContainerStyle={filteredNotes.length === 0 ? styles.emptyContent : null}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyState}
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={createNewNote}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>✏️</Text>
      </TouchableOpacity>

      {/* Edit/Create Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
          
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={[styles.modalHeaderButton, { color: theme.textSecondary }]}>ยกเลิก</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingNote ? 'แก้ไข Note' : 'เขียน Note ใหม่'}
            </Text>
            <TouchableOpacity onPress={saveNote}>
              <Text style={[styles.modalHeaderButton, { color: theme.primary }]}>บันทึก</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <Text style={[styles.inputLabel, { color: theme.text }]}>ชื่อเรื่อง:</Text>
            <TextInput
              style={[styles.titleInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="ใส่ชื่อเรื่อง..."
              placeholderTextColor={theme.textSecondary}
              value={noteTitle}
              onChangeText={setNoteTitle}
              autoFocus={!editingNote}
            />

            {/* Category Selection */}
            <Text style={[styles.inputLabel, { color: theme.text }]}>หมวดหมู่:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
              {DEFAULT_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    { 
                      backgroundColor: noteCategory === category.id ? category.color : theme.surface,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => setNoteCategory(category.id)}
                >
                  <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryOptionText,
                    { color: noteCategory === category.id ? '#fff' : theme.text }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Content Input */}
            <Text style={[styles.inputLabel, { color: theme.text }]}>เนื้อหา:</Text>
            <TextInput
              style={[styles.contentInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="เขียนเนื้อหา note ของคุณ..."
              placeholderTextColor={theme.textSecondary}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
            />

            {/* Tags Input */}
            <Text style={[styles.inputLabel, { color: theme.text }]}>แท็ก:</Text>
            <TextInput
              style={[styles.tagsInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="แท็ก (คั่นด้วยเครื่องหมายจุลภาค)"
              placeholderTextColor={theme.textSecondary}
              value={noteTags}
              onChangeText={setNoteTags}
            />

            {/* Important Toggle */}
            <View style={styles.importantContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>⭐ ทำเครื่องหมายว่าสำคัญ</Text>
              <Switch
                value={isImportant}
                onValueChange={setIsImportant}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={isImportant ? '#fff' : '#f4f3f4'}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
    padding: 8,
  },
  headerButtonIcon: {
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoryFilter: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  categoryFilterItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  noteItem: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    flexDirection: 'row',
  },
  noteContent: {
    flex: 1,
  },
  noteHeader: {
    marginBottom: 8,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  categoryBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 14,
  },
  noteDate: {
    fontSize: 12,
  },
  notePreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteTags: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  noteActions: {
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  actionButton: {
    padding: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalHeaderButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  categorySelector: {
    marginBottom: 10,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryOptionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    height: 200,
  },
  tagsInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  importantContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  pinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  pinTitle: {
    fontSize: 60,
    marginBottom: 20,
  },
  pinSubtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  pinInput: {
    width: 200,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 8,
  },
  pinButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  pinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});