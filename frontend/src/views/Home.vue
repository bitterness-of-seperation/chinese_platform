<script setup lang="ts">
import { ref, onMounted, reactive, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
// 引入Element Plus样式和组件
import 'element-plus/dist/index.css';
// 直接引用需要的图标组件
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const router = useRouter();
const pageLoaded = ref(false);
const prefersReducedMotion = ref(false);
const isDarkMode = ref(false);

type IconName = keyof typeof ElementPlusIconsVue

// 背景粒子系统参数
const particles = reactive({
  elements: Array.from({ length: 15 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.5 + Math.random() * 1.5,
    speed: Math.random() * 0.05 + 0.01,
    color: `hsl(${Math.floor(Math.random() * 60) + 180}, 70%, 70%)`,
    opacity: 0.1 + Math.random() * 0.3
  }))
});

// 模块数据
const modules = [
  {
    id: 'assistant',
    title: 'AI Assistant',
    description: 'Ask me anything',
    icon: 'ChatDotRound' as IconName,
    color: 'var(--ep-color-success)',
    route: '/assistant'
  },
  {
    id: 'dictionary',
    title: 'Dictionary',
    description: 'Look up word meanings',
    icon: 'Reading' as IconName,
    color: 'var(--ep-color-primary)',
    route: '/dictionary'
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary',
    description: 'Learn new words efficiently',
    icon: 'Lightning' as IconName,
    color: 'var(--ep-color-warning)',
    route: '/vocabulary'
  },
  {
    id: 'exercises',
    title: 'Exercises',
    description: 'Reinforce what you learned',
    icon: 'Edit' as IconName,
    color: 'var(--ep-color-info)',
    route: '/exercises'
  }
];

// 导航到指定路由
const navigateTo = (route: string) => {
  // 添加触觉反馈
  tapFeedback();
  router.push(route);
};

// 初始化粒子系统
const initParticles = () => {
  const colors = ['#4ade80', '#34d399', '#10b981', '#059669'];
  
  for (let i = 0; i < particles.elements.length; i++) {
    particles.elements[i].x = Math.random() * 100;
    particles.elements[i].y = Math.random() * 100;
    particles.elements[i].size = Math.random() * 0.3 + 0.1; // 0.1rem - 0.4rem
    particles.elements[i].speed = Math.random() * 0.05 + 0.01; // 移动速度
    particles.elements[i].color = colors[Math.floor(Math.random() * colors.length)];
    particles.elements[i].opacity = Math.random() * 0.5 + 0.1;
  }
};

// 更新粒子位置
const updateParticles = () => {
  if (prefersReducedMotion.value) return; // 减弱动效模式下不执行动画
  
  particles.elements.forEach(particle => {
    particle.y -= particle.speed;
    
    // 当粒子到达顶部时，重置到底部
    if (particle.y < -5) {
      particle.y = 105;
      particle.x = Math.random() * 100;
    }
  });
  
  requestAnimationFrame(updateParticles);
};

// 模块点击触觉反馈
const tapFeedback = (strength = 0.3) => {
  if (navigator.vibrate && !prefersReducedMotion.value) {
    navigator.vibrate(strength * 50);
  }
};

// 检测用户首选项
const detectUserPreferences = () => {
  // 检查是否首选减弱动效
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion.value = mediaQuery.matches;
  
  // 监听减弱动效偏好变化
  mediaQuery.addEventListener('change', () => {
    prefersReducedMotion.value = mediaQuery.matches;
  });
  
  // 检查暗色模式
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  isDarkMode.value = darkModeQuery.matches;
  
  // 监听暗色模式变化
  darkModeQuery.addEventListener('change', () => {
    isDarkMode.value = darkModeQuery.matches;
  });
};

// 底部导航已由全局布局统一提供

// 初始化页面
onMounted(() => {
  // 检测偏好
  detectUserPreferences();
  
  // 初始化粒子系统
  initParticles();
  
  // 开始动画循环
  if (!prefersReducedMotion.value) {
    updateParticles();
  }
  
  // 延迟加载动画
  setTimeout(() => {
    pageLoaded.value = true;
  }, 100);
});

// 监听系统主题与动效偏好变化
let darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
let reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const updateThemePreference = (e: MediaQueryListEvent) => {
  isDarkMode.value = e.matches;
};

const updateMotionPreference = (e: MediaQueryListEvent) => {
  prefersReducedMotion.value = e.matches;
};

onMounted(() => {
  darkModeQuery.addEventListener('change', updateThemePreference);
  reducedMotionQuery.addEventListener('change', updateMotionPreference);
});

onBeforeUnmount(() => {
  darkModeQuery.removeEventListener('change', updateThemePreference);
  reducedMotionQuery.removeEventListener('change', updateMotionPreference);
});
</script>

<template>
  <div class="app-container" :class="{ 'dark-mode': isDarkMode, 'reduced-motion': prefersReducedMotion }">
    <!-- 背景层 - 第一层：渐变背景 -->
    <div class="bg-layer-1"></div>

    <!-- 背景层 - 第二层：粒子效果 -->
    <div class="bg-layer-2">
      <div 
        v-for="(particle, index) in particles.elements" 
        :key="'p-'+index"
        class="particle"
        :style="{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: `${particle.size}rem`,
          height: `${particle.size}rem`,
          backgroundColor: particle.color,
          opacity: particle.opacity
        }"
      ></div>
    </div>
    
    <!-- 背景层 - 第三层：噪点纹理 -->
    <div class="bg-layer-3"></div>

    <!-- 主内容区 -->
    <main class="main-content" :class="{ 'page-loaded': pageLoaded }">
      <h1 class="app-title">智言汉语</h1>
      
      <!-- 功能模块网格 -->
      <section class="module-grid">
        <el-card
          v-for="(module, index) in modules"
          :key="module.id"
          class="module-card"
          :style="{
            '--delay': `${(index + 1) * 0.1}s`,
            '--rotate': `${index % 2 ? 1 : -1}deg`,
            '--module-color': module.color
          }"
          shadow="hover"
          @click="navigateTo(module.route)"
          :body-style="{ padding: '0px' }"
        >
          <div class="card-content">
            <div class="icon-container">
              <el-icon :size="28" class="module-icon">
                <component :is="ElementPlusIconsVue[module.icon]"></component>
              </el-icon>
            </div>
            <h2 class="module-title">{{ module.title }}</h2>
            <p class="module-description">{{ module.description }}</p>
          </div>
          
          <div class="card-highlight"></div>
        </el-card>
      </section>
    </main>
    
  </div>
</template>

<style>
/* 全局CSS变量 */
:root {
  /* 光效和交互 */
  --card-depth: 1.25rem;
  --transition-bouncy: cubic-bezier(0.18, 0.89, 0.32, 1.28);
  --transition-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
  
  /* 间距和尺寸 */
  --grid-gap: 1rem;
  --container-padding: 1.5rem;
  --card-border-radius: 1rem;
  --touch-target-size: 3rem; /* 48dp触控区域 */
  
  /* 元素尺寸 */
  --nav-height: 3.5rem;
  
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
  
  /* 暗色模式色彩 */
  --dark-background: #0f172a;
  --dark-card-bg: rgba(30, 41, 59, 0.8);
  --dark-text-primary: #f8fafc;
  --dark-text-secondary: #cbd5e1;
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
}

/* 暗色模式 */
.app-container.dark-mode {
  background-color: var(--dark-background);
  color: var(--dark-text-primary);
}

/* 背景层 1 - 渐变背景 */
.bg-layer-1 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse at top, rgba(74, 222, 128, 0.15), transparent 70%),
    radial-gradient(ellipse at bottom, rgba(16, 185, 129, 0.1), transparent 70%);
  z-index: 1;
}

/* 背景层 2 - 粒子效果 */
.bg-layer-2 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  transform: translateZ(0); /* 强制GPU渲染 */
  will-change: transform;
  filter: blur(1px);
}

/* 背景层 3 - 噪点纹理 */
.bg-layer-3 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.03;
  z-index: 3;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* 主内容区 */
.main-content {
  position: relative;
  z-index: 10;
  height: 100%;
  padding: var(--container-padding);
  padding-bottom: calc(var(--nav-height) + 1rem);
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(1.25rem);
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
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 2rem;
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
  gap: 1rem;
  padding: 1rem;
  max-width: 100%;
  margin: auto;
}

/* 模块卡片 */
.module-card {
  position: relative;
  height: 10rem;
  border-radius: var(--card-border-radius);
  background-color: var(--card-bg);
  overflow: hidden;
  transform-style: preserve-3d;
  cursor: pointer;
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.05);
  animation: moduleEntrance 0.8s var(--transition-bouncy) both;
  animation-delay: var(--delay);
  transform: rotateY(var(--rotate)) translateZ(0);
  transition: all 0.4s var(--transition-bouncy);
  backdrop-filter: blur(0.5rem);
  will-change: transform, box-shadow;
  
  /* 确保至少48x48dp的触控区域 */
  min-width: var(--touch-target-size);
  min-height: var(--touch-target-size);
  touch-action: manipulation;
}

.dark-mode .module-card {
  background-color: var(--dark-card-bg);
  box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.2);
}

/* 卡片内容 */
.card-content {
  padding: 1.25rem;
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

.dark-mode .card-highlight {
  opacity: 0.4;
}

/* 图标容器 */
.icon-container {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--module-color);
  margin-bottom: 0.75rem;
  transition: transform 0.6s cubic-bezier(0.68, -0.6, 0.32, 1.6);
}

.module-icon {
  font-size: 1.5rem;
  color: white;
}

/* 标题和描述文本 */
.module-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}

.dark-mode .module-title {
  color: var(--dark-text-primary);
}

.module-description {
  font-size: 0.875rem;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.4;
}

.dark-mode .module-description {
  color: var(--dark-text-secondary);
}

/* 触觉悬停效果 - 仅适用于鼠标设备 */
@media (hover: hover) {
  .module-card:hover {
    transform: 
      rotateY(var(--rotate)) 
      translateY(-0.625rem) 
      scale(1.03);
    box-shadow: 0 0.75rem 1.5rem -0.5rem rgba(0, 200, 83, 0.3);
  }
  
  .module-card:hover .icon-container {
    transform: scale(1.2) rotate(5deg);
  }
  
  .module-card:hover .card-highlight {
    opacity: 0.9;
  }
}

/* 焦点状态 - 符合WCAG 2.2 */
.module-card:focus {
  outline: none;
  box-shadow: 
    0 0 0 0.1875rem white,
    0 0 0 0.375rem var(--module-color);
}

/* 活跃状态 */
.module-card:active {
  transform: scale(0.97);
}

/* 减弱动效模式 */
.reduced-motion * {
  animation: none !important;
  transition: opacity 0.3s linear !important;
  transform: none !important;
}

/* 动画定义 */
@keyframes titleEntrance {
  0% {
    opacity: 0;
    transform: translateY(-1.25rem);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes moduleEntrance {
  0% { 
    opacity: 0; 
    transform: scale(0.8) translateY(1.25rem) rotateY(var(--rotate));
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0) rotateY(var(--rotate));
  }
}

/* 响应式调整 */
@media (max-width: 25rem) { /* 400px */
  .module-grid {
    gap: 0.75rem;
  }
  
  .module-card {
    height: 8.75rem;
  }
  
  .icon-container {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .module-title {
    font-size: 1rem;
  }
  
  .module-description {
    font-size: 0.75rem;
  }
}

/* 平板和桌面视图优化 */
@media (min-width: 48rem) { /* 768px */
  .module-grid {
    grid-template-columns: repeat(2, 15rem);
    justify-content: center;
  }
  
  .module-card {
    height: 11.25rem;
  }
}
</style> 