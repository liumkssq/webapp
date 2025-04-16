<template>
  <van-swipe-cell class="cart-item">
    <div class="item-content">
      <van-checkbox :model-value="item.selected" @click="toggleSelect" class="item-checkbox"></van-checkbox>
      <van-image
        :src="item.imageUrl || defaultImage"
        fit="cover"
        class="item-image"
        @click="goToProduct"
      />
      <div class="item-details">
        <div class="item-title" @click="goToProduct">{{ item.title }}</div>
        <div class="item-specs">{{ item.specs || '默认规格' }}</div>
        <div class="item-price-quantity">
          <span class="item-price">¥{{ (item.price).toFixed(2) }}</span>
          <van-stepper
            :model-value="item.quantity"
            @change="onQuantityChange"
            :min="1"
            :max="item.stock || 99"
            integer
            button-size="22"
            class="item-stepper"
            :disabled="!item.selected" <!-- Optionally disable stepper if not selected -->
          />
        </div>
      </div>
    </div>
    <template #right>
      <van-button square text="删除" type="danger" class="delete-button" @click="removeItem" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { SwipeCell as VanSwipeCell, Button as VanButton, Image as VanImage, Stepper as VanStepper, Checkbox as VanCheckbox, showToast } from 'vant';
import defaultImage from '@/assets/images/default-placeholder.png'; // Ensure you have a default image

const props = defineProps({
  item: {
    type: Object,
    required: true,
    default: () => ({ // Provide default structure for safety
        id: null,
        productId: null,
        title: '商品标题',
        imageUrl: '',
        specs: '',
        price: 0,
        quantity: 1,
        stock: 99,
        selected: true
    })
  }
});

const emit = defineEmits(['update:quantity', 'remove', 'toggle-select']);
const router = useRouter();

const onQuantityChange = (value) => {
  // Only emit if value changes and is valid
  if (value !== props.item.quantity && value > 0) {
      console.log(`Quantity changed for item ${props.item.id} to ${value}`);
      // Check stock before emitting? Or let parent handle API error? Let parent handle.
      emit('update:quantity', { itemId: props.item.id, quantity: value });
  }
};

const removeItem = () => {
    console.log(`Remove item clicked: ${props.item.id}`);
    emit('remove', props.item.id);
};

const toggleSelect = () => {
    console.log(`Toggle select clicked for item: ${props.item.id}`);
    emit('toggle-select', props.item.id);
};

const goToProduct = () => {
  if (props.item.productId) {
    // Assuming product detail route name is 'ProductDetail' and expects productId
    router.push({ name: 'ProductDetail', params: { id: props.item.productId } });
  } else {
    showToast('无法跳转到商品详情');
  }
};
</script>

<style scoped>
.cart-item {
  background-color: #fff;
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden; /* Ensure rounded corners apply */
}

.item-content {
  display: flex;
  align-items: center;
  padding: 10px;
  position: relative; /* For absolute positioning if needed */
}

.item-checkbox {
  margin-right: 10px;
  /* Make checkbox area slightly larger for easier tapping */
   flex-shrink: 0;
}

.item-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  margin-right: 10px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.item-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 80px; /* Match image height */
}

.item-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 4px;
   display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
   cursor: pointer;
}

.item-specs {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.item-price-quantity {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 16px;
  color: #ff4d4f;
  font-weight: bold;
}

.item-stepper {
  /* Adjust stepper size or appearance if needed */
}

.delete-button {
  height: 100%; /* Make delete button fill the height */
}
</style>