import { ConfigProvider } from 'vant'

/**
 * 配置Vant的全局选项
 * 包括iOS风格的返回手势等
 */
export function setupVantConfig(app) {
  // 设置CSS变量
  document.documentElement.style.setProperty('--van-overlay-background-color', 'rgba(0, 0, 0, 0.7)');
  
  // 配置页面过渡动画相关样式
  document.documentElement.classList.add('van-touch-enabled');
  
  // 全局配置组件选项
  app.use(ConfigProvider, {
    // 可以在这里设置ConfigProvider的全局默认属性
    // Vant 3.x 并没有提供setConfig方法，而是通过ConfigProvider组件来设置全局属性
    theme: 'light',
    themeVars: {
      // 自定义主题变量
      popupRoundBorderSize: '18px',
      animationDurationBase: '0.3s',
      animationTimingFunctionEnter: 'cubic-bezier(0.4, 0, 0.2, 1)',
      animationTimingFunctionLeave: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  });
}