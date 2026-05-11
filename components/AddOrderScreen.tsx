// ========== IMPORTS ==========
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { BASE_URL } from "../ipconfig";

// ========== CONSTANTS ==========
const colors = {
  primary: "#6A0DAD",
  background: "#f8f9fa",
  text: "#2c3e50",
  muted: "#777",
  border: "#e0e0e0",
  accent: "#fff0f0",
  error: "#6A0DAD",
};

// ========== COMPONENT ==========
export default function AddOrderScreen({ route, navigation }: any) {
  const { userId, totalAmount } = route.params;
  
  // ========== STATE MANAGEMENT ==========

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [products, setProducts] = useState<any[]>([]);

  const finalAmount = useMemo(
    () => Math.round(totalAmount * (1 - discountAmount / 100)),
    [totalAmount, discountAmount]
  );

  // ========== EFFECTS ==========
  // Lấy thông tin user và sản phẩm trong 
  
  useEffect(() => {
    const fetchOrderInfo = async () => {
      try {
        const response = await fetch(`${BASE_URL}/order-info?userId=${userId}`);
        const data = await response.json();

        if (response.ok) {
          setUser(data.user || {});
          setProducts(data.products || []);
        } else {
          Alert.alert("Lỗi", data.message || "Không thể lấy thông tin đơn hàng");
        }
      } catch (error) {
        Alert.alert("Lỗi", "Không thể kết nối máy chủ");
      }
    };

    fetchOrderInfo();
  }, []);

  // ========== HANDLERS ==========
  // Chọn voucher giảm giá
  const handleSelectVoucher = useCallback(() => {
    navigation.navigate("Chọn Khuyến Mãi", {
      userId,
      onSelect: (voucher: { code: string; discountAmount: number }) => {
        setSelectedVoucherCode(voucher.code);
        setDiscountAmount(voucher.discountAmount);
      },
    });
  }, [navigation, userId]);

  // Xử lý thanh toán VNPay
  const handleVNPayPayment = useCallback(() => {
    navigation.navigate("VNPay", {
      amount: finalAmount,
      userId,
      onPaymentSuccess: () => handlePlaceOrder("VNPay"),
      onPaymentCancel: () => {},
    });
  }, [navigation, finalAmount, userId]);

  // Tạo đơn hàng mới
  const handlePlaceOrder = useCallback(async (paymentType?: string) => {
    const method = paymentType || selectedMethod;
    
    if (!method) {
      Alert.alert("Thông báo", "Vui lòng chọn phương thức thanh toán!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          paymentType: method,
          totalAmount: finalAmount,
          voucherCode: selectedVoucherCode,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Thành công", "Đơn hàng đã được đặt!", [
          {
            text: "OK",
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: "Quản Lý Đơn Hàng" }],
            }),
          },
        ]);
      } else {
        Alert.alert("Lỗi", data.message || "Không thể đặt hàng");
      }
    } catch {
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  }, [selectedMethod, userId, finalAmount, selectedVoucherCode, navigation]);

  // Xử lý khi nhấn nút đặt hàng
  const handleOrderButton = useCallback(() => {
    if (!selectedMethod) {
      Alert.alert("Thông báo", "Vui lòng chọn phương thức thanh toán!");
      return;
    }

    if (selectedMethod === "VNPay") {
      handleVNPayPayment();
    } else {
      handlePlaceOrder();
    }
  }, [selectedMethod, handleVNPayPayment]);

  // ========== RENDER ==========
  return (
    <ScrollView style={styles.container}>

      {/* Thông tin người nhận */}
              <Text style={styles.sectionTitle}>Thông tin giao hàng :</Text>

      <View style={styles.userInfoSection}>
        <Text style={styles.userInfoText}>Tên: {user.name || "Đang tải..."}</Text>
        <Text style={styles.userInfoText}>Số điện thoại: {user.phone || "Đang tải..."}</Text>
        <Text style={styles.userInfoText}>Địa chỉ: {user.address || "Đang tải..."}</Text>
      </View>

      {/* Danh sách sản phẩm */}
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Sản phẩm :</Text>
        {products.length > 0 ? (
          products.map((product, index) => (
            <View key={index} style={styles.productBox}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDesc} numberOfLines={2} ellipsizeMode="tail">{product.description}</Text>
              <Text style={styles.productPrice}>
                {Number(product.price).toLocaleString()}₫ x{product.quantity}
              </Text>
            </View>
          ))
        ) : (
          <Text>Đang tải sản phẩm...</Text>
        )}
      </View>

      {/* Mã khuyến mãi */}
      <View style={styles.voucherSection}>
        <Text style={styles.sectionTitle}>EightMart Voucher :</Text>
        <TouchableOpacity onPress={handleSelectVoucher}>
          <View style={styles.voucherRow}>
            <Text style={styles.voucherText}>
              {selectedVoucherCode ? `Mã: ${selectedVoucherCode}` : "Chọn Mã Phiếu Ưu Đãi"}
            </Text>
            <Text style={styles.voucherBtn}>{selectedVoucherCode ? "Đổi mã" : "Chọn mã"}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Vận chuyển */}
      <View style={styles.shippingSection}>
        <Text style={styles.sectionTitle}>Phương thức vận chuyển :</Text>
        <View style={styles.shippingRow}>
          <Text style={styles.shippingText}>Nhanh</Text>
          <Text style={styles.shippingCost}>0₫</Text>
        </View>
        <Text style={styles.shippingDetail}>Đảm bảo nhận hàng từ 25 Tháng 5 - 29 Tháng 5</Text>
      </View>

      {/* Phương thức thanh toán */}
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Phương thức thanh toán :</Text>
        {["COD", "VNPay"].map((method) => (
          <TouchableOpacity
            key={method}
            style={[
              styles.option,
              selectedMethod === method && styles.selectedOption,
            ]}
            onPress={() => setSelectedMethod(method)}
          >
            <Text style={styles.optionText}>
              {method === "COD" ? "💰 Thanh toán khi nhận hàng" :
               "💳 AgriBank"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tổng kết */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Tổng số tiền ({products.length} sản phẩm): {totalAmount.toLocaleString()}₫</Text>
        {selectedVoucherCode && (
          <Text style={styles.discountText}>Mã giảm: {selectedVoucherCode} - Giảm {discountAmount}%</Text>
        )}
        <Text style={styles.totalText}>Cần thanh toán: {finalAmount.toLocaleString()}₫</Text>
      </View>

      {/* Nút đặt hàng */}
      <TouchableOpacity
        style={[styles.confirmButton, loading && styles.disabledButton]}
        onPress={handleOrderButton}
        disabled={loading}
      >
        <Text style={styles.confirmText}>
          {loading ? "Đang xử lý..." : selectedMethod === "VNPay" ? "Thanh toán AgriBank" : "Đặt hàng"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  userInfoSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfoText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
  },
  productsSection: {
    marginBottom: 20,
  },
  productBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  productDesc: {
    fontSize: 14,
    color: colors.muted,
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  voucherSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  voucherRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  voucherText: {
    fontSize: 16,
    color: colors.text,
  },
  voucherBtn: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  shippingSection: {
    marginBottom: 16,
  },
  shippingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shippingText: {
    fontSize: 16,
    color: colors.text,
  },
  shippingCost: {
    fontSize: 16,
    color: colors.text,
  },
  shippingDetail: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
  },
  paymentSection: {
    marginBottom: 16,
  },
  option: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  summary: {
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  discountText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: colors.muted,
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
