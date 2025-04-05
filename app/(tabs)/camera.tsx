import { IconSymbol } from "@/components/ui/IconSymbol";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [datetime, setDatetime] = useState<string>("");
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();

    const interval = setInterval(() => {
      setDatetime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const displayText = errorMsg
    ? errorMsg
    : location
    ? `Latitude: ${location.coords.latitude}\nLongitude: ${location.coords.longitude}\nDatetime: ${datetime}`
    : "Waiting...";

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
        const asset = await MediaLibrary.createAssetAsync(photo.uri); // Save photo to gallery
        Alert.alert("Picture Saved", `Photo saved to gallery at: ${asset.uri}`);
        console.log("Photo URI:", photo.uri);
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to take picture.");
      }
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>{displayText}</Text>
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
    justifyContent: "center",
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
    bottom: Platform.OS === "ios" ? 40 : 20, // Add extra padding for iOS
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
});
