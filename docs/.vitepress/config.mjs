import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '能源赛道知识库',
  description: '新能源·算电协同·AI · 投资研究知识库',
  lastUpdated: true,
  cleanUrls: true,

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
            { text: '研究', link: '/电力新能源/储能/_回流_2026-06-01_research' },
          ]
        },
        {
          text: '光伏',
          collapsed: false,
          items: [
            { text: '产业链', link: '/电力新能源/光伏/产业链' },
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
          ]
        },
        { text: '智能电网', link: '/电力新能源/智能电网/新兴赛道' },
        { text: '碳市场', link: '/电力新能源/碳市场/赛道文件' },
        { text: '电力市场', link: '/电力新能源/电力市场/赛道文件' },
      ],

      '/算电协同/': [
        { text: '赛道总览', link: '/算电协同/赛道总览' },
        { text: '投资逻辑', link: '/算电协同/投资逻辑' },
        { text: '数据中心+能源', link: '/算电协同/数据中心+能源/赛道文件' },
        { text: '节能用能体系', link: '/算电协同/节能用能体系深度分析' },
        { text: '研究专题', link: '/算电协同/_回流_2026-05-30_research' },
      ],

      '/AI/': [
        { text: '赛道总览', link: '/AI/赛道总览' },
        { text: '模型层', link: '/AI/模型层/大模型赛道' },
        { text: '基础层', link: '/AI/基础层/芯片与算力' },
        { text: '应用层', link: '/AI/应用层/AI应用赛道' },
        { text: '关键术语表', link: '/AI/关键术语表' },
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
