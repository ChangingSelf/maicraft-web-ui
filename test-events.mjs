// 测试事件API的脚本
const API_BASE = 'http://localhost:8000/api'

async function testEventsAPI() {
  console.log('开始测试事件API...')

  try {
    // 测试获取事件列表
    console.log('\n1. 测试获取事件列表')
    const eventsResponse = await fetch(`${API_BASE}/events?type=all&limit=10`)
    const eventsData = await eventsResponse.json()
    console.log('事件列表响应:', JSON.stringify(eventsData, null, 2))

    // 测试获取统计
    console.log('\n2. 测试获取事件统计')
    const statsResponse = await fetch(`${API_BASE}/events/stats?period=1h`)
    const statsData = await statsResponse.json()
    console.log('统计响应:', JSON.stringify(statsData, null, 2))

    // 测试搜索事件
    console.log('\n3. 测试搜索事件')
    const searchResponse = await fetch(`${API_BASE}/events/search?keyword=test&type=all&limit=5`)
    const searchData = await searchResponse.json()
    console.log('搜索响应:', JSON.stringify(searchData, null, 2))
  } catch (error) {
    console.error('API测试失败:', error.message)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  testEventsAPI()
}

export { testEventsAPI }
