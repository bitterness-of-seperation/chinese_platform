'use strict';
const db = uniCloud.database();
const userWordbookProgressCollection = db.collection('user_wordbook_progress');
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { word_id, user_id, wordbook_id, correct = true } = event;
  
  if (!word_id || !user_id || !wordbook_id) {
    return {
      code: 400,
      message: '缺少必要参数'
    };
  }
  
  try {
    const now = Date.now();
    
    // 获取用户词书进度
    const { data: progressData } = await userWordbookProgressCollection
      .where({
        user_id: user_id,
        wordbook_id: wordbook_id
      })
      .get();
    
    // 如果答题正确，更新is_exercised数组
    if (correct) {
      if (progressData.length > 0) {
        // 更新现有记录
        await userWordbookProgressCollection.doc(progressData[0]._id).update({
          // 添加到已练习单词列表
          is_exercised: dbCmd.addToSet(word_id),
          update_date: now,
          last_study_date: now
        });
      } else {
        // 创建新记录
        await userWordbookProgressCollection.add({
          user_id: user_id,
          wordbook_id: wordbook_id,
          learned_words: [word_id], // 同时添加到已学习单词
          is_exercised: [word_id], // 添加到已练习单词
          favorite_words: [],
          last_study_date: now,
          create_date: now,
          update_date: now
        });
      }
      
      return {
        code: 200,
        message: '更新练习进度成功',
        data: {
          word_id: word_id,
          is_correct: true
        }
      };
    } else {
      // 如果答题错误，不更新is_exercised数组
      return {
        code: 200,
        message: '记录答题结果成功',
        data: {
          word_id: word_id,
          is_correct: false
        }
      };
    }
  } catch (error) {
    console.error('更新练习进度失败:', error);
    return {
      code: 500,
      message: '更新练习进度失败: ' + error.message
    };
  }
}; 