# Update Changelog: Add Filters and Reorganize 2025 Entries

## Overview
This PR significantly improves the changelog structure and user experience by adding interactive filters, reorganizing entries into unified files, and updating all 2025 changelog content for both English and Chinese versions.

## Major Changes

### 🎯 Filter System Implementation
- **Type Filter**: Added interactive dropdown filter for changelog types:
  - All
  - Core Feature Release
  - Adjustments & Optimization
  - Fixes & Feature Sunset
  - Campaign Launch
- **Month Filter**: Added month-based filtering with support for:
  - All Months
  - Individual months (December, November, October, September, August, July, June)
- **Result Counter**: Added real-time result counter showing the number of visible entries based on active filters
- **Auto-calculation**: Filter counts automatically update when new entries are added

### 📁 File Structure Reorganization
- **Consolidated Files**: Merged individual changelog files into unified files:
  - `en/changelog/2025.mdx` - All English entries in one file
  - `cn/changelog/2025.mdx` - All Chinese entries in one file
- **Removed**: Deleted 22 individual changelog files (11 English + 11 Chinese) from `changelog/2025/` directory
- **Benefits**: 
  - Easier maintenance
  - Better performance
  - Unified filtering experience

### 📝 Content Updates
- **English Version**: Updated all 24 changelog entries with complete information
- **Chinese Version**: Updated all 24 changelog entries with complete translations
- **Date Format**: Standardized date format to use two-digit days (e.g., `July 02` instead of `July 2`)
- **Description Updates**: Updated descriptions to emphasize "2025" year in both versions

### 🎨 UI/UX Improvements
- **Filter Layout**: Clean, modern filter interface with:
  - Color-coded type indicators
  - Hover effects
  - Smooth transitions
  - Responsive design
- **Component Organization**: Moved component definitions to end of file for cleaner code structure
- **Visual Consistency**: Unified styling across all filter components

## Technical Details

### Components Added
- `ChangelogFilter`: Type-based filtering component
- `MonthFilter`: Month-based filtering component  
- `ShowResult`: Dynamic result counter component

### Data Attributes
- All changelog items now include:
  - `data-type`: Entry type (core-feature, campaign, fixes, optimization)
  - `data-month`: Entry month (dec, nov, oct, sep, aug, jul, jun)

### Filter Counts
- **English**: 24 total entries
  - Core Feature Release: 4
  - Adjustments & Optimization: 3
  - Fixes & Feature Sunset: 3
  - Campaign Launch: 14
- **Chinese**: 24 total entries
  - 核心功能发布: 4
  - 调整与优化: 3
  - 修复与功能下线: 3
  - 活动上线: 14

## Files Changed
- ✅ Created: `en/changelog/2025.mdx` (850 lines)
- ✅ Created: `cn/changelog/2025.mdx` (852 lines)
- ✅ Updated: `docs.json` (changelog configuration)
- ❌ Deleted: 22 individual changelog files

## Testing
- ✅ Filters work correctly for both type and month
- ✅ Result counter updates dynamically
- ✅ All entries display correctly
- ✅ Both English and Chinese versions functional
- ✅ Date formatting consistent

## Breaking Changes
⚠️ **Note**: This removes individual changelog files. If there are any external links pointing to specific changelog files, they will need to be updated.

## Next Steps
- [ ] Review filter counts when adding new entries
- [ ] Update any external documentation referencing old file structure
- [ ] Consider adding search functionality in future iterations
- [ ] Complete Korean changelog according to current format standards
- [ ] Continuously supplement historical changelog entries
- [ ] Collaborate on optimizing changelog writing format

