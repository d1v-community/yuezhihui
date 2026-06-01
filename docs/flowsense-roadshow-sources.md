# FlowSense 路演方向资料来源

采集日期：2026-05-25

## 市场与竞品

1. Grand View Research, `FemTech Market (2025 - 2030) Size, Share, & Trends Analysis Report`
   链接：https://www.grandviewresearch.com/industry-analysis/femtech-market-report
   关键信息：2024 年全球 FemTech 市场规模约 392.9 亿美元，预计 2030 年达到 972.5 亿美元。

2. Flo Health 官方新闻稿, `Flo Health Secures More than $200M Investment from General Atlantic`
   链接：https://flo.health/newsroom/flo-health-raises-over-200m
   关键信息：截至 2024 年 6 月，Flo 约 7000 万月活、接近 500 万付费订阅。

3. Clue 官方文章, `Clue launches first-ever community investment round`
   链接：https://helloclue.com/articles/about-clue/clue-launches-first-ever-community-investment-round
   关键信息：2023 年 4 月披露 Clue 在 190 个国家约 1100 万用户。

4. Apple Support, `Track your period with Cycle Tracking`
   链接：https://support.apple.com/en-euro/120356
   关键信息：Apple Health / Apple Watch 的 Cycle Tracking 支持记录 menstruation、symptoms、spotting、BBT，并进行预测。

5. FTC, `Flo Health, Inc.`
   链接：https://www.ftc.gov/legal-library/browse/cases-proceedings/192-3133-flo-health-inc
   关键信息：FTC 最终确定过与 Flo Health 相关的隐私处理命令，说明女性健康数据隐私是核心竞争变量。

## 用户研究与隐私

6. PubMed / Oxford Open Digital Health 2025, `Flowing data: women's views and experiences on privacy and data security when using menstrual cycle tracking apps`
   链接：https://pubmed.ncbi.nlm.nih.gov/40463855/
   关键信息：受访用户希望更好的预测、更好的 UI、数据所有权和更清晰的隐私声明。

7. PMC 2024, `Menstrual Cycle Management and Period Tracker App Use in Millennial and Generation Z Individuals: Mixed Methods Study`
   链接：https://pmc.ncbi.nlm.nih.gov/articles/PMC11502972/
   关键信息：周期管理 app 的持续使用与用户价值感、准确性、健康素养提升有关，未来产品要提供更贴合需求的附加价值。

## 中国市场竞品观察

8. 中国区 App Store, `美柚 - 经期·备孕·怀孕·育儿&亲友版`
   链接：https://apps.apple.com/cn/app/%E7%BE%8E%E6%9F%9A-%E7%BB%8F%E6%9C%9F-%E5%A4%87%E5%AD%95-%E6%80%80%E5%AD%95-%E8%82%B2%E5%84%BF-%E4%BA%B2%E5%8F%8B%E7%89%88/id634896669
   关键信息：主叙事为记录、预测、提醒和经期/备孕/怀孕/育儿四大模式。

9. 中国区 App Store, `大姨妈月经期助手-女性健康攻略社区`
   链接：https://apps.apple.com/cn/app/%E5%A4%A7%E5%A7%A8%E5%A6%88%E6%9C%88%E7%BB%8F%E6%9C%9F%E5%8A%A9%E6%89%8B-%E5%A5%B3%E6%80%A7%E5%81%A5%E5%BA%B7%E6%94%BB%E7%95%A5%E7%A4%BE%E5%8C%BA/id527809600
   关键信息：主叙事为经期预测、备孕辅助、医生咨询、社区内容。

## 与当前项目能力对齐的本地依据

10. 仓库 README
    路径：`README.md`
    关键信息：项目自我定位为“把出血流量、卫生用品使用、症状体感和长期趋势组织成可理解数据的记录系统”。

11. 分析能力实现
    路径：`app/services/analysis.server.ts`
    关键信息：已包含总流量估算、颜色/血块判断、风险提示、异常子宫出血相关规则。

12. Taro 端分析页
    路径：`apps/app/src/pages/analyze/index.tsx`
    关键信息：已存在健康分、趋势、规律性、风险提示与周期列表等用户可见分析入口。
