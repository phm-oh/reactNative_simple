import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  // ฟังก์ชันกดตัวเลข
  const inputNumber = (num) => {
    if (waitingForNewValue) {
      setDisplay(String(num));
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  // ฟังก์ชันกดจุดทศนิยม
  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  // ฟังก์ชันล้างหน้าจอ
  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  // ฟังก์ชันลบตัวเลขทีละตัว
  const backspace = () => {
    if (display.length === 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  // ฟังก์ชันเปลี่ยนเครื่องหมาย +/-
  const toggleSign = () => {
    if (display !== '0') {
      setDisplay(display.charAt(0) === '-' ? display.substr(1) : '-' + display);
    }
  };

  // ฟังก์ชันกดปุ่มคำนวณ
  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  // ฟังก์ชันคำนวณ
  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      default:
        return secondValue;
    }
  };

  // ฟังก์ชันกดเท่ากับ
  const handleEquals = () => {
    if (operation && previousValue !== null) {
      performOperation(null);
      setOperation(null);
      setPreviousValue(null);
      setWaitingForNewValue(true);
    }
  };

  // Component ปุ่ม
  const Button = ({ onPress, title, color = '#333', backgroundColor = '#f0f0f0', size = 1 }) => (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor, 
          flex: size,
          borderColor: '#ddd',
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );

  // จัดรูปแบบการแสดงผล
  const formatDisplay = () => {
    const num = parseFloat(display);
    if (display.length > 10) {
      return num.toExponential(5);
    }
    return display;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* หน้าจอแสดงผล */}
      <View style={styles.displayContainer}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {formatDisplay()}
        </Text>
      </View>

      {/* ปุ่มต่างๆ */}
      <View style={styles.buttonContainer}>
        {/* แถวที่ 1 */}
        <View style={styles.row}>
          <Button title="AC" onPress={clear} backgroundColor="#ff6b6b" color="#fff" />
          <Button title="⌫" onPress={backspace} backgroundColor="#feca57" color="#fff" />
          <Button title="±" onPress={toggleSign} backgroundColor="#feca57" color="#fff" />
          <Button title="÷" onPress={() => performOperation('/')} backgroundColor="#4834d4" color="#fff" />
        </View>

        {/* แถวที่ 2 */}
        <View style={styles.row}>
          <Button title="7" onPress={() => inputNumber(7)} />
          <Button title="8" onPress={() => inputNumber(8)} />
          <Button title="9" onPress={() => inputNumber(9)} />
          <Button title="×" onPress={() => performOperation('*')} backgroundColor="#4834d4" color="#fff" />
        </View>

        {/* แถวที่ 3 */}
        <View style={styles.row}>
          <Button title="4" onPress={() => inputNumber(4)} />
          <Button title="5" onPress={() => inputNumber(5)} />
          <Button title="6" onPress={() => inputNumber(6)} />
          <Button title="−" onPress={() => performOperation('-')} backgroundColor="#4834d4" color="#fff" />
        </View>

        {/* แถวที่ 4 */}
        <View style={styles.row}>
          <Button title="1" onPress={() => inputNumber(1)} />
          <Button title="2" onPress={() => inputNumber(2)} />
          <Button title="3" onPress={() => inputNumber(3)} />
          <Button title="+" onPress={() => performOperation('+')} backgroundColor="#4834d4" color="#fff" />
        </View>

        {/* แถวที่ 5 */}
        <View style={styles.row}>
          <Button title="0" onPress={() => inputNumber(0)} size={2} />
          <Button title="." onPress={inputDecimal} />
          <Button title="=" onPress={handleEquals} backgroundColor="#2ecc71" color="#fff" />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>🔥 Calculator by ไอ้เสี่ย 🔥</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  displayContainer: {
    flex: 2,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2c2c2c',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  displayText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  buttonContainer: {
    flex: 3,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 10,
  },
  button: {
    margin: 5,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  footer: {
    padding: 15,
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
});