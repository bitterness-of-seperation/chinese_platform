'use strict';
const db = uniCloud.database();
const dictionaryCollection = db.collection('dictionary');
const userStatsCollection = db.collection('user_stats');
const zhipuai = require('./zhipuai');

exports.main = async (event, context) => {
  const { word, user_id } = event;
  
  if (!word) {
    return {
      code: 400,
      message: '请输入要查询的词语'
    };
  }
  
  try {
    // 查询词语
    const wordRecord = await dictionaryCollection
      .where({
        word: word
      })
      .limit(1)
      .get();
      
    // 如果找到词语，更新搜索次数
    if (wordRecord.data.length > 0) {
      const wordData = wordRecord.data[0];
      
      // 更新搜索次数
      await dictionaryCollection.doc(wordData._id).update({
        search_count: db.command.inc(1)
      });
      
      // 如果有用户ID，更新用户搜索历史
      if (user_id) {
        try {
          await updateSearchHistory(user_id, {
            word: wordData.word,
            word_id: wordData._id,
            search_date: Date.now()
          });
        } catch (error) {
          console.error('更新用户搜索历史失败:', error);
        }
      }
      
      return {
        code: 200,
        data: wordData,
        message: 'success'
      };
    }
    
    // 如果没有找到词语，调用智谱AI接口
    const result = await zhipuai.searchWord(word);
    
    if (result) {
      // 保存到数据库
      const newWord = {
        ...result,
        search_count: 1,
        create_date: Date.now(),
        update_date: Date.now()
      };
      
      const insertResult = await dictionaryCollection.add(newWord);
      newWord._id = insertResult.id;
      
      // 如果有用户ID，更新用户搜索历史
      if (user_id) {
        try {
          await updateSearchHistory(user_id, {
            word: newWord.word,
            word_id: newWord._id,
            search_date: Date.now()
          });
        } catch (error) {
          console.error('更新用户搜索历史失败:', error);
        }
      }
      
      return {
        code: 200,
        data: newWord,
        message: 'success'
      };
    }
    
    return {
      code: 404,
      message: '未找到该词语'
    };
    
  } catch (error) {
    console.error('搜索词语失败:', error);
    return {
      code: 500,
      message: '搜索失败，请稍后重试'
    };
  }
}; 

// 更新用户搜索历史记录
async function updateSearchHistory(userId, searchRecord) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  try {
    // 查询今天的统计数据
    const { data: statsData } = await userStatsCollection.where({
      user_id: userId,
      date: todayTimestamp
    }).get();
    
    const now = Date.now();
    const MAX_HISTORY_SIZE = 20; // 历史记录最大数量
    
    if (statsData.length > 0) {
      // 已有今日统计，更新历史记录
      const stats = statsData[0];
      let searchHistory = stats.search_history || [];
      
      // 检查是否已经包含了当前词汇
      const existingIndex = searchHistory.findIndex(item => 
        item.word === searchRecord.word || 
        (item.word_id && item.word_id === searchRecord.word_id)
      );
      
      if (existingIndex !== -1) {
        // 已存在则更新搜索时间和次数
        searchHistory[existingIndex] = {
          ...searchHistory[existingIndex],
          search_date: now,
          search_count: (searchHistory[existingIndex].search_count || 1) + 1
        };
        // 将这条记录移到最前面
        searchHistory.unshift(searchHistory.splice(existingIndex, 1)[0]);
      } else {
        // 添加新记录
        searchHistory.unshift({
          ...searchRecord,
          search_count: 1,
          search_date: now
        });
        
        // 限制历史记录大小
        if (searchHistory.length > MAX_HISTORY_SIZE) {
          searchHistory = searchHistory.slice(0, MAX_HISTORY_SIZE);
        }
      }
      
      // 更新记录
      await userStatsCollection.doc(stats._id).update({
        search_history: searchHistory,
        update_date: now
      });
    } else {
      // 无今日统计，创建新记录
      await userStatsCollection.add({
        user_id: userId,
        date: todayTimestamp,
        search_history: [{
          ...searchRecord,
          search_count: 1,
          search_date: now
        }],
        new_words_count: 0,
        favorite_words_count: 0,
        app_usage_minutes: 0,
        create_date: now,
        update_date: now
      });
    }
  } catch (error) {
    console.error('更新用户搜索历史失败:', error);
    throw error;
  }
} 