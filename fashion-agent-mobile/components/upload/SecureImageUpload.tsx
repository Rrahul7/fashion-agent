import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import Toast from 'react-native-toast-message';
import { fashionAPI } from '../../services/api';

const { width } = Dimensions.get('window');

interface AnalysisResult {
  reviewId: string;
  outfitAnalysis: {
    styleCategory: string;
    fit: number;
    colorHarmony: number;
    occasionSuitability: number;
    highlights: string[];
    improvementSuggestions: string[];
  };
}

interface SecureImageUploadProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onUploadProgress?: (progress: number) => void;
}

export default function SecureImageUpload({ 
  onAnalysisComplete, 
  onUploadProgress 
}: SecureImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageInfo, setImageInfo] = useState<any>(null);

  // Security: Validate image before processing
  const validateImage = async (uri: string): Promise<boolean> => {
    try {
      // Check file size (max 10MB)
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Image file not found');
        return false;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (fileInfo.size > maxSize) {
        Alert.alert('Error', 'Image file is too large. Please choose a smaller image (max 10MB).');
        return false;
      }

      // Validate file extension
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const fileExtension = uri.toLowerCase().split('.').pop();
      
      if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
        Alert.alert('Error', 'Please select a valid image file (JPG, PNG, GIF, WEBP).');
        return false;
      }

      // Generate file hash for integrity
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        base64
      );

      console.log('✅ Image validated:', {
        size: fileInfo.size,
        extension: fileExtension,
        hash: hash.substring(0, 16) + '...'
      });

      return true;
    } catch (error) {
      console.error('Image validation error:', error);
      Alert.alert('Error', 'Failed to validate image file.');
      return false;
    }
  };

  // Request camera permissions securely
  const requestCameraPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Fashion Agent needs camera access to capture outfit photos for analysis. You can enable this in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => {
                // Note: In a real app, you might want to open settings
                console.log('Redirect to settings');
              }
            },
          ]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('Error', 'Failed to request camera permissions.');
      return false;
    }
  };

  // Request media library permissions securely  
  const requestMediaLibraryPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Fashion Agent needs access to your photo library to analyze your outfit photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => {
                console.log('Redirect to settings');
              }
            },
          ]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Media library permission error:', error);
      Alert.alert('Error', 'Failed to request photo library permissions.');
      return false;
    }
  };

  // Secure image picking with validation
  const pickImageFromLibrary = async () => {
    try {
      const hasPermission = await requestMediaLibraryPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Balance between quality and file size
        exif: false, // Remove EXIF data for privacy
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const isValid = await validateImage(imageUri);
        
        if (isValid) {
          setSelectedImage(imageUri);
          setImageInfo(result.assets[0]);
          
          Toast.show({
            type: 'success',
            text1: 'Image Selected',
            text2: 'Ready for outfit analysis',
            visibilityTime: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image from library.');
    }
  };

  // Secure camera capture
  const takePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false, // Remove EXIF data for privacy
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const isValid = await validateImage(imageUri);
        
        if (isValid) {
          setSelectedImage(imageUri);
          setImageInfo(result.assets[0]);
          
          Toast.show({
            type: 'success',
            text1: 'Photo Captured',
            text2: 'Ready for outfit analysis',
            visibilityTime: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  // Secure outfit analysis with progress tracking
  const analyzeOutfit = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select or capture an image first.');
      return;
    }

    setAnalyzing(true);
    setUploadProgress(0);

    try {
      console.log('🔍 Starting outfit analysis...');
      
      // Progress callback
      const progressCallback = (progress: number) => {
        setUploadProgress(progress);
        onUploadProgress?.(progress);
      };

      // Call secure API with progress tracking
      const response = await fashionAPI.uploadImage(selectedImage, progressCallback);
      
      if (response.data) {
        const analysisResult: AnalysisResult = response.data;
        
        console.log('✅ Analysis completed successfully');
        
        // Calculate average score
        const avgScore = Math.round((analysisResult.outfitAnalysis.fit + analysisResult.outfitAnalysis.colorHarmony + analysisResult.outfitAnalysis.occasionSuitability) / 3);
        
        Toast.show({
          type: 'success',
          text1: 'Analysis Complete!',
          text2: `Your outfit scored ${avgScore}/10`,
          visibilityTime: 3000,
        });

        // Call completion callback
        onAnalysisComplete?.(analysisResult);
        
        // Clear the selected image for next use
        setSelectedImage(null);
        setImageInfo(null);
        setUploadProgress(0);
      }
    } catch (error: any) {
      console.error('❌ Analysis failed:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Analysis failed. Please try again.';
      
      Toast.show({
        type: 'error',
        text1: 'Analysis Failed',
        text2: errorMessage,
      });
      
      Alert.alert('Analysis Failed', errorMessage);
    } finally {
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  // Clear selected image
  const clearImage = () => {
    Alert.alert(
      'Clear Image',
      'Are you sure you want to remove the selected image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setSelectedImage(null);
            setImageInfo(null);
            setUploadProgress(0);
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Image Display Area */}
      <View style={styles.imageContainer}>
        {selectedImage ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: selectedImage }} style={styles.image} />
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={clearImage}
              accessibilityLabel="Clear selected image"
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
            
            {/* Image Info */}
            {imageInfo && (
              <View style={styles.imageInfoContainer}>
                <Text style={styles.imageInfoText}>
                  {Math.round(imageInfo.width)}×{Math.round(imageInfo.height)}
                  {imageInfo.fileSize && ` • ${Math.round(imageInfo.fileSize / 1024)}KB`}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Camera size={48} color="#666" />
            <Text style={styles.placeholderText}>Select or capture outfit photo</Text>
            <Text style={styles.placeholderSubtext}>
              Upload a clear photo of your outfit for AI analysis
            </Text>
          </View>
        )}
      </View>

      {/* Upload Progress */}
      {analyzing && uploadProgress > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${uploadProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{uploadProgress}% uploaded</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={pickImageFromLibrary}
          disabled={analyzing}
          accessibilityLabel="Choose photo from library"
        >
          <Text style={styles.buttonText}>📸 Choose Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={takePhoto}
          disabled={analyzing}
          accessibilityLabel="Take photo with camera"
        >
          <Text style={styles.buttonText}>📷 Take Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Analyze Button */}
      {selectedImage && (
        <TouchableOpacity
          style={[styles.analyzeButton, analyzing && styles.disabledButton]}
          onPress={analyzeOutfit}
          disabled={analyzing}
          accessibilityLabel="Analyze outfit with AI"
        >
          {analyzing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.loadingText}>
                {uploadProgress > 0 ? 'Uploading...' : 'Analyzing...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.analyzeButtonText}>✨ Analyze My Outfit</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Text style={styles.securityText}>
          🔒 Your photos are securely processed and not stored permanently
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  imageContainer: {
    height: width * 0.75, // 4:3 aspect ratio
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageInfoContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageInfoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    marginTop: 16,
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderSubtext: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#28a745',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNotice: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  securityText: {
    color: '#2d5016',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
