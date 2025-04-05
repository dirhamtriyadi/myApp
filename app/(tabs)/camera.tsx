import { IconSymbol } from "@/components/ui/IconSymbol";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

export default function App() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [address, setAddress] = useState<any>(null);
  const [datetime, setDatetime] = useState<string>("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const shotRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync(
        currentLocation.coords
      );
      setLocation(currentLocation);
      setAddress(geocode[0]);
    })();

    const interval = setInterval(() => {
      setDatetime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!permission || !mediaPermission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Camera Permission" />
      </View>
    );
  }

  if (!mediaPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to save photos to the gallery
        </Text>
        <Button
          onPress={requestMediaPermission}
          title="Grant Media Permission"
        />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);
        const loc = await Location.getCurrentPositionAsync({});
        const geocode = await Location.reverseGeocodeAsync(loc.coords);
        setLocation(loc);
        setAddress(geocode[0]);
        setDatetime(new Date().toLocaleString());
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to take picture.");
      }
    }
  };

  const saveImageWithOverlay = async () => {
    try {
      await new Promise((r) => setTimeout(r, 100)); // wait a moment
      const uri = await captureRef(shotRef, {
        format: "jpg",
        quality: 1,
      });
      await MediaLibrary.createAssetAsync(uri);
      Alert.alert("Success", "Photo with overlay saved to gallery.");
      setPhotoUri(null);
    } catch (err) {
      console.error("Failed to capture image:", err);
    }
  };

  if (photoUri) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View
            style={styles.previewContainer}
            ref={shotRef}
            collapsable={false}
          >
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>🕒 {datetime}</Text>
              <Text style={styles.overlayText}>
                📍 {location?.coords.latitude}, {location?.coords.longitude}
              </Text>
              <Text style={styles.overlayText}>
                🏠 {address?.street}, {address?.city}, {address?.region}
              </Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setPhotoUri(null); // keluar dari preview
                setDatetime(""); // reset datetime
                setLocation(null); // reset lokasi
                setAddress(null); // reset alamat
              }}
            >
              <Text style={styles.retakeText}>🔁 Ambil Ulang</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveImageWithOverlay}
            >
              <Text style={{ color: "white" }}>💾 Simpan Foto</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Arah Kamera: {facing}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <IconSymbol size={28} name="camera.fill" color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={toggleCameraFacing}
            >
              <IconSymbol size={28} name="camera.rotate" color="white" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "white",
  },
  camera: {
    flex: 1,
  },
  infoContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 8,
  },
  infoText: {
    color: "white",
    fontSize: 16,
  },
  buttonContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  button: {
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    alignItems: "center",
  },
  previewContainer: {
    flex: 1,
    position: "relative",
  },
  previewImage: {
    flex: 1,
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    bottom: 80,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 10,
  },
  overlayText: {
    color: "white",
    fontSize: 14,
    marginBottom: 5,
  },
  saveButton: {
    backgroundColor: "#1E88E5",
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    margin: 16,
    // bottom: Platform.OS === "ios" ? 90 : 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    // marginBottom: Platform.OS === "ios" ? 90 : 20,
    // gap: 10,
  },
  retakeButton: {
    backgroundColor: "#9E9E9E",
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    margin: 16,
    // bottom: Platform.OS === "ios" ? 90 : 20,
  },
  retakeText: {
    color: "white",
    fontWeight: "bold",
  },
});
