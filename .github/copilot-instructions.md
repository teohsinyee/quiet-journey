# Quiet Journey - Bible Reading Site

This is a static web application for tracking daily Bible reading reflections. It's built with vanilla HTML5, CSS3, and JavaScript with no build process required.

**ALWAYS follow these instructions first and only search or use bash commands when you encounter unexpected information that contradicts what is documented here.**

## Working Effectively

### Getting Started (No Build Required)
- Start local development server: `python3 -m http.server 8080 --directory docs` - takes 1-2 seconds to start. NEVER CANCEL.
- Access site: Open browser to `http://localhost:8080`
- **CRITICAL**: The site is pure static files - no installation, compilation, or build steps needed

### Repository Structure
```
/
├── .nojekyll              # GitHub Pages indicator
├── readme.md              # Project documentation  
└── docs/                  # Website root (GitHub Pages serves from here)
    ├── index.html         # Main SPA entry point
    ├── app.js             # Core JavaScript functionality
    ├── style.css          # Styles with themes and responsive design
    ├── data/
    │   ├── manifest.json  # Reflection entries metadata
    │   └── open-questions.json # Questions tracking database
    ├── notes/             # Markdown reflection files
    │   ├── 000-welcome.md # Default/home content
    │   ├── _template_reflection.md # Template for new reflections
    │   └── YYYY-MM-DD-book-chapter.md # Daily reflection format
    └── pages/
        └── reading-plan.md # 260-day reading plan
```

### Technology Stack
- **Frontend**: Vanilla JavaScript SPA with routing
- **Content**: Markdown files rendered via marked.js CDN
- **Styling**: CSS with CSS variables for theming
- **Data**: JSON files for structured data
- **Hosting**: GitHub Pages (live at https://teohsinyee.github.io/quiet-journey/)

## Validation and Testing

### ALWAYS Run These Manual Tests After Changes
1. **Start local server**: `python3 -m http.server 8080 --directory docs` (1-2 seconds startup time, NEVER CANCEL)
2. **Verify server is running**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/` should return `200`
3. **Test core functionality**:
   - Navigate to `http://localhost:8080`
   - Verify homepage loads with reflection list in sidebar
   - Click "My Intention" - should load welcome content
   - Click "Reading Plan" - should load 260-day plan
   - Click "Open Questions" - should load interactive questions page
   - Test search box - type "matthew" and verify filtering works
   - Toggle theme button - should switch light/dark modes
   - Change color palette - should apply different accent colors
3. **Test Open Questions page**:
   - Enter new question and click "Make JSON snippet" 
   - Verify JSON appears at bottom with current date
   - Test "Export CSV" - should download file
   - Test filtering by status
   - Test search within questions
4. **Test navigation and routing**:
   - Use browser back/forward buttons
   - Click reflection "Read" links from sidebar
   - Verify URLs update properly with ?page= parameters

### Content Validation
- **Markdown files** must be valid and use the template structure from `_template_reflection.md`
- **JSON files** must be valid JSON format - use `python3 -m json.tool file.json` to validate
- **manifest.json entries** require: category, type, title, date, path, excerpt fields
- **File paths** in manifest.json must match actual files (e.g., `./notes/2025-08-23-matthew-1.md` must exist)
- **Dates** should be in YYYY-MM-DD format
- **Reflection filenames** must follow pattern: `YYYY-MM-DD-book-chapter.md`

## Content Management

### Adding New Reflections
1. Create new file: `/docs/notes/YYYY-MM-DD-book-chapter.md`
2. Use `_template_reflection.md` structure
3. Update `/docs/data/manifest.json` with new entry:
   ```json
   {
     "category": "reflection",
     "type": "NT",
     "title": "YYYY-MM-DD - Book Chapter",
     "date": "YYYY-MM-DD", 
     "path": "./notes/YYYY-MM-DD-book-chapter.md",
     "excerpt": "Brief summary of key themes"
   }
   ```
4. Commit and push changes

### Managing Open Questions
- **Via UI**: Use Open Questions page → enter question → "Make JSON snippet" → copy result
- **Manual**: Edit `/docs/data/open-questions.json` directly
- Required fields: question, posted, status ("open"|"inprogress"|"answered"), answer, answered (date if status is "answered")

## Key Application Features

### Single Page Application (SPA)
- **Routing**: URL parameters (?page=filename) control content loading
- **Content loading**: `loadMD()` function fetches and renders markdown
- **Special routes**: 
  - No params or "index.html" → loads welcome.md
  - "open-questions" → renders interactive questions interface
  - Other → loads markdown file from notes/ or pages/

### Theme System
- **Light/Dark toggle**: Click "Theme" button
- **Color palettes**: Royal (default), Sunrise, Forest, Lavender, Olive
- **Persistence**: Settings saved to localStorage
- **CSS variables**: All theming uses CSS custom properties

### Search and Filtering
- **Reflection search**: Sidebar search box filters by title
- **Question filtering**: Open Questions page has search + status filtering
- **Live filtering**: Updates immediately as you type

### Progress Tracking
- **Progress badge**: Shows "Progress: X/260" based on manifest.json entries
- **Target**: 260 total reflections (New Testament reading plan)

## Common Locations and Files

### Frequently Modified Files
- `/docs/data/manifest.json` - Add new reflections here
- `/docs/notes/` - Create new reflection markdown files here
- `/docs/data/open-questions.json` - Update questions here

### Template Files
- `/docs/notes/_template_reflection.md` - Copy this structure for new reflections
- `/docs/pages/reading-plan.md` - 260-day reading schedule

### Core Application Files
- `/docs/app.js` - All JavaScript functionality (SPA routing, rendering, interactivity)
- `/docs/style.css` - All styling including responsive design and themes
- `/docs/index.html` - Page structure and HTML

## Error Handling and Troubleshooting

### Common Issues
- **"marked is not defined"**: CDN blocked - external dependency issue, site will work in production
- **404 on markdown files**: Check file paths in manifest.json match actual files
- **JSON parse errors**: Validate JSON files using `python3 -m json.tool filename.json`
- **Routing issues**: Ensure URLs use proper ?page= format

### Dependencies
- **External CDN**: marked.js for markdown parsing (https://cdn.jsdelivr.net/npm/marked/marked.min.js)
- **Google Fonts**: Inter font family
- **No local dependencies**: Everything else is vanilla HTML/CSS/JS

## Validation Commands

### JSON Validation
```bash
# Validate manifest.json
python3 -m json.tool docs/data/manifest.json

# Validate open-questions.json  
python3 -m json.tool docs/data/open-questions.json
```

### Development Server
```bash
# Start server (1-2 seconds startup time, NEVER CANCEL)
python3 -m http.server 8080 --directory docs

# Alternative ports if 8080 is busy
python3 -m http.server 8081 --directory docs
```

### File Structure Check
```bash
# Verify all reflection files exist
ls -la docs/notes/

# Check data files
ls -la docs/data/

# Verify template exists
cat docs/notes/_template_reflection.md
```

## Performance Notes
- **Static serving**: Instant response times for all files
- **No build process**: Changes are immediately visible after refresh
- **CDN dependencies**: marked.js and Google Fonts load from external CDNs
- **Local development**: Server startup takes 1-2 seconds maximum

## GitHub Pages Deployment
- **Automatic**: Pushes to main branch auto-deploy to https://teohsinyee.github.io/quiet-journey/
- **No build step**: GitHub Pages serves `/docs` folder directly
- **`.nojekyll` file**: Tells GitHub Pages not to process files through Jekyll

## NEVER DO
- **Do not add build tools** - this is intentionally a simple static site
- **Do not modify external CDN links** without testing thoroughly  
- **Do not change file structure** without updating all references
- **Do not cancel development server startup** - it only takes 1-2 seconds
- **Do not skip manual validation** after making changes
- **Do not commit invalid JSON files** - always validate first
- **Do not modify core app files** (app.js, style.css, index.html) without extensive testing

## Daily Workflow Reference (From README.md)
When making content updates, follow the maintainer's daily workflow:
1. Read today's chapter (see Reading Plan)
2. Create a note in `/docs/notes/` with filename `YYYY-MM-DD-book-chapter.md`
3. Use `_template_reflection.md` as structure
4. Update `/docs/data/manifest.json` with new entry
5. If adding questions: Use Open Questions page → Generate snippet → Paste into `/docs/data/open-questions.json`
6. Commit and push changes