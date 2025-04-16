import { ref } from 'vue';

// Mock Data
const mockWalletInfo = ref({
    balance: 1234.56,
    currency: 'CNY',
    lastTransaction: {
        id: 'txn_1',
        type: 'expense', // 'income' or 'expense'
        amount: -58.00,
        description: '购买 商品A',
        timestamp: '2023-10-27T10:30:00Z'
    }
});

const mockTransactions = ref([
    { id: 'txn_1', type: 'expense', amount: -58.00, description: '购买 商品A', timestamp: '2023-10-27T10:30:00Z', status: 'completed' },
    { id: 'txn_2', type: 'income', amount: 200.00, description: '活动奖励', timestamp: '2023-10-26T15:00:00Z', status: 'completed' },
    { id: 'txn_3', type: 'expense', amount: -12.50, description: '食堂午餐', timestamp: '2023-10-26T12:15:00Z', status: 'completed' },
    { id: 'txn_4', type: 'expense', amount: -8.00, description: '校园巴士', timestamp: '2023-10-25T08:00:00Z', status: 'completed' },
    { id: 'txn_5', type: 'income', amount: 500.00, description: '充值', timestamp: '2023-10-24T18:45:00Z', status: 'completed' },
    // Add more mock transactions
]);

// --- Mock API Functions ---

/**
 * 获取钱包信息 (余额等) (Mock)
 */
export function getWalletInfo() {
    console.log('[API Mock] getWalletInfo called');
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ code: 200, message: 'success', data: mockWalletInfo.value });
        }, 200);
    });
}

/**
 * 获取交易记录 (Mock)
 * @param {object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @param {string} [params.filterType] - 'income' or 'expense' or 'all' (optional)
 */
export function getTransactionHistory(params = { page: 1, limit: 10, filterType: 'all' }) {
    console.log('[API Mock] getTransactionHistory called with params:', params);
    return new Promise((resolve) => {
        setTimeout(() => {
            let filtered = mockTransactions.value;
            if (params.filterType && params.filterType !== 'all') {
                filtered = filtered.filter(t => t.type === params.filterType);
            }

            const start = (params.page - 1) * params.limit;
            const end = start + params.limit;
            const paginated = filtered.slice(start, end);

            resolve({
                code: 200,
                message: 'success',
                data: {
                    list: paginated,
                    total: filtered.length
                }
            });
        }, 400);
    });
}

// Mock function for recharge (placeholder)
export function rechargeWallet(amount) {
    console.log(`[API Mock] rechargeWallet called with amount: ${amount}`);
    return new Promise((resolve) => {
        setTimeout(() => {
            mockWalletInfo.value.balance += amount;
            mockTransactions.value.unshift({ id: `txn_${Date.now()}`, type: 'income', amount: amount, description: '充值', timestamp: new Date().toISOString(), status: 'completed' });
            resolve({ code: 200, message: '充值成功', data: { newBalance: mockWalletInfo.value.balance } });
        }, 500);
    });
}

// Mock function for withdrawal (placeholder)
export function withdrawFromWallet(amount) {
    console.log(`[API Mock] withdrawFromWallet called with amount: ${amount}`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (amount > mockWalletInfo.value.balance) {
                reject({ code: 400, message: '余额不足' });
            } else {
                mockWalletInfo.value.balance -= amount;
                mockTransactions.value.unshift({ id: `txn_${Date.now()}`, type: 'expense', amount: -amount, description: '提现', timestamp: new Date().toISOString(), status: 'pending' }); // Assume withdrawal needs processing
                resolve({ code: 200, message: '提现申请已提交', data: { newBalance: mockWalletInfo.value.balance } });
            }
        }, 600);
    });
}
