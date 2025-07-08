'use strict';
const db = uniCloud.database();
const userStatsCollection = db.collection('user_stats');

exports.main = async (event, context) => {
  const { user_id, limit = 10, sort_by = 'date' } = event;
  
  if (!user_id) {
    return {
      code: 400,
      message: '缺少用户ID'
    };
  }
  
  try {
    // 查询用户最近的统计记录
    const { data: statsData } = await userStatsCollection
      .where({ user_id })
      .orderBy('date', 'desc')
      .limit(30) // 查询最近30天的记录
      .get();
    
    if (statsData.length === 0) {
      return {
        code: 200,
        data: [],
        message: 'success'
      };
    }
    
    // 合并所有搜索历史
    let allSearchHistory = [];
    statsData.forEach(stats => {
      if (stats.search_history && Array.isArray(stats.search_history)) {
        allSearchHistory = allSearchHistory.concat(stats.search_history);
      }
    });
    
    // 合并同一词汇的记录，保留最新的搜索时间和累计搜索次数
    const wordMap = new Map();
    
    for (const historyItem of allSearchHistory) {
      const word = historyItem.word;
      
      if (wordMap.has(word)) {
        // 如果词汇已存在，更新搜索次数和时间
        const existingItem = wordMap.get(word);
        const searchCount = (existingItem.search_count || 1) + (historyItem.search_count || 1);
        const searchDate = Math.max(existingItem.search_date, historyItem.search_date);
        
        wordMap.set(word, {
          ...historyItem,
          search_count: searchCount,
          search_date: searchDate
        });
      } else {
        // 新词汇
        wordMap.set(word, {
          ...historyItem,
          search_count: historyItem.search_count || 1
        });
      }
    }
    
    // 转换为数组
    let mergedHistory = Array.from(wordMap.values());
    
    // 根据指定字段排序
    if (sort_by === 'count') {
      // 按搜索次数降序排序
      mergedHistory.sort((a, b) => (b.search_count || 1) - (a.search_count || 1));
    } else {
      // 默认按搜索日期降序排序
      mergedHistory.sort((a, b) => b.search_date - a.search_date);
    }
    
    // 限制返回数量
    if (limit > 0) {
      mergedHistory = mergedHistory.slice(0, limit);
    }
    
    return {
      code: 200,
      data: mergedHistory,
      message: 'success'
    };
    
  } catch (error) {
    console.error('获取用户搜索历史失败:', error);
    return {
      code: 500,
      message: '获取失败: ' + error.message
    };
  }
}; 