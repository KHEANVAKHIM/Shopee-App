// ========== IMPORTS ==========
import React, { useEffect, useState, useLayoutEffect } from "react";
import NotLoggedIn from "../settings/NotLoggedIn";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BASE_URL } from "../ipconfig";
import Navbar from "./Navbar";

// ========== TYPES ==========
interface CartItem {
  cart_id: string;
  name: string;
  images: string;
  price: number;
  quantity: number;
  product_id: number;
  description: string;
}

type RootStackParamList = {
  "Tạo Đơn Hàng": { userId: number | null; totalAmount: number };
  "Giỏ Hàng": undefined;
};

type CartScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Giỏ Hàng"
>;

type Props = {
  navigation: CartScreenNavigationProp;
};

// ========== COMPONENT ==========
export default function CartScreen({ navigation }: Props) {
  // ========== STATE MANAGEMENT ==========
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // ========== EFFECTS ==========
  // Cập nhật tiêu đề navigation theo số lượng sản phẩm
  useLayoutEffect(() => {
    const count = cartItems.length;
    navigation.setOptions({
      title: count > 0 ? `Giỏ Hàng (${count})` : "Giỏ Hàng",
    });
  }, [navigation, cartItems]);

  // Lấy userId từ AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("userId").then((id) => {
      if (id) setUserId(parseInt(id, 10));
    });
  }, []);

  // Lấy danh sách sản phẩm trong giỏ hàng
  useEffect(() => {
    if (userId === null) return;

    setLoading(true);
    fetch(`${BASE_URL}/cart/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi khi tải giỏ hàng");
        return res.json();
      })
      .then((data) => {
        setCartItems(data);
      })
      .catch((error) => {
        Alert.alert("Lỗi", error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  // Kiểm tra đăng nhập
  if (!userId) {
    return <NotLoggedIn navigation={navigation} />;
  }

  // ========== HANDLERS ==========
  // Tính tổng tiền
  const getTotalAmount = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // Thay đổi số lượng sản phẩm (tăng/giảm)
  const handleQuantityChange = async (productId: number, change: number) => {
    const updatedItem = cartItems.find((item) => item.product_id === productId);
    if (!updatedItem) {
      return;
    }
    const newQuantity = Math.max(1, updatedItem.quantity + change);
    
    try {
      setLoading(true);
      const res = await axios.put(`${BASE_URL}/cart`, {
        cart_id: updatedItem.cart_id,
        product_id: productId,
        quantity: newQuantity,
      });
      
      if (res.status === 200) {
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            item.product_id === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      } else {
        Alert.alert("Lỗi", res.data?.message || "Không thể cập nhật số lượng.");
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể kết nối tới server."
      );
    } finally {
      setLoading(false);
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const handleRemoveCartItem = async (cartId: string) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              if (!userId) {
                Alert.alert(
                  "Lỗi",
                  "Bạn cần đăng nhập để thực hiện thao tác này."
                );
                return;
              }

              const item = cartItems.find((i) => i.cart_id === cartId);
              if (!item) {
                Alert.alert("Lỗi", "Không tìm thấy sản phẩm trong giỏ hàng.");
                return;
              }

              setLoading(true);
              const res = await axios.delete(`${BASE_URL}/cart1`, {
                headers: { "Content-Type": "application/json" },
                data: {
                  product_id: item.product_id,
                  cart_id: cartId,
                },
              });

              if (res.status === 200) {
                setCartItems((prevItems) =>
                  prevItems.filter((item) => item.cart_id !== cartId)
                );
                Alert.alert("Thành công", "Đã xóa sản phẩm khỏi giỏ hàng.");
                navigation.replace("Giỏ Hàng");
              } else {
                Alert.alert(
                  "Lỗi",
                  res.data?.message || "Xóa sản phẩm thất bại."
                );
              }
            } catch (error: any) {
              Alert.alert(
                "Lỗi",
                error.response?.data?.message || "Không thể kết nối tới server."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Điều hướng đến trang đặt hàng
  const handleCheckout = () => {
    const totalAmount = getTotalAmount();
    if (totalAmount === 0) {
      Alert.alert("Thông báo", "Giỏ hàng của bạn đang trống.");
      return;
    }
    navigation.navigate("Tạo Đơn Hàng", { userId, totalAmount });
  };

  // ========== RENDER FUNCTIONS ==========
  // Render cart item
  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.item}>
      <Image
        source={{
          uri: item.images
            ? `${BASE_URL}/uploads/${item.images}`
            : "https://via.placeholder.com/100",
        }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
          {item.description}
        </Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item.product_id, -1)}
            style={styles.quantityButton}
            activeOpacity={0.7}
          >
          <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
           onPress={() => handleQuantityChange(item.product_id, 1)}
           style={styles.quantityButton}
           activeOpacity={0.7}
          >
           <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.price}>{Number(item.price || 0).toLocaleString('vi-VN')} đ</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveCartItem(item.cart_id)}
        style={styles.deleteButton}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteButtonText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#ff4d4d" />
      </View>
    );
  }

  // ========== RENDER ==========
  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item, index) => `${item.cart_id}_${item.product_id}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListEmptyComponent={() => (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text>Giỏ hàng của bạn đang trống.</Text>
          </View>
        )}
      />
      <View style={styles.footerContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Tổng cộng: {getTotalAmount().toLocaleString()}đ
          </Text>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutButtonText}>
              Mua hàng ({cartItems.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.navbarContainer}>
        <Navbar navigation={navigation} userId={userId} />
      </View>
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: { flex: 1,
     backgroundColor: "#fff"
     },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 10,
    backgroundColor: "#f8f9fa",
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  image: { width: 80, height: 80, marginRight: 10 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "500", color: "#333" },
  description: { fontSize: 12, color: "#888", marginVertical: 2 },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  quantityButton: {
    backgroundColor: "#ddd",
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  quantityButtonText: { fontSize: 18, fontWeight: "bold", color: "#333" },
  quantity: { marginHorizontal: 10, fontSize: 16, fontWeight: "500" },
  price: { fontSize: 16, color: "#d81b60", fontWeight: "bold" },
  deleteButton: { backgroundColor: "#6A0DAD", padding: 5, borderRadius: 5 },
  deleteButtonText: { color: "#fff", fontWeight: "bold" },
  shippingOptions: {
    padding: 10,
    backgroundColor: "#6A0DAD",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  shippingText: { fontSize: 12, color: "#555" },
  voucherButton: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  voucherText: { color: "#6A0DAD", fontWeight: "bold" },
  footerContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  navbarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  checkoutButton: {
    backgroundColor: "#6A0DAD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  checkoutButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
