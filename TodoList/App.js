import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [inputText, setInputText] = useState('');

  // โหลดข้อมูล todos เมื่อเปิดแอป
  useEffect(() => {
    loadTodos();
  }, []);

  // โหลดข้อมูลจาก AsyncStorage
  const loadTodos = async () => {
    try {
      const storedTodos = await AsyncStorage.getItem('todos');
      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  // บันทึกข้อมูลลง AsyncStorage
  const saveTodos = async (newTodos) => {
    try {
      await AsyncStorage.setItem('todos', JSON.stringify(newTodos));
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  };

  // เพิ่ม todo ใหม่
  const addTodo = () => {
    if (inputText.trim() === '') {
      Alert.alert('เฮ้ย!', 'พิมพ์อะไรสักอย่างสิไอ้เสี่ย! 😅');
      return;
    }

    const newTodo = {
      id: Date.now().toString(),
      text: inputText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
    setInputText('');
    Keyboard.dismiss();
  };

  // ลบ todo
  const deleteTodo = (id) => {
    Alert.alert(
      'ลบ Todo',
      'แน่ใจมั้ยว่าจะลบ? 🗑️',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบเลย!',
          style: 'destructive',
          onPress: () => {
            const updatedTodos = todos.filter(todo => todo.id !== id);
            setTodos(updatedTodos);
            saveTodos(updatedTodos);
          },
        },
      ]
    );
  };

  // เปลี่ยนสถานะเสร็จ/ไม่เสร็จ
  const toggleTodo = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  // ลบ todos ที่เสร็จแล้วทั้งหมด
  const clearCompleted = () => {
    const completedTodos = todos.filter(todo => todo.completed);
    if (completedTodos.length === 0) {
      Alert.alert('ไม่มีอะไรให้ลบ', 'ยังไม่มี todo ที่เสร็จเลย! 😊');
      return;
    }

    Alert.alert(
      'ลบงานที่เสร็จแล้ว',
      `จะลบ ${completedTodos.length} งานที่เสร็จแล้ว ใช่มั้ย?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบเลย!',
          style: 'destructive',
          onPress: () => {
            const updatedTodos = todos.filter(todo => !todo.completed);
            setTodos(updatedTodos);
            saveTodos(updatedTodos);
          },
        },
      ]
    );
  };

  // นับสถิติ
  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;
  const remainingCount = totalCount - completedCount;

  // Component แสดง todo แต่ละรายการ
  const TodoItem = ({ item }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity
        style={styles.todoContent}
        onPress={() => toggleTodo(item.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.checkbox,
          item.completed && styles.checkboxCompleted
        ]}>
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[
          styles.todoText,
          item.completed && styles.todoTextCompleted
        ]}>
          {item.text}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTodo(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  // Component ว่างเปล่า
  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyText}>ยังไม่มี Todo เลย!</Text>
      <Text style={styles.emptySubtext}>เพิ่มงานแรกกันเถอะ! 🚀</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4834d4" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Todo List</Text>
        <Text style={styles.headerSubtitle}>จัดการงานแบบโปร! 🔥</Text>
      </View>

      {/* สถิติ */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>ทั้งหมด</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.pendingNumber]}>{remainingCount}</Text>
          <Text style={styles.statLabel}>เหลือ</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.completedNumber]}>{completedCount}</Text>
          <Text style={styles.statLabel}>เสร็จแล้ว</Text>
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="เพิ่มงานใหม่... 💡"
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={addTodo}
          returnKeyType="done"
          multiline={false}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addTodo}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Todo List */}
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TodoItem item={item} />}
        style={styles.todoList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={todos.length === 0 ? styles.emptyListContent : null}
      />

      {/* Actions */}
      {completedCount > 0 && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearCompleted}
            activeOpacity={0.8}
          >
            <Text style={styles.clearButtonText}>
              🧹 ลบงานที่เสร็จแล้ว ({completedCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ by ไอ้เสี่ย</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#4834d4',
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ddd',
    textAlign: 'center',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 15,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pendingNumber: {
    color: '#ff6b6b',
  },
  completedNumber: {
    color: '#2ecc71',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#4834d4',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 20,
  },
  todoList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  todoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 15,
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
});