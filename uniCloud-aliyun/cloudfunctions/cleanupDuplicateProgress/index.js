'use strict';
const db = uniCloud.database();
const userWordbookProgressCollection = db.collection('user_wordbook_progress');

exports.main = async (event, context) => {
  try {
    console.log('开始清理重复的用户词书进度记录...');
    
    // 1. 获取所有用户词书进度记录
    const { data: allProgress } = await userWordbookProgressCollection.limit(1000).get();
    
    // 2. 按用户ID和词书ID分组
    const progressGroups = {};
    
    for (const progress of allProgress) {
      const key = `${progress.user_id}_${progress.wordbook_id}`;
      if (!progressGroups[key]) {
        progressGroups[key] = [];
      }
      progressGroups[key].push(progress);
    }
    
    // 3. 处理每个分组
    let mergedCount = 0;
    let deletedCount = 0;
    
    for (const key in progressGroups) {
      const group = progressGroups[key];
      
      // 如果一个组内有多条记录，需要合并
      if (group.length > 1) {
        mergedCount++;
        console.log(`发现用户-词书组合 ${key} 有 ${group.length} 条记录，开始合并...`);
        
        // 按更新时间排序，找出最新的记录作为主记录
        const sortedRecords = group.sort((a, b) => b.update_date - a.update_date);
        const mainRecord = sortedRecords[0];
        const otherRecords = sortedRecords.slice(1);
        
        // 收集所有记录中的单词ID
        let allLearnedWords = [...(mainRecord.learned_words || [])];
        let allFavoriteWords = [...(mainRecord.favorite_words || [])];
        
        // 合并其他记录的单词ID
        for (const record of otherRecords) {
          if (record.learned_words && record.learned_words.length > 0) {
            allLearnedWords = [...new Set([...allLearnedWords, ...record.learned_words])];
          }
          if (record.favorite_words && record.favorite_words.length > 0) {
            allFavoriteWords = [...new Set([...allFavoriteWords, ...record.favorite_words])];
          }
          
          // 删除多余的记录
          await userWordbookProgressCollection.doc(record._id).remove();
          deletedCount++;
          console.log(`已删除多余记录: ${record._id}`);
        }
        
        // 更新主记录
        const now = Date.now();
        await userWordbookProgressCollection.doc(mainRecord._id).update({
          learned_words: allLearnedWords,
          favorite_words: allFavoriteWords,
          update_date: now,
          last_study_date: now
        });
        
        console.log(`已合并记录，保留主记录: ${mainRecord._id}`);
      }
    }
    
    return {
      code: 200,
      data: {
        total_records: allProgress.length,
        merged_groups: mergedCount,
        deleted_records: deletedCount
      },
      message: `清理完成，合并了 ${mergedCount} 组重复记录，删除了 ${deletedCount} 条多余记录`
    };
    
  } catch (error) {
    console.error('清理重复记录失败:', error);
    return {
      code: 500,
      message: '清理失败: ' + error.message
    };
  }
}; 