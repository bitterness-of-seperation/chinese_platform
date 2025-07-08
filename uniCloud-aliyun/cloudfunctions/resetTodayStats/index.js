'use strict';
const db = uniCloud.database();
const userStatsCollection = db.collection('user_stats');

exports.main = async (event, context) => {
  const { user_id, new_words_count = 0, favorite_words_count = null, app_usage_minutes = null } = event;
  
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
    
    // 精确查询当天的记录
    const { data: statsData } = await userStatsCollection
      .where({
        user_id: user_id,
        date: todayTimestamp
      })
      .get();
      
    const now = Date.now();
    
    if (statsData.length > 0) {
      // 有记录，进行更新
      const stats = statsData[0];
      const updates = {
        update_date: now
      };
      
      // 设置新值
      if (new_words_count !== null) {
        updates.new_words_count = new_words_count;
      }
      
      if (favorite_words_count !== null) {
        updates.favorite_words_count = favorite_words_count;
      }
      
      if (app_usage_minutes !== null) {
        updates.app_usage_minutes = app_usage_minutes;
      }
      
      await userStatsCollection.doc(stats._id).update(updates);
      
      return {
        code: 200,
        message: '统计数据已重置',
        data: {
          updated_id: stats._id,
          new_words_count: new_words_count,
          favorite_words_count: favorite_words_count !== null ? favorite_words_count : stats.favorite_words_count,
          app_usage_minutes: app_usage_minutes !== null ? app_usage_minutes : stats.app_usage_minutes
        }
      };
    } else {
      // 无记录，创建新记录
      const newStats = {
        user_id,
        date: todayTimestamp,
        new_words_count: new_words_count || 0,
        favorite_words_count: favorite_words_count || 0,
        app_usage_minutes: app_usage_minutes || 0,
        search_history: [],
        create_date: now,
        update_date: now
      };
      
      const result = await userStatsCollection.add(newStats);
      
      return {
        code: 200,
        message: '统计数据已创建并重置',
        data: {
          id: result.id,
          ...newStats
        }
      };
    }
  } catch (error) {
    console.error('重置统计数据失败:', error);
    return {
      code: 500,
      message: '重置失败: ' + error.message
    };
  }
}; 