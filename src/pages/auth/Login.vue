<template>
  <div class="login-page">
    <div class="login-header">
      <h1>登录</h1>
      <p>欢迎回到校园信息平台</p>
    </div>
    
    <div class="login-form">
      <div class="login-tabs">
        <div 
          :class="['tab-item', { active: loginType === 'account' }]" 
          @click="loginType = 'account'"
        >
          账号密码登录
        </div>
        <div 
          :class="['tab-item', { active: loginType === 'sms' }]" 
          @click="loginType = 'sms'"
        >
          短信验证码登录
        </div>
      </div>
      
      <!-- 账号密码登录 -->
      <form v-if="loginType === 'account'" @submit.prevent="handleAccountLogin">
        <div class="form-item">
          <label>账号</label>
          <input 
            type="text" 
            v-model="accountForm.username" 
            placeholder="用户名/手机号/邮箱" 
            required 
          />
        </div>
        
        <div class="form-item">
          <label>密码</label>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="accountForm.password" 
            placeholder="请输入密码" 
            required 
          />
          <div class="password-toggle" @click="showPassword = !showPassword">
            <svg-icon :name="showPassword ? 'eye' : 'eye-off'" />
          </div>
        </div>
        
        <div class="form-options">
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="accountForm.remember" />
            <label for="remember" @click.stop>记住我</label>
          </div>
          <router-link to="/forgot-password">忘记密码?</router-link>
        </div>
        
        <button 
          type="submit" 
          class="login-button" 
          :disabled="accountLoading"
        >
          {{ accountLoading ? '登录中...' : '登录' }}
        </button>
        
        <!-- 快速登录 -->
        <div class="quick-login">
          <button 
            type="button" 
            class="quick-login-button" 
            @click="handleAdminLogin" 
            :disabled="accountLoading"
          >
            {{ accountLoading ? '登录中...' : '一键登录(管理员)' }}
          </button>
          <p class="quick-login-tip">开发环境专用，无需账号密码</p>
        </div>
      </form>
      
      <!-- 短信验证码登录 -->
      <form v-else @submit.prevent="handleSmsLogin">
        <div class="form-item">
          <label>手机号</label>
          <input 
            type="tel" 
            v-model="smsForm.phone" 
            placeholder="请输入手机号" 
            required 
            pattern="^1[3-9]\d{9}$"
          />
        </div>
        
        <div class="form-item verification-code">
          <label>验证码</label>
          <input 
            type="text" 
            v-model="smsForm.verificationCode" 
            placeholder="请输入验证码" 
            required 
          />
          <button 
            type="button" 
            class="send-code-button" 
            id="send-verification-code-btn"
            @click="sendVerificationCode" 
            :disabled="codeSending || countdown > 0"
          >
            {{ getVerifyCodeButtonText }}
            <span v-if="codeSending" class="loading-indicator"></span>
          </button>
        </div>
        
        <button 
          type="submit" 
          class="login-button" 
          :disabled="smsLoading"
        >
          {{ smsLoading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="register-link">
        还没有账号? <router-link to="/register">立即注册</router-link>
      </div>
      
      <!-- 图形验证码已移除 -->
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { loginByPassword, loginByVerificationCode, apiSendVerificationCode, autoLogin, adminLogin } from '@/api/user'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

// 登录类型切换
const loginType = ref('account')
const showPassword = ref(false)

// 已移除图形验证码相关变量

// 账号密码登录表单
const accountForm = reactive({
  username: 'admin',  // 预设为admin账号
  password: '123456', // 预设为123456密码
  remember: false
})

// 短信验证码登录表单
const smsForm = reactive({
  phone: '',
  verificationCode: ''
})

// 加载状态
const accountLoading = ref(false)
const smsLoading = ref(false)
const codeSending = ref(false)

// 验证码倒计时
const countdown = ref(0)
let countdownTimer = null

// 验证码按钮文本计算属性
const getVerifyCodeButtonText = computed(() => {
  if (codeSending.value) return '发送中...';
  if (countdown.value > 0) return `${countdown.value}秒后重新获取`;
  return '获取验证码';
})

// 已移除图形验证码相关函数

// 账号密码登录
const handleAccountLogin = async () => {
  try {
    accountLoading.value = true
    console.log('发送账号密码登录请求:', {
      username: accountForm.username,
      password: accountForm.password
    })
    
    const response = await loginByPassword({
      username: accountForm.username,
      password: accountForm.password
    })
    
    console.log('收到登录响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应属性:', Object.keys(response));
    
    // 检查响应是否存在
    if (!response) {
      console.error('登录响应为空');
      messageStore.showError('服务器响应异常，请重试');
      return;
    }
    
    // 处理成功情况 - 检查多种可能的响应格式
    if (response.accessToken) {
      // 直接返回token的情况
      console.log('直接包含token的响应格式');
      handleLoginSuccess(response);
    } else if (response.data && response.data.accessToken) {
      // 嵌套在data字段中的情况
      console.log('嵌套在data中的token');
      handleLoginSuccess(response.data);
    } else if (response.code === 200 && response.data) {
      // 标准成功响应但token在其他地方
      console.log('标准成功响应，检查data:', response.data);
      handleLoginSuccess(response.data);
    } else {
      // 处理错误情况
      console.error('登录失败，响应:', response);
      let errorMessage = '登录失败，请重试';
      
      if (response.message) {
        errorMessage = response.message;
      } else if (response.code === 401) {
        errorMessage = '用户名或密码错误';
      } else if (response.code === 403) {
        errorMessage = '账号已被禁用';
      } else if (response.code === 429) {
        errorMessage = '登录尝试次数过多，请稍后再试';
      }
      
      messageStore.showError(errorMessage);
    }
  } catch (error) {
    console.error('登录过程发生异常:', error);
    messageStore.showError(error.message || '登录失败，请稍后重试');
  } finally {
    accountLoading.value = false;
  }
}

// 处理登录成功的通用函数
const handleLoginSuccess = async (userData) => {
  console.log('登录成功，保存用户数据:', userData);
  
  // 保存用户基本信息到localStorage
  localStorage.setItem('token', userData.accessToken);
  localStorage.setItem('tokenExpire', userData.accessExpire?.toString() || '');
  localStorage.setItem('refreshAfter', userData.refreshAfter?.toString() || '');
  localStorage.setItem('userId', userData.userId?.toString() || '');
  localStorage.setItem('username', userData.username || '');
  localStorage.setItem('isLoggedIn', 'true');
  
  // 存储到Pinia，确保状态管理一致性
  userStore.setToken(userData.accessToken);
  
  // 获取完整的用户信息
  try {
    console.log('获取完整用户信息...');
    const userInfoResponse = await getUserInfo();
    
    if (userInfoResponse && userInfoResponse.code === 200 && userInfoResponse.data) {
      console.log('获取用户信息成功:', userInfoResponse.data);
      // 更新Pinia状态管理
      userStore.setUserInfo(userInfoResponse.data);
    } else {
      console.warn('获取用户信息失败:', userInfoResponse);
    }
  } catch (error) {
    console.error('获取用户信息时出错:', error);
  }
  
  // 显示成功消息
  messageStore.showSuccess('登录成功，正在跳转...');
  
  // 确保消息显示后再跳转
  setTimeout(() => {
    console.log('准备跳转到首页...');
    // 重定向到之前的页面或首页
    const redirect = route.query.redirect || '/';
    window.location.replace(redirect);
  }, 1000);
};

// 短信验证码登录
const handleSmsLogin = async () => {
  try {
    smsLoading.value = true
    console.log('发送验证码登录请求:', {
      phone: smsForm.phone,
      verificationCode: smsForm.verificationCode
    })
    
    const response = await loginByVerificationCode({
      phone: smsForm.phone,
      verificationCode: smsForm.verificationCode
    })
    
    console.log('收到验证码登录响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应属性:', Object.keys(response));
    
    // 检查响应是否存在
    if (!response) {
      console.error('登录响应为空');
      messageStore.showError('服务器响应异常，请重试');
      return;
    }
    
    // 处理成功情况 - 检查多种可能的响应格式
    if (response.accessToken) {
      // 直接返回token的情况
      console.log('直接包含token的响应格式');
      handleLoginSuccess(response);
    } else if (response.data && response.data.accessToken) {
      // 嵌套在data字段中的情况
      console.log('嵌套在data中的token');
      handleLoginSuccess(response.data);
    } else if (response.code === 200 && response.data) {
      // 标准成功响应但token在其他地方
      console.log('标准成功响应，检查data:', response.data);
      handleLoginSuccess(response.data);
    } else {
      // 处理错误情况
      console.error('登录失败，响应:', response);
      let errorMessage = '登录失败，请重试';
      
      if (response.message) {
        errorMessage = response.message;
      } else if (response.code === 401) {
        errorMessage = '验证码错误或已过期';
      } else if (response.code === 403) {
        errorMessage = '账号已被禁用';
      } else if (response.code === 429) {
        errorMessage = '登录尝试次数过多，请稍后再试';
      }
      
      messageStore.showError(errorMessage);
    }
  } catch (error) {
    console.error('登录过程发生异常:', error);
    messageStore.showError(error.message || '登录失败，请稍后重试');
  } finally {
    smsLoading.value = false;
  }
}

// 发送短信验证码的主函数
const sendVerificationCode = async () => {
  // 简单的手机号验证
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(smsForm.phone)) {
    messageStore.showError('请输入正确的手机号');
    // 聚焦到手机号输入框
    document.querySelector('input[v-model="smsForm.phone"]')?.focus();
    return;
  }
  
  try {
    codeSending.value = true;
    console.log('准备发送验证码请求:', {
      phone: smsForm.phone,
      type: 'login'
    });
    
    let response;
    try {
      response = await apiSendVerificationCode({
        phone: smsForm.phone,
        type: 'login'
      });
    } catch (requestError) {
      console.error('验证码请求异常被捕获:', requestError);
      response = {
        code: 500,
        message: requestError.message || '请求发送失败',
        data: null
      };
    }
    
    console.log('验证码请求完成，响应结果:', response);
    
    // 进行安全检查，确保响应有效
    if (!response) {
      console.error('响应为null或undefined');
      messageStore.showError('验证码发送失败，服务器无响应');
      return;
    }
    
    // 确保响应是一个有效的对象
    if (typeof response !== 'object') {
      console.error('响应不是对象:', response);
      messageStore.showError('验证码发送失败，响应格式无效');
      return;
    }
    
    // 检查响应是否存在且有code属性
    if (response.code === 200) {
      messageStore.showSuccess('验证码已发送，请注意查收');
      
      // 震动反馈（如果设备支持）
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      // 开始倒计时
      countdown.value = 60;
      countdownTimer = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value -= 1;
        } else {
          clearInterval(countdownTimer);
        }
      }, 1000);
    } else {
      // 处理错误响应
      console.warn('验证码请求返回错误状态码:', response.code);
      messageStore.showError(response.message || '验证码发送失败，请稍后重试');
    }
  } catch (error) {
    console.error('发送验证码过程中出现未捕获异常:', error);
    messageStore.showError('网络异常，请稍后重试');
  } finally {
    codeSending.value = false;
  }
}

// 一键登录（管理员账号）
const handleAdminLogin = async () => {
  try {
    accountLoading.value = true
    console.log('发送管理员一键登录请求')
    
    const response = await adminLogin()
    
    console.log('收到管理员登录响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应属性:', Object.keys(response));
    
    // 检查响应是否存在
    if (!response) {
      console.error('登录响应为空');
      messageStore.showError('服务器响应异常，请重试');
      return;
    }
    
    // 处理成功情况 - 检查多种可能的响应格式
    if (response.accessToken) {
      // 直接返回token的情况
      console.log('直接包含token的响应格式');
      handleLoginSuccess(response);
    } else if (response.data && response.data.accessToken) {
      // 嵌套在data字段中的情况
      console.log('嵌套在data中的token');
      handleLoginSuccess(response.data);
    } else if (response.code === 200 && response.data) {
      // 标准成功响应但token在其他地方
      console.log('标准成功响应，检查data:', response.data);
      handleLoginSuccess(response.data);
    } else {
      // 处理错误情况
      console.error('管理员登录失败，响应:', response);
      let errorMessage = '一键登录失败，请重试';
      
      if (response.message) {
        errorMessage = response.message;
      }
      
      messageStore.showError(errorMessage);
    }
  } catch (error) {
    console.error('管理员登录过程发生异常:', error);
    messageStore.showError(error.message || '一键登录失败，请稍后重试');
  } finally {
    accountLoading.value = false;
  }
}

// 自动填充表单并登录（开发模式专用）
onMounted(() => {
  // 开发环境下自动填充登录表单
  if (import.meta.env.DEV) {
    accountForm.username = 'admin'
    accountForm.password = '123456'
    
    // 如果URL带有auto=true参数，则自动登录
    if (route.query.auto === 'true') {
      handleAccountLogin()
    }
    
    // 检查是否需要自动切换到短信验证码登录
    if (route.query.sms === 'true') {
      console.log('自动切换到验证码登录模式')
      // 切换到短信验证码登录标签
      loginType.value = 'sms'
      
      // 填充手机号
      smsForm.phone = '13800138000'
    }
  }
})

// 组件销毁前清除定时器
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
/* 登录页面样式 */
.login-page {
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-header h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.login-form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #1890ff;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 2px;
  background-color: #1890ff;
}

.form-item {
  margin-bottom: 20px;
  position: relative;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.form-item input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-item input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  outline: none;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 40px;
  cursor: pointer;
  color: #999;
}

.verification-code {
  display: flex;
  align-items: flex-end;
}

.verification-code input {
  flex: 1;
  margin-right: 8px;
}

.send-code-button {
  white-space: nowrap;
  padding: 12px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-code-button:hover {
  background-color: #40a9ff;
}

.send-code-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.loading-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-left: 6px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 添加iOS风格的输入框 */
.form-item input {
  -webkit-appearance: none;
  appearance: none;
  border-radius: 8px; 
  padding: 12px 15px;
  font-size: 16px;
  border: 1px solid #ddd;
  background-color: #f5f5f5;
  width: 100%;
  transition: all 0.3s;
}

.form-item input:focus {
  outline: none;
  border-color: #007aff;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 14px;
}

.remember-me {
  display: flex;
  align-items: center;
}

.remember-me input {
  margin-right: 8px;
}

.login-button {
  width: 100%;
  padding: 12px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.login-button:hover {
  background-color: #40a9ff;
}

.login-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #1890ff;
  text-decoration: none;
}

/* 快速登录样式 */
.quick-login {
  margin-top: 20px;
  text-align: center;
}

.quick-login-button {
  width: 100%;
  padding: 12px;
  background-color: #ffc107;
  color: #333;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-login-button:hover {
  background-color: #ffb300;
}

.quick-login-button:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
}

.quick-login-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

/* 已移除验证码弹窗相关样式 */
</style>