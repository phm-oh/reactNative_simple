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
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// API Key - ต้องสมัครฟรีที่ openweathermap.org
const API_KEY = '9a53c9d4ad14484680297e93f4d2978e'; // แทนที่ด้วย API key จริง
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Weather icons mapping
const WEATHER_ICONS = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '🌨️', '13n': '🌨️',
  '50d': '🌫️', '50n': '🌫️',
};

// Background gradients based on weather
const WEATHER_GRADIENTS = {
  Clear: ['#87CEEB', '#98D8E8'],
  Clouds: ['#BDC3C7', '#2C3E50'],
  Rain: ['#3A7BD5', '#00D2FF'],
  Drizzle: ['#4DA0B0', '#D39D38'],
  Thunderstorm: ['#2C3E50', '#4CA1AF'],
  Snow: ['#E6DADA', '#274046'],
  Mist: ['#BDC3C7', '#2C3E50'],
  default: ['#74b9ff', '#0984e3'],
};

export default function WeatherApp() {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('current'); // current, forecast, favorites

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await loadFavorites();
    await getCurrentLocation();
  };

  // โหลดเมืองโปรด
  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem('weather_favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // บันทึกเมืองโปรด
  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('weather_favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // ขออนุญาตและหาตำแหน่งปัจจุบัน
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ขออนุญาต',
          'แอปต้องการสิทธิ์เข้าถึงตำแหน่ง เพื่อแสดงสภาพอากาศในพื้นที่ของคุณ 📍',
          [
            { text: 'ยกเลิก', style: 'cancel' },
            { text: 'ตั้งค่า', onPress: getCurrentLocation }
          ]
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      
      await getWeatherByCoords(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Location error:', error);
      setError('ไม่สามารถหาตำแหน่งได้ กรุณาค้นหาเมืองแทน 📍');
      setLoading(false);
    }
  };

  // ดึงข้อมูลสภาพอากาศจากพิกัด
  const getWeatherByCoords = async (lat, lon) => {
    try {
      setLoading(true);
      setError(null);

      // เช็ค API Key (แก้แล้ว - ไม่เช็คกับค่าจริง)
      // เช็ค API Key (แก้แล้ว - ไม่เช็คกับค่าจริง)
      if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        setError('ยังไม่ได้ตั้งค่า API Key! ดูวิธีตั้งค่าในคอมเมนต์ 🔑');
        setLoading(false);
        return;
      }

      // Current weather
      const currentResponse = await fetch(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=th`
      );
      const currentData = await currentResponse.json();

      if (!currentResponse.ok) {
        throw new Error(currentData.message || 'ไม่สามารถดึงข้อมูลได้');
      }

      setCurrentWeather(currentData);

      // 5-day forecast
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=th`
      );
      const forecastData = await forecastResponse.json();

      if (!forecastResponse.ok) {
        throw new Error(forecastData.message || 'ไม่สามารถดึงข้อมูลพยากรณ์ได้');
      }

      // แปลงข้อมูล forecast (แสดงทุก 8 ชั่วโมง = 3 ครั้งต่อวัน)
      const dailyForecast = forecastData.list.filter((item, index) => index % 8 === 0).slice(0, 5);
      setForecast(dailyForecast);

    } catch (error) {
      console.error('Weather API error:', error);
      setError(`ข้อผิดพลาด: ${error.message} 🌐`);
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาเมือง
  const searchCity = async (cityName) => {
    if (!cityName.trim()) {
      Alert.alert('ค้นหาเมือง', 'กรุณาใส่ชื่อเมือง! 🔍');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // เช็ค API Key (แก้แล้ว - ไม่เช็คกับค่าจริง)
      if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        setError('ยังไม่ได้ตั้งค่า API Key! ดูวิธีตั้งค่าในคอมเมนต์ 🔑');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric&lang=th`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message === 'city not found' ? 'ไม่พบเมืองที่ค้นหา' : data.message);
      }

      setCurrentWeather(data);
      
      // ดึง forecast สำหรับเมืองที่ค้นหา
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric&lang=th`
      );
      const forecastData = await forecastResponse.json();
      
      if (forecastResponse.ok) {
        const dailyForecast = forecastData.list.filter((item, index) => index % 8 === 0).slice(0, 5);
        setForecast(dailyForecast);
      }

      setSearchText('');
      setActiveTab('current');
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('ข้อผิดพลาด', error.message);
    } finally {
      setLoading(false);
    }
  };

  // เพิ่ม/ลบเมืองโปรด
  const toggleFavorite = async () => {
    if (!currentWeather) return;

    const cityData = {
      id: currentWeather.id,
      name: currentWeather.name,
      country: currentWeather.sys.country,
      coord: currentWeather.coord,
    };

    const isAlreadyFavorite = favorites.some(fav => fav.id === cityData.id);
    let newFavorites;

    if (isAlreadyFavorite) {
      newFavorites = favorites.filter(fav => fav.id !== cityData.id);
      Alert.alert('ลบแล้ว! 💔', `ลบ ${cityData.name} ออกจากรายการโปรดแล้ว`);
    } else {
      newFavorites = [...favorites, cityData];
      Alert.alert('เพิ่มแล้ว! ❤️', `เพิ่ม ${cityData.name} ลงในรายการโปรดแล้ว`);
    }

    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  // เลือกเมืองจากรายการโปรด
  const selectFavoriteCity = async (city) => {
    await getWeatherByCoords(city.coord.lat, city.coord.lon);
    setActiveTab('current');
  };

  // ลบเมืองจากรายการโปรด
  const removeFavorite = async (cityId) => {
    Alert.alert(
      'ลบเมืองโปรด',
      'แน่ใจมั้ยว่าจะลบเมืองนี้? 💔',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบเลย!',
          style: 'destructive',
          onPress: async () => {
            const newFavorites = favorites.filter(fav => fav.id !== cityId);
            setFavorites(newFavorites);
            await saveFavorites(newFavorites);
          },
        },
      ]
    );
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    if (location) {
      await getWeatherByCoords(location.coords.latitude, location.coords.longitude);
    } else {
      await getCurrentLocation();
    }
    setRefreshing(false);
  };

  // จัดรูปแบบวันที่
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  // จัดรูปแบบเวลา
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ได้ background gradient
  const getBackgroundGradient = () => {
    if (currentWeather) {
      const condition = currentWeather.weather[0].main;
      return WEATHER_GRADIENTS[condition] || WEATHER_GRADIENTS.default;
    }
    return WEATHER_GRADIENTS.default;
  };

  // Component: Current Weather Card
  const CurrentWeatherCard = () => {
    if (!currentWeather) return null;

    const weather = currentWeather.weather[0];
    const isFavorite = favorites.some(fav => fav.id === currentWeather.id);

    return (
      <View style={styles.currentWeatherCard}>
        <View style={styles.currentWeatherHeader}>
          <View>
            <Text style={styles.cityName}>
              {currentWeather.name}, {currentWeather.sys.country}
            </Text>
            <Text style={styles.weatherDescription}>
              {weather.description}
            </Text>
          </View>
          <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.currentWeatherMain}>
          <Text style={styles.weatherIcon}>
            {WEATHER_ICONS[weather.icon] || '🌤️'}
          </Text>
          <Text style={styles.temperature}>
            {Math.round(currentWeather.main.temp)}°C
          </Text>
        </View>

        <View style={styles.weatherDetails}>
          <View style={styles.weatherDetailItem}>
            <Text style={styles.weatherDetailLabel}>ความรู้สึก</Text>
            <Text style={styles.weatherDetailValue}>
              {Math.round(currentWeather.main.feels_like)}°C
            </Text>
          </View>
          <View style={styles.weatherDetailItem}>
            <Text style={styles.weatherDetailLabel}>ความชื้น</Text>
            <Text style={styles.weatherDetailValue}>
              {currentWeather.main.humidity}%
            </Text>
          </View>
          <View style={styles.weatherDetailItem}>
            <Text style={styles.weatherDetailLabel}>ลม</Text>
            <Text style={styles.weatherDetailValue}>
              {currentWeather.wind.speed} m/s
            </Text>
          </View>
          <View style={styles.weatherDetailItem}>
            <Text style={styles.weatherDetailLabel}>ความกดอากาศ</Text>
            <Text style={styles.weatherDetailValue}>
              {currentWeather.main.pressure} hPa
            </Text>
          </View>
        </View>

        <View style={styles.sunTimes}>
          <View style={styles.sunTimeItem}>
            <Text style={styles.sunTimeIcon}>🌅</Text>
            <Text style={styles.sunTimeLabel}>พระอาทิตย์ขึ้น</Text>
            <Text style={styles.sunTimeValue}>
              {formatTime(currentWeather.sys.sunrise)}
            </Text>
          </View>
          <View style={styles.sunTimeItem}>
            <Text style={styles.sunTimeIcon}>🌇</Text>
            <Text style={styles.sunTimeLabel}>พระอาทิตย์ตก</Text>
            <Text style={styles.sunTimeValue}>
              {formatTime(currentWeather.sys.sunset)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Component: Forecast Item
  const ForecastItem = ({ item }) => {
    const weather = item.weather[0];
    return (
      <View style={styles.forecastItem}>
        <Text style={styles.forecastDate}>
          {formatDate(item.dt)}
        </Text>
        <Text style={styles.forecastIcon}>
          {WEATHER_ICONS[weather.icon] || '🌤️'}
        </Text>
        <Text style={styles.forecastTemp}>
          {Math.round(item.main.temp)}°C
        </Text>
        <Text style={styles.forecastDescription}>
          {weather.description}
        </Text>
        <Text style={styles.forecastHumidity}>
          💧 {item.main.humidity}%
        </Text>
      </View>
    );
  };

  // Component: Favorite City Item
  const FavoriteCityItem = ({ item }) => (
    <View style={styles.favoriteCityItem}>
      <TouchableOpacity
        style={styles.favoriteCityContent}
        onPress={() => selectFavoriteCity(item)}
      >
        <Text style={styles.favoriteCityName}>
          {item.name}, {item.country}
        </Text>
        <Text style={styles.favoriteCityCoords}>
          📍 {item.coord.lat.toFixed(2)}, {item.coord.lon.toFixed(2)}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => removeFavorite(item.id)}
        style={styles.deleteFavoriteButton}
      >
        <Text>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  // Component: Empty State
  const EmptyState = ({ icon, title, subtitle }) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={getBackgroundGradient()}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌤️ Weather App</Text>
          <TouchableOpacity onPress={getCurrentLocation} disabled={loading}>
            <Text style={styles.locationButton}>📍</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาเมือง... 🔍"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => searchCity(searchText)}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => searchCity(searchText)}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'current' && styles.activeTab]}
            onPress={() => setActiveTab('current')}
          >
            <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
              🌤️ ปัจจุบัน
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'forecast' && styles.activeTab]}
            onPress={() => setActiveTab('forecast')}
          >
            <Text style={[styles.tabText, activeTab === 'forecast' && styles.activeTabText]}>
              📅 พยากรณ์
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
            onPress={() => setActiveTab('favorites')}
          >
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
              ❤️ โปรด ({favorites.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#fff']}
            />
          }
        >
          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>กำลังโหลดข้อมูล... ⏳</Text>
            </View>
          )}

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
                <Text style={styles.retryButtonText}>ลองใหม่ 🔄</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Current Weather Tab */}
          {activeTab === 'current' && !loading && !error && (
            <>
              {currentWeather ? (
                <CurrentWeatherCard />
              ) : (
                <EmptyState
                  icon="🌍"
                  title="ยินดีต้อนรับ!"
                  subtitle="ค้นหาเมืองหรือใช้ตำแหน่งปัจจุบัน"
                />
              )}
            </>
          )}

          {/* Forecast Tab */}
          {activeTab === 'forecast' && !loading && (
            <>
              {forecast.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>พยากรณ์อากาศ 5 วัน</Text>
                  {forecast.map((item, index) => (
                    <ForecastItem key={index} item={item} />
                  ))}
                </>
              ) : (
                <EmptyState
                  icon="📅"
                  title="ไม่มีข้อมูลพยากรณ์"
                  subtitle="ค้นหาเมืองเพื่อดูพยากรณ์อากาศ"
                />
              )}
            </>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <>
              {favorites.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>เมืองโปรด ({favorites.length})</Text>
                  {favorites.map((item) => (
                    <FavoriteCityItem key={item.id} item={item} />
                  ))}
                </>
              ) : (
                <EmptyState
                  icon="❤️"
                  title="ไม่มีเมืองโปรด"
                  subtitle="เพิ่มเมืองโปรดโดยกดไอคอนหัวใจ"
                />
              )}
            </>
          )}
        </ScrollView>

        {/* API Key Warning (แก้แล้ว - ไม่เช็คกับค่าจริง) */}
        {(!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') && (
          <View style={styles.apiWarning}>
            <Text style={styles.apiWarningText}>
              ⚠️ ต้องตั้งค่า API Key ก่อนใช้งาน!
            </Text>
            <Text style={styles.apiWarningSubtext}>
              สมัครฟรีที่ openweathermap.org
            </Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  locationButton: {
    fontSize: 24,
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 5,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  currentWeatherCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  currentWeatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  weatherDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textTransform: 'capitalize',
  },
  favoriteButton: {
    padding: 5,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  currentWeatherMain: {
    alignItems: 'center',
    marginBottom: 25,
  },
  weatherIcon: {
    fontSize: 80,
    marginBottom: 10,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  weatherDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weatherDetailItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  weatherDetailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 5,
  },
  weatherDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sunTimes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sunTimeItem: {
    alignItems: 'center',
  },
  sunTimeIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  sunTimeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 5,
  },
  sunTimeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  forecastItem: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastDate: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  forecastIcon: {
    fontSize: 24,
    marginHorizontal: 10,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    width: 60,
    textAlign: 'center',
  },
  forecastDescription: {
    flex: 2,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize',
  },
  forecastHumidity: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  favoriteCityItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  favoriteCityContent: {
    flex: 1,
  },
  favoriteCityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  favoriteCityCoords: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  deleteFavoriteButton: {
    padding: 10,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  apiWarning: {
    backgroundColor: 'rgba(255,0,0,0.8)',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  apiWarningText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  apiWarningSubtext: {
    color: '#fff',
    fontSize: 12,
  },
});