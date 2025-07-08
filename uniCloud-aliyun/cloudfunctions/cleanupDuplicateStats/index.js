'use strict';
const db = uniCloud.database();
const dbCmd = db.command;
const userStatsCollection = db.collection('user_stats');

exports.main = async (event, context) => {
  try {
    console.log('开始清理重复的用户统计记录...');
    
    // 1. 查找所有用户
    const { data: usersWithStats } = await userStatsCollection.aggregate()
      .group({
        _id: '$user_id',
        count: dbCmd.aggregate.sum(1)
      })
      .match({
        count: dbCmd.gt(1) // 只查找有多条记录的用户
      })
      .end();
    
    console.log(`找到 ${usersWithStats.length} 个有重复记录的用户`);
    
    let cleanedUsers = 0;
    let fixedNegativeCounts = 0;
    
    // 2. 清理每个用户的重复记录
    for (const user of usersWithStats) {
      const userId = user._id;
      
      // 获取该用户的所有记录
      const { data: userRecords } = await userStatsCollection.where({
        user_id: userId
      }).orderBy('date', 'desc').get(); // 按日期降序排列
      
      // 按日期分组
      const recordsByDate = {};
      userRecords.forEach(record => {
        const dateKey = new Date(record.date).setHours(0, 0, 0, 0);
        if (!recordsByDate[dateKey]) {
          recordsByDate[dateKey] = [];
        }
        recordsByDate[dateKey].push(record);
      });
      
      // 处理每个日期的记录
      for (const [dateKey, records] of Object.entries(recordsByDate)) {
        if (records.length > 1) {
          // 有重复记录，进行合并
          console.log(`用户 ${userId} 在日期 ${new Date(parseInt(dateKey)).toISOString().split('T')[0]} 有 ${records.length} 条记录`);
          
          // 按更新时间排序，保留最新的一条作为主记录
          const sortedRecords = records.sort((a, b) => (b.update_date || 0) - (a.update_date || 0));
          const mainRecord = sortedRecords[0];
          const duplicateRecords = sortedRecords.slice(1);
          
          // 合并统计数据
          let newWordsCount = mainRecord.new_words_count || 0;
          let favoriteWordsCount = mainRecord.favorite_words_count || 0;
          let appUsageMinutes = mainRecord.app_usage_minutes || 0;
          let searchHistory = mainRecord.search_history || [];
          
          // 合并其他记录的数据
          for (const record of duplicateRecords) {
            newWordsCount += record.new_words_count || 0;
            favoriteWordsCount += record.favorite_words_count || 0;
            appUsageMinutes = Math.max(appUsageMinutes, record.app_usage_minutes || 0);
            
            // 合并搜索历史
            if (record.search_history && record.search_history.length > 0) {
              searchHistory = [...searchHistory, ...record.search_history];
            }
            
            // 删除重复记录
            await userStatsCollection.doc(record._id).remove();
            console.log(`删除重复记录: ${record._id}`);
          }
          
          // 确保收藏计数不为负数
          if (favoriteWordsCount < 0) {
            console.log(`修正用户 ${userId} 的负收藏计数 ${favoriteWordsCount} -> 0`);
            favoriteWordsCount = 0;
            fixedNegativeCounts++;
          }
          
          // 更新主记录
          await userStatsCollection.doc(mainRecord._id).update({
            new_words_count: newWordsCount,
            favorite_words_count: favoriteWordsCount,
            app_usage_minutes: appUsageMinutes,
            search_history: searchHistory,
            update_date: Date.now()
          });
          
          console.log(`更新主记录: ${mainRecord._id}`);
          cleanedUsers++;
        } else if (records[0].favorite_words_count < 0) {
          // 检查单条记录的负收藏计数
          const record = records[0];
          console.log(`修正用户 ${userId} 的负收藏计数 ${record.favorite_words_count} -> 0`);
          
          await userStatsCollection.doc(record._id).update({
            favorite_words_count: 0,
            update_date: Date.now()
          });
          
          fixedNegativeCounts++;
        }
      }
    }
    
    // 3. 检查剩余的记录中是否有负收藏计数
    const { data: negativeRecords } = await userStatsCollection.where({
      favorite_words_count: dbCmd.lt(0)
    }).get();
    
    if (negativeRecords.length > 0) {
      console.log(`找到 ${negativeRecords.length} 条含负收藏计数的记录`);
      
      for (const record of negativeRecords) {
        console.log(`修正用户 ${record.user_id} 的负收藏计数 ${record.favorite_words_count} -> 0`);
        
        await userStatsCollection.doc(record._id).update({
          favorite_words_count: 0,
          update_date: Date.now()
        });
        
        fixedNegativeCounts++;
      }
    }
    
    return {
      code: 200,
      message: '清理完成',
      data: {
        cleanedUsers,
        fixedNegativeCounts,
        totalProcessed: usersWithStats.length + negativeRecords.length
      }
    };
  } catch (error) {
    console.error('清理用户统计记录失败:', error);
    return {
      code: 500,
      message: '清理失败: ' + error.message
    };
  }
}; 