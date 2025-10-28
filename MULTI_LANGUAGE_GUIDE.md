# Multi-Language Documentation Guide

This guide explains how to work with the multi-language setup for your Mintlify documentation.

## Directory Structure

```
.
├── en/              # English (primary language)
│   ├── index.mdx
│   ├── starter/
│   ├── core-systems/
│   ├── community/
│   └── protocol-token/
├── cn/              # Chinese (中文)
│   ├── index.mdx
│   ├── starter/
│   ├── core-systems/
│   ├── community/
│   └── protocol-token/
├── ko/              # Korean (한국어)
│   ├── index.mdx
│   ├── starter/
│   ├── core-systems/
│   ├── community/
│   └── protocol-token/
├── docs.json        # Main configuration
└── i18n.json        # Translation automation config
```

## Configuration

### `docs.json`

The `docs.json` file now includes a `languages` array within the `navigation` object, defining content for each language:

- **English (en)**: Primary language with all existing content
- **Chinese (cn)**: Simplified Chinese translations
- **Korean (ko)**: Korean translations

Each language has its own:
- Navigation structure
- Translated group names
- Page paths relative to the language directory

## How to Add Content

### 1. Adding New Pages

When adding a new page:

1. Create the file in the English (`en/`) directory first
2. Add the page to the English navigation in `docs.json`
3. Create corresponding files in Chinese (`cn/`) and Korean (`ko/`) directories
4. Update the navigation for all languages in `docs.json`

Example:
```bash
# Create English version
en/starter/new-feature.mdx

# Create Chinese version  
cn/starter/new-feature.mdx

# Create Korean version
ko/starter/new-feature.mdx
```

### 2. Translating Content

#### Manual Translation

1. Copy the English content file to the target language directory
2. Translate the content while maintaining:
   - Markdown structure
   - Frontmatter metadata
   - Code blocks
   - Component syntax

#### Automated Translation (Recommended)

Use Lingo.dev CLI for automated translations:

1. **Install Lingo.dev CLI** (if not already installed):
   ```bash
   npm install -g lingo.dev
   ```

2. **Login to Lingo.dev**:
   ```bash
   npx lingo.dev@latest login
   ```

3. **Configure your project**:
   The `i18n.json` file is already configured for:
   - Source language: English (`en`)
   - Target languages: Chinese (`cn`) and Korean (`ko`)

4. **Run the translation**:
   ```bash
   npx lingo.dev@latest run
   ```

   This will automatically translate all `.mdx` files from English to Chinese and Korean.

5. **Review and edit translations**:
   After automated translation, review the generated files and make any necessary edits for accuracy.

## Viewing Your Documentation

### Local Development

Run the Mintlify dev server:

```bash
mint dev
```

Navigate to `http://localhost:3000` and use the language selector in the top navigation to switch between languages.

### Production Deployment

Changes pushed to your default branch are automatically deployed. The language selector will be available in the production site.

## Tips

1. **Keep structure consistent**: Ensure all language versions maintain the same directory structure
2. **Translate URLs carefully**: When adding links within content, use language-appropriate URLs
3. **Test navigation**: After adding new pages, verify they appear correctly in all languages
4. **Review automated translations**: Always review machine-generated translations for accuracy, especially technical terms

## Language Codes

- `en`: English (default)
- `cn`: Chinese (Simplified)
- `ko`: Korean

## Troubleshooting

- **Pages not showing**: Verify the page paths in `docs.json` include the language prefix (e.g., `en/starter/overview`)
- **Language selector not appearing**: Ensure the `languages` array in `docs.json` is properly configured
- **Translation errors**: Check the file structure matches the expected patterns defined in `i18n.json`

