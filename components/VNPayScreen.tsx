// ========== IMPORTS ==========
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { BASE_URL } from "../ipconfig";
import { Image } from "react-native";

// ========== CONSTANTS ==========
const colors = {
  primary: "#0052A5",
  success: "#28a745",
  danger: "#dc3545",
  background: "#f5f5f5",
  text: "#333",
  textLight: "#fff",
  border: "#ddd",
};

// ========== TYPES ==========
interface VNPayScreenProps {
  route: {
    params: {
      amount: number;
      orderId?: string;
      userId: number;
      onPaymentSuccess: () => void;
      onPaymentCancel: () => void;
    };
  };
  navigation: any;
}

// ========== COMPONENT ==========
export default function VNPayScreen({ route, navigation }: VNPayScreenProps) {
  // ========== STATE MANAGEMENT ==========
  const { amount, userId, onPaymentSuccess, onPaymentCancel } = route.params;
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isAutoPaymentStarted, setIsAutoPaymentStarted] = useState(false);
  const [isQRScanned, setIsQRScanned] = useState(false);
  
  // Memoize QR code value và URL để tránh tạo lại mỗi lần render
  const qrCodeValue = useMemo(
    () => `VNPAY-${userId}-${Date.now()}-${amount}`,
    [userId, amount]
  );
  
  const qrCodeURL = useMemo(
    () => `${BASE_URL}/qr-scan-redirect/${encodeURIComponent(qrCodeValue)}`,
    [qrCodeValue]
  );

  // ========== HANDLERS ==========
  const handlePaymentSuccess = useCallback(async () => {
    if (isAutoPaymentStarted || loading) return;
    
    setLoading(true);
    setIsAutoPaymentStarted(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      Alert.alert(
        "Thanh toán thành công",
        `Bạn đã thanh toán thành công số tiền ${amount.toLocaleString()}₫`,
        [
          {
            text: "OK",
            onPress: () => {
              onPaymentSuccess();
              navigation.goBack();
            },
          },
        ]
      );
    } catch {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi xử lý thanh toán");
    } finally {
      setLoading(false);
    }
  }, [amount, isAutoPaymentStarted, loading, onPaymentSuccess, navigation]);

  // ========== EFFECTS ==========
  // Khởi tạo QR code trên server khi component mount
  useEffect(() => {
    fetch(`${BASE_URL}/qr-create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCode: qrCodeValue }),
    }).catch(() => {});
  }, [qrCodeValue]);

  // Polling để kiểm tra trạng thái quét QR mỗi 2 giây
  useEffect(() => {
    if (isQRScanned) return;

    const encodedQRCode = encodeURIComponent(qrCodeValue);
    const checkQRStatus = async () => {
      try {
        const response = await fetch(`${BASE_URL}/qr-status/${encodedQRCode}`);
        const data = await response.json();

        if (data.success && data.scanned) {
          setIsQRScanned(true);
          setCountdown(10);
        }
      } catch {
        // Ignore error
      }
    };

    const interval = setInterval(checkQRStatus, 2000);
    checkQRStatus();

    return () => clearInterval(interval);
  }, [qrCodeValue, isQRScanned]);

  // Tự động thanh toán sau 10 giây khi đã quét QR
  useEffect(() => {
    if (!isQRScanned) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isAutoPaymentStarted && !loading) {
      handlePaymentSuccess();
    }
  }, [isQRScanned, countdown, isAutoPaymentStarted, loading, handlePaymentSuccess]);

  const handlePaymentCancel = useCallback(() => {
    Alert.alert(
      "Hủy thanh toán",
      "Bạn có chắc muốn hủy thanh toán?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Có",
          onPress: () => {
            onPaymentCancel();
            navigation.goBack();
          },
        },
      ]
    );
  }, [onPaymentCancel, navigation]);


  // ========== RENDER ==========
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* QR Code */}
        <Image
            source={{
              uri: `https://img.vietqr.io/image/AGRIBANK-1500203219470-compact.png?amount=${amount}&addInfo=ThanhToan`
            }}
            style={{ width: 250, height: 250 }}
          />

        {/* Số tiền */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Số tiền:</Text>
          <Text style={styles.amountValue}>{amount.toLocaleString()}₫</Text>
        </View>

        {/* Hình thức thanh toán */}
        <View style={styles.paymentMethodBox}>
          <Text style={styles.paymentMethodText}>Hình thức: QR Agribank</Text>
        </View>

        {/* Trạng thái quét QR */}
        {!isQRScanned && (
          <View style={styles.statusBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusText}>
              Đang chờ quét mã QR...
            </Text>
          </View>
        )}
        {isQRScanned && (
          <View style={[styles.statusBox, styles.statusScanned]}>
            <Text style={styles.statusText}>✅ Đã quét QR thành công</Text>
          </View>
        )}

        {/* Button hủy */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handlePaymentCancel}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Hủy thanh toán</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
  },
  paymentMethodBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  paymentMethodText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#e7f3ff",
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 200,
  },
  statusScanned: {
    backgroundColor: "#d4edda",
  },
  statusText: {
    fontSize: 14,
    color: "#004085",
    marginLeft: 8,
    textAlign: "center",
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 200,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
});


