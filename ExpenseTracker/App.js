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
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// หมวดหมู่เริ่มต้น
const DEFAULT_CATEGORIES = {
  income: [
    { id: 'salary', name: 'เงินเดือน', icon: '💰', color: '#2ecc71' },
    { id: 'bonus', name: 'โบนัส', icon: '🎁', color: '#27ae60' },
    { id: 'investment', name: 'การลงทุน', icon: '📈', color: '#16a085' },
    { id: 'other_income', name: 'อื่นๆ', icon: '💵', color: '#1abc9c' },
  ],
  expense: [
    { id: 'food', name: 'อาหาร', icon: '🍕', color: '#e74c3c' },
    { id: 'transport', name: 'ค่าเดินทาง', icon: '🚗', color: '#f39c12' },
    { id: 'shopping', name: 'ซื้อของ', icon: '🛍️', color: '#9b59b6' },
    { id: 'bills', name: 'ค่าบิล', icon: '📄', color: '#34495e' },
    { id: 'health', name: 'สุขภาพ', icon: '⚕️', color: '#e67e22' },
    { id: 'entertainment', name: 'บันเทิง', icon: '🎬', color: '#8e44ad' },
    { id: 'education', name: 'การศึกษา', icon: '📚', color: '#3498db' },
    { id: 'other_expense', name: 'อื่นๆ', icon: '💸', color: '#95a5a6' },
  ]
};

export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('overview'); // overview, transactions, stats

  useEffect(() => {
    loadTransactions();
  }, []);

  // โหลดข้อมูลธุรกรรม
  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem('expense_transactions');
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // บันทึกข้อมูลธุรกรรม
  const saveTransactions = async (newTransactions) => {
    try {
      await AsyncStorage.setItem('expense_transactions', JSON.stringify(newTransactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  // เพิ่มธุรกรรมใหม่
  const addTransaction = async () => {
    if (!amount || !selectedCategory || !description.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบถ้วน! 📝');
      return;
    }

    const newTransaction = {
      id: Date.now().toString(),
      type: selectedType,
      amount: parseFloat(amount),
      description: description.trim(),
      category: selectedCategory,
      date: selectedDate.toISOString(),
      timestamp: new Date().toISOString(),
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);

    // รีเซ็ตฟอร์ม
    setAmount('');
    setDescription('');
    setSelectedCategory(null);
    setModalVisible(false);

    Alert.alert(
      'บันทึกสำเร็จ! ✅',
      `เพิ่ม${selectedType === 'income' ? 'รายรับ' : 'รายจ่าย'} ${formatMoney(parseFloat(amount))} บาท`
    );
  };

  // ลบธุรกรรม
  const deleteTransaction = (id) => {
    Alert.alert(
      'ลบรายการ',
      'แน่ใจมั้ยว่าจะลบรายการนี้? 🗑️',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบเลย!',
          style: 'destructive',
          onPress: async () => {
            const updated = transactions.filter(t => t.id !== id);
            setTransactions(updated);
            await saveTransactions(updated);
          },
        },
      ]
    );
  };

  // คำนวณยอดรวม
  const calculateTotals = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, balance };
  };

  // จัดรูปแบบเงิน
  const formatMoney = (amount) => {
    return amount.toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // จัดรูปแบบวันที่
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // หาหมวดหมู่ตาม ID
  const getCategoryById = (categoryId, type) => {
    const categories = DEFAULT_CATEGORIES[type];
    return categories.find(cat => cat.id === categoryId) || { name: 'ไม่ระบุ', icon: '❓', color: '#95a5a6' };
  };

  // คำนวณสถิติหมวดหมู่
  const getCategoryStats = () => {
    const expensesByCategory = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const categoryId = transaction.category;
        if (!expensesByCategory[categoryId]) {
          expensesByCategory[categoryId] = 0;
        }
        expensesByCategory[categoryId] += transaction.amount;
      });

    return Object.entries(expensesByCategory)
      .map(([categoryId, amount]) => ({
        category: getCategoryById(categoryId, 'expense'),
        amount,
        percentage: (amount / calculateTotals().totalExpense) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const { totalIncome, totalExpense, balance } = calculateTotals();

  // Component: Header สถิติ
  const StatsHeader = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, styles.incomeCard]}>
        <Text style={styles.statLabel}>รายรับ</Text>
        <Text style={[styles.statAmount, styles.incomeAmount]}>
          +{formatMoney(totalIncome)}
        </Text>
      </View>
      
      <View style={[styles.statCard, styles.expenseCard]}>
        <Text style={styles.statLabel}>รายจ่าย</Text>
        <Text style={[styles.statAmount, styles.expenseAmount]}>
          -{formatMoney(totalExpense)}
        </Text>
      </View>
      
      <View style={[styles.statCard, balance >= 0 ? styles.positiveCard : styles.negativeCard]}>
        <Text style={styles.statLabel}>คงเหลือ</Text>
        <Text style={[styles.statAmount, balance >= 0 ? styles.positiveAmount : styles.negativeAmount]}>
          {balance >= 0 ? '+' : ''}{formatMoney(balance)}
        </Text>
      </View>
    </View>
  );

  // Component: รายการธุรกรรม
  const TransactionItem = ({ item }) => {
    const category = getCategoryById(item.category, item.type);
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <Text style={styles.categoryEmoji}>{category.icon}</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>{item.description}</Text>
            <Text style={styles.transactionCategory}>{category.name}</Text>
            <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
          </View>
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            item.type === 'income' ? styles.incomeText : styles.expenseText
          ]}>
            {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}
          </Text>
          <TouchableOpacity
            onPress={() => deleteTransaction(item.id)}
            style={styles.deleteButton}
          >
            <Text>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Component: เลือกหมวดหมู่
  const CategorySelector = () => {
    const categories = DEFAULT_CATEGORIES[selectedType];
    
    return (
      <View style={styles.categorySelector}>
        <Text style={styles.modalLabel}>หมวดหมู่:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryOption,
                { borderColor: category.color },
                selectedCategory === category.id && { backgroundColor: category.color }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryOptionText,
                selectedCategory === category.id && styles.categoryOptionTextSelected
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Component: สถิติหมวดหมู่
  const CategoryStats = () => {
    const stats = getCategoryStats();
    
    if (stats.length === 0) {
      return (
        <View style={styles.emptyStats}>
          <Text style={styles.emptyStatsText}>ยังไม่มีข้อมูลรายจ่าย 📊</Text>
        </View>
      );
    }

    return (
      <View style={styles.categoryStats}>
        <Text style={styles.sectionTitle}>สถิติรายจ่ายตามหมวดหมู่</Text>
        {stats.map((stat, index) => (
          <View key={index} style={styles.categoryStatItem}>
            <View style={styles.categoryStatLeft}>
              <View style={[styles.categoryStatIcon, { backgroundColor: stat.category.color }]}>
                <Text>{stat.category.icon}</Text>
              </View>
              <Text style={styles.categoryStatName}>{stat.category.name}</Text>
            </View>
            <View style={styles.categoryStatRight}>
              <Text style={styles.categoryStatAmount}>{formatMoney(stat.amount)} บาท</Text>
              <Text style={styles.categoryStatPercent}>{stat.percentage.toFixed(1)}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Expense Tracker</Text>
        <Text style={styles.headerSubtitle}>จัดการเงินแบบโปร! 📊</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'overview' && styles.activeTab]}
          onPress={() => setViewMode('overview')}
        >
          <Text style={[styles.tabText, viewMode === 'overview' && styles.activeTabText]}>
            📊 ภาพรวม
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, viewMode === 'transactions' && styles.activeTab]}
          onPress={() => setViewMode('transactions')}
        >
          <Text style={[styles.tabText, viewMode === 'transactions' && styles.activeTabText]}>
            📝 รายการ
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, viewMode === 'stats' && styles.activeTab]}
          onPress={() => setViewMode('stats')}
        >
          <Text style={[styles.tabText, viewMode === 'stats' && styles.activeTabText]}>
            📈 สถิติ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Header */}
      <StatsHeader />

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'overview' && (
          <>
            <Text style={styles.sectionTitle}>รายการล่าสุด</Text>
            {transactions.slice(0, 5).map(item => (
              <TransactionItem key={item.id} item={item} />
            ))}
            {transactions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>ยังไม่มีรายการเลย! 💼</Text>
                <Text style={styles.emptySubtext}>เริ่มบันทึกรายรับ-รายจ่ายกันเถอะ</Text>
              </View>
            )}
          </>
        )}

        {viewMode === 'transactions' && (
          <>
            <Text style={styles.sectionTitle}>รายการทั้งหมด ({transactions.length})</Text>
            {transactions.map(item => (
              <TransactionItem key={item.id} item={item} />
            ))}
            {transactions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>ยังไม่มีรายการเลย! 💼</Text>
              </View>
            )}
          </>
        )}

        {viewMode === 'stats' && <CategoryStats />}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>➕</Text>
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เพิ่มรายการใหม่</Text>
            
            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, selectedType === 'income' && styles.incomeButton]}
                onPress={() => {
                  setSelectedType('income');
                  setSelectedCategory(null);
                }}
              >
                <Text style={[styles.typeButtonText, selectedType === 'income' && styles.typeButtonTextActive]}>
                  💰 รายรับ
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.typeButton, selectedType === 'expense' && styles.expenseButton]}
                onPress={() => {
                  setSelectedType('expense');
                  setSelectedCategory(null);
                }}
              >
                <Text style={[styles.typeButtonText, selectedType === 'expense' && styles.typeButtonTextActive]}>
                  💸 รายจ่าย
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>จำนวนเงิน (บาท):</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>รายละเอียด:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ระบุรายละเอียด..."
                value={description}
                onChangeText={setDescription}
                returnKeyType="done"
              />
            </View>

            {/* Category Selector */}
            <CategorySelector />

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addTransaction}
              >
                <Text style={styles.saveButtonText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2c3e50',
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 15,
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#2c3e50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  incomeCard: {
    borderTopWidth: 3,
    borderTopColor: '#2ecc71',
  },
  expenseCard: {
    borderTopWidth: 3,
    borderTopColor: '#e74c3c',
  },
  positiveCard: {
    borderTopWidth: 3,
    borderTopColor: '#3498db',
  },
  negativeCard: {
    borderTopWidth: 3,
    borderTopColor: '#f39c12',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#2ecc71',
  },
  expenseAmount: {
    color: '#e74c3c',
  },
  positiveAmount: {
    color: '#3498db',
  },
  negativeAmount: {
    color: '#f39c12',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    marginTop: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  incomeText: {
    color: '#2ecc71',
  },
  expenseText: {
    color: '#e74c3c',
  },
  deleteButton: {
    padding: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
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
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2c3e50',
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
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 25,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  incomeButton: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  expenseButton: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  categorySelector: {
    marginBottom: 25,
  },
  categoryOption: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    minWidth: 80,
  },
  categoryOptionIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoryOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryStats: {
    marginBottom: 20,
  },
  categoryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryStatLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryStatIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryStatName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  categoryStatRight: {
    alignItems: 'flex-end',
  },
  categoryStatAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  categoryStatPercent: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  emptyStats: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStatsText: {
    fontSize: 16,
    color: '#666',
  },
});