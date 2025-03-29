<template>
  <div class="register-page">
    <div class="register-header">
      <h1>注册</h1>
      <p>创建你的校园信息平台账号</p>
    </div>
    
    <div class="register-form">
      <form @submit.prevent="handleRegister">
        <div class="form-item">
          <label>用户名</label>
          <input 
            type="text" 
            v-model="registerForm.username" 
            placeholder="请输入用户名" 
            required 
          />
        </div>
        
        <div class="form-item">
          <label>手机号</label>
          <input 
            type="tel" 
            v-model="registerForm.phone" 
            placeholder="请输入手机号" 
            required 
            pattern="^1[3-9]\d{9}$"
          />
        </div>
        
        <div class="form-item verification-code">
          <label>验证码</label>
          <input 
            type="text" 
            v-model="registerForm.verificationCode" 
            placeholder="请输入验证码" 
            required 
          />
          <button 
            type="button" 
            class="send-code-button" 
            @click="sendVerificationCode" 
            :disabled="codeSending || countdown > 0"
          >
            {{ countdown > 0 ? `${countdown}秒后重新获取` : '获取验证码' }}
          </button>
        </div>
        
        <div class="form-item">
          <label>密码</label>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="registerForm.password" 
            placeholder="请设置密码" 
            required 
            minlength="6"
          />
          <div class="password-toggle" @click="showPassword = !showPassword">
            <svg-icon :name="showPassword ? 'eye' : 'eye-off'" />
          </div>
        </div>
        
        <div class="form-item">
          <label>确认密码</label>
          <input 
            :type="showConfirmPassword ? 'text' : 'password'" 
            v-model="registerForm.confirmPassword" 
            placeholder="请确认密码" 
            required 
          />
          <div class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
            <svg-icon :name="showConfirmPassword ? 'eye' : 'eye-off'" />
          </div>
        </div>
        
        <div class="terms-agreement">
          <input type="checkbox" id="agreement" v-model="registerForm.agreement" required />
          <label for="agreement">我已阅读并同意 <a href="#" @click.prevent="showTerms">服务条款</a> 和 <a href="#" @click.prevent="showPrivacy">隐私政策</a></label>
        </div>
        
        <button 
          type="submit" 
          class="register-button" 
          :disabled="registerLoading || !registerForm.agreement"
        >
          {{ registerLoading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="login-link">
        已有账号? <router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register, sendVerificationCode as apiSendVerificationCode } from '@/api/user'
import { useMessageStore } from '@/store/message'

const router = useRouter()
const messageStore = useMessageStore()

// 密码显示切换
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 注册表单
const registerForm = reactive({
  username: '',
  phone: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
  agreement: false
})

// 加载状态
const registerLoading = ref(false)
const codeSending = ref(false)

// 验证码倒计时
const countdown = ref(0)
let countdownTimer = null

// 发送验证码
const sendVerificationCode = async () => {
  // 简单的手机号验证
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(registerForm.phone)) {
    messageStore.showError('请输入正确的手机号')
    return
  }
  
  try {
    codeSending.value = true
    
    const response = await apiSendVerificationCode({
      phone: registerForm.phone
    })
    
    if (response.code === 200) {
      messageStore.showSuccess('验证码已发送')
      
      // 开始倒计时
      countdown.value = 60
      countdownTimer = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value -= 1
        } else {
          clearInterval(countdownTimer)
        }
      }, 1000)
    } else {
      messageStore.showError(response.message || '验证码发送失败')
    }
  } catch (error) {
    console.error('验证码发送失败:', error)
    messageStore.showError('验证码发送失败，请稍后重试')
  } finally {
    codeSending.value = false
  }
}

// 处理注册
const handleRegister = async () => {
  // 验证两次密码输入是否一致
  if (registerForm.password !== registerForm.confirmPassword) {
    messageStore.showError('两次密码输入不一致')
    return
  }
  
  try {
    registerLoading.value = true
    
    const response = await register({
      username: registerForm.username,
      phone: registerForm.phone,
      verificationCode: registerForm.verificationCode,
      password: registerForm.password
    })
    
    if (response.code === 200) {
      messageStore.showSuccess('注册成功，请登录')
      router.push('/login')
    } else {
      messageStore.showError(response.message || '注册失败，请稍后重试')
    }
  } catch (error) {
    console.error('注册失败:', error)
    messageStore.showError('注册失败，请稍后重试')
  } finally {
    registerLoading.value = false
  }
}

// 显示服务条款
const showTerms = () => {
  // 这里可以实现弹窗显示服务条款
  alert('服务条款内容')
}

// 显示隐私政策
const showPrivacy = () => {
  // 这里可以实现弹窗显示隐私政策
  alert('隐私政策内容')
}
</script>

<style scoped>
.register-page {
  max-width: 420px;
  margin: 30px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.register-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.register-header p {
  font-size: 14px;
  color: #666;
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
  height: 40px;
  padding: 0 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-item input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 38px;
  color: #999;
  cursor: pointer;
}

.verification-code {
  display: flex;
  align-items: flex-end;
}

.verification-code input {
  flex: 1;
  margin-right: 10px;
}

.send-code-button {
  width: 110px;
  height: 40px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.send-code-button:disabled {
  background-color: #b3d9ff;
  cursor: not-allowed;
}

.terms-agreement {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.terms-agreement input {
  margin-right: 8px;
  margin-top: 3px;
}

.terms-agreement a {
  color: #1890ff;
  text-decoration: none;
}

.register-button {
  width: 100%;
  height: 44px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.register-button:hover {
  background-color: #40a9ff;
}

.register-button:disabled {
  background-color: #b3d9ff;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #1890ff;
  text-decoration: none;
}

@media (max-width: 480px) {
  .register-page {
    margin: 20px 15px;
    padding: 15px;
  }
}
</style>