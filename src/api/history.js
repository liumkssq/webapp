import { ref } from 'vue';

// Mock Data
const mockHistory = ref([
  { id: 'hist1', type: 'product', itemId: 'prod1', title: '经典款白T恤', imageUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', timestamp: '2023-10-27T14:30:00Z', price: 89.00 },
  { id: 'hist2', type: 'article', itemId: 'art2', title: '秋季校园穿搭指南', imageUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', timestamp: '2023-10-27T11:05:00Z' },
  { id: 'hist3', type: 'product', itemId: 'prod3', title: '帆布双肩包', imageUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', timestamp: '2023-10-26T18:20:00Z', price: 199.00 },
  { id: 'hist4', type: 'lostfound', itemId: 'lf1', title: '寻物启事：丢失一把雨伞', imageUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', timestamp: '2023-10-26T09:15:00Z' },
  { id: 'hist5', type: 'product', itemId: 'prod4', title: '复古石英手表', imageUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', timestamp: '2023-10-25T20:00:00Z', price: 499.00 },
]);

// --- Mock API Functions ---

/**
 * 获取浏览历史 (Mock)
 * @param {object} params
 * @param {number} params.page
 * @param {number} params.limit
 */
export function getBrowsingHistory(params = { page: 1, limit: 10 }) {
  console.log('[API Mock] getBrowsingHistory called with params:', params);
  return new Promise((resolve) => {
    setTimeout(() => {
      // Sort by timestamp descending
      const sortedHistory = [...mockHistory.value].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const paginated = sortedHistory.slice(start, end);

      resolve({
        code: 200,
        message: 'success',
        data: {
          list: paginated,
          total: sortedHistory.length
        }
      });
    }, 350);
  });
}

/**
 * 删除浏览历史记录 (Mock)
 * @param {object} payload
 * @param {string[]} payload.historyIds
 */
export function removeHistoryItems({ historyIds }) {
  console.log('[API Mock] removeHistoryItems called with ids:', historyIds);
  return new Promise((resolve) => {
    setTimeout(() => {
      mockHistory.value = mockHistory.value.filter(item => !historyIds.includes(item.id));
      resolve({ code: 200, message: '删除成功' });
    }, 150);
  });
}

/**
 * 清空浏览历史 (Mock)
 */
export function clearAllHistory() {
    console.log('[API Mock] clearAllHistory called');
    return new Promise((resolve) => {
        setTimeout(() => {
            mockHistory.value = [];
            resolve({ code: 200, message: '历史记录已清空' });
        }, 200);
    });
}
