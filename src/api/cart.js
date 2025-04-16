import { ref, computed } from 'vue';

// Mock data - in a real app, this would not exist client-side
const mockCartItems = ref([
  { id: 'cart1', productId: 'prod1', title: '经典款白T恤', imageUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', specs: '白色, L', price: 89.00, quantity: 2, stock: 10, selected: true },
  { id: 'cart2', productId: 'prod2', title: '透气运动短裤', imageUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', specs: '黑色, M', price: 129.00, quantity: 1, stock: 5, selected: true },
  { id: 'cart3', productId: 'prod3', title: '帆布双肩包', imageUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', specs: '卡其色', price: 199.00, quantity: 1, stock: 8, selected: false },
  { id: 'cart4', productId: 'prod4', title: '复古石英手表', imageUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', specs: '钢带', price: 499.00, quantity: 1, stock: 3, selected: true, },
]);

// --- Mock API Functions ---

/**
 * 获取购物车列表 (Mock)
 */
export function getCartItems() {
  console.log('[API Mock] getCartItems called');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ code: 200, message: 'success', data: [...mockCartItems.value] }); // Return a copy
    }, 300);
  });
}

/**
 * 更新购物车商品数量 (Mock)
 * @param {object} payload
 * @param {string} payload.itemId
 * @param {number} payload.quantity
 */
export function updateCartItemQuantity({ itemId, quantity }) {
  console.log(`[API Mock] updateCartItemQuantity called for ${itemId} with quantity ${quantity}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const itemIndex = mockCartItems.value.findIndex(item => item.id === itemId);
      if (itemIndex !== -1 && quantity > 0 && quantity <= mockCartItems.value[itemIndex].stock) {
        mockCartItems.value[itemIndex].quantity = quantity;
        resolve({ code: 200, message: '更新成功' });
      } else if (itemIndex !== -1 && quantity > mockCartItems.value[itemIndex].stock) {
        reject({ code: 400, message: '库存不足' });
      }
       else if (itemIndex === -1){
           reject({ code: 404, message: '商品不存在' });
       } else {
           reject({ code: 400, message: '无效数量' });
       }
    }, 150);
  });
}

/**
 * 移除购物车商品 (Mock)
 * @param {object} payload
 * @param {string[]} payload.itemIds
 */
export function removeCartItems({ itemIds }) {
  console.log('[API Mock] removeCartItems called with ids:', itemIds);
  return new Promise((resolve) => {
    setTimeout(() => {
      mockCartItems.value = mockCartItems.value.filter(item => !itemIds.includes(item.id));
      resolve({ code: 200, message: '删除成功' });
    }, 200);
  });
}

/**
 * 选中/取消选中购物车商品 (Mock)
 * @param {object} payload
 * @param {string[]} payload.itemIds
 * @param {boolean} payload.selected
 */
export function selectCartItems({ itemIds, selected }) {
    console.log(`[API Mock] selectCartItems called for ids: ${itemIds} with selected: ${selected}`);
    return new Promise((resolve) => {
        setTimeout(() => {
            mockCartItems.value.forEach(item => {
                if (itemIds.includes(item.id)) {
                    item.selected = selected;
                }
            });
            resolve({ code: 200, message: '操作成功' });
        }, 100);
    });
}

/**
 * 全选/取消全选 (Mock Helper, usually handled client-side but mock API provided)
 * @param {object} payload
 * @param {boolean} payload.selected
 */
export function selectAllCartItems({ selected }) {
    console.log(`[API Mock] selectAllCartItems called with selected: ${selected}`);
    return new Promise((resolve) => {
        setTimeout(() => {
            mockCartItems.value.forEach(item => {
                item.selected = selected;
            });
            resolve({ code: 200, message: '操作成功' });
        }, 100);
    });
}
