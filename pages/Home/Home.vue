<template>
  <view class="app-container">
    <!-- 背景层 - OrganicBackground 组件 -->
    <OrganicBackground :color="'#31C48D'" :opacity="0.3" :animationSpeed="20"></OrganicBackground>

    <!-- 主内容区 -->
    <view class="main-content" :class="{ 'page-loaded': pageLoaded }">      
      <!-- 功能模块网格 -->
      <view class="module-grid">
        <view
          v-for="(module, index) in modules"
          :key="module.id"
          class="module-card"
          :style="{
            '--delay': `${(index + 1) * 0.1}s`,
            '--rotate': `${index % 2 ? 1 : -1}deg`,
            '--module-color': module.color
          }"
          @click="navigateTo(module.route)"
        >
          <view class="card-content">
            <view class="icon-container">
              <uni-icons :type="module.icon" size="28" color="white"></uni-icons>
            </view>
            <text class="module-title">{{ module.title }}</text>
            <text class="module-description">{{ module.description }}</text>
          </view>
          
          <view class="card-highlight"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import OrganicBackground from '../../components/OrganicBackground.vue';
import { handlePageAuth } from '@/utils/auth';

const pageLoaded = ref(false);
const activeTab = ref('home');

// 模块数据
const modules = [
  {
    id: 'assistant',
    title: 'AI Assistant',
    description: 'Ask me anything',
    icon: 'chatbubble',
    color: '#4ade80',
    route: '/pages/Assistant/Assistant'
  },
  {
    id: 'dictionary',
    title: 'Dictionary',
    description: 'Look up word meanings',
    icon: 'compose',
    color: '#10b981',
    route: '/pages/Dictionary/Dictionary'
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary',
    description: 'Learn new words efficiently',
    icon: 'flag',
    color: '#fbbf24',
    route: '/pages/WordProgress/WordProgress'
  },
  {
    id: 'exercises',
    title: 'Exercises',
    description: 'Reinforce what you learned',
    icon: 'checkbox',
    color: '#60a5fa',
    route: '/pages/WordExercise/WordExercise'
  }
];

// 导航项
const navItems = [
  { name: 'assistant', label: 'AI Assistant', route: '/pages/Assistant/Assistant', isTab: false },
  { name: 'dictionary', label: 'Dictionary', route: '/pages/Dictionary/Dictionary', isTab: false },
  { name: 'vocabulary', label: 'Vocabulary', route: '/pages/WordProgress/WordProgress', isTab: false },
  { name: 'exercises', label: 'Exercises', route: '/pages/WordExercise/WordExercise', isTab: false },
];

// 导航到指定路由
const navigateTo = (route: string) => {
  uni.navigateTo({
    url: route,
    fail: (e: any) => {
      console.error('navigateTo failed', e);
      // 如果导航失败，尝试使用redirectTo
      uni.redirectTo({
        url: route,
        fail: (err: any) => {
          console.error('redirectTo also failed', err);
        }
      });
    }
  });
};

// 初始化页面
onMounted(() => {
  setTimeout(() => {
    pageLoaded.value = true;
  }, 100);
});

// 添加页面级路由守卫
onMounted(() => {
  handlePageAuth();
});
</script>

<style scoped lang="scss">
/* 全局CSS变量 */
:root {
  /* 光效和交互 */
  --card-depth: 40rpx;
  --transition-bouncy: cubic-bezier(0.18, 0.89, 0.32, 1.28);
  --transition-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
  
  /* 间距和尺寸 */
  --grid-gap: 32rpx;
  --container-padding: 48rpx;
  --card-border-radius: 32rpx;
  --touch-target-size: 96rpx;
  
  /* 元素尺寸 */
  --nav-height: 112rpx;
  
  /* 色彩系统 */
  --ep-color-primary: #10b981;
  --ep-color-success: #34d399;
  --ep-color-warning: #fbbf24;
  --ep-color-info: #60a5fa;
  --ep-color-danger: #f87171;
  
  /* 背景色 */
  --background: #f8f9fa;
  --card-bg: rgba(255, 255, 255, 0.8);
  --text-primary: #1e293b;
  --text-secondary: #64748b;
}

/* 应用容器 */
.app-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  position: relative;
  background-color: var(--background);
  color: var(--text-primary);
  font-family: 'Noto Sans SC', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 主内容区 */
.main-content {
  position: relative;
  z-index: 10;
  padding: var(--container-padding);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(40rpx);
  transition: opacity 0.8s var(--transition-smooth), 
              transform 0.8s var(--transition-smooth);
  will-change: transform, opacity;
}

.main-content.page-loaded {
  opacity: 1;
  transform: translateY(0);
}

/* 应用标题 */
.app-title {
  font-size: 56rpx;
  font-weight: 700;
  margin-bottom: 64rpx;
  text-align: center;
  background: linear-gradient(135deg, var(--ep-color-success), var(--ep-color-primary));
  -webkit-background-clip: text;
  color: transparent;
  animation: titleEntrance 1.2s var(--transition-bouncy) both;
  animation-delay: 0.2s;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32rpx;
  padding: 32rpx;
  max-width: 100%;
  margin: auto;
}

/* 模块卡片 */
.module-card {
  position: relative;
  height: 320rpx; /* 10rem = 320rpx */
  border-radius: var(--card-border-radius);
  background-color: var(--card-bg);
  overflow: hidden;
  transform-style: preserve-3d; /* 兼容性考虑 */
  /* cursor: pointer; */ /* 移除，移动端无光标 */
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05); /* 0.25rem = 8rpx, 0.75rem = 24rpx */
  animation: moduleEntrance 0.8s var(--transition-bouncy) both;
  animation-delay: var(--delay);
  transform: rotateY(var(--rotate)) translateZ(0);
  transition: all 0.4s var(--transition-bouncy);
  backdrop-filter: blur(16rpx); /* 0.5rem = 16rpx, 兼容性考虑 */
  will-change: transform, box-shadow;
  
  /* 确保至少48x48dp的触控区域 */
  min-width: var(--touch-target-size);
  min-height: var(--touch-target-size);
  touch-action: manipulation;
}

/* 卡片内容 */
.card-content {
  padding: 40rpx; /* 1.25rem = 40rpx */
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transform: translateZ(var(--card-depth));
  will-change: transform;
  position: relative;
  z-index: 2;
}

/* 卡片高光 */
.card-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at 50% 0%, 
    rgba(255, 255, 255, 0.3), 
    rgba(255, 255, 255, 0.05) 60%, 
    transparent 70%
  );
  opacity: 0.7;
  mix-blend-mode: overlay;
  z-index: 1;
}

/* 图标容器 */
.icon-container {
  width: 96rpx; /* 3rem = 96rpx */
  height: 96rpx; /* 3rem = 96rpx */
  border-radius: 24rpx; /* 0.75rem = 24rpx */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--module-color);
  margin-bottom: 24rpx; /* 0.75rem = 24rpx */
  transition: transform 0.6s cubic-bezier(0.68, -0.6, 0.32, 1.6);
}

.module-icon {
  font-size: 48rpx; /* 1.5rem = 48rpx */
  color: white;
}

/* 标题和描述文本 */
.module-title {
  font-size: 36rpx; /* 1.125rem = 36rpx */
  font-weight: 600;
  margin: 0 0 16rpx; /* 0.5rem = 16rpx */
  color: var(--text-primary);
}

.module-description {
  font-size: 28rpx; /* 0.875rem = 28rpx */
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* 焦点状态 - 符合WCAG 2.2 */
.module-card:focus {
  outline: none;
  box-shadow: 
    0 0 0 6rpx white,
    0 0 0 12rpx var(--module-color);
}

/* 活跃状态 */
.module-card:active {
  transform: scale(0.97);
}

/* 底部导航栏 (已在 pages.json 中配置) */
/* .tab-bar { ... } */

/* 动画定义 */
@keyframes titleEntrance {
  0% {
    opacity: 0;
    transform: translateY(-40rpx); /* 1.25rem = 40rpx */
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes moduleEntrance {
  0% { 
    opacity: 0; 
    transform: scale(0.8) translateY(40rpx) rotateY(var(--rotate)); /* 1.25rem = 40rpx */
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0) rotateY(var(--rotate));
  }
}

/* 响应式调整 */
@media (max-width: 800rpx) { /* 25rem = 800rpx */
  .module-grid {
    gap: 24rpx; /* 0.75rem = 24rpx */
  }
  
  .module-card {
    height: 280rpx; /* 8.75rem = 280rpx */
  }
  
  .icon-container {
    width: 80rpx; /* 2.5rem = 80rpx */
    height: 80rpx; /* 2.5rem = 80rpx */
  }
  
  .module-title {
    font-size: 32rpx; /* 1rem = 32rpx */
  }
  
  .module-description {
    font-size: 24rpx; /* 0.75rem = 24rpx */
  }
}

/* 平板和桌面视图优化 */
@media (min-width: 1536rpx) { /* 48rem = 1536rpx */
  .module-grid {
    grid-template-columns: repeat(2, 480rpx); /* 15rem = 480rpx */
    justify-content: center;
  }
  
  .module-card {
    height: 360rpx; /* 11.25rem = 360rpx */
  }
}
</style> 