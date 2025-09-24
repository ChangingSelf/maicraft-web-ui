import type {
  PlayerData,
  WorldData,
  LogEntry,
  EventData,
  TokenUsageData,
  TaskData,
} from '../stores/websocketData'

/**
 * WebSocket模拟数据生成器
 * 用于生成各种类型的测试数据，方便调试和测试
 */

// 随机数生成工具函数
const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

const randomInt = (min: number, max: number): number => {
  return Math.floor(randomBetween(min, max))
}

const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}

// 玩家名称池
const playerNames = [
  'Steve',
  'Alex',
  'Herobrine',
  'Notch',
  'Jeb',
  'Dinnerbone',
  '测试玩家',
  '冒险者',
  '建筑师',
  '探索者',
  '矿工',
  '农夫',
]

// 游戏模式
const gameModes = ['survival', 'creative', 'adventure', 'spectator']

// 装备类型
const weaponTypes = [
  { id: 'minecraft:diamond_sword', name: '钻石剑', durability: 1561, max_durability: 1561 },
  { id: 'minecraft:iron_sword', name: '铁剑', durability: 250, max_durability: 250 },
  { id: 'minecraft:golden_sword', name: '金剑', durability: 32, max_durability: 32 },
  { id: 'minecraft:stone_sword', name: '石剑', durability: 131, max_durability: 131 },
  { id: 'minecraft:wooden_sword', name: '木剑', durability: 59, max_durability: 59 },
  { id: 'minecraft:bow', name: '弓', durability: 384, max_durability: 384 },
  { id: 'minecraft:crossbow', name: '弩', durability: 326, max_durability: 326 },
  { id: 'minecraft:trident', name: '三叉戟', durability: 250, max_durability: 250 },
]

const toolTypes = [
  { id: 'minecraft:diamond_pickaxe', name: '钻石镐', durability: 1561, max_durability: 1561 },
  { id: 'minecraft:iron_pickaxe', name: '铁镐', durability: 250, max_durability: 250 },
  { id: 'minecraft:diamond_axe', name: '钻石斧', durability: 1561, max_durability: 1561 },
  { id: 'minecraft:iron_axe', name: '铁斧', durability: 250, max_durability: 250 },
  { id: 'minecraft:diamond_shovel', name: '钻石铲', durability: 1561, max_durability: 1561 },
  { id: 'minecraft:iron_shovel', name: '铁铲', durability: 250, max_durability: 250 },
  { id: 'minecraft:diamond_hoe', name: '钻石锄', durability: 1561, max_durability: 1561 },
  { id: 'minecraft:fishing_rod', name: '钓鱼竿', durability: 64, max_durability: 64 },
]

const armorTypes = {
  helmet: [
    { id: 'minecraft:diamond_helmet', name: '钻石头盔', durability: 363, max_durability: 363 },
    { id: 'minecraft:iron_helmet', name: '铁头盔', durability: 165, max_durability: 165 },
    { id: 'minecraft:golden_helmet', name: '金头盔', durability: 77, max_durability: 77 },
    { id: 'minecraft:leather_helmet', name: '皮革帽子', durability: 55, max_durability: 55 },
  ],
  chestplate: [
    { id: 'minecraft:diamond_chestplate', name: '钻石胸甲', durability: 528, max_durability: 528 },
    { id: 'minecraft:iron_chestplate', name: '铁胸甲', durability: 240, max_durability: 240 },
    { id: 'minecraft:golden_chestplate', name: '金胸甲', durability: 112, max_durability: 112 },
    { id: 'minecraft:leather_chestplate', name: '皮革上衣', durability: 80, max_durability: 80 },
  ],
  leggings: [
    { id: 'minecraft:diamond_leggings', name: '钻石护腿', durability: 495, max_durability: 495 },
    { id: 'minecraft:iron_leggings', name: '铁护腿', durability: 225, max_durability: 225 },
    { id: 'minecraft:golden_leggings', name: '金护腿', durability: 105, max_durability: 105 },
    { id: 'minecraft:leather_leggings', name: '皮革裤子', durability: 75, max_durability: 75 },
  ],
  boots: [
    { id: 'minecraft:diamond_boots', name: '钻石靴子', durability: 429, max_durability: 429 },
    { id: 'minecraft:iron_boots', name: '铁靴子', durability: 195, max_durability: 195 },
    { id: 'minecraft:golden_boots', name: '金靴子', durability: 91, max_durability: 91 },
    { id: 'minecraft:leather_boots', name: '皮革靴子', durability: 65, max_durability: 65 },
  ],
}

// 常见物品类型
const itemTypes = [
  { id: 'minecraft:bread', name: '面包', stackable: true, max_count: 64 },
  { id: 'minecraft:cooked_beef', name: '熟牛肉', stackable: true, max_count: 64 },
  { id: 'minecraft:apple', name: '苹果', stackable: true, max_count: 64 },
  { id: 'minecraft:golden_apple', name: '金苹果', stackable: true, max_count: 64 },
  { id: 'minecraft:potion', name: '药水', stackable: false, max_count: 1 },
  { id: 'minecraft:ender_pearl', name: '末影珍珠', stackable: true, max_count: 16 },
  { id: 'minecraft:arrow', name: '箭', stackable: true, max_count: 64 },
  { id: 'minecraft:torch', name: '火把', stackable: true, max_count: 64 },
  { id: 'minecraft:cobblestone', name: '圆石', stackable: true, max_count: 64 },
  { id: 'minecraft:oak_log', name: '橡木原木', stackable: true, max_count: 64 },
  { id: 'minecraft:iron_ingot', name: '铁锭', stackable: true, max_count: 64 },
  { id: 'minecraft:diamond', name: '钻石', stackable: true, max_count: 64 },
  { id: 'minecraft:emerald', name: '绿宝石', stackable: true, max_count: 64 },
  { id: 'minecraft:coal', name: '煤炭', stackable: true, max_count: 64 },
  { id: 'minecraft:redstone', name: '红石粉', stackable: true, max_count: 64 },
]

// 方块类型
const blockTypes = [
  'minecraft:stone',
  'minecraft:dirt',
  'minecraft:grass_block',
  'minecraft:oak_log',
  'minecraft:iron_ore',
  'minecraft:diamond_ore',
  'minecraft:water',
  'minecraft:lava',
  'minecraft:bedrock',
]

// 生物类型
const entityTypes = [
  'minecraft:zombie',
  'minecraft:skeleton',
  'minecraft:creeper',
  'minecraft:cow',
  'minecraft:pig',
  'minecraft:chicken',
  'minecraft:villager',
  'minecraft:iron_golem',
]

// 维度类型
const dimensions = ['minecraft:overworld', 'minecraft:nether', 'minecraft:the_end']

// 生物群系
const biomes = [
  'minecraft:plains',
  'minecraft:forest',
  'minecraft:desert',
  'minecraft:mountains',
  'minecraft:ocean',
  'minecraft:swamp',
  'minecraft:jungle',
  'minecraft:savanna',
]

// 天气类型
const weatherTypes = ['clear', 'rain', 'thunder']

// 日志级别和模块
const logLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR']
const logModules = [
  'minecraft.server',
  'minecraft.world',
  'minecraft.player',
  'minecraft.network',
  'minecraft.command',
  'mcp.server',
  'mcp.tools',
  'mcp.websocket',
]

// 事件类型
const eventTypes = [
  'player_join',
  'player_leave',
  'player_death',
  'player_chat',
  'block_break',
  'block_place',
  'mob_spawn',
  'mob_death',
  'weather_change',
  'time_change',
  'dimension_change',
]

// 生成装备物品
const generateEquipmentItem = (itemPool: any[], allowEmpty = true) => {
  if (allowEmpty && Math.random() > 0.6) return null

  const item = randomChoice(itemPool)
  const durability = randomInt(Math.floor(item.max_durability * 0.2), item.max_durability)

  return {
    id: item.id,
    name: item.name,
    display_name: item.name, // 添加display_name字段
    count: 1,
    durability,
    max_durability: item.max_durability,
    damage: item.max_durability - durability, // 添加damage字段（已使用的耐久）
    max_damage: item.max_durability, // 添加max_damage字段
    enchantments: Math.random() > 0.7 ? generateEnchantments() : [],
  }
}

// 生成附魔
const generateEnchantments = () => {
  const enchantments = [
    { id: 'minecraft:sharpness', name: '锋利', level: randomInt(1, 5) },
    { id: 'minecraft:unbreaking', name: '耐久', level: randomInt(1, 3) },
    { id: 'minecraft:efficiency', name: '效率', level: randomInt(1, 5) },
    { id: 'minecraft:protection', name: '保护', level: randomInt(1, 4) },
    { id: 'minecraft:fire_protection', name: '火焰保护', level: randomInt(1, 4) },
    { id: 'minecraft:mending', name: '修补', level: 1 },
  ]

  const numEnchants = randomInt(1, 3)
  const selectedEnchants: any[] = []
  for (let i = 0; i < numEnchants; i++) {
    const enchant = randomChoice(enchantments)
    if (!selectedEnchants.find((e) => e.id === enchant.id)) {
      selectedEnchants.push(enchant)
    }
  }

  return selectedEnchants
}

// 生成背包物品
const generateInventoryItems = () => {
  const numItems = randomInt(8, 20)
  const items: any[] = []

  for (let i = 0; i < numItems; i++) {
    const slot = randomInt(0, 35)
    if (items.find((item) => item.slot === slot)) continue // 避免重复槽位

    // 随机选择物品类型
    const itemType = Math.random()
    let item

    if (itemType < 0.4) {
      // 40% 概率是常见物品
      const baseItem = randomChoice(itemTypes)
      const count = baseItem.stackable ? randomInt(1, Math.min(baseItem.max_count, 64)) : 1
      item = {
        slot,
        id: baseItem.id,
        name: baseItem.name,
        display_name: baseItem.name,
        count,
        stackable: baseItem.stackable,
        max_count: baseItem.max_count,
      }
    } else if (itemType < 0.7) {
      // 30% 概率是工具
      const tool = randomChoice(toolTypes)
      const durability = randomInt(Math.floor(tool.max_durability * 0.1), tool.max_durability)
      item = {
        slot,
        id: tool.id,
        name: tool.name,
        display_name: tool.name,
        count: 1,
        durability,
        max_durability: tool.max_durability,
        damage: tool.max_durability - durability,
        max_damage: tool.max_durability,
        enchantments: Math.random() > 0.8 ? generateEnchantments() : [],
      }
    } else {
      // 30% 概率是武器
      const weapon = randomChoice(weaponTypes)
      const durability = randomInt(Math.floor(weapon.max_durability * 0.1), weapon.max_durability)
      item = {
        slot,
        id: weapon.id,
        name: weapon.name,
        display_name: weapon.name,
        count: 1,
        durability,
        max_durability: weapon.max_durability,
        damage: weapon.max_durability - durability,
        max_damage: weapon.max_durability,
        enchantments: Math.random() > 0.8 ? generateEnchantments() : [],
      }
    }

    items.push(item)
  }

  return items
}

/**
 * 生成模拟玩家数据
 */
export const generatePlayerData = (): PlayerData => {
  const name = randomChoice(playerNames)
  const health = randomInt(1, 20)
  const food = randomInt(0, 20)
  const inventoryItems = generateInventoryItems()

  return {
    name,
    health,
    max_health: 20,
    food,
    max_food: 20,
    experience: randomInt(0, 1000),
    level: randomInt(1, 50),
    gamemode: randomChoice(gameModes),
    position: {
      x: randomBetween(-1000, 1000),
      y: randomBetween(1, 256),
      z: randomBetween(-1000, 1000),
      yaw: randomBetween(0, 360),
      pitch: randomBetween(-90, 90),
      on_ground: Math.random() > 0.2,
    },
    equipment: {
      main_hand: generateEquipmentItem([...weaponTypes, ...toolTypes]),
      helmet: generateEquipmentItem(armorTypes.helmet),
      chestplate: generateEquipmentItem(armorTypes.chestplate),
      leggings: generateEquipmentItem(armorTypes.leggings),
      boots: generateEquipmentItem(armorTypes.boots),
    },
    inventory: {
      occupied_slots: inventoryItems.length,
      total_slots: 36,
      empty_slots: 36 - inventoryItems.length,
      items: inventoryItems,
    },
  }
}

/**
 * 生成模拟世界数据
 */
export const generateWorldData = (): WorldData => {
  const timeOfDay = randomInt(0, 24000)
  const weather = randomChoice(weatherTypes)

  return {
    time: {
      time_of_day: timeOfDay,
      formatted_time: formatMinecraftTime(timeOfDay),
      day_count: randomInt(1, 365),
    },
    weather: {
      weather,
      formatted_weather: formatWeather(weather),
      duration: randomInt(1000, 10000),
    },
    location: {
      dimension: randomChoice(dimensions),
      biome: randomChoice(biomes),
      light_level: randomInt(0, 15),
    },
    nearby_blocks: Array.from({ length: randomInt(3, 8) }, () => ({
      type: randomChoice(blockTypes),
      position: {
        x: randomInt(-5, 5),
        y: randomInt(-2, 2),
        z: randomInt(-5, 5),
      },
    })),
    nearby_entities: Array.from({ length: randomInt(0, 5) }, () => ({
      type: randomChoice(entityTypes),
      name: `实体_${randomInt(1000, 9999)}`,
      position: {
        x: randomBetween(-10, 10),
        y: randomBetween(-2, 5),
        z: randomBetween(-10, 10),
      },
      health: randomInt(1, 20),
      distance: randomBetween(1, 15),
    })),
  }
}

/**
 * 生成模拟日志条目
 */
export const generateLogEntry = (isMCP = false): LogEntry => {
  const timestamp = Date.now()
  const level = randomChoice(logLevels)
  const module = randomChoice(
    logModules.filter((m) => (isMCP ? m.startsWith('mcp') : !m.startsWith('mcp'))),
  )

  const messages = [
    `玩家 ${randomChoice(playerNames)} 加入了游戏`,
    `世界时间更新为 ${randomInt(0, 24000)}`,
    `检测到方块破坏: ${randomChoice(blockTypes)}`,
    `生物生成: ${randomChoice(entityTypes)}`,
    `WebSocket连接建立成功`,
    `数据推送完成`,
    `心跳检测正常`,
    `配置文件已重载`,
    `内存使用情况: ${randomInt(50, 90)}%`,
    `网络延迟: ${randomInt(10, 100)}ms`,
  ]

  return {
    timestamp,
    level,
    module,
    message: randomChoice(messages),
    formatted_timestamp: new Date(timestamp).toLocaleString('zh-CN'),
  }
}

/**
 * 生成模拟事件数据
 */
export const generateEventData = (): EventData => {
  const timestamp = new Date().toISOString()
  const type = randomChoice(eventTypes)

  const eventDataMap: Record<string, any> = {
    player_join: { player: randomChoice(playerNames), ip: `192.168.1.${randomInt(1, 255)}` },
    player_leave: { player: randomChoice(playerNames), reason: '正常退出' },
    player_death: {
      player: randomChoice(playerNames),
      cause: randomChoice(['坠落', '怪物攻击', '溺水', '爆炸']),
      location: { x: randomInt(-100, 100), y: randomInt(1, 100), z: randomInt(-100, 100) },
    },
    player_chat: {
      player: randomChoice(playerNames),
      message: randomChoice(['你好！', '有人吗？', '我在挖矿', '天气真好', '谁要一起建房子？']),
    },
    block_break: {
      player: randomChoice(playerNames),
      block: randomChoice(blockTypes),
      location: { x: randomInt(-100, 100), y: randomInt(1, 100), z: randomInt(-100, 100) },
    },
    block_place: {
      player: randomChoice(playerNames),
      block: randomChoice(blockTypes),
      location: { x: randomInt(-100, 100), y: randomInt(1, 100), z: randomInt(-100, 100) },
    },
    mob_spawn: {
      entity: randomChoice(entityTypes),
      location: { x: randomInt(-100, 100), y: randomInt(1, 100), z: randomInt(-100, 100) },
      reason: randomChoice(['自然生成', '刷怪笼', '命令生成']),
    },
    weather_change: {
      from: randomChoice(weatherTypes),
      to: randomChoice(weatherTypes),
      duration: randomInt(1000, 10000),
    },
  }

  return {
    id: `event_${Date.now()}_${randomInt(1000, 9999)}`,
    type,
    timestamp,
    data: eventDataMap[type] || {},
    formatted_timestamp: new Date(timestamp).toLocaleString('zh-CN'),
  }
}

/**
 * 生成模拟Token使用数据
 */
export const generateTokenUsageData = (): TokenUsageData => {
  const currentUsage = randomInt(1000, 50000)
  const limit = 100000

  return {
    current_usage: currentUsage,
    limit,
    reset_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    usage_history: Array.from({ length: randomInt(5, 15) }, () => ({
      timestamp: new Date(Date.now() - randomInt(0, 86400000)).toISOString(),
      tokens_used: randomInt(10, 500),
      operation: randomChoice(['chat_completion', 'embedding', 'fine_tuning', 'moderation']),
    })),
    total_cost: randomBetween(0.01, 10.0),
    total_prompt_tokens: randomInt(1000, 20000),
    total_completion_tokens: randomInt(500, 10000),
    total_tokens: randomInt(1500, 30000),
    total_calls: randomInt(10, 200),
    model_count: randomInt(1, 5),
    models: {
      'gpt-3.5-turbo': {
        model_name: 'gpt-3.5-turbo',
        total_calls: randomInt(5, 50),
        total_prompt_tokens: randomInt(500, 5000),
        total_completion_tokens: randomInt(200, 2000),
        total_tokens: randomInt(700, 7000),
        total_cost: randomBetween(0.01, 2.0),
        first_call_time: Date.now() - randomInt(86400000, 604800000), // 1-7天前
        last_call_time: Date.now() - randomInt(3600000, 86400000), // 1小时-1天前
        last_updated: Date.now() - randomInt(300000, 3600000), // 5分钟-1小时前
      },
      'gpt-4': {
        model_name: 'gpt-4',
        total_calls: randomInt(1, 20),
        total_prompt_tokens: randomInt(100, 2000),
        total_completion_tokens: randomInt(50, 1000),
        total_tokens: randomInt(150, 3000),
        total_cost: randomBetween(0.1, 5.0),
        first_call_time: Date.now() - randomInt(86400000, 604800000),
        last_call_time: Date.now() - randomInt(3600000, 86400000),
        last_updated: Date.now() - randomInt(300000, 3600000),
      },
      'claude-3-sonnet': {
        model_name: 'claude-3-sonnet',
        total_calls: randomInt(2, 15),
        total_prompt_tokens: randomInt(200, 1500),
        total_completion_tokens: randomInt(100, 800),
        total_tokens: randomInt(300, 2300),
        total_cost: randomBetween(0.05, 3.0),
        first_call_time: Date.now() - randomInt(86400000, 604800000),
        last_call_time: Date.now() - randomInt(3600000, 86400000),
        last_updated: Date.now() - randomInt(300000, 3600000),
      },
    },
  }
}

/**
 * 生成模拟任务数据
 */
export const generateTaskData = (): TaskData[] => {
  const taskCategories = {
    collection: [
      { details: '收集100个橡木原木', done_criteria: '背包中有100个橡木原木', priority: 'medium' },
      { details: '收集64个圆石', done_criteria: '背包中有64个圆石', priority: 'low' },
      { details: '收集10个钻石', done_criteria: '获得10个钻石', priority: 'high' },
      { details: '收集32个铁锭', done_criteria: '冶炼获得32个铁锭', priority: 'medium' },
      { details: '收集16个绿宝石', done_criteria: '通过交易或挖掘获得绿宝石', priority: 'high' },
    ],
    building: [
      { details: '建造基础庇护所', done_criteria: '建造4x4的房屋结构', priority: 'high' },
      { details: '建造农场', done_criteria: '建造9x9的耕地农场', priority: 'medium' },
      { details: '建造附魔室', done_criteria: '建造包含附魔台和书架的房间', priority: 'medium' },
      { details: '建造地下矿井', done_criteria: '挖掘到Y=11的矿井通道', priority: 'low' },
      { details: '建造传送门', done_criteria: '建造并激活下界传送门', priority: 'high' },
    ],
    crafting: [
      { details: '制作钻石镐', done_criteria: '成功制作钻石镐', priority: 'high' },
      { details: '制作附魔台', done_criteria: '制作附魔台和15个书架', priority: 'medium' },
      { details: '制作酿造台', done_criteria: '制作酿造台和基础药水', priority: 'medium' },
      { details: '制作铁套装', done_criteria: '制作全套铁质护甲', priority: 'medium' },
      { details: '制作弓和箭', done_criteria: '制作弓和64支箭', priority: 'low' },
    ],
    exploration: [
      { details: '探索村庄', done_criteria: '找到并与村民交易', priority: 'medium' },
      { details: '探索沙漠神殿', done_criteria: '找到并探索沙漠神殿', priority: 'high' },
      { details: '探索废弃矿井', done_criteria: '找到废弃矿井并获得战利品', priority: 'medium' },
      { details: '探索要塞', done_criteria: '找到要塞并激活末地传送门', priority: 'high' },
      { details: '探索下界要塞', done_criteria: '在下界找到要塞结构', priority: 'high' },
    ],
    combat: [
      { details: '击败10只僵尸', done_criteria: '击败10只僵尸并收集掉落物', priority: 'low' },
      { details: '击败凋灵骷髅', done_criteria: '在下界击败凋灵骷髅', priority: 'high' },
      { details: '击败末影龙', done_criteria: '进入末地并击败末影龙', priority: 'high' },
      { details: '击败凋灵', done_criteria: '召唤并击败凋灵Boss', priority: 'high' },
      { details: '击败监守者', done_criteria: '在海底神殿击败监守者', priority: 'high' },
    ],
  }

  const allTasks = Object.values(taskCategories).flat()
  const numTasks = randomInt(5, 12)

  const taskList = Array.from({ length: numTasks }, (_, index) => {
    const template = randomChoice(allTasks)
    const isDone = Math.random() > 0.7
    const createdTime = new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)) // 最近7天内创建
    const updatedTime = new Date(createdTime.getTime() + randomInt(0, 24 * 60 * 60 * 1000)) // 创建后24小时内更新

    return {
      id: `task_${Date.now()}_${randomInt(1000, 9999)}_${index}`,
      details: template.details,
      done_criteria: template.done_criteria,
      progress: isDone ? '已完成' : randomChoice(['进行中', '未开始', '等待条件', '部分完成']),
      done: isDone,
      priority: template.priority,
      category:
        Object.keys(taskCategories).find((key) =>
          taskCategories[key as keyof typeof taskCategories].includes(template),
        ) || 'other',
      created_at: createdTime.toISOString(),
      updated_at: updatedTime.toISOString(),
      estimated_time: randomInt(5, 120), // 预计完成时间（分钟）
      difficulty: randomChoice(['easy', 'medium', 'hard', 'expert']),
      rewards: generateTaskRewards(),
      dependencies: Math.random() > 0.8 ? [`task_${randomInt(1000, 9999)}`] : [],
      tags: generateTaskTags(template.details),
    }
  })

  console.log(
    `[MockDataGenerators] 生成了 ${taskList.length} 个任务:`,
    taskList.map((t) => t.details),
  )
  return taskList
}

// 生成任务奖励
const generateTaskRewards = () => {
  const rewards = []

  // 经验奖励
  if (Math.random() > 0.3) {
    rewards.push({
      type: 'experience',
      amount: randomInt(10, 100),
      description: `获得 ${randomInt(10, 100)} 点经验`,
    })
  }

  // 物品奖励
  if (Math.random() > 0.5) {
    const rewardItems = randomChoice(itemTypes)
    rewards.push({
      type: 'item',
      item_id: rewardItems.id,
      item_name: rewardItems.name,
      amount: randomInt(1, 16),
      description: `获得 ${randomInt(1, 16)} 个${rewardItems.name}`,
    })
  }

  return rewards
}

// 生成任务标签
const generateTaskTags = (details: string) => {
  const tagMap = {
    收集: ['collection', 'gathering'],
    建造: ['building', 'construction'],
    制作: ['crafting', 'creation'],
    探索: ['exploration', 'adventure'],
    击败: ['combat', 'battle'],
    钻石: ['valuable', 'rare'],
    下界: ['nether', 'dangerous'],
    末地: ['end', 'endgame'],
    村庄: ['village', 'trading'],
  }

  const tags = ['auto-generated']
  Object.entries(tagMap).forEach(([keyword, keywordTags]) => {
    if (details.includes(keyword)) {
      tags.push(...keywordTags)
    }
  })

  return [...new Set(tags)] // 去重
}

// 辅助函数
function formatMinecraftTime(ticks: number): string {
  const totalMinutes = Math.floor(ticks / 16.67) // 1 MC分钟 ≈ 16.67 ticks
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function formatWeather(weather: string): string {
  const weatherMap: Record<string, string> = {
    clear: '晴朗',
    rain: '下雨',
    thunder: '雷暴',
  }
  return weatherMap[weather] || weather
}

/**
 * 数据生成器配置
 */
export interface MockDataConfig {
  interval: number // 数据生成间隔（毫秒）
  enabled: boolean // 是否启用自动生成
  batchSize?: number // 批量生成数量（适用于日志、事件等）
}

/**
 * 默认配置
 */
export const DEFAULT_MOCK_CONFIGS: Record<string, MockDataConfig> = {
  player: { interval: 1000, enabled: true },
  world: { interval: 2000, enabled: true },
  marker: { interval: 8000, enabled: true },
  logs: { interval: 3000, enabled: true, batchSize: 2 },
  logs_alt: { interval: 4000, enabled: true, batchSize: 1 },
  token_usage: { interval: 10000, enabled: true },
  events: { interval: 5000, enabled: true, batchSize: 1 },
  task_manager: { interval: 15000, enabled: true },
  general: { interval: 6000, enabled: true },
  status: { interval: 7000, enabled: true },
}

console.log('[MockDataGenerators] 模拟数据生成器已初始化')
