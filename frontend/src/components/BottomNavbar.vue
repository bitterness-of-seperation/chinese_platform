<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = [
  { id: 'home', icon: 'home', label: '首页', route: '/' },
  { id: 'profile', icon: 'person', label: '我的', route: '/profile' },
]

const activeTab = computed(() => {
  const match = navItems.find(i => i.route === route.path)
  return match?.id ?? 'home'
})

const setActiveTab = (to: string) => {
  if (to !== route.path) router.push(to)
}
</script>

<template>
  <nav class="bottom-navbar">
    <button 
      v-for="item in navItems" 
      :key="item.id"
      class="nav-item"
      :class="{ active: activeTab === item.id }"
      @click="setActiveTab(item.route)"
    >
      <span class="material-icons icon">{{ item.icon }}</span>
      <span class="label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 16px;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9E9E9E;
  transition: all 0.2s ease;
  position: relative;
  padding: 0;
  outline: none;
}

.nav-item:hover {
  color: #43A047;
}

.nav-item.active {
  color: #2E7D32;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 3px;
  background-color: #2E7D32;
  border-radius: 3px 3px 0 0;
}

.icon {
  font-size: 22px;
  margin-bottom: 4px;
}

.label {
  font-size: 12px;
  font-weight: 500;
}
</style> 