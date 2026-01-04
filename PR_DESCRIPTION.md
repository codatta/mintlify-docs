# 添加自动翻译系统并完善多语言 Changelog 支持

## 📋 概述

本次 PR 引入了自动翻译工作流系统，为文档添加了韩文支持，并全面改进了中文和韩文 changelog 的翻译质量和本地化体验。

## ✨ 主要功能

### 1. 自动翻译系统
- **新增 GitHub Actions 工作流** (`.github/workflows/auto-translate.yml`)
  - 当推送到非 main 分支时自动触发翻译
  - 自动创建翻译分支并提交翻译结果
- **新增翻译脚本** (`translate.js`)
  - 使用 OpenAI API 进行智能翻译
  - 支持中文和韩文翻译
  - 包含重试机制和分块处理

### 2. 翻译质量改进
- **专有名词智能识别**
  - 自动识别首字母大写的专有名词（产品名、模块名等）
  - 固定术语规则：`Frontier`、`Crypto Frontier`、`Robotics Frontier`、`Model Comparison` 等保持英文
  - 特定术语统一翻译：`Lineage` → `血缘`，`How` → `运作方式`，`Timeline` → `活动时间`，`Access` → `参与方式`，`Lock` → `锁仓`
- **自然语言表达**
  - 避免直译，根据上下文用符合语言习惯的方式表达
  - 例如：`action` 根据上下文翻译为 `操作`、`动作` 等，而非直译为 `行动`
- **日期格式统一**
  - 中文：`2025 年 12 月 04 日`（汉字和数字之间保留空格，月份和日期补零）
  - 韩文：`2025년 12월 04일`（月份和日期补零）

### 3. 多语言 Changelog 支持
- **新增韩文 changelog** (`ko/changelog/2025.mdx`)
  - 完整的 2025 年 changelog 韩文翻译
  - 包含所有 UI 元素的本地化
- **更新中文 changelog** (`cn/changelog/2025.mdx`)
  - 改进翻译质量
  - 统一日期格式
  - 修复专有名词翻译
- **更新英文 changelog** (`en/changelog/2025.mdx`)
  - 添加 React hooks 导入以支持交互功能

### 4. UI 元素本地化
- **Front matter（元数据）**
  - 中文：`title: "变更日志"`，`description: "本文档记录了 Codatta 在 2025 年的所有更新、修复和新功能。"`
  - 韩文：`title: "변경 로그"`，`description: "이 변경 로그는 2025년 Codatta의 모든 업데이트, 수정 및 새로운 기능을 문서화합니다."`
- **结果文本**
  - 中文：`条结果`
  - 韩文：`개 결과`
- **过滤器标签**
  - 中文：全部、核心功能发布、调整与优化、修复与功能下线、活动启动
  - 韩文：전체、핵심 기능 출시、조정 및 최적화、수정 및 기능 종료、캠페인 시작
- **月份标签**
  - 中文：全部月份、十二月、十一月、十月等
  - 韩文：전체、12월、11월、10월等

### 5. 配置更新
- **更新 `docs.json`**
  - 添加韩文 changelog 导航配置

## 🐛 修复的问题

1. **解析错误修复**
   - 修复韩文 changelog 中的代码块标记错误（` ```html` 和多余的 ` ````）
   - 修复 JSX 解析错误

2. **翻译一致性**
   - 统一专有名词处理规则
   - 统一日期格式
   - 统一术语翻译

3. **UI 元素翻译**
   - 修复过滤器标签未翻译的问题
   - 修复结果文本未翻译的问题
   - 修复 front matter 未翻译的问题

## 📁 文件变更

- **新增文件：**
  - `.github/workflows/auto-translate.yml` - 自动翻译工作流
  - `translate.js` - 翻译脚本
  - `ko/changelog/2025.mdx` - 韩文 changelog

- **修改文件：**
  - `cn/changelog/2025.mdx` - 中文 changelog 更新
  - `en/changelog/2025.mdx` - 英文 changelog 更新
  - `docs.json` - 导航配置更新

## 🔄 工作流程

1. 开发者推送代码到非 main 分支
2. GitHub Actions 自动触发翻译工作流
3. 工作流运行 `translate.js` 脚本
4. 脚本读取英文 changelog，使用 OpenAI API 翻译为中文和韩文
5. 自动创建翻译分支（格式：`{原分支名}-auto-translate-{时间戳}`）
6. 提交翻译结果到新分支

## 📝 注意事项

- 翻译脚本需要 `OPENAI_API_KEY` 环境变量
- 工作流会自动跳过已包含 `auto-translate` 的分支，避免循环触发
- 翻译提示词已优化，确保专有名词和术语的一致性

## ✅ 测试

- [x] 中文 changelog 显示正常
- [x] 韩文 changelog 显示正常，无解析错误
- [x] 所有 UI 元素已正确本地化
- [x] 日期格式统一
- [x] 专有名词处理正确
- [x] 自动翻译工作流正常运行
