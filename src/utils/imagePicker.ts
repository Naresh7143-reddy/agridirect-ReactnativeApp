/**
 * AgriDirect — Image Picker Utility
 *
 * Wraps react-native-image-picker.
 * Install: npm install react-native-image-picker
 * Android permissions are auto-handled by the library (API 33+).
 */

import { Alert } from 'react-native';

export interface PickedImage {
  uri: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
}

type PickerCallback = (image: PickedImage | null) => void;

function getImagePicker() {
  try {
    return require('react-native-image-picker');
  } catch {
    return null;
  }
}

export function launchCamera(callback: PickerCallback): void {
  const lib = getImagePicker();
  if (!lib) {
    Alert.alert(
      'Setup required',
      'Run: npm install react-native-image-picker\nthen rebuild the app.',
    );
    callback(null);
    return;
  }

  lib.launchCamera(
    { mediaType: 'photo', quality: 0.8, maxWidth: 1024, maxHeight: 1024 },
    (response: any) => {
      if (response.didCancel || response.errorCode) { callback(null); return; }
      const asset = response.assets?.[0];
      if (asset) callback({ uri: asset.uri, fileName: asset.fileName, type: asset.type, fileSize: asset.fileSize });
      else callback(null);
    },
  );
}

export function launchGallery(callback: PickerCallback): void {
  const lib = getImagePicker();
  if (!lib) {
    Alert.alert(
      'Setup required',
      'Run: npm install react-native-image-picker\nthen rebuild the app.',
    );
    callback(null);
    return;
  }

  lib.launchImageLibrary(
    { mediaType: 'photo', quality: 0.8, maxWidth: 1024, maxHeight: 1024, selectionLimit: 1 },
    (response: any) => {
      if (response.didCancel || response.errorCode) { callback(null); return; }
      const asset = response.assets?.[0];
      if (asset) callback({ uri: asset.uri, fileName: asset.fileName, type: asset.type, fileSize: asset.fileSize });
      else callback(null);
    },
  );
}

export function launchMultipleGallery(
  selectionLimit: number,
  callback: (images: PickedImage[]) => void,
): void {
  const lib = getImagePicker();
  if (!lib) {
    Alert.alert('Setup required', 'Run: npm install react-native-image-picker');
    callback([]);
    return;
  }

  lib.launchImageLibrary(
    { mediaType: 'photo', quality: 0.8, maxWidth: 1024, maxHeight: 1024, selectionLimit },
    (response: any) => {
      if (response.didCancel || response.errorCode) { callback([]); return; }
      const images: PickedImage[] = (response.assets ?? []).map((a: any) => ({
        uri: a.uri, fileName: a.fileName, type: a.type, fileSize: a.fileSize,
      }));
      callback(images);
    },
  );
}

/** Show a camera/gallery action sheet then call back with the picked image. */
export function showImagePickerActionSheet(callback: PickerCallback): void {
  Alert.alert('Select Image', 'Choose a source', [
    { text: 'Camera', onPress: () => launchCamera(callback) },
    { text: 'Gallery', onPress: () => launchGallery(callback) },
    { text: 'Cancel', style: 'cancel', onPress: () => callback(null) },
  ]);
}
