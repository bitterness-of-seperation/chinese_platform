'use strict';
const db = uniCloud.database();
const userStatsCollection = db.collection('user_stats');
const userWordbookProgressCollection = db.collection('user_wordbook_progress');
const wordsCollection = db.collection('words');
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { word, user_id, book_id, is_learned = true, is_favorite = false, update_count = false } = event;
  
  if (!word || !user_id || !book_id) {
    return {
      code: 400,
      message: '缺少必要参数'
    };
  }
  
  try {
    // 查询词语是否存在于words表中
    const { data: existingWords } = await wordsCollection
      .where({
        word: word,
        book_id: book_id
      })
      .get();
      
    const now = Date.now();
    let wordId;
    
    if (existingWords.length > 0) {
      // 词语已存在，使用其ID
      wordId = existingWords[0]._id;
    } else {
      console.error('未找到单词:', word, '词书:', book_id);
      return {
        code: 404,
        message: '未找到对应的单词'
      };
    }
    
    // 检查单词是否已经在用户词书进度表中被标记为已学习
    const { data: progressData } = await userWordbookProgressCollection
      .where({
        user_id: user_id,
        wordbook_id: book_id
      })
      .get();
    
    let isAlreadyLearned = false;
    if (progressData.length > 0) {
      const progress = progressData[0];
      if (progress.learned_words && progress.learned_words.includes(wordId)) {
        isAlreadyLearned = true;
      }
    }
    
    // 如果需要更新计数（只在回答正确时更新），并且单词之前未被学习过，则更新用户统计数据
    if (update_count) {
      // 更新用户统计数据 - 只更新当日计数
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
        
      if (statsData.length > 0) {
        // 更新今日统计
        const stats = statsData[0];
        const updates = {
          update_date: now
        };
        
        // 只有在单词未学习过时才更新新词计数
        if (is_learned && !isAlreadyLearned) {
          updates.new_words_count = dbCmd.inc(1);
        }

        // 检查单词是否已经被收藏
        let isAlreadyFavorited = false;
        if (progressData.length > 0) {
          const progress = progressData[0];
          if (progress.favorite_words && progress.favorite_words.includes(wordId)) {
            isAlreadyFavorited = true;
          }
        }

        // 根据收藏状态变化更新收藏计数
        if (is_favorite && !isAlreadyFavorited) {
          updates.favorite_words_count = dbCmd.inc(1);
        } else if (!is_favorite && isAlreadyFavorited) {
          updates.favorite_words_count = dbCmd.inc(-1);
        }
        
        await userStatsCollection.doc(stats._id).update(updates);
      } else {
        // 创建今日统计
        await userStatsCollection.add({
          user_id: user_id,
          date: todayTimestamp,
          new_words_count: (is_learned && !isAlreadyLearned) ? 1 : 0,
          favorite_words_count: is_favorite ? 1 : 0,
          app_usage_minutes: 0,
          search_history: [],
          create_date: now,
          update_date: now
        });
      }
    }
    
    // 更新用户词书进度表 - 无论单词是否已学习，都更新收藏状态
    if (progressData.length > 0) {
      // 更新现有记录
      const progress = progressData[0];
      const updates = {
        update_date: now
      };
      
      if (is_learned) {
        updates.learned_words = dbCmd.addToSet(wordId);
      }
      
      // 根据收藏状态更新收藏列表
      if (is_favorite) {
        updates.favorite_words = dbCmd.addToSet(wordId);
      } else {
        updates.favorite_words = dbCmd.pull(wordId);
      }
      
      await userWordbookProgressCollection.doc(progress._id).update(updates);
    } else {
      // 创建新记录
      await userWordbookProgressCollection.add({
        user_id: user_id,
        wordbook_id: book_id,
        learned_words: is_learned ? [wordId] : [],
        favorite_words: is_favorite ? [wordId] : [],
        is_exercised: [],
        last_study_date: now,
        create_date: now,
        update_date: now
      });
    }
    
    return {
      code: 200,
      data: {
        word_id: wordId,
        is_learned: is_learned,
        is_favorite: is_favorite,
        is_already_learned: isAlreadyLearned // 返回单词是否已经学习过的信息
      },
      message: isAlreadyLearned && is_learned ? '单词已学习过' : '更新成功'
    };
  } catch (error) {
    console.error('更新单词进度失败:', error);
    return {
      code: 500,
      message: '更新失败: ' + error.message
    };
  }
}; 