import OpenAI from "openai";
import fs from "fs-extra";
import path from "path";

/**
 * Configuration
 */
const SRC_DIR = "en/changelog";
const TARGET_LANGS = [
  {
    code: "cn",
    name: "Chinese",
    systemPrompt:
      "请将以下英文 changelog 按中文语境重写一下，要求：1. 只翻译纯文本部分，忽略任何 HTML 标签、代码块、表格、特殊格式（如代码行、列）等，看着像代码也保留不动。2. 保留原有 HTML 标签和结构，不要修改格式。3. 保证翻译内容准确。4.小标题的单词也要翻译，日期也要翻译，但必须遵循统一的日期格式。5.不要直译，要理解英文原文的语义，然后用符合中文语言习惯的自然方式重新表述。例如：'action' 不应直译为'行动'，而应根据上下文用更自然的中文表达（如'操作'、'动作'等）。6.专有名词识别规则：- 自动识别首字母大写的专有名词（如产品名、模块名、功能名等），这些通常应保持英文不翻译；- 特别地，以下术语和表达必须固定使用，不要翻译：- 'Frontier' 和 'Frontiers' 是产品名，保持英文不翻译；- 'New Frontier' 和 'New Frontiers' 必须翻译为'新 Frontier'和'新 Frontiers'，不要翻译成'新前沿'；- 'Crypto Frontier'、'Crypto Frontier QUEST'、'Robotics Frontier' 是专有名词，保持英文不翻译；- 'Model Comparison'、'Spot LLM's Mistakes'、'Correct LLM's Mistakes'、'Food Science'、'Lifelog Canvas' 是专有名词，保持英文不翻译；- 'Lineage' 翻译为'血缘'（因为我们有产品叫 Data Lineage 数据血缘）；- 小要点中的 'How' 不要翻译成'如何'，统一翻译为'运作方式'；- 'Timeline' 不要翻译成'时间表'、'时间安排'，统一翻译为'活动时间'；- 'Access' 不要翻译成'访问'、'访问方式'，统一翻译为'参与方式'；- 'Lock' 统一翻译为'锁仓'。7.日期格式必须严格统一为：'2025 年 12 月 04 日'格式（汉字和数字之间必须保留 1 个空格，年份、月份、日期都是两位数，月份和日期不足两位要补零，例如：'2025 年 09 月 05 日'、'2025 年 06 月 25 日'）。所有日期标题（如 '## 4.2.7 Dec 04, 2025'）必须翻译为 '## 4.2.7 2025 年 12 月 04 日' 格式，版本号（如 4.2.7）必须完整保留在日期前面，不要删除或修改版本号。8.代码块处理规则：- 不要添加任何代码块标记（``` 或 ```html），除非原文中明确存在代码块标记；- 如果原文中没有代码块标记，翻译后也不应该出现代码块标记；- 所有文本内容都必须翻译，不要因为看起来像代码就跳过翻译。9.完整性要求：- 确保所有英文文本都被翻译，不要遗漏任何段落或句子；- 如果遇到不确定的内容，也要尝试翻译，而不是跳过。确保翻译后的中文读起来自然流畅，符合中文表达习惯。",
  },
  {
    code: "ko",
    name: "Korean",
    systemPrompt:
      "다음 영어 changelog 를 한국어 문맥에 맞게 재작성해 주세요. 다음 요구사항을 엄격히 준수하세요: 1. 텍스트 내용만 번역하고, HTML 태그, 코드 블록, 표, 특수 형식(예: 코드 행, 열 등) 등은 무시하고, 코드로 보이는 모든 내용은 그대로 유지하세요. 2. 원본 HTML 태그와 구조를 유지하고, 형식을 수정하지 마세요. 3. 번역 내용의 정확성을 보장하세요. 4. 소제목의 단어도 반드시 번역하세요. 날짜도 번역해야 하며, 반드시 통일된 날짜 형식을 따라야 합니다. 5. 직역하지 말고, 영어 원문의 의미를 이해한 후 한국어 언어 습관에 맞는 자연스러운 방식으로 재표현하세요. 예를 들어, 'action'을 단순히 '행동'으로 직역하지 말고, 문맥에 따라 더 자연스러운 한국어 표현을 사용하세요. 6. 고유명사 식별 규칙: - 대문자로 시작하는 고유명사(예: 제품명, 모듈명, 기능명 등)를 자동으로 식별하고, 이러한 용어는 일반적으로 영어로 유지하고 번역하지 마세요. - 특히 다음 용어와 표현은 고정적으로 사용해야 하며 번역하지 마세요: - 'Frontier'와 'Frontiers'는 제품명이므로 영어로 유지하세요. - 'New Frontier'와 'New Frontiers'는 반드시 '새로운 Frontier'와 '새로운 Frontiers'로 번역해야 하며, '새로운 프론티어'로 번역하지 마세요. - 'Crypto Frontier', 'Crypto Frontier QUEST', 'Robotics Frontier'는 고유명사이므로 영어로 유지하세요. - 'Model Comparison', 'Spot LLM's Mistakes', 'Correct LLM's Mistakes', 'Food Science', 'Lifelog Canvas'는 고유명사이므로 영어로 유지하세요. 7. 날짜 형식은 반드시 '2025년 12월 04일' 형식으로 통일하세요(년, 월, 일은 모두 두 자리 숫자이며, 월과 일이 한 자리인 경우 앞에 0을 붙여야 합니다. 예: '2025년 09월 05일', '2025년 06월 25일'). 모든 날짜 제목(예: '## 4.2.7 Dec 04, 2025')은 '## 4.2.7 2025년 12월 04일' 형식으로 번역해야 하며, 버전 번호(예: 4.2.7)는 날짜 앞에 완전히 보존되어야 하며, 버전 번호를 삭제하거나 수정하지 마세요. 8. 코드 블록 처리 규칙: - 원문에 코드 블록 표시(``` 또는 ```html)가 명확히 존재하지 않는 한 코드 블록 표시를 추가하지 마세요; - 원문에 코드 블록 표시가 없으면 번역 후에도 코드 블록 표시가 나타나지 않아야 합니다; - 모든 텍스트 내용은 번역되어야 하며, 코드처럼 보인다고 해서 번역을 건너뛰지 마세요. 9. 완전성 요구사항: - 모든 영어 텍스트가 번역되도록 하고, 어떤 단락이나 문장도 누락하지 마세요; - 불확실한 내용을 만나더라도 건너뛰지 말고 번역을 시도하세요. 번역된 한국어가 자연스럽고 유창하게 읽히도록 한국어 표현 습관에 맞게 작성하세요.",
  },
];

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000,
  maxRetries: 0,
});

/**
 * Retry strategy
 */
async function withRetry(fn, maxRetries = 5) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      retries++;
      if (retries >= maxRetries) {
        throw new Error(`Failed after ${maxRetries} retries: ${err.message}`);
      }
      const delay = 1000 * Math.pow(2, retries);
      console.log(`Request failed, retrying after ${delay}ms (attempt ${retries}/${maxRetries}):`, err.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Split text into chunks (only for the part to be translated)
 * Improved: Ensures complete paragraphs and avoids splitting in the middle of sentences
 */
function splitTextByParagraphs(text, maxChars = 8000) {
  // First, split by double newlines (paragraphs)
  const paragraphs = text.split("\n\n");
  const chunks = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    // If a single paragraph is too long, try to split by single newlines
    if (para.length > maxChars) {
      // Save current chunk if it has content
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      
      // Split long paragraph by single newlines
      const lines = para.split("\n");
      let subCurrent = "";
      for (const line of lines) {
        // If adding this line would exceed limit, save current sub-chunk
        if (subCurrent.length + line.length + 1 > maxChars && subCurrent.trim()) {
          chunks.push(subCurrent.trim());
          subCurrent = line + "\n";
        } else {
          subCurrent += line + "\n";
        }
      }
      if (subCurrent.trim()) {
        chunks.push(subCurrent.trim());
      }
      continue;
    }

    // If adding this paragraph would exceed limit, save current chunk
    if (currentChunk.length + para.length + 2 > maxChars && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = para + "\n\n";
    } else {
      currentChunk += para + "\n\n";
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  console.log(`✅ Split translation part into ${chunks.length} chunks, max ${maxChars} chars per chunk`);
  return chunks;
}

/**
 * Two-marker truncation logic (core modification)
 * Rules:
 * 1. Before markerBefore (inclusive) → keep as-is, no translation
 * 2. Between markerBefore and markerAfter → translate
 * 3. After markerAfter (inclusive) → keep as-is, no translation
 */
function truncateWithTwoMarkers(text, markerBefore, markerAfter) {
  // 1. Locate markerBefore (supports multi-line)
  const markerBeforeIndex = text.indexOf(markerBefore);
  // 2. Locate markerAfter (search forward, must be after markerBefore)
  const markerAfterIndex = markerBeforeIndex === -1
    ? -1
    : text.indexOf(markerAfter, markerBeforeIndex + markerBefore.length);

  // Edge case 1: markerBefore not found → only handle markerAfter (keep after markerAfter as-is)
  if (markerBeforeIndex === -1) {
    if (markerAfterIndex === -1) {
      console.log("⚠️ No markers found, will translate entire content");
      return { translatePart: text, keepBefore: "", keepAfter: "" };
    }
    console.log("⚠️ markerBefore not found, keeping content after markerAfter as-is");
    return {
      translatePart: text.slice(0, markerAfterIndex).trim(),
      keepBefore: "",
      keepAfter: text.slice(markerAfterIndex)
    };
  }

  // Edge case 2: markerBefore found but markerAfter not found → keep before markerBefore as-is, translate the rest
  if (markerAfterIndex === -1) {
    console.log("⚠️ markerAfter not found, keeping content before markerBefore as-is");
    return {
      translatePart: text.slice(markerBeforeIndex + markerBefore.length).trim(),
      keepBefore: text.slice(0, markerBeforeIndex + markerBefore.length),
      keepAfter: ""
    };
  }

  // Normal case: both markers found → translate the middle part
  console.log(`✅ Both markers located:
  - markerBefore position: ${markerBeforeIndex}
  - markerAfter position: ${markerAfterIndex}`);

  return {
    // To translate: between markerBefore and markerAfter
    translatePart: text.slice(markerBeforeIndex + markerBefore.length, markerAfterIndex).trim(),
    // Keep: before markerBefore (inclusive)
    keepBefore: text.slice(0, markerBeforeIndex + markerBefore.length),
    // Keep: after markerAfter (inclusive)
    keepAfter: text.slice(markerAfterIndex)
  };
}

/**
 * Translate front matter and UI elements
 */
async function translateFrontMatterAndUI(text, langCode) {
  const translations = {
    cn: {
      title: "变更日志",
      description: "本文档记录了 Codatta 在 2025 年的所有更新、修复和新功能。",
      resultText: "条结果",
      filterLabels: {
        all: "全部",
        "core-feature": "核心功能发布",
        optimization: "调整与优化",
        fixes: "修复与功能下线",
        campaign: "活动启动"
      },
      monthLabels: {
        all: "全部月份",
        dec: "十二月",
        nov: "十一月",
        oct: "十月",
        sep: "九月",
        aug: "八月",
        jul: "七月",
        jun: "六月"
      }
    },
    ko: {
      title: "변경 로그",
      description: "이 변경 로그는 2025년 Codatta의 모든 업데이트, 수정 및 새로운 기능을 문서화합니다.",
      resultText: "개 결과",
      filterLabels: {
        all: "전체",
        "core-feature": "핵심 기능 출시",
        optimization: "조정 및 최적화",
        fixes: "수정 및 기능 종료",
        campaign: "캠페인 시작"
      },
      monthLabels: {
        all: "전체",
        dec: "12월",
        nov: "11월",
        oct: "10월",
        sep: "9월",
        aug: "8월",
        jul: "7월",
        jun: "6월"
      }
    }
  };

  const t = translations[langCode];
  if (!t) return text;

  let result = text;

  // Translate front matter
  result = result.replace(/title:\s*"Changelog"/, `title: "${t.title}"`);
  result = result.replace(/description:\s*"This changelog documents all updates, fixes, and new features for Codatta in 2025\."/, `description: "${t.description}"`);

  // Translate result text
  result = result.replace(/<span>result\{num !== 1 \? 's' : ''\}<\/span>/, `<span>${t.resultText}</span>`);

  // Translate filter labels - match the exact structure in the code
  const filterLabelMap = {
    'All': t.filterLabels.all,
    'Core Feature Release': t.filterLabels['core-feature'],
    'Adjustments & Optimization': t.filterLabels.optimization,
    'Fixes & Feature Sunset': t.filterLabels.fixes,
    'Campaign Launch': t.filterLabels.campaign
  };
  
  Object.entries(filterLabelMap).forEach(([english, translated]) => {
    // Match: { id: 'xxx', label: 'English', color: ...
    const pattern = new RegExp(`(label: '${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}')`, 'g');
    result = result.replace(pattern, `label: '${translated}'`);
  });

  // Translate month labels - match the exact structure in the code
  const monthLabelMap = {
    'All Months': t.monthLabels.all,
    'December': t.monthLabels.dec,
    'November': t.monthLabels.nov,
    'October': t.monthLabels.oct,
    'September': t.monthLabels.sep,
    'August': t.monthLabels.aug,
    'July': t.monthLabels.jul,
    'June': t.monthLabels.jun
  };
  
  Object.entries(monthLabelMap).forEach(([english, translated]) => {
    // Match: label: 'English'
    const pattern = new RegExp(`(label: '${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}')`, 'g');
    result = result.replace(pattern, `label: '${translated}'`);
  });

  return result;
}

/**
 * Post-process translation result to fix common issues
 */
function postProcessTranslation(text) {
  let result = text;
  
  // Remove erroneous code block markers that shouldn't be there
  // Pattern: ```html or ``` at the start of a line, followed by non-code content
  result = result.replace(/^```html\s*\n(?![a-zA-Z])/gm, '');
  result = result.replace(/^```\s*\n(?![a-zA-Z])/gm, '');
  
  // Remove standalone ``` markers that are clearly errors
  // Look for ``` on its own line that's not part of a proper code block
  result = result.replace(/\n```\s*\n(?!```)/g, '\n');
  
  // Ensure version numbers are preserved in date headers
  // This is more of a validation - the prompt should handle this, but we can log warnings
  
  return result;
}

/**
 * Translation function (integrates two-marker + chunking + translation + concatenation + post-processing)
 */
async function translate(text, systemPrompt) {
  console.log("\n📝 Original text total length:", text.length, "characters");

  // Configure two markers (exact copy, including newlines/indentation/special characters)
  // markerBefore: };    return <ShowResult />;  })()}</div>
  const markerBefore = `};
    return <ShowResult />;
  })()}
</div>`;
  // markerAfter: {/* Component definitions - moved to end of file for cleaner code organization */}
  const markerAfter = `{/* Component definitions - moved to end of file for cleaner code organization */}`;

  // Execute two-marker truncation
  const { translatePart, keepBefore, keepAfter } = truncateWithTwoMarkers(text, markerBefore, markerAfter);

  // No content to translate → return kept parts directly
  if (!translatePart) {
    return postProcessTranslation(keepBefore + keepAfter);
  }

  // Chunk and translate the middle content
  const chunks = splitTextByParagraphs(translatePart);
  const translatedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`🔄 Translating chunk ${i+1}/${chunks.length} (${chunks[i].length} characters)`);
    const res = await withRetry(async () => {
      return await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please translate the following text, strictly following the system instructions. Ensure all text is translated and no content is skipped:\n${chunks[i]}` },
        ],
        temperature: 0.0,
        max_tokens: 4096,
        stream: false,
      });
    });

    if (!res || !res.choices || res.choices.length === 0) {
      throw new Error(`Translation failed for chunk ${i+1}: API returned abnormal response`);
    }
    translatedChunks.push(res.choices[0].message.content.trim());
  }

  // Concatenate final result: keepBefore + translated middle content + keepAfter
  const translatedPart = translatedChunks.join("\n\n");
  const finalResult = keepBefore + (translatedPart ? "\n" + translatedPart : "") + keepAfter;

  // Post-process to fix common issues
  let processedResult = postProcessTranslation(finalResult);
  
  // Translate front matter and UI elements (this needs to be done after main translation)
  // Note: We'll handle this in the main run() function after translation
  
  // Log warnings if version numbers might be missing
  const versionNumberPattern = /##\s*(\d+\.\d+\.\d+)\s+\d{4}/;
  const dateHeaders = processedResult.match(/##\s+\d{4}[년年]/g);
  if (dateHeaders) {
    dateHeaders.forEach(header => {
      if (!versionNumberPattern.test(header)) {
        console.log(`⚠️ Warning: Date header might be missing version number: ${header.substring(0, 50)}`);
      }
    });
  }

  return processedResult;
}

/**
 * Main process
 */
async function run() {
  if (!(await fs.pathExists(SRC_DIR))) {
    console.log("❌ changelog directory not found, skipping translation");
    return;
  }

  const files = await fs.readdir(SRC_DIR);
  for (const file of files) {
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;

    const srcPath = path.join(SRC_DIR, file);
    const content = await fs.readFile(srcPath, "utf-8");

    console.log(`\n========== Processing ${srcPath} ==========`);

    for (const lang of TARGET_LANGS) {
      const outDir = path.join(lang.code, "changelog");
      const outPath = path.join(outDir, file);
      await fs.ensureDir(outDir);

      try {
        const translated = await translate(content, lang.systemPrompt);
        // Translate front matter and UI elements
        const finalTranslated = await translateFrontMatterAndUI(translated, lang.code);
        await fs.writeFile(outPath, finalTranslated, "utf-8");
        console.log(`✅ Success: ${file} → ${lang.code}/changelog/${file}`);
      } catch (err) {
        console.error(`❌ Failed: ${file} → ${lang.code}`, err.stack);
        continue;
      }
    }
  }

  console.log("\n🎉 All files processed!");
}

// Execute main process
run().catch((err) => {
  console.error("💥 Global execution failed:", err.stack);
  process.exit(1);
});