'use strict';
const db = uniCloud.database();
const wordbooksCollection = db.collection('wordbooks');
const userWordProgressCollection = db.collection('user_wordbook_progress');

exports.main = async (event, context) => {
  try {
    const { user_id } = event;
    
    // 如果提供了用户ID，查询用户已选择的词书
    if (user_id) {
      // 获取用户词书关联记录
      const userProgress = await userWordProgressCollection
        .where({
          user_id: user_id
        })
        .get();
      
      if (userProgress.data && userProgress.data.length > 0) {
        // 提取用户已选择的词书ID
        const bookIds = userProgress.data.map(item => item.book_id);
        
        // 获取这些词书的详细信息
        const wordbooks = await wordbooksCollection
          .where({
            _id: db.command.in(bookIds)
          })
          .orderBy('_id', 'asc')
          .get();
        
        return {
          code: 200,
          data: wordbooks.data,
          message: 'success'
        };
      }
      
      // 用户没有选择词书
      return {
        code: 200,
        data: [],
        message: '用户未选择词书'
      };
    }
    
    // 如果没有提供用户ID，获取所有词书
    const wordbooks = await wordbooksCollection
      .orderBy('_id', 'asc')
      .get();
      
    return {
      code: 200,
      data: wordbooks.data,
      message: 'success'
    };
    
  } catch (error) {
    console.error('获取词书列表失败:', error);
    return {
      code: 500,
      message: '获取词书列表失败'
    };
  }
}; 