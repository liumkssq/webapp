<template>
  <div class="cart-page">
    <HeaderNav title="购物车" :showBackButton="true" @back="goBack">
      <template #right>
        <span @click="toggleEditMode" class="edit-toggle">{{ isEditMode ? '完成' : '管理' }}</span>
      </template>
    </HeaderNav>

    <div v-if="loading" class="loading-state">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <div v-else-if="error" class="error-state">
      <van-empty :description="error || '加载失败，请稍后重试'" image="error">
         <van-button type="primary" size="small" @click="fetchCart">点击重试</van-button>
      </van-empty>
    </div>

    <div v-else-if="cartItems.length === 0" class="empty-state">
       <van-empty description="购物车空空如也" image="https://img01.yzcdn.cn/vant/empty-image-cart.png">
        <van-button type="primary" size="small" round @click="goToMarket">去逛逛</van-button>
      </van-empty>
    </div>

    <div v-else class="cart-content">
      <div class="cart-items-list">
        <CartItem
          v-for="item in cartItems"
          :key="item.id"
          :item="item"
          @update:quantity="handleUpdateQuantity"
          @remove="handleRemoveItem"
          @toggle-select="handleToggleSelect"
        />
      </div>

      <!-- Submit Bar -->
      <van-submit-bar
        :price="totalPrice"
        :button-text="isEditMode ? '删除选中' : `结算(${selectedCount})`"
        @submit="handleSubmit"
        :disabled="isSubmitDisabled"
        button-type="primary"
        class="cart-submit-bar"
      >
        <template #default>
          <van-checkbox v-model="isAllSelected" @click="handleSelectAll" class="select-all-checkbox">全选</van-checkbox>
        </template>
      </van-submit-bar>
    </div>

     <!-- Bottom padding to prevent overlap with submit bar -->
    <div style="height: 50px;"></div>

    <!-- Footer Navigation -->
    <FooterNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog, Loading as VanLoading, Empty as VanEmpty, Button as VanButton, SubmitBar as VanSubmitBar, Checkbox as VanCheckbox } from 'vant';
import HeaderNav from '@/components/HeaderNav.vue';
import FooterNav from '@/components/FooterNav.vue';
import CartItem from '@/components/cart/CartItem.vue';
import { getCartItems, updateCartItemQuantity, removeCartItems, selectCartItems, selectAllCartItems } from '@/api/cart.js'; // Use Mock API for now

const router = useRouter();
const cartItems = ref([]);
const loading = ref(true);
const error = ref(null);
const isEditMode = ref(false); // Toggle between checkout and edit mode

// Fetch cart items
const fetchCart = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await getCartItems();
    if (response.code === 200) {
      cartItems.value = response.data || [];
       console.log("Fetched cart items:", cartItems.value);
    } else {
      throw new Error(response.message || '获取购物车数据失败');
    }
  } catch (err) {
    console.error("Error fetching cart:", err);
    error.value = err.message || '加载购物车失败';
    showToast(error.value);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchCart);

// Calculations
const selectedItems = computed(() => cartItems.value.filter(item => item.selected));
const selectedCount = computed(() => selectedItems.value.length);
const totalPrice = computed(() => {
  const total = selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return Math.round(total * 100); // Vant SubmitBar expects price in cents
});

// All Selected Checkbox Logic
const isAllSelected = computed({
  get: () => cartItems.value.length > 0 && selectedCount.value === cartItems.value.length,
  set: (value) => {
      handleSelectAll(value);
  }
});

const handleSelectAll = async (forceSelect = null) => {
    const shouldSelect = forceSelect !== null ? forceSelect : !isAllSelected.value;
    console.log(`Handle select all: ${shouldSelect}`);
    const itemIds = cartItems.value.map(item => item.id);
    if (itemIds.length === 0) return;

    // --- Using Mock API (Replace with real API call) ---
    try {
        // Mock selectAllCartItems or iterate selectCartItems
        await selectAllCartItems({ selected: shouldSelect }); // Assuming a dedicated API endpoint
        // Update local state immediately for responsiveness
        cartItems.value.forEach(item => item.selected = shouldSelect);
    } catch (err) {
        console.error("Error selecting all:", err);
        showToast('操作失败，请重试');
    }
    // --- End Mock API ---
};

// Toggle individual item selection
const handleToggleSelect = async (itemId) => {
  const item = cartItems.value.find(item => item.id === itemId);
  if (!item) return;
  const newSelectedState = !item.selected;
  console.log(`Toggle select for item ${itemId} to ${newSelectedState}`);

   // --- Using Mock API (Replace with real API call) ---
   try {
        await selectCartItems({ itemIds: [itemId], selected: newSelectedState });
        item.selected = newSelectedState; // Update local state
   } catch (err) {
       console.error("Error toggling select:", err);
       showToast('操作失败，请重试');
   }
   // --- End Mock API ---
};

// Update item quantity
const handleUpdateQuantity = async ({ itemId, quantity }) => {
  console.log(`Handle update quantity for item ${itemId} to ${quantity}`);
  const item = cartItems.value.find(item => item.id === itemId);
   if (!item) return;

   // --- Using Mock API (Replace with real API call) ---
   try {
        await updateCartItemQuantity({ itemId, quantity });
        item.quantity = quantity; // Update local state
   } catch (err) {
       console.error("Error updating quantity:", err);
       showToast(err.message || '更新数量失败');
       // Optional: Revert quantity visually if API fails strongly?
       // Or re-fetch cart data? For now, just show toast.
   }
    // --- End Mock API ---
};

// Remove single item (from CartItem component's emit)
const handleRemoveItem = async (itemId) => {
    showConfirmDialog({
        title: '确认删除',
        message: '确定要将这件商品移出购物车吗？',
    }).then(async () => {
        console.log(`Confirmed remove for item ${itemId}`);
        // --- Using Mock API (Replace with real API call) ---
        try {
            await removeCartItems({ itemIds: [itemId] });
             // Update local state
            cartItems.value = cartItems.value.filter(item => item.id !== itemId);
            showToast('删除成功');
        } catch(err) {
            console.error("Error removing item:", err);
            showToast('删除失败，请重试');
        }
        // --- End Mock API ---
    }).catch(() => {
        // cancel
        console.log('Remove cancelled');
    });
};

// Submit Action (Checkout or Delete)
const handleSubmit = async () => {
  if (isEditMode.value) {
    // Delete selected items
     if (selectedCount.value === 0) {
      showToast('请选择要删除的商品');
      return;
    }
    showConfirmDialog({
      title: '确认删除',
      message: `确定要删除选中的 ${selectedCount.value} 件商品吗？`,
    }).then(async () => {
      const idsToRemove = selectedItems.value.map(item => item.id);
      console.log(`Confirmed remove selected items:`, idsToRemove);
      // --- Using Mock API (Replace with real API call) ---
      try {
          await removeCartItems({ itemIds: idsToRemove });
          // Update local state
          cartItems.value = cartItems.value.filter(item => !idsToRemove.includes(item.id));
          showToast('删除成功');
          isEditMode.value = false; // Exit edit mode after deletion
      } catch(err) {
          console.error("Error removing selected items:", err);
          showToast('删除失败，请重试');
      }
      // --- End Mock API ---
    }).catch(() => {
      // cancel
       console.log('Remove selected cancelled');
    });

  } else {
    // Proceed to checkout
    if (selectedCount.value === 0) {
      showToast('请选择要结算的商品');
      return;
    }
    console.log('Proceeding to checkout with items:', selectedItems.value);
    // Store selected items or IDs (e.g., in Pinia store or route query/params)
    // Navigate to order confirmation page
    // router.push({ name: 'OrderConfirmation', query: { items: JSON.stringify(selectedItems.value.map(item => item.id)) } }); // Example
    showToast(`准备结算 ${selectedCount.value} 件商品`);
    // Placeholder for navigation
     router.push('/path/to/order-confirmation'); // Replace with actual checkout route
  }
};

// Toggle Edit Mode
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
};

// Disable submit button logic
const isSubmitDisabled = computed(() => {
  return selectedCount.value === 0; // Disable if no items are selected
});

// Navigation helpers
const goBack = () => {
  router.go(-1);
};

const goToMarket = () => {
  router.push({ name: 'ProductList' }); // Adjust route name if needed
};

</script>

<style scoped>
.cart-page {
  padding-top: 46px; /* Adjust based on HeaderNav height */
  padding-bottom: 100px; /* Add more padding to ensure submit bar doesn't overlap content when scrolling AND footer is visible */
  min-height: 100vh;
  background-color: #f7f8fa; /* Light background */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.edit-toggle {
  font-size: 14px;
  color: var(--van-nav-bar-icon-color); /* Match header icon color */
  cursor: pointer;
}

.loading-state, .error-state, .empty-state {
  margin-top: 40px;
  text-align: center;
  flex-grow: 1; /* Allow empty/loading states to take up space */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.cart-content {
  padding: 10px;
  flex-grow: 1;
}

.cart-items-list {
  /* Styles for the list container if needed */
}

.cart-submit-bar {
  position: fixed; /* Ensure it stays at the bottom */
  left: 0;
  right: 0;
  bottom: 50px; /* Position above the FooterNav */
  z-index: 99; /* Below HeaderNav (usually 100+) but above content */
  border-top: 1px solid #eee;
  background-color: #fff;
}

.select-all-checkbox {
    margin-left: 10px; /* Add some space from the edge */
}

/* Ensure FooterNav is always visible below the submit bar */
.footer-nav-wrapper { /* Assuming FooterNav has this class or similar */
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100; /* Ensure FooterNav is above submit bar if needed, or adjust submit bar z-index */
}

</style>
