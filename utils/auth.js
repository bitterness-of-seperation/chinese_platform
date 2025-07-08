import { useUserStore } from '../stores/user';

// 需要登录才能访问的页面
const authPages = [
  '/pages/Home/Home',
  '/pages/WordLearning/WordLearning',
  '/pages/WordProgress/WordProgress',
  '/pages/WordExercise/WordExercise',
  '/pages/Dictionary/Dictionary',
  '/pages/Assistant/Assistant',
  '/pages/Blank/Blank'
];

// 不需要登录就能访问的页面
const publicPages = [
  '/pages/login/login',
  '/pages/register/register',
  '/pages/reset-password/reset-password'
];

// 检查页面是否需要认证
export function needAuth(url) {
  // 移除 URL 中的参数部分
  const path = url.split('?')[0];
  return authPages.includes(path);
}

// 检查是否是公开页面
export function isPublicPage(url) {
  const path = url.split('?')[0];
  return publicPages.includes(path);
}

// 检查用户是否已登录
export function checkLogin() {
  const userStore = useUserStore();
  return userStore.isLoggedIn;
}

// 跳转到登录页面
export function redirectToLogin(fromUrl) {
  const redirectUrl = fromUrl ? encodeURIComponent(fromUrl) : '';
  uni.redirectTo({
    url: `/pages/login/login${redirectUrl ? '?redirect=' + redirectUrl : ''}`
  });
}

// 处理页面访问权限
export function handlePageAuth() {
  const pages = getCurrentPages();
  // 如果没有页面（比如在 App onLaunch 时），直接返回
  if (!pages.length) {
    return true;
  }
  
  const currentPage = pages[pages.length - 1];
  const currentUrl = `/${currentPage.route}`;
  
  // 如果是需要认证的页面且用户未登录
  if (needAuth(currentUrl) && !checkLogin()) {
    redirectToLogin(currentUrl);
    return false;
  }
  
  // 如果用户已登录且访问登录相关页面，跳转到首页
  if (checkLogin() && isPublicPage(currentUrl)) {
    uni.switchTab({
      url: '/pages/Home/Home'
    });
    return false;
  }
  
  return true;
} 