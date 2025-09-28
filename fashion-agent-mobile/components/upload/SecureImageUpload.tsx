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
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, X } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import Toast from 'react-native-toast-message';
import { guestAPI } from '../../services/api';

const { width } = Dimensions.get('window');

interface OutfitAnalysis {
  styleCategory: string;
  styleCategoryScore: number;
  fit: string;
  fitScore: number;
  colorHarmony: string;
  colorHarmonyScore: number;
  occasionSuitability: string;
  occasionScore: number;
  proportionBalance: string;
  proportionScore: number;
  fabricSynergy: string;
  fabricScore: number;
  stylingSophistication: string;
  sophisticationScore: number;
  overallScore: number;
  highlights: string[];
  improvementSuggestions: string[];
  expertInsights?: string[];
  technicalFlaws?: string[];
}

interface GuestUsage {
  used: number;
  limit: number;
  remaining: number;
}

interface ReviewResult {
  reviewId: string;
  outfitAnalysis: OutfitAnalysis;
  guestUsage?: GuestUsage;
}

interface SecureImageUploadProps {
  onAnalysisComplete?: (result: ReviewResult) => void;
  onUploadProgress?: (progress: number) => void;
}

export function SecureImageUpload({ 
  onAnalysisComplete, 
  onUploadProgress 
}: SecureImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
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

      console.log('✅ Image validated:', {
        size: fileInfo.size,
        extension: fileExtension,
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
          'Fashion Agent needs camera access to capture outfit photos for analysis.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'OK' },
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
            { text: 'OK' },
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

      // Call guest API with progress tracking
      const response = await guestAPI.uploadImage(
        selectedImage, 
        description.trim() || undefined, 
        progressCallback
      );
      
      if (response.data) {
        const analysisResult: ReviewResult = response.data;
        
        console.log('✅ Analysis completed successfully');
        
        // Check for "no outfit" case
        if (analysisResult.outfitAnalysis.styleCategory === 'no outfit' || analysisResult.outfitAnalysis.overallScore === 0) {
          Toast.show({
            type: 'error',
            text1: 'No Outfit Detected',
            text2: 'Please upload an image with clothing to analyze',
            visibilityTime: 4000,
          });
        } else {
          // Convert to 10-point scale for display
          const convertedScore = Math.round(analysisResult.outfitAnalysis.overallScore / 10);
          Toast.show({
            type: 'success',
            text1: 'Analysis Complete!',
            text2: `Your outfit scored ${convertedScore}/10`,
            visibilityTime: 3000,
          });
        }

        // Call completion callback
        onAnalysisComplete?.(analysisResult);
        
        // Clear the form
        clearForm();
      }
    } catch (error: any) {
      console.error('❌ Analysis failed:', error);
      
      const errorData = error.response?.data;
      
      if (errorData?.code === 'LIMIT_REACHED') {
        Toast.show({
          type: 'error',
          text1: 'Review Limit Reached',
          text2: errorData.message,
        });
        Alert.alert('Review Limit Reached', errorData.message);
      } else {
        const errorMessage = errorData?.error || 
                            error.message || 
                            'Analysis failed. Please try again.';
        
        Toast.show({
          type: 'error',
          text1: 'Analysis Failed',
          text2: errorMessage,
        });
      }
    } finally {
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  // Clear form
  const clearForm = () => {
    setSelectedImage(null);
    setDescription('');
    setImageInfo(null);
    setUploadProgress(0);
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedImage(null);
    setImageInfo(null);
    setUploadProgress(0);
  };

  if (!selectedImage) {
    return (
      <View style={styles.container}>
        {/* Upload Area */}
        <View style={styles.uploadArea}>
          <Camera size={48} color="#1F2937" />
          <Text style={styles.uploadTitle}>Upload Your Outfit</Text>
          <Text style={styles.uploadSubtext}>Drag & drop or click to browse</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={pickImageFromLibrary}
            disabled={analyzing}
          >
            <Upload size={20} color="white" />
            <Text style={styles.buttonText}>Choose Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={takePhoto}
            disabled={analyzing}
          >
            <Camera size={20} color="white" />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Image Preview */}
      <View style={styles.imagePreview}>
        <Image source={{ uri: selectedImage }} style={styles.image} />
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearImage}
        >
          <X size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Description Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Tell us about this outfit (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Special occasion, style goals, or anything else you'd like our AI to consider..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
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
          <Text style={styles.progressText}>Analyzing your style... {uploadProgress}%</Text>
        </View>
      )}

      {/* Analyze Button */}
      <TouchableOpacity
        style={[styles.analyzeButton, analyzing && styles.disabledButton]}
        onPress={analyzeOutfit}
        disabled={analyzing}
      >
        {analyzing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="white" />
            <Text style={styles.loadingText}>
              {uploadProgress > 0 ? 'Uploading...' : 'Analyzing...'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.analyzeButtonText}>Get My Style Analysis</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#1F2937',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    backgroundColor: '#F5F1E8',
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
    minHeight: 100,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  progressText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  analyzeButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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
});