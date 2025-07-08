'use strict';

exports.main = async (event, context) => {
	// 参数校验
	if (!event.user_id || !event.word_id) {
		return {
			code: 400,
			message: '缺少必要参数'
		};
	}
	
	const db = uniCloud.database();
	const dbCmd = db.command;
	
	try {
		// 查询是否已经收藏过该单词
		const userWordCollection = db.collection('user_word_relation');
		const { data: existingRelation } = await userWordCollection.where({
			user_id: event.user_id,
			word_id: event.word_id
		}).get();
		
		let isFavorite = false;
		let favoriteChangeValue = 0;
		
		if (existingRelation.length > 0) {
			const relation = existingRelation[0];
			// 切换收藏状态
			isFavorite = !relation.is_favorite;
			
			// 更新收藏状态
			await userWordCollection.doc(relation._id).update({
				is_favorite: isFavorite,
				update_date: Date.now()
			});
			
			favoriteChangeValue = isFavorite ? 1 : -1;
		} else {
			// 创建新的关系记录
			isFavorite = true;
			favoriteChangeValue = 1;
			
			await userWordCollection.add({
				user_id: event.user_id,
				word_id: event.word_id,
				is_favorite: true,
				create_date: Date.now(),
				update_date: Date.now()
			});
		}
		
		// 更新用户统计
		if (favoriteChangeValue !== 0) {
			// 获取当前收藏计数
			const userStatsCollection = db.collection('user_stats');
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			
			const { data: statsData } = await userStatsCollection.where({
				user_id: event.user_id,
				date: dbCmd.gte(today.getTime())
			}).get();
			
			// 确保收藏计数不会为负数
			if (statsData.length > 0) {
				const currentStats = statsData[0];
				const currentFavorites = currentStats.favorite_words_count || 0;
				// 如果取消收藏但当前收藏数为0，不进行减法操作
				if (favoriteChangeValue < 0 && currentFavorites <= 0) {
					favoriteChangeValue = 0;
				}
			}
			
			// 只有在有实际变化时才更新统计
			if (favoriteChangeValue !== 0) {
				await uniCloud.callFunction({
					name: 'updateUserStats',
					data: {
						user_id: event.user_id,
						favorite_words_count: favoriteChangeValue
					}
				});
			}
		}
		
		return {
			code: 200,
			message: isFavorite ? '收藏成功' : '取消收藏成功',
			data: { is_favorite: isFavorite }
		};
	} catch (error) {
		console.error('切换收藏状态失败:', error);
		return {
			code: 500,
			message: '操作失败: ' + error.message
		};
	}
}; 