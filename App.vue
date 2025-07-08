<script>
import { useUserStore } from '@/stores/user';
import Layout from '@/components/Layout.vue';

export default {
	components: {
		Layout
	},
	onLaunch: async function() {
		console.log('App Launch');
		const userStore = useUserStore();
		
		try {
			// 验证token
			const isValid = await userStore.validateToken();
			
			if (!isValid) {
				// 如果token无效，跳转到登录页面
				uni.reLaunch({
					url: '/pages/Profile/Profile'
				});
			} else {
				// 如果token有效，跳转到首页
				uni.switchTab({
					url: '/pages/Home/Home'
				});
			}
		} catch (error) {
			console.error('启动时验证token失败：', error);
			// 发生错误时，清除登录状态并跳转到登录页面
			userStore.logout();
			uni.reLaunch({
				url: '/pages/Profile/Profile'
			});
		}
	},
	onShow: function() {
		console.log('App Show');
	},
	onHide: function() {
		console.log('App Hide');
	}
}
</script>

<template>
	<Layout>
		<slot></slot>
	</Layout>
</template>

<style>
	/*每个页面公共css */
	body {
		margin: 0;
		padding: 0;
		font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		overflow-x: hidden;
	}

	/* 在这里添加全局样式 */
	page {
		font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica,
			Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei',
			sans-serif;
		/* 定义全局CSS变量 */
		--nav-bar-height: 88rpx;
		--status-bar-height: 40rpx;
		--safe-area-inset-top: var(--status-bar-height);
		--content-padding-top: calc(var(--nav-bar-height) + var(--safe-area-inset-top));
	}

	/* 去除按钮的默认边框 */
	button {
		border: none !important;
	}
	button::after {
		border: none;
	}
	
	/* 页面主内容 */
	.page-content {
		margin-top: var(--content-padding-top);
	}
</style>
