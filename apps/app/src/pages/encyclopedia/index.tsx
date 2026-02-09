import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useMemo, useState } from 'react'
import { ensureAuthedAndOnboardedOrRedirect } from '../../utils/authGuard'
import { FCActionBar, FCButton, FCNotice, FCPressable, FCSourceTag, FCTabBar } from '../../ui'
import './index.less'

type Source = { label: string; url: string }
type CardTag = '精细化管理' | '常识' | '风险' | '反直觉' | '自检'
type KbCard = {
  id: string
  tag: CardTag
  title: string
  lead: string
  body: string[]
  bullets?: string[]
  redFlags?: string[]
  sources: Source[]
}

const SOURCES: Record<string, Source> = {
  acog_vital_sign: { label: 'ACOG：月经是生命体征', url: 'https://www.acog.org/womens-health/faqs/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign' },
  cdc_hmb: { label: 'CDC：重度月经出血', url: 'https://www.cdc.gov/heavy-menstrual-bleeding/index.html' },
  mayo_cycle: { label: 'Mayo Clinic：月经周期基础', url: 'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cycle/art-20047186' },
  mayo_hmb: { label: 'Mayo Clinic：重度月经出血症状', url: 'https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20351256' },
  nhs_heavy_periods: { label: 'NHS：经量过多', url: 'https://www.nhs.uk/conditions/heavy-periods/' },
  who_endometriosis: { label: 'WHO：子宫内膜异位症', url: 'https://www.who.int/news-room/fact-sheets/detail/endometriosis' },
}

export default function EncyclopediaPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useLoad(() => {
    void ensureAuthedAndOnboardedOrRedirect()
  })

  const cards: KbCard[] = useMemo(
    () => [
      {
        id: 'vital-sign',
        tag: '精细化管理',
        title: '月经是一项“生命体征”',
        lead: '周期、经量、颜色、痛感与出血模式，都是身体状态的信号。',
        body: [
          '把月经当成“每月一次的健康快照”，你会更早发现：是否出血过多、是否存在长期炎症/疼痛问题、是否可能贫血或激素轴波动。',
          '精细化记录的价值不在“记得更多”，而在于：把模糊的感受变成可比较、可解释、可沟通的数据（对自己、对医生都更有用）。',
        ],
        bullets: ['记录不是为了焦虑，而是为了更稳地掌控变化', '异常往往是“趋势”而不是一次性事件', '把变化说清楚，比“我觉得不对劲”更能获得有效帮助'],
        sources: [SOURCES.acog_vital_sign, SOURCES.mayo_cycle],
      },
      {
        id: 'why-precision',
        tag: '精细化管理',
        title: '精细化月经管理：你能得到什么？',
        lead: '更少的未知、更快的定位、更稳定的生活安排。',
        body: [
          '当你能稳定记录“哪天开始、哪天结束、哪几天量最大、是否有血块、是否会痛到影响生活”，你会更容易判断：这是正常波动，还是需要关注的风险。',
          '同时，精细化记录会反向优化你的用品选择、补铁策略、运动/睡眠安排——把“熬过去”变成“更舒服地度过”。',
        ],
        bullets: ['识别经量过多与潜在贫血风险', '识别持续性痛经背后的可能原因', '为分析页面的趋势与风险提示提供更可靠的输入'],
        sources: [SOURCES.cdc_hmb, SOURCES.who_endometriosis],
      },
      {
        id: 'cycle-basics',
        tag: '常识',
        title: '“正常范围”比你想的更宽，但也有底线',
        lead: '周期并不总是 28 天；关键是“稳定的你”而不是“标准的别人”。',
        body: [
          '很多人会把 28 天当成标准，但医学上更常见的做法是看一个范围，并关注“你自己的稳定模式”。',
          '如果你的周期突然明显变短/变长、出血持续时间明显拉长、或伴随新的异常出血模式（例如非经期出血），更值得优先关注。',
        ],
        bullets: ['把“突然变化”标出来：它往往比“绝对数值”更重要', '用同一套口径记录（开始/结束、量峰值、痛感）才能形成可比趋势'],
        sources: [SOURCES.mayo_cycle, SOURCES.acog_vital_sign],
      },
      {
        id: 'hmb-redflags',
        tag: '风险',
        title: '经量过多：最容易被忽视的风险之一',
        lead: '并不是“量大=正常体质好”。经量过多可能与贫血、生活质量下降相关。',
        body: [
          '“经量过多/重度月经出血”常常被误认为是正常个体差异，但当它影响日常生活、需要频繁更换用品、或伴随头晕乏力时，就不应忽视。',
          '你不需要精确到毫升来证明“过多”，但你可以用“更换频率、夜间是否需要起床更换、是否需要双层用品、是否出现大血块”等指标来描述。',
        ],
        redFlags: [
          '连续数小时每小时就浸透 1 片卫生巾/棉条',
          '需要半夜起床更换，或不得不叠加使用多种用品',
          '经期持续 >7 天且量明显影响生活/工作/睡眠',
          '伴随明显贫血症状（乏力、头晕、心慌、气短等）',
        ],
        sources: [SOURCES.cdc_hmb, SOURCES.nhs_heavy_periods, SOURCES.mayo_hmb],
      },
      {
        id: 'pain-not-normal',
        tag: '反直觉',
        title: '痛经不是“必须忍”的成人礼',
        lead: '如果疼痛持续加重、影响学习/工作/睡眠，值得认真评估。',
        body: [
          '很多人从小被告知“痛经很正常”，但临床上更关键的问题是：疼痛是否影响生活、是否在加重、是否伴随其他异常（经量过多、性交痛、排便痛等）。',
          '精细化记录能帮助你识别：疼痛发生在第几天、持续多久、是否与经量峰值同步、止痛药是否有效——这会显著提升就医沟通效率。',
        ],
        redFlags: ['疼痛越来越重，或止痛药效果越来越差', '疼痛导致无法正常上学/上班', '伴随经期外出血、发热、或异常分泌物（需尽快排查）'],
        sources: [SOURCES.who_endometriosis, SOURCES.acog_vital_sign],
      },
      {
        id: 'how-to-track',
        tag: '自检',
        title: '建议你记录的 6 个关键维度（最小但够用）',
        lead: '少而精：能形成趋势、能解释变化、能支撑决策。',
        body: [
          '你不需要“全都记”。只要稳定记录以下维度，就能显著提升分析价值：',
        ],
        bullets: [
          '开始/结束日期（持续天数）',
          '每天的大致经量（用“更换次数/估算 mL/少中多”任一口径即可）',
          '颜色与血块（尤其是突然变化时）',
          '疼痛强度（0~10）与用药情况',
          '是否存在非经期出血/同房后出血',
          '精力与睡眠（便于与贫血/压力波动关联）',
        ],
        sources: [SOURCES.mayo_cycle, SOURCES.cdc_hmb],
      },
    ],
    [],
  )

  const sections = useMemo(() => {
    const order: CardTag[] = ['精细化管理', '常识', '反直觉', '风险', '自检']
    return order.map((tag) => ({ tag, cards: cards.filter((c) => c.tag === tag) })).filter((s) => s.cards.length > 0)
  }, [cards])

  const copyUrl = async (url: string) => {
    try {
      await Taro.setClipboardData({ data: url })
      Taro.showToast({ title: '已复制链接', icon: 'none' })
    } catch {
      Taro.showToast({ title: '复制失败', icon: 'none' })
    }
  }

  return (
    <View className="page">
      <View className="bg">
        <View className="wrap">
          <View className="card fc-appear">
            <View className="row">
              <Text className="title">百科</Text>
              <FCButton size="sm" variant="secondary" onClick={() => Taro.navigateTo({ url: '/pages/setting/index' })}>
                设置
              </FCButton>
            </View>
          </View>

          {sections.map((sec) => (
            <View key={sec.tag} className="section">
              <Text className="sectionTitle">{sec.tag}</Text>
              <View className="cardList">
                {sec.cards.map((c) => {
                  const expanded = expandedId === c.id
                  return (
                    <FCPressable
                      key={c.id}
                      className={['kbCard', expanded ? 'kbCardOpen' : ''].join(' ')}
                      onClick={() => setExpandedId((prev) => (prev === c.id ? null : c.id))}
                    >
                      <View className="kbHead">
                        <Text className="kbTag">{c.tag}</Text>
                        <Text className="kbTitle">{c.title}</Text>
                        <Text className="kbMore">{expanded ? '收起' : '展开'}</Text>
                      </View>
                      <Text className="kbLead">{c.lead}</Text>

                      {expanded ? (
                        <View className="kbBody">
                          {c.body.map((p) => (
                            <Text key={p} className="kbP">
                              {p}
                            </Text>
                          ))}

                          {c.bullets?.length ? (
                            <View className="kbBlock">
                              <Text className="kbSub">要点</Text>
                              {c.bullets.map((b) => (
                                <Text key={b} className="kbLi">
                                  · {b}
                                </Text>
                              ))}
                            </View>
                          ) : null}

                          {c.redFlags?.length ? (
                            <View className="kbWarn">
                              <Text className="kbSub">红旗（建议尽快就医/咨询）</Text>
                              {c.redFlags.map((b) => (
                                <Text key={b} className="kbLi">
                                  · {b}
                                </Text>
                              ))}
                            </View>
                          ) : null}

                          <View className="kbBlock">
                            <View className="kbSourcesTop">
                              <Text className="kbSub">来源</Text>
                              <FCButton
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const text = c.sources.map((s) => `${s.label}\n${s.url}`).join('\n\n')
                                  void copyUrl(text)
                                }}
                              >
                                复制全部
                              </FCButton>
                            </View>
                            <View className="kbSources">
                              {c.sources.map((s) => (
                                <FCSourceTag key={s.url} label={s.label} onClick={() => void copyUrl(s.url)} />
                              ))}
                            </View>
                          </View>
                        </View>
                      ) : null}
                    </FCPressable>
                  )
                })}
              </View>
            </View>
          ))}

          <FCActionBar>
            <FCTabBar />
          </FCActionBar>
          <View className="card" style={{ marginTop: 12 }}>
            <FCNotice
              variant="warn"
              title="科普信息不替代诊断"
              desc="若出现大量出血、晕厥/胸闷气短、持续加重的剧痛、或怀疑怀孕相关出血，请尽快就医或按当地急救流程处理。"
            />
          </View>
        </View>
      </View>
    </View>
  )
}
