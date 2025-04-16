<template>
  <div class="my-articles-page">
    <header-nav title="我的文章" back />

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" />
      <p>正在加载您的文章...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p class="error-message">加载失败: {{ error }}</p>
      <van-button plain type="primary" @click="fetchUserArticles" class="retry-button">重试</van-button>
    </div>

    <div v-else-if="articles.length === 0" class="empty-container">
      <van-empty description="您还没有发布任何文章" />
      <router-link to="/publish/article" class="publish-button">去发布</router-link>
    </div>

    <div v-else class="articles-list">
      <!-- ArticleCard Component -->
      <article-card
        v-for="article in articles"
        :key="article.id"
        :article="article"
        @edit="editArticle(article.id)"
        @delete="confirmDeleteArticle(article)"
        :show-actions="true"
      />
    </div>

     <footer-nav />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { showToast, showDialog, showLoadingToast, closeToast } from 'vant';
import { getUserArticles, deleteArticle as apiDeleteArticle } from '@/api/article';

// Import UI components
import HeaderNav from '@/components/HeaderNav.vue';
import FooterNav from '@/components/FooterNav.vue';
import ArticleCard from '@/components/cards/ArticleCard.vue'; // Updated path

const router = useRouter();
const userStore = useUserStore();

const articles = ref([]);
const loading = ref(true);
const error = ref(null);
const articleToDelete = ref(null);

onMounted(() => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录');
    router.replace('/login');
    loading.value = false;
    return;
  }
  fetchUserArticles();
});

const fetchUserArticles = async () => {
  loading.value = true;
  error.value = null;
  articles.value = [];
  try {
    const userId = userStore.userInfo?.id;
    if (!userId) {
       await userStore.getUserInfo();
       if(!userStore.userInfo?.id) throw new Error('无法获取用户信息，请重新登录');
    }
    console.log(`Fetching articles for user ID: ${userStore.userInfo.id}`);
    const response = await getUserArticles({ authorId: userStore.userInfo.id, page: 1, pageSize: 50 });

    if (response.code === 200) {
      articles.value = response.data?.list || [];
      console.log('用户文章列表:', articles.value);
    } else {
      throw new Error(response.message || '未能加载文章列表');
    }
  } catch (err) {
    console.error("获取用户文章失败:", err);
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

// Navigate to edit article page
const editArticle = (articleId) => {
  router.push({ name: 'PublishArticle', query: { edit: articleId } });
};

// Confirm before deleting an article
const confirmDeleteArticle = (article) => {
  articleToDelete.value = article;
   showDialog({
    title: '删除文章',
    message: `确定要删除文章 "${article.title || '此文章'}" 吗？`,
    showCancelButton: true,
  }).then(({ confirm }) => {
    if (confirm) {
      deleteArticle();
    } else {
      articleToDelete.value = null;
    }
  });
};

// Delete the article after confirmation
const deleteArticle = async () => {
  if (!articleToDelete.value) return;
  const articleId = articleToDelete.value.id;

  try {
    showLoadingToast({ message: '正在删除...', forbidClick: true });
    const response = await apiDeleteArticle(articleId);
    if (response.code === 200) {
      closeToast();
      showToast('文章删除成功');
      articles.value = articles.value.filter(a => a.id !== articleId);
    } else {
      throw new Error(response.message || '删除失败');
    }
  } catch (err) {
    console.error("删除文章失败:", err);
    showToast(err.message || '删除时出错');
  } finally {
    closeToast();
    articleToDelete.value = null;
  }
};

</script>

<style scoped>
/* Reuse or adapt styles from other user pages */
.my-articles-page {
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

.empty-container {
    color: #969799;
}

.publish-button {
  margin-top: 20px;
  padding: 8px 24px;
  background-color: #007aff;
  color: white;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.articles-list {
  padding: 10px;
}

</style>
