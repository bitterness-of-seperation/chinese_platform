'use strict';
const db = uniCloud.database();
const userWordbookProgressCollection = db.collection('user_wordbook_progress');
const wordbooksCollection = db.collection('wordbooks');

exports.main = async (event, context) => {
  const { user_id, book_id } = event;
  
  if (!user_id || !book_id) {
    return {
      code: 400,
      message: '缺少必要参数'
    };
  }
  
  try {
    // 1. 获取词书信息
    const { data: bookData } = await wordbooksCollection
      .doc(book_id)
      .get();
    
    if (!bookData || bookData.length === 0) {
      return {
        code: 404,
        message: '词书不存在'
      };
    }
    
    const book = bookData[0];
    const totalWords = book.total_words || 0;
    
    // 2. 获取用户的词书进度 (历史累计数据，不区分日期)
    let { data: progressData } = await userWordbookProgressCollection
      .where({
        user_id,
        wordbook_id: book_id
      })
      .get();
    
    // 如果没有进度记录，需要初始化
    if (progressData.length === 0) {
      console.log('用户词书进度不存在，开始初始化...');
      
      try {
        // 创建新的进度记录 (初始化历史累计数据)
        const now = new Date();
        const newProgress = {
          user_id,
          wordbook_id: book_id,
          learned_words: [], // 初始为空数组
          favorite_words: [], // 初始为空数组
          last_study_date: now,
          create_date: now,
          update_date: now
        };
        
        const { id } = await userWordbookProgressCollection.add(newProgress);
        console.log('成功创建用户词书进度记录');
        
        // 重新获取创建的记录
        const { data } = await userWordbookProgressCollection.doc(id).get();
        progressData = data;
      } catch (error) {
        console.error('初始化用户词书进度失败:', error);
        throw error;
      }
    }
    
    // 3. 直接从历史累计数据计算进度信息
    const progress = progressData[0];
    const learnedWords = progress.learned_words || [];
    const favoriteWords = progress.favorite_words || [];
    
    // 计算进度 - 简单地用已学习单词数除以总单词数
    const learnedCount = learnedWords.length;
    const favoriteCount = favoriteWords.length;
    //两位小数
    const progressPercentage = (learnedCount / totalWords * 100).toFixed(2);
    
    // 4. 返回进度信息
    return {
      code: 200,
      data: {
        book_name: book.name,
        total_words: totalWords,
        learned_count: learnedCount,
        favorite_count: favoriteCount,
        progress_percentage: progressPercentage,
        last_study_date: progress.last_study_date,
        // 添加数组信息，方便前端直接使用
        learned_words: learnedWords,
        favorite_words: favoriteWords
      },
      message: 'success'
    };
  } catch (error) {
    console.error('获取词书进度失败:', error);
    return {
      code: 500,
      message: '获取词书进度失败: ' + error.message
    };
  }
}; 