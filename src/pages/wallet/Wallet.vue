<template>
  <div class="wallet-page">
    <HeaderNav title="我的钱包" :showBackButton="true" @back="goBack">
       <template #right>
        <van-icon name="records" size="20" @click="goToHistory" />
      </template>
    </HeaderNav>

    <div v-if="loading" class="loading-state">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>
     <div v-else-if="error" class="error-state">
        <van-empty :description="error || '加载钱包信息失败'" image="error">
           <van-button type="primary" size="small" @click="fetchWalletData">点击重试</van-button>
        </van-empty>
    </div>
    <div v-else class="wallet-content">
      <!-- Balance Card -->
      <div class="balance-card">
        <div class="balance-label">账户余额 (元)</div>
        <div class="balance-amount">{{ walletInfo.balance?.toFixed(2) || '0.00' }}</div>
        <div class="wallet-actions">
          <van-button type="primary" size="small" round @click="showRecharge = true">充值</van-button>
          <van-button type="default" size="small" round @click="showWithdraw = true" class="withdraw-btn">提现</van-button>
        </div>
      </div>

      <!-- Quick Access / Ads -->
      <van-grid :column-num="3" :border="false" class="quick-access">
        <van-grid-item icon="bill-o" text="交易记录" @click="goToHistory" />
        <van-grid-item icon="coupon-o" text="优惠券" @click="goToCoupons" />
        <van-grid-item icon="setting-o" text="支付设置" @click="goToPaySettings" />
        <!-- Add more grid items as needed -->
      </van-grid>

       <!-- Recent Transactions Preview -->
      <div class="recent-transactions">
         <van-cell title="最近交易" is-link value="查看全部" @click="goToHistory" />
         <div v-if="recentTransactions.length === 0" class="no-transactions">
            <van-empty description="暂无交易记录" image-size="80" />
         </div>
         <div v-else class="transaction-list-preview">
             <TransactionItem 
                v-for="item in recentTransactions" 
                :key="item.id" 
                :item="item" 
              />
         </div>
      </div>

    </div>

    <!-- Recharge Popup -->
    <van-popup v-model:show="showRecharge" position="bottom" round :style="{ height: '40%' }" >
        <div class="popup-content">
            <van-nav-bar title="充值" left-text="取消" @click-left="showRecharge = false" />
            <van-field
                v-model="rechargeAmount"
                label="充值金额"
                type="number"
                placeholder="请输入充值金额"
                clearable
                class="popup-input"
            />
            <van-button type="primary" block round @click="handleRecharge" :disabled="!rechargeAmount || rechargeAmount <= 0" class="popup-button">确认充值</van-button>
        </div>
    </van-popup>

    <!-- Withdraw Popup -->
     <van-popup v-model:show="showWithdraw" position="bottom" round :style="{ height: '40%' }" >
        <div class="popup-content">
            <van-nav-bar title="提现" left-text="取消" @click-left="showWithdraw = false" />
            <van-field
                v-model="withdrawAmount"
                label="提现金额"
                type="number"
                placeholder="请输入提现金额"
                clearable
                class="popup-input"
            >
                 <template #extra>
                    <span class="balance-hint">可用余额: {{ walletInfo.balance?.toFixed(2) || '0.00' }}</span>
                 </template>
            </van-field>
            <van-field
                v-model="withdrawAccount" 
                label="提现账户"
                placeholder="请输入支付宝/银行卡号等" 
                clearable
                class="popup-input"
            />
            <van-button type="primary" block round @click="handleWithdraw" :disabled="!withdrawAmount || withdrawAmount <= 0 || !withdrawAccount || withdrawAmount > walletInfo.balance" class="popup-button">确认提现</van-button>
        </div>
    </van-popup>

     <!-- Footer Navigation -->
    <FooterNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog, Loading as VanLoading, Empty as VanEmpty, Button as VanButton, Grid as VanGrid, GridItem as VanGridItem, Icon as VanIcon, Popup as VanPopup, Field as VanField, NavBar as VanNavBar, Cell as VanCell } from 'vant';
import HeaderNav from '@/components/HeaderNav.vue';
import FooterNav from '@/components/FooterNav.vue';
import TransactionItem from '@/components/wallet/TransactionItem.vue';
import { getWalletInfo, getTransactionHistory, rechargeWallet, withdrawFromWallet } from '@/api/wallet.js'; // Using Mock API

const router = useRouter();
const walletInfo = ref({});
const recentTransactions = ref([]);
const loading = ref(true);
const error = ref(null);

const showRecharge = ref(false);
const rechargeAmount = ref(null);
const showWithdraw = ref(false);
const withdrawAmount = ref(null);
const withdrawAccount = ref(''); // For storing withdrawal destination

// Fetch wallet data and recent transactions
const fetchWalletData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [infoResponse, historyResponse] = await Promise.all([
      getWalletInfo(),
      getTransactionHistory({ page: 1, limit: 3 }) // Fetch first 3 for preview
    ]);

    if (infoResponse.code === 200) {
      walletInfo.value = infoResponse.data || {};
    } else {
      throw new Error(infoResponse.message || '获取钱包信息失败');
    }

    if (historyResponse.code === 200) {
      recentTransactions.value = historyResponse.data?.list || [];
    } else {
      // Don't block the page for history failure, just log it
      console.warn('获取最近交易记录失败:', historyResponse.message);
      recentTransactions.value = []; // Ensure it's empty
    }

  } catch (err) {
    console.error("Error fetching wallet data:", err);
    error.value = err.message;
    // Don't show toast here as the error state handles it
  } finally {
    loading.value = false;
  }
};

onMounted(fetchWalletData);

// Actions
const handleRecharge = async () => {
    if (!rechargeAmount.value || rechargeAmount.value <= 0) {
        showToast('请输入有效的充值金额');
        return;
    }
    try {
        const response = await rechargeWallet(Number(rechargeAmount.value));
        if (response.code === 200) {
            showToast('充值成功');
            walletInfo.value.balance = response.data.newBalance; // Update balance locally
            showRecharge.value = false;
            rechargeAmount.value = null;
            // Optionally re-fetch recent transactions or manually add the recharge transaction
             fetchWalletData(); // Re-fetch everything for simplicity now
        } else {
            throw new Error(response.message || '充值失败');
        }
    } catch (err) {
        showToast(err.message || '充值时出错');
    }
};

const handleWithdraw = async () => {
    if (!withdrawAmount.value || withdrawAmount.value <= 0) {
        showToast('请输入有效的提现金额');
        return;
    }
     if (!withdrawAccount.value) {
        showToast('请输入提现账户');
        return;
    }
     if (withdrawAmount.value > walletInfo.value.balance) {
        showToast('提现金额不能超过可用余额');
        return;
    }

    showConfirmDialog({
        title: '确认提现',
        message: `您确定要提现 ${withdrawAmount.value.toFixed(2)} 元到账户 ${withdrawAccount.value} 吗？`,
    }).then(async () => {
         try {
            const response = await withdrawFromWallet(Number(withdrawAmount.value)); // Assuming API only needs amount
            if (response.code === 200) {
                showToast(response.message || '提现申请已提交'); // Message might be different
                walletInfo.value.balance = response.data.newBalance; // Update balance locally
                showWithdraw.value = false;
                withdrawAmount.value = null;
                withdrawAccount.value = '';
                fetchWalletData(); // Re-fetch everything
            } else {
                throw new Error(response.message || '提现失败');
            }
        } catch (err) {
            showToast(err.message || '提现时出错');
        }
    }).catch(() => {
        // cancel
    });
};


// Navigation
const goBack = () => {
  router.go(-1);
};

const goToHistory = () => {
  router.push('/wallet/history'); // Define this route later
};

const goToCoupons = () => {
    router.push('/coupons'); // Use the route name/path for coupons
};

const goToPaySettings = () => {
    showToast('支付设置功能暂未开放');
    // router.push('/settings/payment'); // Define this route later
};

</script>

<style scoped>
.wallet-page {
  padding-top: 46px; /* Header height */
  padding-bottom: 50px; /* Footer height */
  min-height: 100vh;
  background-color: #f7f8fa;
  box-sizing: border-box;
}

.loading-state, .error-state {
  margin-top: 40px;
  text-align: center;
}

.wallet-content {
  /* padding: 15px; */
}

.balance-card {
  background: linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%);
  color: white;
  padding: 25px 20px;
  margin: 15px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.balance-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 20px;
}

.wallet-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.wallet-actions .van-button {
    min-width: 80px;
}

.withdraw-btn {
    background-color: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: white;
}

.quick-access {
    margin: 0 15px 15px 15px; /* Add margin around the grid */
    border-radius: 8px;
    overflow: hidden; /* Apply border-radius */
}

:deep(.quick-access .van-grid-item__content) {
    background-color: #fff;
}

.recent-transactions {
    margin: 15px;
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden; /* Apply border-radius */
}

.recent-transactions .van-cell {
    font-weight: 500;
}

.no-transactions {
    padding: 20px 0;
}

.transaction-list-preview {
    /* Limit height or add scroll if needed, but for preview, 3 items is fine */
}

/* Popup Styles */
.popup-content {
    padding: 15px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.popup-input {
    margin-top: 15px;
}

.popup-button {
    margin-top: 25px;
}

.balance-hint {
    font-size: 12px;
    color: #969799;
}

</style>
