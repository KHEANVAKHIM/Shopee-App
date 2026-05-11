// ========== IMPORTS ==========
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BASE_URL } from "../ipconfig";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { theme } from "../styles/theme";

// ========== STYLES (Partial) ==========
const styles = StyleSheet.create({
  addToCartButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    ...theme.shadow.md,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  iconButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadow.md,
  },
});

// ========== COMPONENT ==========
export default function ProductDetailScreen({ route, navigation }: any) {
  // ========== STATE MANAGEMENT ==========
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const { productId } = route.params || {};

  // ========== EFFECTS ==========
  // Load dữ liệu khi component mount
  useEffect(() => {
    if (!productId) {
      Alert.alert("Lỗi", "Không tìm thấy sản phẩm");
      navigation.goBack();
      return;
    }

    fetchProduct();
    fetchUserId();
    fetchFeedbacks();
  }, [productId]);

  // Kiểm tra sản phẩm có trong yêu thích không
  useEffect(() => {
    if (userId) {
      checkIfFavorite();
    }
  }, [userId]);

  // ========== FUNCTIONS ==========
  // Lấy thông tin chi tiết sản phẩm
  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products/${productId}`);
      setProduct(res.data);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải thông tin sản phẩm");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Lấy userId từ AsyncStorage
  const fetchUserId = async () => {
    try {
      const id = await AsyncStorage.getItem("userId");
      if (id) {
        setUserId(parseInt(id, 10));
      }
    } catch (error) {
    }
  };

  // Lấy danh sách đánh giá sản phẩm
  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/feedbacks/product/${productId}`);
      setFeedbacks(res.data || []);
    } catch (err) {
    }
  };

  // Kiểm tra sản phẩm có trong danh sách yêu thích không
  const checkIfFavorite = async () => {
    if (!userId) return;

    try {
      const res = await axios.get(`${BASE_URL}/favorites/user/${userId}`);
      const favorites: any[] = res.data || [];
      const found = favorites.some((fav) => fav.product_id === productId);
      setIsFavorite(found);
    } catch (err) {
    }
  };

  // ========== HANDLERS ==========
  // Thêm sản phẩm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!userId) {
      Alert.alert("Thông báo", "VUi lòng đăng nhập để tiếp tục");
      return;
    }
    if (!product) {
      Alert.alert("Thông báo", "Sản phẩm không tồn tại");
      return;
    }

    try {
      await axios.post(`${BASE_URL}/cart-items`, {
        user_id: userId,
        product_id: product.id,
        quantity: 1,
      });
      Alert.alert("✅ Thành công", "Sản phẩm đã được thêm vào giỏ hàng");
    } catch (err) {
      Alert.alert("Lỗi", "Không thể thêm sản phẩm vào giỏ");
    }
  };

  // Thêm/xóa sản phẩm khỏi danh sách yêu thích
  const handleToggleFavorite = async () => {
    if (!userId || !product) {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để thực hiện thao tác này");
      return;
    }

    try {
      if (isFavorite) {
        // Gọi API xóa yêu thích
        await axios.delete(`${BASE_URL}/favorites`, {
          data: { user_id: userId, product_id: product.id },
        });
        setIsFavorite(false);
        Alert.alert("Thông báo", "Đã bỏ yêu thích sản phẩm");
      } else {
        // Gọi API thêm yêu thích
        await axios.post(`${BASE_URL}/favorites`, {
          user_id: userId,
          product_id: product.id,
        });
        setIsFavorite(true);
        Alert.alert("Thông báo", "Đã thêm sản phẩm vào yêu thích");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật yêu thích, vui lòng thử lại");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: theme.colors.text }}>Không tìm thấy sản phẩm.</Text>
      </View>
    );
  }

  // ========== RENDER ==========
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Image
        source={{
          uri: product.images
            ? `${BASE_URL}/uploads/${product.images}`
            : undefined,
        }}
        style={{
          width: "100%",
          height: 320,
          resizeMode: "cover",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      />

      <View
        style={{
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.backgroundLight,
          marginHorizontal: theme.spacing.lg,
          marginTop: -theme.spacing.lg,
          borderRadius: theme.borderRadius.lg,
        }}
      >
        <Text
          style={{
            fontSize: theme.fontSize.xxxl,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.md,
          }}
        >
          {product.name}
        </Text>
        <Text
          style={{
            fontSize: theme.fontSize.xxl,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.accent,
            marginBottom: theme.spacing.lg,
          }}
        >
          {Number(product.price).toLocaleString('vi-VN')} đ
        </Text>
        <Text
          style={{
            fontSize: theme.fontSize.lg,
            color: theme.colors.textMuted,
            lineHeight: 24,
            marginBottom: theme.spacing.xl,
          }}
        >
          {product.description}
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
          >
            <Text style={{ color: theme.colors.textLight, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.semibold }}>
              Thêm vào giỏ hàng
            </Text>
          </TouchableOpacity>

          {userId && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleToggleFavorite}
            >
              <FontAwesome
                name="heart"
                size={28}
                color={isFavorite ? "red" : "white"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View
        style={{
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.background,
          marginHorizontal: theme.spacing.lg,
          marginTop: theme.spacing.lg,
          borderRadius: theme.borderRadius.lg,
        }}
      >
        <Text style={{ fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.semibold, marginBottom: theme.spacing.md, color: theme.colors.text }}>
          ⭐ Đánh giá sản phẩm
        </Text>
        {feedbacks.length > 0 ? (
          feedbacks.map((item, idx) => (
            <View
              key={idx}
              style={{
                marginBottom: theme.spacing.lg,
                backgroundColor: theme.colors.backgroundLight,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                ...theme.shadow.sm,
              }}
            >
              <Text style={{ fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.lg, color: theme.colors.text }}>
                {item.name || "Người dùng ẩn danh"}
              </Text>
              <Text style={{ marginTop: theme.spacing.xs, color: theme.colors.textSecondary }}>
                {item.feedback}
              </Text>
              <Text style={{ marginTop: theme.spacing.xs, color: theme.colors.text }}>⭐ {item.star}</Text>
              {item.images ? (
                <Image
                  source={{ uri: `${BASE_URL}/uploads/${item.images}` }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: theme.borderRadius.md,
                    marginTop: theme.spacing.sm,
                  }}
                />
              ) : null}
            </View>
          ))
        ) : (
          <Text style={{ textAlign: "center", color: theme.colors.textMuted }}>
            Chưa có đánh giá nào cho sản phẩm này.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
