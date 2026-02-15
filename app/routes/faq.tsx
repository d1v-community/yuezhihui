import { json, type MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import React, { useState } from "react";
import { APP_TITLE } from "~/constants/app";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.pageTitle ? `${data.pageTitle} - ${APP_TITLE}` : `问答 - ${APP_TITLE}`;
  return [{ title }];
};

const faqs = [
  {
    id: "faq-1",
    question: "月经是什么？",
    answer: `月经是在没有怀孕的情况下，受激素水平变化（雌激素、孕激素）影响，子宫内膜剥落并随血液经阴道排出体外的过程。每月脱落的子宫内膜，是对未孕周期的自然清理，防止细胞异常积累，减少病变风险。`
  },
  {
    id: "faq-2",
    question: "如何记录月经周期？",
    answer: `记录月经周期有助于了解自己的身体规律。建议记录每次月经的开始日期、结束日期、经期长度、月经量等信息。通过长期记录，可以发现周期规律，预测下一次月经时间，及时发现异常情况。`
  },
  {
    id: "faq-3",
    question: "正常的月经周期是多少天？",
    answer: `正常月经周期一般为21-35天，平均28天左右。周期从月经第一天开始计算，到下一次月经第一天为止。经期一般为3-7天。每个女性的周期可能有所不同，重要的是了解自己的规律。`
  },
  {
    id: "faq-4",
    question: "月经量多少算正常？",
    answer: `正常月经量为20-80ml，大约相当于4-6片卫生巾的量。如果月经量明显增多（超过80ml）或减少（少于20ml），建议咨询医生。月经量的变化可能受多种因素影响，包括压力、体重变化、疾病等。`
  },
  {
    id: "faq-5",
    question: "痛经正常吗？",
    answer: `轻微的痛经是正常的，通常表现为下腹部轻微坠胀感。但如果疼痛严重影响日常生活，伴有恶心、呕吐、头晕等症状，建议及时就医。原发性痛经和继发性痛经的原因不同，需要医生诊断后对症处理。`
  },
  {
    id: "faq-6",
    question: "月经期间可以运动吗？",
    answer: `月经期间可以进行适量运动。适当的运动可以缓解经期不适，如散步、瑜伽、游泳等轻度运动。但应避免剧烈运动和会增加腹压的运动。如果有严重痛经或不适，可以适当休息。`
  },
  {
    id: "faq-7",
    question: "月经期间饮食需要注意什么？",
    answer: `月经期间建议多摄入富含铁质的食物（如红肉、菠菜等），补充因失血流失的铁元素。可以适量摄入温热的食物，避免过多生冷刺激的食物。保持充足的水分摄入，减少咖啡因和酒精的摄入。`
  },
  {
    id: "faq-8",
    question: "月经不规律怎么办？",
    answer: `偶尔的月经不规律可能是正常的，可能与压力、生活习惯、饮食等因素有关。但如果持续不规律，建议记录月经情况后咨询医生。医生可能会建议进行相关检查，以排除多囊卵巢综合征、甲状腺功能异常等疾病。`
  }
];

export function loader() {
  return json({
    pageTitle: "常见问题",
    faqs
  });
}

export default function FaqRoute() {
  const { pageTitle } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen flex flex-col bg-white text-brand-text">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="text-sm font-semibold tracking-tight text-brand-text hover:text-black">
              {APP_TITLE}
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm text-brand-muted">
              <Link to="/wiki" className="hover:text-brand-text transition-colors">
                百科
              </Link>
              <Link to="/faq" className="text-brand-text transition-colors">
                问答
              </Link>
              <Link to="/" className="hover:text-brand-text transition-colors">
                首页
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/app"
                className="rounded-full bg-brand-text px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition"
              >
                进入应用
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 bg-brand-primary/20">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* 顶部：新版结构 */}
          <div className="mb-8 text-center">
            <div className="text-xs tracking-[0.14em] uppercase text-brand-muted mb-3">FAQ</div>
            <h1 className="text-2xl font-semibold tracking-tight text-brand-text md:text-3xl">
              {pageTitle}
            </h1>
            <p className="mt-3 text-sm text-brand-muted max-w-2xl mx-auto">
              了解月经健康知识，更好地关爱自己
            </p>
          </div>

          {/* 面包屑导航 */}
          <div className="mb-6 flex items-center gap-2 text-sm text-brand-muted">
            <Link to="/" className="hover:text-brand-text transition-colors">
              首页
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-brand-text">{pageTitle}</span>
          </div>

          {/* 底部：问答卡片列表 */}
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqCard key={faq.id} faq={faq} />
            ))}
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-black/5 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-brand-muted">
          <p>&copy; 2024 {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

function FaqCard({ faq }: { faq: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/80 shadow-sm transition-all duration-200 hover:shadow-md">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-brand-primary/20"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-brand-text">
          {faq.question}
        </span>
        <span className={`ml-3 flex-shrink-0 text-brand-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-black/5 px-5 py-4 text-sm text-brand-muted leading-relaxed">
            {faq.answer}
          </div>
        </div>
      </div>
    </div>
  );
}
