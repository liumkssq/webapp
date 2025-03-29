<template>
  <div class="login-container">
    <div class="login-header">
      <h2>登录</h2>
    </div>
    
    <div class="login-form">
      <div class="form-item">
        <input
          v-model="loginForm.username"
          type="text"
          placeholder="用户名/手机号"
        />
      </div>
      
      <div class="form-item">
        <input
          v-model="loginForm.password"
          type="password"
          placeholder="密码"
        />
      </div>
      
      <div class="form-options">
        <div class="remember-me">
          <input
            v-model="rememberMe"
            type="checkbox"
            id="remember-me"
          />
          <label for="remember-me">记住我</label>
        </div>
        
        <div class="forgot-password">
          <router-link to="/forgot-password">忘记密码？</router-link>
        </div>
      </div>
      
      <div class="form-btn">
        <button @click="handleLogin">登录</button>
      </div>
      
      <div class="third-party-login">
        <div class="divider">
          <span>其他登录方式</span>
        </div>
        
        <div class="login-icons">
          <div class="icon-item" @click="handleThirdPartyLogin('wechat')">
            <span>微信</span>
          </div>
          
          <div class="icon-item" @click="handleThirdPartyLogin('qq')">
            <span>QQ</span>
          </div>
          
          <div class="icon-item" @click="handleThirdPartyLogin('weibo')">
            <span>微博</span>
          </div>
        </div>
      </div>
      
      <div class="register-link">
        <span>还没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 记住我选项
const rememberMe = ref(false)

// 处理登录
const handleLogin = async () => {
  if (!loginForm.username) {
    alert('请输入用户名/手机号')
    return
  }
  
  if (!loginForm.password) {
    alert('请输入密码')
    return
  }
  
  try {
    await userStore.login(loginForm)
    
    // 如果有重定向地址，跳转到重定向地址
    const redirectPath = route.query.redirect || '/home'
    router.push(redirectPath)
  } catch (error) {
    console.error('登录失败', error)
  }
}

// 处理第三方登录
const handleThirdPartyLogin = (platform) => {
  console.log(`使用${platform}登录`)
  // 实际项目中应该跳转到对应的第三方授权页面
}
</script>