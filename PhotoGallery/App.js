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
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3; // 3 รูปต่อแถว

export default function PhotoGalleryApp() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermissions();
    loadPhotos();
  }, []);

  // เช็คและขออนุญาต
  const checkPermissions = async () => {
    try {
      // ขออนุญาตกล้อง
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      
      // ขออนุญาต Media Library
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      
      if (cameraStatus.status === 'granted' && mediaStatus.status === 'granted') {
        setHasPermission(true);
      } else {
        Alert.alert(
          'ขออนุญาต',
          'แอปต้องการสิทธิ์เข้าถึงกล้องและรูปภาพ เพื่อใช้งานได้เต็มที่ 📷',
          [
            { text: 'ยกเลิก', style: 'cancel' },
            { text: 'ตั้งค่า', onPress: () => checkPermissions() }
          ]
        );
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  // โหลดรูปจาก AsyncStorage
  const loadPhotos = async () => {
    try {
      const storedPhotos = await AsyncStorage.getItem('gallery_photos');
      if (storedPhotos) {
        setPhotos(JSON.parse(storedPhotos));
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  // บันทึกรูปลง AsyncStorage
  const savePhotos = async (newPhotos) => {
    try {
      await AsyncStorage.setItem('gallery_photos', JSON.stringify(newPhotos));
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  // ถ่ายรูปใหม่
  const takePhoto = async () => {
    if (!hasPermission) {
      checkPermissions();
      return;
    }

    try {
      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          timestamp: new Date().toISOString(),
          source: 'camera'
        };

        const updatedPhotos = [newPhoto, ...photos];
        setPhotos(updatedPhotos);
        await savePhotos(updatedPhotos);
        
        Alert.alert('สำเร็จ! 📸', 'ถ่ายรูปเสร็จแล้ว!');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถถ่ายรูปได้ 😅');
    } finally {
      setLoading(false);
    }
  };

  // เลือกรูปจากแกลเลอรี่
  const pickPhoto = async () => {
    if (!hasPermission) {
      checkPermissions();
      return;
    }

    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          timestamp: new Date().toISOString(),
          source: 'gallery'
        };

        const updatedPhotos = [newPhoto, ...photos];
        setPhotos(updatedPhotos);
        await savePhotos(updatedPhotos);
        
        Alert.alert('สำเร็จ! 🖼️', 'เพิ่มรูปเสร็จแล้ว!');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถเลือกรูปได้ 😅');
    } finally {
      setLoading(false);
    }
  };

  // ลบรูป
  const deletePhoto = (photoId) => {
    Alert.alert(
      'ลบรูป',
      'แน่ใจมั้ยว่าจะลบรูปนี้? 🗑️',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบเลย!',
          style: 'destructive',
          onPress: async () => {
            const updatedPhotos = photos.filter(photo => photo.id !== photoId);
            setPhotos(updatedPhotos);
            await savePhotos(updatedPhotos);
            setModalVisible(false);
            Alert.alert('ลบแล้ว! 🗑️', 'รูปถูกลบเรียบร้อยแล้ว');
          },
        },
      ]
    );
  };

  // ลบรูปทั้งหมด
  const clearAllPhotos = () => {
    if (photos.length === 0) {
      Alert.alert('ไม่มีรูป', 'ยังไม่มีรูปให้ลบเลย! 📷');
      return;
    }

    Alert.alert(
      'ลบรูปทั้งหมด',
      `จะลบรูป ${photos.length} รูปทั้งหมด ใช่มั้ย?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบทั้งหมด!',
          style: 'destructive',
          onPress: async () => {
            setPhotos([]);
            await savePhotos([]);
            Alert.alert('ลบแล้ว! 🧹', 'ลบรูปทั้งหมดเรียบร้อยแล้ว');
          },
        },
      ]
    );
  };

  // แสดงรูปขยาย
  const showPhotoModal = (photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  // จัดรูปแบบวันที่
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Component แสดงรูปใน Grid
  const PhotoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => showPhotoModal(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.photo}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoSource}>
          {item.source === 'camera' ? '📷' : '🖼️'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Component หน้าจอว่าง
  const EmptyGallery = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📷</Text>
      <Text style={styles.emptyText}>ยังไม่มีรูปเลย!</Text>
      <Text style={styles.emptySubtext}>ถ่ายรูปหรือเลือกจากแกลเลอรี่กันเถอะ! ✨</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6c5ce7" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📸 My Gallery</Text>
        <Text style={styles.headerSubtitle}>
          {photos.length} รูป • สร้างความทรงจำสวยๆ 🌟
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cameraButton]}
          onPress={takePhoto}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>ถ่ายรูป</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.galleryButton]}
          onPress={pickPhoto}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={styles.actionText}>เลือกรูป</Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteAllButton]}
            onPress={clearAllPhotos}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.actionText}>ลบทั้งหมด</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.loadingText}>กำลังดำเนินการ... ⏳</Text>
        </View>
      )}

      {/* Photo Grid */}
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PhotoItem item={item} />}
        numColumns={3}
        style={styles.photoGrid}
        contentContainerStyle={photos.length === 0 ? styles.emptyContent : styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? EmptyGallery : null}
      />

      {/* Photo Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {selectedPhoto && (
                <>
                  <Image
                    source={{ uri: selectedPhoto.uri }}
                    style={styles.modalImage}
                    contentFit="contain"
                  />
                  
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalDate}>
                      📅 {formatDate(selectedPhoto.timestamp)}
                    </Text>
                    <Text style={styles.modalSource}>
                      {selectedPhoto.source === 'camera' ? '📷 ถ่ายจากกล้อง' : '🖼️ เลือกจากแกลเลอรี่'}
                    </Text>
                    <Text style={styles.modalSize}>
                      📐 {selectedPhoto.width} × {selectedPhoto.height}
                    </Text>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setModalVisible(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalButtonText}>ปิด</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalButton, styles.deleteModalButton]}
                      onPress={() => deletePhoto(selectedPhoto.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalButtonText}>🗑️ ลบ</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with 📷 by ไอ้เสี่ย</Text>
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
    backgroundColor: '#6c5ce7',
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
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    borderColor: '#6c5ce7',
    borderWidth: 2,
  },
  galleryButton: {
    borderColor: '#00cec9',
    borderWidth: 2,
  },
  deleteAllButton: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  photoGrid: {
    flex: 1,
    paddingHorizontal: 15,
  },
  gridContent: {
    paddingVertical: 10,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  photoItem: {
    width: imageSize,
    height: imageSize,
    margin: 5,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSource: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  modalInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalDate: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  modalSource: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modalSize: {
    fontSize: 14,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 15,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#6c5ce7',
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  deleteModalButton: {
    backgroundColor: '#ff6b6b',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
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