<template>
  <div class="my-favorites-page">
    <header-nav title="我的收藏" back/>

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" />
      <p>正在加载您的收藏...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p class="error-message">加载失败: {{ error }}</p>
      <van-button plain type="primary" @click="fetchUserFavorites" class="retry-button">重试</van-button>
    </div>

    <div v-else-if="favorites.length === 0" class="empty-container">
      <van-empty description="您还没有收藏任何内容" />
      <router-link to="/" class="explore-button">去逛逛</router-link>
    </div>

    <div v-else class="favorites-list">
      <!-- Display different card types based on favorite type -->
      <template v-for="fav in favorites" :key="fav.favoriteId || `${fav.type}-${fav.itemId}`">
        <!-- Product Favorite -->
        <product-card
          v-if="fav.type === 'product' && fav.itemDetails"
          :product="fav.itemDetails"
          @click="goToDetail(fav.type, fav.itemId)"
          :show-actions="false"
        >
          <template #actions>
             <van-button size="small" type="danger" @click.stop="removeFavorite(fav)">取消收藏</van-button>
          </template>
        </product-card>

        <!-- Article Favorite -->
         <article-card
           v-if="fav.type === 'article' && fav.itemDetails"
           :article="fav.itemDetails"
           @click="goToDetail(fav.type, fav.itemId)"
           :show-actions="false"
         >
           <template #actions>
              <van-button size="small" type="danger" @click.stop="removeFavorite(fav)">取消收藏</van-button>
           </template>
         </article-card>

         <!-- Lost/Found Favorite -->
          <lost-found-card
            v-if="fav.type === 'lostfound' && fav.itemDetails"
            :item="fav.itemDetails"
            @click="goToDetail(fav.type, fav.itemId)"
            :show-actions="false"
          >
            <template #actions>
               <van-button size="small" type="danger" @click.stop="removeFavorite(fav)">取消收藏</van-button>
            </template>
          </lost-found-card>

          <!-- Fallback if itemDetails are missing -->
           <div v-if="!fav.itemDetails" class="favorite-item-fallback">
              <p>收藏项 ({{ fav.type }} - ID: {{ fav.itemId }})</p>
              <van-button size="small" type="danger" @click.stop="removeFavorite(fav)">取消收藏</van-button>
           </div>
      </template>
    </div>

    <footer-nav />
  </div>
</template>

<script setup>
import { useUserStore } from '@/store/user';
import { showToast } from 'vant';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

// 从各模块导入收藏相关API
import { favoriteArticle, getFavoriteArticles } from '@/api/article'; // favoriteArticle(id, false) 用于取消收藏
import { unfavoriteLostFound } from '@/api/lostfound'; // 假设 lostFound.js 有 getFavoriteLostFounds (待确认或添加)
import { getFavoriteProducts, unfavoriteProduct } from '@/api/product';
// 假设有 getFavoriteLostFounds 用于获取收藏的失物招领
// import { getFavoriteLostFounds, unfavoriteLostFound } from '@/api/lostfound';

// 导入组件
import FooterNav from '@/components/FooterNav.vue';
import HeaderNav from '@/components/HeaderNav.vue';
import ArticleCard from '@/components/cards/ArticleCard.vue';
import LostFoundCard from '@/components/cards/LostFoundCard.vue';
import ProductCard from '@/components/cards/ProductCard.vue';

const router = useRouter();
const userStore = useUserStore();

const favorites = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(() => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录');
    router.replace('/login');
    loading.value = false;
    return;
  }
  fetchUserFavorites();
});

const fetchUserFavorites = async () => {
  loading.value = true;
  error.value = null;
  favorites.value = [];
  try {
    const userId = userStore.userInfo?.id;
    if (!userId) {
       await userStore.getUserInfo();
       if(!userStore.userInfo?.id) throw new Error('无法获取用户信息，请重新登录');
    }
    console.log(`Fetching favorites for user ID: ${userStore.userInfo.id}`);

    // 获取商品收藏
    const productFavsResponse = await getFavoriteProducts();
    console.log('getFavoriteProducts原始响应:', productFavsResponse);

    // 尝试获取文章收藏
    let articleFavsResponse;
    try {
      articleFavsResponse = await getFavoriteArticles();
      console.log('getFavoriteArticles原始响应:', articleFavsResponse);
    } catch (e) {
      console.warn('获取文章收藏失败，可能API不存在', e);
      articleFavsResponse = null;
    }

    let allFavorites = [];

    // 处理商品收藏结果
    if (productFavsResponse) {
      const productFavs = productFavsResponse.list || productFavsResponse.data?.list || [];
      
      allFavorites.push(...productFavs.map(item => ({ 
        type: 'product', 
        itemId: item.id, 
        itemDetails: item, 
        favoriteId: item.favoriteId || item.id
      })));
    }

    // 处理文章收藏结果
    if (articleFavsResponse) {
      const articleFavs = articleFavsResponse.list || articleFavsResponse.data?.list || [];
      
      allFavorites.push(...articleFavs.map(item => ({ 
        type: 'article', 
        itemId: item.id, 
        itemDetails: item, 
        favoriteId: item.favoriteId || item.id
      })));
    }

    favorites.value = allFavorites;
    console.log('合并后的收藏列表:', favorites.value);

  } catch (err) {
    console.error("获取用户收藏失败:", err);
    error.value = err.message || '网络错误，请稍后重试';
    showToast(error.value);
    if (err.message.includes('登录') || err.status === 401) {
        userStore.clearUserInfo();
        router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath }});
    }
  } finally {
    loading.value = false;
  }
};

// 跳转到详情页
const goToDetail = (type, itemId) => {
  let routeName;
  switch (type) {
    case 'product':
      routeName = 'ProductDetail';
      break;
    case 'article':
      routeName = 'ArticleDetail';
      break;
    case 'lostfound':
       routeName = 'LostFoundDetail';
       break;
    default:
      console.warn('未知收藏类型:', type);
      return;
  }
  router.push({ name: routeName, params: { id: itemId } });
};

// 取消收藏 - 根据类型调用不同API
const removeFavorite = async (favorite) => {
  const { type, itemId, favoriteId } = favorite;
  const idToRemove = favoriteId || itemId; // 使用 favoriteId 或 itemId

  if (!idToRemove) {
      showToast('无法识别收藏项ID');
      return;
  }

  let apiCall;
  switch (type) {
    case 'product':
      // 优先使用unfavoriteProduct，如果它明确是取消收藏
      apiCall = unfavoriteProduct(idToRemove);
      // 如果unfavoriteProduct不存在或用于其他目的，使用 favoriteProduct(id, false)
      // apiCall = favoriteProduct(idToRemove, false);
      break;
    case 'article':
      apiCall = favoriteArticle(idToRemove, false);
      break;
    case 'lostfound':
      apiCall = unfavoriteLostFound(idToRemove);
      break;
    default:
      showToast('未知的收藏类型');
      return;
  }

  try {
    showToast('正在取消收藏...');
    const response = await apiCall;
    if (response.code === 200) {
      showToast('已取消收藏');
      // 本地更新列表 - 使用itemId和type确保唯一性
      favorites.value = favorites.value.filter(fav => !(fav.type === type && fav.itemId === itemId));
    } else {
      throw new Error(response.message || '取消收藏失败');
    }
  } catch (err) {
    console.error(`取消收藏 (${type}) 失败:`, err);
    showToast(err.message || '取消收藏时出错');
  }
};
</script>

<style scoped>
.my-favorites-page {
  padding-top: 46px;
  padding-bottom: 60px;
  min-height: 100vh;
  background-color: #f7f8fa;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  min-height: calc(100vh - 150px);
}

.loading-container p {
  margin-top: 15px;
  font-size: 0.9rem;
  color: #969799;
}

.error-message {
  color: #ee0a24;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.retry-button {
  margin-top: 10px;
}

.explore-button {
  margin-top: 20px;
  padding: 8px 24px;
  background-color: #007aff;
  color: white;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.favorites-list {
  padding: 10px;
}

.favorite-item-fallback {
  background-color: #fff;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
  color: #969799;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
