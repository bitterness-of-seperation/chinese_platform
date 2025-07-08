'use strict';
const db = uniCloud.database();
const attendanceCollection = db.collection('attendance');

exports.main = async (event, context) => {
  const { user_id, type = 'get' } = event;
  
  if (!user_id) {
    return {
      code: 400,
      message: '缺少用户ID'
    };
  }
  
  try {
    const now = new Date(); // 当前精确时间
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    if (type === 'sign') {
      // 检查今天是否已签到
      const todayStr = today.toISOString().split('T')[0];
      
      const existingRecord = await attendanceCollection
        .where({
          user_id
        })
        .get();
      
      // 过滤出今天的记录
      const todayRecords = existingRecord.data.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.toISOString().split('T')[0] === todayStr;
      });
      
      // 如果今天已经签到，则不重复签到
      if (todayRecords && todayRecords.length > 0) {
        return {
          code: 200,
          data: {
            is_signed: true,
            continuous_days: todayRecords[0].continuous_days,
            sign_time: todayRecords[0].sign_time || todayRecords[0].create_date
          },
          message: '今日已签到'
        };
      }
      
      // 计算连续签到天数
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // 过滤出昨天的记录
      const yesterdayRecords = existingRecord.data.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.toISOString().split('T')[0] === yesterdayStr;
      });
      
      let continuousDays = 1; // 默认为1天
      
      // 如果昨天有签到，则连续天数+1
      if (yesterdayRecords && yesterdayRecords.length > 0) {
        continuousDays = yesterdayRecords[0].continuous_days + 1;
      }
      
      // 创建新的签到记录
      const newRecord = {
        user_id,
        date: today,
        sign_time: now, // 保存精确的签到时间
        continuous_days: continuousDays,
        create_date: now,
        is_signed: true
      };
      
      await attendanceCollection.add(newRecord);
      
      return {
        code: 200,
        data: {
          is_signed: true,
          continuous_days: continuousDays,
          sign_time: now
        },
        message: '签到成功'
      };
    } else if (type === 'get') {
      // 获取最近4天的打卡记录
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 3); // 今天和前3天，共4天
      
      // 获取用户所有打卡记录
      const allRecords = await attendanceCollection
        .where({
          user_id
        })
        .get();
        
      // 创建最近4天的空记录
      const emptyRecords = [];
      for (let i = 3; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        // 将日期转换为字符串，便于比较
        const dateStr = date.toISOString().split('T')[0];
        
        // 在所有记录中查找当天记录
        const found = allRecords.data.find(record => {
          const recordDate = new Date(record.date);
          return recordDate.toISOString().split('T')[0] === dateStr;
        });
        
        if (found) {
          // 使用找到的记录
          emptyRecords.push({
            ...found,
            is_signed: true,
            date: date // 确保使用正确的日期对象
          });
        } else {
          // 添加未签到记录
          emptyRecords.push({
            date: date, // 确保使用正确的日期对象
            is_signed: false,
            user_id
          });
        }
      }
      
      return {
        code: 200,
        data: {
          records: emptyRecords
        },
        message: 'success'
      };
    }
    
    return {
      code: 400,
      message: '无效的操作类型'
    };
    
  } catch (error) {
    console.error('操作失败:', error);
    return {
      code: 500,
      message: '操作失败'
    };
  }
}; 