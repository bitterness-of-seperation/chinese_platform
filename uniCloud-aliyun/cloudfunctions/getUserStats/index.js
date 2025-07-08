'use strict';
const db = uniCloud.database();
const userStatsCollection = db.collection('user_stats');

exports.main = async (event, context) => {
  const { user_id } = event;
  
  if (!user_id) {
    return {
      code: 400,
      message: '缺少用户ID'
    };
  }
  
  try {
    // 获取今天的开始时间（0点）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    // 获取今日统计数据
    const { data: todayStats } = await userStatsCollection
      .where({
        user_id,
        date: todayTimestamp
      })
      .get();
    
    const now = Date.now();
    
    // 检查是否有多条记录，如果有则合并
    if (todayStats.length > 1) {
      console.log(`发现用户 ${user_id} 在日期 ${todayTimestamp} 有 ${todayStats.length} 条记录，开始合并...`);
      
      // 按更新时间排序，找出最新的记录作为主记录
      const sortedRecords = todayStats.sort((a, b) => b.update_date - a.update_date);
      const mainRecord = sortedRecords[0];
      const otherRecords = sortedRecords.slice(1);
      
      // 计算合并后的统计数据
      let totalNewWords = mainRecord.new_words_count || 0;
      let totalFavoriteWords = mainRecord.favorite_words_count || 0;
      let totalAppUsage = mainRecord.app_usage_minutes || 0;
      
      // 合并其他记录的数据
      for (const record of otherRecords) {
        totalNewWords += record.new_words_count || 0;
        totalFavoriteWords += record.favorite_words_count || 0;
        
        // 对于使用时间，取最大值
        if ((record.app_usage_minutes || 0) > totalAppUsage) {
          totalAppUsage = record.app_usage_minutes;
        }
        
        // 合并搜索历史
        if (record.search_history && record.search_history.length > 0) {
          if (!mainRecord.search_history) {
            mainRecord.search_history = [];
          }
          mainRecord.search_history = [...mainRecord.search_history, ...record.search_history];
        }
        
        // 删除多余的记录
        await userStatsCollection.doc(record._id).remove();
        console.log(`已删除多余记录: ${record._id}`);
      }
      
      // 更新主记录
      await userStatsCollection.doc(mainRecord._id).update({
        new_words_count: totalNewWords,
        favorite_words_count: totalFavoriteWords,
        app_usage_minutes: totalAppUsage,
        search_history: mainRecord.search_history || [],
        update_date: now
      });
      
      console.log(`已合并记录，保留主记录: ${mainRecord._id}`);
      
      // 返回合并后的记录
      return {
        code: 200,
        data: {
          ...mainRecord,
          new_words_count: totalNewWords,
          favorite_words_count: totalFavoriteWords,
          app_usage_minutes: totalAppUsage
        },
        message: 'success (merged records)'
      };
    } else if (todayStats.length === 1) {
      // 如果有一个记录，直接返回
      return {
        code: 200,
        data: todayStats[0],
        message: 'success'
      };
    } else {
      // 创建今日统计数据
      const statsData = {
        user_id,
        date: todayTimestamp,
        new_words_count: 0,
        favorite_words_count: 0,
        app_usage_minutes: 0,
        search_history: [],
        create_date: now,
        update_date: now
      };
      
      const result = await userStatsCollection.add(statsData);
      
      return {
        code: 200,
        data: {
          _id: result.id,
          ...statsData
        },
        message: 'success'
      };
    }
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    return {
      code: 500,
      message: '获取失败: ' + error.message
    };
  }
}; 