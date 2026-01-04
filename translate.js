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
      "请将以下英文 changelog 按中文语境重写一下，要求：1. 只翻译纯文本部分，忽略任何 HTML 标签、代码块、表格、特殊格式（如代码行、列）等，看着像代码也保留不动。2. 保留原有 HTML 标签和结构，不要修改格式。3. 保证翻译内容准确。4.小标题的单词也要翻译，日期也要翻译，但必须遵循统一的日期格式。5.不要直译，要理解英文原文的语义，然后用符合中文语言习惯的自然方式重新表述。例如：'action' 不应直译为'行动'，而应根据上下文用更自然的中文表达（如'操作'、'动作'等）。6.专有名词识别规则：- 自动识别首字母大写的专有名词（如产品名、模块名、功能名等），这些通常应保持英文不翻译；- 特别地，以下术语和表达必须固定使用，不要翻译：- 'Frontier' 和 'Frontiers' 是产品名，保持英文不翻译；- 'Crypto Frontier'、'Crypto Frontier QUEST'、'Robotics Frontier' 是专有名词，保持英文不翻译；- 'Model Comparison'、'Spot LLM's Mistakes'、'Correct LLM's Mistakes'、'Food Science'、'Lifelog Canvas' 是专有名词，保持英文不翻译；- 'Lineage' 翻译为'血缘'（因为我们有产品叫 Data Lineage 数据血缘）；- 小要点中的 'How' 不要翻译成'如何'，统一翻译为'运作方式'；- 'Timeline' 不要翻译成'时间表'、'时间安排'，统一翻译为'活动时间'；- 'Access' 不要翻译成'访问'、'访问方式'，统一翻译为'参与方式'；- 'Lock' 统一翻译为'锁仓'。7.日期格式必须严格统一为：'2025 年 12 月 04 日'格式（汉字和数字之间必须保留 1 个空格，年份、月份、日期都是两位数，月份和日期不足两位要补零，例如：'2025 年 09 月 05 日'、'2025 年 06 月 25 日'）。所有日期标题（如 '## Dec 04, 2025'）必须翻译为 '## 2025 年 12 月 04 日' 格式。确保翻译后的中文读起来自然流畅，符合中文表达习惯。",
  },
  {
    code: "ko",
    name: "Korean",
    systemPrompt:
      "다음 영어 changelog 를 한국어 문맥에 맞게 재작성해 주세요. 다음 요구사항을 엄격히 준수하세요: 1. 텍스트 내용만 번역하고, HTML 태그, 코드 블록, 표, 특수 형식(예: 코드 행, 열 등) 등은 무시하고, 코드로 보이는 모든 내용은 그대로 유지하세요. 2. 원본 HTML 태그와 구조를 유지하고, 형식을 수정하지 마세요. 3. 번역 내용의 정확성을 보장하세요. 4. 소제목의 단어도 반드시 번역하세요. 날짜도 번역해야 하며, 반드시 통일된 날짜 형식을 따라야 합니다. 5. 직역하지 말고, 영어 원문의 의미를 이해한 후 한국어 언어 습관에 맞는 자연스러운 방식으로 재표현하세요. 예를 들어, 'action'을 단순히 '행동'으로 직역하지 말고, 문맥에 따라 더 자연스러운 한국어 표현을 사용하세요. 6. 고유명사 식별 규칙: - 대문자로 시작하는 고유명사(예: 제품명, 모듈명, 기능명 등)를 자동으로 식별하고, 이러한 용어는 일반적으로 영어로 유지하고 번역하지 마세요. - 특히 다음 용어와 표현은 고정적으로 사용해야 하며 번역하지 마세요: - 'Frontier'와 'Frontiers'는 제품명이므로 영어로 유지하세요. - 'Crypto Frontier', 'Crypto Frontier QUEST', 'Robotics Frontier'는 고유명사이므로 영어로 유지하세요. - 'Model Comparison', 'Spot LLM's Mistakes', 'Correct LLM's Mistakes', 'Food Science', 'Lifelog Canvas'는 고유명사이므로 영어로 유지하세요. 7. 날짜 형식은 반드시 '2025년 12월 04일' 형식으로 통일하세요(년, 월, 일은 모두 두 자리 숫자이며, 월과 일이 한 자리인 경우 앞에 0을 붙여야 합니다. 예: '2025년 09월 05일', '2025년 06월 25일'). 모든 날짜 제목(예: '## Dec 04, 2025')은 '## 2025년 12월 04일' 형식으로 번역해야 합니다. 번역된 한국어가 자연스럽고 유창하게 읽히도록 한국어 표현 습관에 맞게 작성하세요.",
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
 */
function splitTextByParagraphs(text, maxChars = 8000) {
  const paragraphs = text.split("\n\n");
  const chunks = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      const subPara = para.split("\n");
      let subCurrent = "";
      for (const sub of subPara) {
        if (subCurrent.length + sub.length <= maxChars) {
          subCurrent += sub + "\n";
        } else {
          chunks.push(subCurrent.trim());
          subCurrent = sub + "\n";
        }
      }
      if (subCurrent.trim()) chunks.push(subCurrent.trim());
      continue;
    }

    if (currentChunk.length + para.length <= maxChars) {
      currentChunk += para + "\n\n";
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = para + "\n\n";
    }
  }
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
 * Translation function (integrates two-marker + chunking + translation + concatenation)
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
    return keepBefore + keepAfter;
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
          { role: "user", content: `Please translate the following text, strictly following the system instructions:\n${chunks[i]}` },
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

  return finalResult;
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
        await fs.writeFile(outPath, translated, "utf-8");
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