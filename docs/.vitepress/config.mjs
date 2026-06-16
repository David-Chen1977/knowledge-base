import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '能源赛道知识库',
  description: '新能源·算电协同·AI · 投资研究知识库',
  lastUpdated: true,
  cleanUrls: true,

  ignoreDeadLinks: [
    /./,
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: '能源赛道知识库',

    nav: [
      { text: '首页', link: '/' },
      { text: '电力新能源', link: '/电力新能源/赛道总览' },
      { text: '算电协同', link: '/算电协同/赛道总览' },
      { text: 'AI', link: '/AI/赛道总览' },
      { text: '交叉图谱', link: '/MOC-赛道交叉图' },
    ],

    sidebar: {
      '/电力新能源/': [
        { text: '赛道总览', link: '/电力新能源/赛道总览' },
        { text: '关键术语表', link: '/电力新能源/关键术语表' },
        {
          text: '储能',
          collapsed: false,
          items: [
            { text: '产业链', link: '/电力新能源/储能/产业链' },
            { text: '钠电成本与良率', link: '/电力新能源/储能/_深化_2026-06-16_钠电成本与良率' },
            { text: '工商业储能IRR', link: '/电力新能源/储能/_深化_2026-06-16_工商业储能IRR与峰谷价差' },
            { text: '液流电池降本路径', link: '/电力新能源/储能/_深化_2026-06-16_液流电池电解液降本路径' },
          ]
        },
        {
          text: '光伏',
          collapsed: false,
          items: [
            { text: '产业链', link: '/电力新能源/光伏/产业链' },
            { text: '钙钛矿GW量产', link: '/电力新能源/光伏/_深化_2026-06-16_钙钛矿GW级量产' },
          ]
        },
        {
          text: '风电',
          collapsed: false,
          items: [
            { text: '产业链', link: '/电力新能源/风电/产业链' },
          ]
        },
        {
          text: '氢能',
          collapsed: false,
          items: [
            { text: '产业链', link: '/电力新能源/氢能/产业链' },
            { text: '2026拐点', link: '/电力新能源/氢能/_深化_2026-06-16_氢能2026拐点' },
          ]
        },
        { text: '智能电网', link: '/电力新能源/智能电网/新兴赛道' },
        {
          text: '碳市场',
          collapsed: false,
          items: [
            { text: '赛道文件', link: '/电力新能源/碳市场/赛道文件' },
            { text: '扩围与SaaS机会', link: '/电力新能源/碳市场/_深化_2026-06-16_碳市场扩围与碳管理SaaS' },
          ]
        },
        {
          text: '新赛道',
          collapsed: false,
          items: [
            { text: '绿电直连2.0', link: '/电力新能源/新赛道/_深化_2026-06-16_绿电直连2.0与绿色燃料' },
            { text: '800V HVDC', link: '/电力新能源/新赛道/_深化_2026-06-16_800V高压直流输电与设备国产化' },
          ]
        },
        {
          text: '电力市场',
          collapsed: false,
          items: [
            { text: '赛道文件', link: '/电力新能源/电力市场/赛道文件' },
            { text: 'VPP入市+电力交易AI', link: '/电力新能源/电力市场/_深化_2026-06-16_虚拟电厂入市与电力交易AI' },
          ]
        },
      ],

      '/算电协同/': [
        { text: '赛道总览', link: '/算电协同/赛道总览' },
        { text: '投资逻辑', link: '/算电协同/投资逻辑' },
        { text: '数据中心+能源', link: '/算电协同/数据中心+能源/赛道文件' },
        { text: '节能用能体系', link: '/算电协同/节能用能体系深度分析' },
        { text: '算电协同模式', link: '/算电协同/_深化_2026-06-16_算电协同模式与投资收益' },
      ],

      '/AI/': [
        { text: '赛道总览', link: '/AI/赛道总览' },
        { text: '模型层', link: '/AI/模型层/大模型赛道' },
        { text: '基础层', link: '/AI/基础层/芯片与算力' },
        { text: '应用层', link: '/AI/应用层/AI应用赛道' },
        { text: '关键术语表', link: '/AI/关键术语表' },
        { text: 'AI电力调度', link: '/AI/_深化_2026-06-16_电力调度AI与Agent' },
        { text: 'AI芯片量产', link: '/AI/_深化_2026-06-16_中国AI推理芯片量产进度' },
        { text: 'AI编程PMF', link: '/AI/_深化_2026-06-16_中国AI编程PMF' },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/knowledge-base' }
    ],

    footer: {
      message: '投资研究参考 · 不构成投资建议',
      copyright: '知识共享 BY-NC 4.0'
    },

    editLink: {
      pattern: 'https://github.com/your-username/knowledge-base/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索知识库', buttonAriaLabel: '搜索' },
          modal: { displayDetails: '显示详情', resetButtonTitle: '重置' }
        }
      }
    },
  },

  head: [
    ['meta', { name: 'theme-color', content: '#10b981' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ]
})
