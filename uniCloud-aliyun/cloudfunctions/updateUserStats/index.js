'use strict';

exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('updateUserStats事件', event)
	
	// 参数校验
	if (!event.user_id) {
		return {
			code: 400,
			message: '用户ID不能为空'
		}
	}
	
	const db = uniCloud.database();
	const dbCmd = db.command;
	const userStatsCollection = db.collection('user_stats');
	
	try {
		// 首先检查用户统计记录是否存在
		const userStatsResult = await userStatsCollection.where({
			user_id: event.user_id,
			date: event.date || dbCmd.gte(new Date().setHours(0, 0, 0, 0))
		}).get();
		
		// 准备更新的数据
		const updateData = {};
		
		// 只有在提供了具体字段时才更新
		if (event.new_words_count !== undefined) {
			updateData.new_words_count = event.new_words_count;
		}
		
		if (event.favorite_words_count !== undefined) {
			// 确保favorite_words_count不会是负数
			const currentCount = userStatsResult.data.length > 0 ? (userStatsResult.data[0].favorite_words_count || 0) : 0;
			const newCount = currentCount + event.favorite_words_count;
			updateData.favorite_words_count = Math.max(0, newCount); // 确保不会是负数
		}
		
		if (event.app_usage_minutes !== undefined) {
			updateData.app_usage_minutes = event.app_usage_minutes;
		}
		
		if (event.search_history !== undefined) {
			updateData.search_history = event.search_history;
		}
		
		// 如果没有需要更新的数据，直接返回成功
		if (Object.keys(updateData).length === 0) {
			return {
				code: 200,
				message: '没有需要更新的数据',
				data: userStatsResult.data[0] || {}
			}
		}
		
		// 更新时间
		updateData.update_date = Date.now();
		
		let result;
		
		// 如果记录已存在，则更新
		if (userStatsResult.data.length > 0) {
			result = await userStatsCollection.doc(userStatsResult.data[0]._id).update(updateData);
			
			return {
				code: 200,
				message: '用户统计数据更新成功',
				data: {
					...userStatsResult.data[0],
					...updateData
				}
			}
		} else {
			// 如果记录不存在，则创建新记录
			updateData.user_id = event.user_id;
			updateData.date = event.date || Date.now();
			updateData.create_date = Date.now();
			
			// 确保所有必要字段都有初始值
			if (updateData.new_words_count === undefined) updateData.new_words_count = 0;
			if (updateData.favorite_words_count === undefined) updateData.favorite_words_count = 0;
			if (updateData.app_usage_minutes === undefined) updateData.app_usage_minutes = 0;
			if (updateData.search_history === undefined) updateData.search_history = [];
			
			result = await userStatsCollection.add(updateData);
			
			return {
				code: 200,
				message: '用户统计数据创建成功',
				data: updateData
			}
		}
		
	} catch (error) {
		console.error('更新用户统计数据失败:', error);
		return {
			code: 500,
			message: '更新用户统计数据失败: ' + error.message
		}
	}
}; 