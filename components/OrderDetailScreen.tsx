// ========== IMPORTS ==========
import React, { useEffect, useState } from "react";
import { RootStackParamList } from "../types";
import { BASE_URL } from "../ipconfig";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Navbar from "./Navbar";

// ========== TYPES ==========
type OrderDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Chi Tiết Đơn Hàng"
>;

// ========== CONSTANTS ==========
const colors = {
  primary: "#2c3e50",
  accent: "#ff6f61",
  background: "#f9f9f9",
  text: "#333",
  muted: "#777",
  danger: "#e74c3c",
};

// ========== COMPONENT ==========
export default function OrderDetailScreen({ route }: any) {
  const { orderId } = route.params;
  
  // ========== STATE MANAGEMENT ==========
  const [details, setDetails] = useState<any[]>([]);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const navigation = useNavigation<OrderDetailScreenNavigationProp>();

  // ========== EFFECTS ==========
  // Load chi tiết đơn hàng khi component mount
  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  // ========== FUNCTIONS ==========
  // Lấy chi tiết đơn hàng từ API
  const fetchOrderDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/order/${orderId}`);
      const data = await res.json();

      if (res.ok) {
        if (Array.isArray(data.items)) {
          setDetails(data.items);
          setOrderInfo(data.orderInfo);
        } else {
          setDetails(data);
        }
      } else {
        setError(data.message || "Không thể tải chi tiết đơn hàng");
      }
    } catch (err) {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setLoading(false);
    }
  };

  // ========== HANDLERS ==========
  // Xóa sản phẩm khỏi đơn hàng
  const handleDeleteItem = async (orderDetailId: number) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn xóa sản phẩm này khỏi đơn hàng?",
      [
        { text: "Không" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              const res = await fetch(
                `${BASE_URL}/order-detail/${orderDetailId}`,
                {
                  method: "DELETE",
                }
              );
              const result = await res.json();
              if (res.ok) {
                if (details.length === 1) {
                  Alert.alert(
                    "Thành công",
                    "Đơn hàng không còn sản phẩm nào.",
                    [
                      {
                        text: "OK",
                        onPress: () => navigation.navigate("Quản Lý Đơn Hàng"),
                      },
                    ]
                  );
                } else {
                  Alert.alert("Thành công", "Đã xóa sản phẩm khỏi đơn hàng");
                  fetchOrderDetail();
                }
              } else {
                Alert.alert("Lỗi", result.message || "Xóa thất bại");
              }
            } catch (err) {
              Alert.alert("Lỗi", "Không thể xóa sản phẩm");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.item}>
      <View style={styles.itemRow}>
        <Text style={styles.labelKey}>Sản phẩm:</Text>
        <Text style={styles.labelValue}>{item.name || "Không rõ"}</Text>
      </View>
      <View style={styles.itemRow}>
        <Text style={styles.labelKey}>Số lượng:</Text>
        <Text style={styles.labelValue}>{item.quantity}</Text>
      </View>
      <View style={styles.itemRow}>
        <Text style={styles.labelKey}>Giá:</Text>
        <Text style={styles.labelValue}>
        {Number(item.price).toLocaleString('vi-VN')} đ
        </Text>
      </View>
      {orderInfo?.status === "Ordered" && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={styles.deleteButtonText}>Xóa sản phẩm</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ========== RENDER ==========
  return (
    <View style={styles.container}>
      <Text style={styles.title}> #{orderId}</Text>

      {orderInfo && (
        <View style={styles.orderInfoBox}>
          <Text style={styles.orderInfoText}>
            Tổng tiền: {orderInfo.total_amount?.toLocaleString()}₫
          </Text>
          <Text style={styles.orderInfoText}>
            Thanh toán: {orderInfo.payment_type || "Chưa chọn"}
          </Text>
          <Text style={styles.orderInfoText}>
            Ngày tạo: {new Date(orderInfo.created_at).toLocaleDateString()}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={details}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Navbar navigation={navigation} />
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "left",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingBottom: 120,
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labelKey: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    lineHeight: 24,
  },
  labelValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.muted,
    flex: 1,
    textAlign: "right",
    lineHeight: 24,
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: colors.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  orderInfoBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e8ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  orderInfoText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: colors.text,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: "#ffe6e6",
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ff9999",
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 24,
  },
});
