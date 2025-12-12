# Federal Letter Generator - Project Instructions

## Overview

This is a cross-platform desktop application for financial planning professionals to generate engagement letters and batch client letters. Built with Tauri 2.x (Rust backend) + React 18 (TypeScript frontend) + Tailwind CSS.

**Reference Documents:**
- `Letter_Generator_Spec.md` - Complete project specification with TypeScript interfaces
- `DEVELOPMENT.md` - Task tracking and progress (check here for current status)
- `DR Engagement Letter Sample Drafting Notes.docx` - Sample engagement letter with drafting notes

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Tauri | 2.x | Desktop app framework (Rust backend) |
| React | 18+ | Frontend framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Zustand | 4.x | State management |
| docx | latest | Word document generation |
| jsPDF | latest | PDF generation |
| xlsx/sheetjs | latest | Excel parsing (batch imports) |
| date-fns | latest | Date formatting |

## Project Structure

```
federal-letter-generator/
├── src-tauri/                    # Rust backend
│   ├── src/main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                          # React frontend
│   ├── components/
│   │   ├── common/               # Reusable UI (Button, Input, etc.)
│   │   ├── wizard/               # Wizard framework + step components
│   │   ├── batch/                # Batch processing (future)
│   │   └── templates/            # Template selection UI
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # Document generation, parsing
│   │   ├── documentGenerator.ts  # DOCX generation
│   │   ├── pdfGenerator.ts       # PDF generation
│   │   ├── templateEngine.ts     # Variable interpolation
│   │   └── excelParser.ts        # Excel import (batch)
│   ├── store/                    # Zustand state management
│   │   ├── wizardStore.ts        # Wizard state
│   │   └── templateStore.ts      # Saved templates
│   ├── templates/                # Content block libraries
│   │   └── engagement/
│   │       ├── contentBlocks.ts
│   │       ├── goalTemplates.ts
│   │       └── conflictTemplates.ts
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── CLAUDE.md                     # This file
└── DEVELOPMENT.md                # Task tracking
```

## Coding Standards

### TypeScript
- Use strict mode (`"strict": true` in tsconfig)
- Define interfaces for all data structures (see `Letter_Generator_Spec.md` Part 6)
- Avoid `any` - use proper typing
- Export types from `src/types/index.ts`

### React Components
- Functional components only (no class components)
- Use TypeScript for props interfaces
- Keep components focused and single-purpose
- Co-locate step-specific logic within step components

### Tailwind CSS
Use the professional financial services color palette:
```css
--primary: slate-700      /* Headers, primary actions */
--secondary: blue-600     /* Links, secondary actions */
--accent: emerald-600     /* Success states, confirmations */
--warning: amber-500      /* Warnings, attention needed */
--error: red-600          /* Errors, critical issues */
--background: slate-50    /* Page background */
--surface: white          /* Cards, panels */
```

### State Management (Zustand)
- `useWizardStore` - Tracks wizard progress and collected data
- `useTemplateStore` - Stores saved templates and preferences
- Keep store slices focused and small

## DOCX Generation Critical Rules

**IMPORTANT**: The `docx` npm package has specific requirements:

1. **Never use `\n` for line breaks** - Always use separate `Paragraph` elements
2. **Use proper numbering config for bullets** - Never use Unicode symbols (•, ○, etc.)
3. **Set column widths at BOTH table level AND cell level**
4. **Use `ShadingType.CLEAR` for table backgrounds** - Never use `SOLID`
5. **PageBreak must be inside a Paragraph**
6. **Images require the `type` parameter**

Example of correct line breaks:
```typescript
// CORRECT
new Paragraph({ children: [new TextRun("First line")] }),
new Paragraph({ children: [new TextRun("Second line")] }),

// WRONG - will not work
new Paragraph({ children: [new TextRun("First line\nSecond line")] }),
```

## Engagement Letter Structure

Generated letters must follow this exact section order:

1. Header (date, client address, salutation)
2. Opening paragraph (varies by contact type)
3. Document disclosure paragraph
4. CFP fiduciary language (optional)
5. **"WE WILL PROVIDE YOU THE FOLLOWING SERVICES AND PRODUCTS"**
6. Financial planning approach (7-step CFP process)
7. Investment advisory approach
8. Brokerage services approach
9. Risk management approach
10. **"HOW YOU WILL PAY FOR PRODUCTS AND SERVICES"**
11. **"HOW WE (THE FIRM AND I) WILL BE PAID"**
12. **"MY MATERIAL CONFLICTS OF INTEREST"**
13. **"YOUR RESPONSIBILITIES"**
14. **"TIMING OF THE ENGAGEMENT"**
15. **"YOUR PERSONAL INFORMATION"**
16. **"PUBLIC DISCIPLINARY AND BANKRUPTCY HISTORY"** (optional)
17. **"THANK YOU FOR WORKING WITH US"**
18. Signature block

## Wizard Steps (13 total)

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | ClientInfoStep | Name, address, salutation, date |
| 2 | InitialContactStep | Contact type (conversation/email/meeting/phone/referral) |
| 3 | FirmDocumentsStep | Documents provided + delivery method |
| 4 | CFPDisclosureStep | Optional CFP fiduciary language |
| 5 | ServicesOfferedStep | Financial planning, advisory, brokerage, risk mgmt |
| 6 | ClientGoalsStep | Goals from template library + custom |
| 7 | PlanningProcessStep | 7-step CFP process customization |
| 8 | AccountConfigStep | Account configuration (advisory/brokerage) |
| 9 | FeeStructureStep | Fee types and tiers |
| 10 | CompensationStep | How firm/advisor are paid |
| 11 | ConflictsStep | Material conflicts of interest |
| 12 | AdditionalSectionsStep | Responsibilities, termination, privacy, disciplinary |
| 13 | ReviewGenerateStep | Preview and generate documents |

## Key Patterns

### Wizard Navigation
```tsx
// From WizardContainer
<WizardProgress currentStep={step} totalSteps={13} />
<WizardStep>{children}</WizardStep>
<WizardNavigation
  onBack={handleBack}
  onNext={handleNext}
  canProceed={isValid}
/>
```

### Form Field Pattern
```tsx
<div className="space-y-4">
  <label className="block text-sm font-medium text-slate-700">
    Field Label
  </label>
  <Input
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="Enter value"
  />
</div>
```

### Template Selection Pattern
```tsx
<TemplateSelector
  templates={goalTemplates}
  selected={selectedGoals}
  onSelect={handleSelect}
  allowCustom={true}
/>
```

## Testing Approach

- Test document generation with sample data matching the reference letter
- Verify all wizard steps collect required data
- Test keyboard shortcuts (Ctrl+S, Ctrl+P, Ctrl+G, etc.)
- Test file save/load functionality via Tauri APIs

## Development Workflow

1. Check `DEVELOPMENT.md` for current phase and tasks
2. Complete tasks in order within each phase
3. Mark tasks as complete in `DEVELOPMENT.md`
4. Test functionality before moving to next phase

## Platform Targets

- **macOS**: Primary development platform
- **Windows**: Must be tested before release
- Build both using `npm run tauri build`
