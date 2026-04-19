import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { qrAPI } from '../../services/api';

export default function QRScanScreen({ navigation }) {
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);

  const handleQRCodeRead = async (event) => {
    setScanning(false);
    setLoading(true);

    try {
      const qrData = event.data;

      // QR code format: "SKIPQ:restaurant_slug:table_number"
      const parts = qrData.split(':');
      if (parts[0] !== 'SKIPQ' || parts.length < 3) {
        throw new Error('Invalid QR code');
      }

      const restaurantSlug = parts[1];
      const tableNumber = parts[2];

      // Verify QR code with backend
      await qrAPI.resolve(restaurantSlug, tableNumber);

      // Navigate to restaurant detail with dine-in params
      navigation.navigate('RestaurantDetail', {
        slug: restaurantSlug,
        orderType: 'dine-in',
        tableNumber,
      });
    } catch (err) {
      Alert.alert('Invalid QR Code', 'This QR code is not valid or has expired', [
        {
          text: 'Scan Again',
          onPress: () => {
            setScanning(true);
            setLoading(false);
            scannerRef.current?.reactivate();
          },
        },
        {
          text: 'Go Back',
          onPress: () => navigation.goBack(),
          style: 'cancel',
        },
      ]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Processing QR Code...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {scanning ? (
        <>
          <QRCodeScanner
            ref={scannerRef}
            onRead={handleQRCodeRead}
            flashMode={RNCamera.Constants.FlashMode.off}
            reactivateTimeout={1000}
            markerStyle={styles.marker}
            cameraStyle={styles.camera}
            containerStyle={styles.scannerContainer}
          />

          <View style={styles.overlay}>
            <View style={styles.maskOuter}>
              <View style={styles.maskInner} />
              <View style={styles.maskRow}>
                <View style={styles.maskInner} />
              </View>
              <View style={styles.maskInner} />
            </View>
          </View>

          <View style={styles.footer}>
            <Icon name="square" size={200} color="transparent" />
            <Text style={styles.instructions}>
              Position the QR code inside the frame to scan
            </Text>
          </View>
        </>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.secondary,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  headerPlaceholder: {
    width: 24,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskOuter: {
    flex: 1,
    width: '100%',
  },
  maskInner: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  maskRow: {
    flexDirection: 'row',
    flex: 1,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  marker: {
    borderColor: Colors.primary,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.overlay,
  },
  instructions: {
    color: Colors.white,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    marginHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.white,
    marginTop: Spacing.lg,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
});
