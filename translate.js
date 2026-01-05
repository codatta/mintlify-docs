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
      "请将以下英文 changelog 按中文语境重写，严格遵循以下要求：\n\n【一、结构完整性（最高优先级）】\n1. 严格禁止添加任何新的 HTML 标签或结构元素（如 <div>、<span> 等），只翻译文本内容。\n2. 如果原文中某个 changelog item 已存在完整结构（包括 <div className=\"changelog-item\"> 和日期标题），不要重复创建，只翻译其中的文本内容。\n3. 不要添加重复的日期标题或 changelog item 结构。\n4. 保持原文结构完整性，不要因认为结构不完整而添加新元素。\n5. 保留所有原有 HTML 标签和结构，不要修改格式。\n\n【二、格式规范】\n6. 只翻译纯文本部分，忽略 HTML 标签、代码块、表格、特殊格式等，代码相关内容保留不动。\n7. 小标题和日期必须翻译，日期格式统一为：'2025 年 12 月 04 日'（汉字和数字之间保留 1 个空格，年月日均为两位数，不足补零，如：'2025 年 09 月 05 日'）。\n8. 日期标题（如 '## 4.2.7 Dec 04, 2025'）必须翻译为 '## 4.2.7 2025 年 12 月 04 日'，版本号必须完整保留在日期前面，不得删除或修改。\n9. 不要添加代码块标记（``` 或 ```html），除非原文明确存在；原文无代码块标记时，翻译后也不应出现。\n\n【三、翻译质量】\n10. 不要直译，理解英文语义后用符合中文习惯的自然方式重新表述。例如：'action' 不应直译为'行动'，应根据上下文用'操作'、'动作'等更自然的表达。\n11. 确保所有英文文本都被翻译，不遗漏任何段落或句子；遇到不确定内容也要尝试翻译，不要跳过。\n12. 保证翻译内容准确，翻译后的中文应自然流畅，符合中文表达习惯。\n\n【四、专有名词处理】\n13. 自动识别首字母大写的专有名词（产品名、模块名、功能名等），通常保持英文不翻译。\n14. 固定术语规则（必须严格遵守）：\n    - 产品名：'Frontier'、'Frontiers' 保持英文；'New Frontier'、'New Frontiers' 翻译为'新 Frontier'、'新 Frontiers'（不要翻译成'新前沿'）。\n    - 专有名词（保持英文）：'Crypto Frontier'、'Crypto Frontier QUEST'、'Robotics Frontier'、'Model Comparison'、'Spot LLM's Mistakes'、'Correct LLM's Mistakes'、'Food Science'、'Lifelog Canvas'。\n    - 固定翻译：'Lineage' → '血缘'；小要点中的 'How' → '运作方式'；'Timeline' → '活动时间'；'Access' → '参与方式'；'Lock' → '锁仓'。",
  },
  {
    code: "ko",
    name: "Korean",
    systemPrompt:
      "다음 영어 changelog를 한국어 문맥에 맞게 재작성하되, 다음 요구사항을 엄격히 준수하세요:\n\n【一、구조 완전성(최우선 순위)】\n1. 새로운 HTML 태그나 구조 요소(<div>, <span> 등) 추가를 엄격히 금지하며, 텍스트 내용만 번역하세요.\n2. 원문에 changelog item의 완전한 구조(<div className=\"changelog-item\"> 및 날짜 제목 포함)가 이미 존재하는 경우, 이러한 구조를 반복 생성하지 말고 텍스트 내용만 번역하세요.\n3. 중복된 날짜 제목이나 changelog item 구조를 추가하지 마세요.\n4. 원문의 구조 완전성을 유지하고, 구조가 불완전하다고 생각하여 새 요소를 추가하지 마세요.\n5. 원본 HTML 태그와 구조를 유지하고, 형식을 수정하지 마세요.\n\n【二、형식 규칙】\n6. 텍스트 내용만 번역하고, HTML 태그, 코드 블록, 표, 특수 형식 등은 무시하며, 코드로 보이는 모든 내용은 그대로 유지하세요.\n7. 소제목과 날짜는 반드시 번역하되, 날짜 형식은 '2025년 12월 04일'로 통일하세요(년, 월, 일은 모두 두 자리 숫자, 한 자리인 경우 앞에 0을 붙임, 예: '2025년 09월 05일').\n8. 날짜 제목(예: '## 4.2.7 Dec 04, 2025')은 '## 4.2.7 2025년 12월 04일' 형식으로 번역하며, 버전 번호는 날짜 앞에 완전히 보존하고 삭제하거나 수정하지 마세요.\n9. 원문에 코드 블록 표시(``` 또는 ```html)가 명확히 존재하지 않는 한 코드 블록 표시를 추가하지 마세요.\n\n【三、번역 품질】\n10. 직역하지 말고, 영어 원문의 의미를 이해한 후 한국어 언어 습관에 맞는 자연스러운 방식으로 재표현하세요. 예: 'action'을 단순히 '행동'으로 직역하지 말고, 문맥에 따라 더 자연스러운 한국어 표현을 사용하세요.\n11. 모든 영어 텍스트가 번역되도록 하고, 어떤 단락이나 문장도 누락하지 마세요. 불확실한 내용도 건너뛰지 말고 번역을 시도하세요.\n12. 번역 내용의 정확성을 보장하고, 번역된 한국어가 자연스럽고 유창하게 읽히도록 한국어 표현 습관에 맞게 작성하세요.\n\n【四、고유명사 처리】\n13. 대문자로 시작하는 고유명사(제품명, 모듈명, 기능명 등)를 자동으로 식별하고, 이러한 용어는 일반적으로 영어로 유지하고 번역하지 마세요.\n14. 고정 용어 규칙(반드시 준수):\n    - 제품명: 'Frontier', 'Frontiers'는 영어로 유지; 'New Frontier', 'New Frontiers'는 '새로운 Frontier', '새로운 Frontiers'로 번역(('새로운 프론티어'로 번역하지 마세요).\n    - 고유명사(영어 유지): 'Crypto Frontier', 'Crypto Frontier QUEST', 'Robotics Frontier', 'Model Comparison', 'Spot LLM's Mistakes', 'Correct LLM's Mistakes', 'Food Science', 'Lifelog Canvas'.\n    - 고정 번역: 'Lineage' → '계보'; 소제목의 'How' → '방법'; 'Timeline' → '일정'; 'Access' → '접근'; 'Lock' → '잠금'.",
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
 * Improved: Split by complete changelog items to preserve structure context
 */
function splitTextByParagraphs(text, maxChars = 8000) {
  // Try to split by complete changelog items first
  const changelogItemPattern = /<div className="changelog-item"[^>]*>/g;
  const itemMatches = [...text.matchAll(changelogItemPattern)];
  
  // If we have changelog items, try to split by them
  if (itemMatches.length > 1) {
    const chunks = [];
    let lastIndex = 0;
    
    for (let i = 0; i < itemMatches.length; i++) {
      const currentMatch = itemMatches[i];
      const nextMatch = itemMatches[i + 1];
      const itemStart = currentMatch.index;
      const itemEnd = nextMatch ? nextMatch.index : text.length;
      const itemContent = text.slice(itemStart, itemEnd);
      
      // If this item alone is too long, fall back to paragraph splitting for this item
      if (itemContent.length > maxChars) {
        // Add any content before this item
        if (itemStart > lastIndex) {
          const beforeContent = text.slice(lastIndex, itemStart);
          if (beforeContent.trim()) {
            chunks.push(beforeContent.trim());
          }
        }
        
        // Split this long item by paragraphs
        const itemParagraphs = itemContent.split("\n\n");
        let itemChunk = "";
        for (const para of itemParagraphs) {
          if (itemChunk.length + para.length + 2 > maxChars && itemChunk.trim()) {
            chunks.push(itemChunk.trim());
            itemChunk = para + "\n\n";
          } else {
            itemChunk += para + "\n\n";
          }
        }
        if (itemChunk.trim()) {
          chunks.push(itemChunk.trim());
        }
        lastIndex = itemEnd;
        continue;
      }
      
      // Check if we can add this item to current chunk
      const contentBefore = text.slice(lastIndex, itemStart);
      const potentialChunk = contentBefore + itemContent;
      
      if (potentialChunk.length > maxChars && contentBefore.trim()) {
        // Save current chunk and start new one
        chunks.push(contentBefore.trim());
        lastIndex = itemStart;
      }
    }
    
    // Add remaining content
    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex);
      if (remaining.trim()) {
        chunks.push(remaining.trim());
      }
    }
    
    if (chunks.length > 0) {
      console.log(`✅ Split translation part into ${chunks.length} chunks by changelog items, max ${maxChars} chars per chunk`);
      return chunks;
    }
  }
  
  // Fallback to paragraph-based splitting
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
  
  // Detect and remove duplicate changelog items
  // Pattern: Look for consecutive changelog-item divs with the same date
  const dateHeaderPattern = /##\s*([0-9]+\.[0-9]+\.[0-9]+)\s+(\d{4}[년年]\s*\d{1,2}[월月]\s*\d{1,2}[일日])/g;
  const dates = [];
  let match;
  while ((match = dateHeaderPattern.exec(result)) !== null) {
    dates.push({
      fullMatch: match[0],
      version: match[1],
      date: match[2],
      index: match.index
    });
  }
  
  // Check for duplicate dates (same version and date)
  const seenDates = new Map();
  const duplicatesToRemove = [];
  
  for (let i = 0; i < dates.length; i++) {
    const dateKey = `${dates[i].version}-${dates[i].date}`;
    if (seenDates.has(dateKey)) {
      // Found duplicate - mark the later one for removal
      const firstIndex = seenDates.get(dateKey);
      const duplicateIndex = dates[i].index;
      
      // Find the changelog item div that contains this duplicate date
      // Look backwards from the date to find the opening <div className="changelog-item">
      const beforeDate = result.substring(Math.max(0, duplicateIndex - 500), duplicateIndex);
      const divMatch = beforeDate.match(/<div className="changelog-item"[^>]*>[\s\S]*$/);
      
      if (divMatch) {
        // Find the closing </div> for this changelog item
        const afterDate = result.substring(duplicateIndex);
        const closingDivMatch = afterDate.match(/^[\s\S]*?<\/div>/);
        
        if (closingDivMatch) {
          const duplicateStart = duplicateIndex - (beforeDate.length - divMatch.index);
          const duplicateEnd = duplicateIndex + closingDivMatch[0].length;
          duplicatesToRemove.push({ start: duplicateStart, end: duplicateEnd });
          console.log(`⚠️ Detected duplicate changelog item: ${dates[i].fullMatch}, removing...`);
        }
      }
    } else {
      seenDates.set(dateKey, dates[i].index);
    }
  }
  
  // Remove duplicates (in reverse order to maintain indices)
  duplicatesToRemove.sort((a, b) => b.start - a.start);
  for (const dup of duplicatesToRemove) {
    result = result.substring(0, dup.start) + result.substring(dup.end);
  }
  
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
    
    // Provide context from previous and next chunks to help AI understand structure
    let contextInfo = "";
    if (chunks.length > 1) {
      if (i > 0) {
        // Extract date headers from previous chunk for context
        const prevDates = chunks[i - 1].match(/##\s*[0-9]+\.[0-9]+\.[0-9]+\s+[A-Za-z]+\s+\d+,\s+\d{4}/g);
        if (prevDates && prevDates.length > 0) {
          contextInfo += `\n\n[Context: Previous changelog entry ends with: ${prevDates[prevDates.length - 1]}]`;
        }
      }
      if (i < chunks.length - 1) {
        // Extract date headers from next chunk for context
        const nextDates = chunks[i + 1].match(/##\s*[0-9]+\.[0-9]+\.[0-9]+\s+[A-Za-z]+\s+\d+,\s+\d{4}/g);
        if (nextDates && nextDates.length > 0) {
          contextInfo += `\n\n[Context: Next changelog entry starts with: ${nextDates[0]}]`;
        }
      }
    }
    
    const res = await withRetry(async () => {
      return await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please translate the following text, strictly following the system instructions. Ensure all text is translated and no content is skipped. Do NOT add any new HTML tags or duplicate structures - only translate the text content within existing structures.${contextInfo}\n\nText to translate:\n${chunks[i]}` },
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