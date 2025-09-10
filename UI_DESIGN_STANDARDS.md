# UI Design Standards - CIG Sales Dashboard

## ภาพรวม Design System

เอกสารนี้สรุปมาตรฐานการออกแบบ UI ที่ใช้ในโครงการ CIG Sales Dashboard เพื่อเป็นแนวทางในการพัฒนาโครงการอื่นๆ ต่อไป

## Technology Stack

### Frontend Framework
- **React 18.3.1** - Frontend framework หลัก
- **TypeScript** - Type safety และ better development experience
- **Vite** - Build tool ที่รวดเร็ว

### UI Framework & Styling
- **Shadcn/ui** - Component library สำหรับ React
- **Tailwind CSS 3.4.11** - Utility-first CSS framework
- **Radix UI** - Headless UI components (ใช้ผ่าน Shadcn/ui)
- **Class Variance Authority (CVA)** - Type-safe CSS variants
- **Lucide React 0.462.0** - Icon library

### Charts & Visualization
- **Recharts 2.12.7** - Chart library สำหรับ React

## 🎨 Color Palette & System

### Color Palette Overview

#### Primary Blue Scale
```
Primary: hsl(207, 90%, 45%) → #1493c7 (Bright Blue)
Primary Hover: hsl(207, 90%, 40%) → #0d82b8 (Darker Blue)
Primary Light: hsl(207, 30%, 85%) → #cce4f0 (Light Blue)
```

#### Secondary Gray Scale  
```
Background: hsl(0, 0%, 100%) → #ffffff (Pure White)
Foreground: hsl(210, 20%, 20%) → #293747 (Dark Gray)
Muted: hsl(207, 20%, 96%) → #f4f7f9 (Very Light Gray)
Muted Foreground: hsl(207, 15%, 45%) → #6b8099 (Medium Gray)
Border: hsl(207, 20%, 88%) → #d4dde6 (Light Gray)
```

#### Accent Colors
```
Accent (Red): hsl(0, 75%, 55%) → #e53e3e (Bright Red)
Destructive: hsl(0, 84.2%, 60.2%) → #f56565 (Error Red)
Success: hsl(142, 71%, 45%) → #38a169 (Green - inferred)
Warning: hsl(38, 92%, 50%) → #ed8936 (Orange - inferred)
```

### Dark Mode Palette
```
Background: hsl(210, 25%, 8%) → #0f1419 (Very Dark Blue)
Foreground: hsl(207, 20%, 95%) → #f0f4f8 (Very Light Blue)
Card: hsl(210, 25%, 10%) → #1a202c (Dark Blue)
Primary: hsl(207, 85%, 60%) → #4299e1 (Lighter Blue)
```

### Color Usage Matrix

| Color Token | Light Mode | Dark Mode | Usage |
|------------|------------|-----------|--------|
| `--primary` | `#1493c7` | `#4299e1` | Buttons, links, active states |
| `--secondary` | `#cce4f0` | `#2d3748` | Secondary buttons, highlights |
| `--accent` | `#e53e3e` | `#f56565` | Alerts, warnings, important actions |
| `--background` | `#ffffff` | `#0f1419` | Page background |
| `--foreground` | `#293747` | `#f0f4f8` | Main text color |
| `--muted` | `#f4f7f9` | `#2d3748` | Disabled states, backgrounds |
| `--border` | `#d4dde6` | `#4a5568` | Borders, dividers |

### CSS Variables Architecture
```css
:root {
  /* Primary Colors - Blue Theme */
  --primary: 207 90% 45%;           /* Main brand color */
  --primary-foreground: 0 0% 98%;   /* Text on primary */
  
  /* Secondary Colors */
  --secondary: 207 30% 85%;         /* Light blue */
  --secondary-foreground: 207 90% 25%; /* Dark blue text */
  
  /* Accent Colors */
  --accent: 0 75% 55%;              /* Red accent */
  --accent-foreground: 0 0% 98%;    /* Text on accent */
  
  /* Background & Surfaces */
  --background: 0 0% 100%;          /* Main background */
  --foreground: 210 20% 20%;        /* Main text color */
  --card: 0 0% 100%;                /* Card backgrounds */
  --card-foreground: 210 20% 20%;   /* Text on cards */
  
  /* Interactive Elements */
  --border: 207 20% 88%;            /* Border color */
  --input: 207 20% 88%;             /* Input borders */
  --ring: 207 90% 45%;              /* Focus rings */
  
  /* Muted/Subtle Elements */
  --muted: 207 20% 96%;             /* Muted backgrounds */
  --muted-foreground: 207 15% 45%;  /* Muted text */
  
  /* Destructive/Error */
  --destructive: 0 84.2% 60.2%;     /* Error/danger color */
  --destructive-foreground: 210 40% 98%; /* Text on error */
  
  /* Border Radius */
  --radius: 0.5rem;                 /* Standard border radius */
}
```

### Dark Mode Support
```css
.dark {
  --background: 210 25% 8%;         /* Dark background */
  --foreground: 207 20% 95%;        /* Light text */
  --primary: 207 85% 60%;           /* Lighter primary for contrast */
  --card: 210 25% 10%;              /* Dark card background */
  /* ... other dark mode variables */
}
```

### Color Usage Guidelines & Examples

#### Primary Blue (`#1493c7`)
```tsx
// ปุ่มหลัก, links, focus states
<Button variant="default">Primary Action</Button>
<div className="bg-primary text-primary-foreground">
  Brand elements, call-to-action
</div>
```

#### Secondary Light Blue (`#cce4f0`)  
```tsx
// ปุ่มรอง, highlights, subtle backgrounds
<Button variant="secondary">Secondary Action</Button>
<Card className="border-l-4 border-l-secondary">
  Highlighted content
</Card>
```

#### Accent Red (`#e53e3e`)
```tsx
// Alerts, warnings, important actions
<Button variant="destructive">Delete Action</Button>
<div className="text-accent">Important notification</div>
```

#### Status Colors in Action
```tsx
// Success state (green tones)
<div className="text-green-600">
  <TrendingUp className="h-3 w-3 mr-1" />
  Achievement: 105% of target
</div>

// Warning state (orange tones)  
<div className="text-orange-600">
  Required Margin: 25.3%
</div>

// Error/Gap state (red tones)
<div className="text-destructive">
  Gap: ฿2,500,000
</div>
```

### Chart Color Scheme
```tsx
// Recharts color usage
<Bar dataKey="Actual" fill="hsl(var(--primary))" />     // #1493c7
<Bar dataKey="Target" fill="hsl(var(--secondary))" />   // #cce4f0  
<Line stroke="hsl(var(--accent))" />                    // #e53e3e
```

## Typography

### Font System
```css
/* ใช้ system fonts สำหรับ performance */
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Text Hierarchy
- **Headings**: `text-2xl font-semibold` (Card titles)
- **Body Text**: `text-sm` (Labels, descriptions)
- **Small Text**: `text-xs` (Secondary info, metadata)
- **Numbers**: `text-2xl font-bold` (KPI values)

## Component Architecture

### Base Components (Shadcn/ui)

#### Button Component
```tsx
// Variants system using CVA
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // ... more variants
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    }
  }
)
```

#### Card Component System
```tsx
// Modular card structure
<Card>           // Container with border and shadow
  <CardHeader>   // Top section with padding
    <CardTitle>  // Heading typography
  <CardContent>  // Main content area
  <CardFooter>   // Bottom actions area
</Card>
```

### Business Components

#### KPI Cards Pattern
```tsx
// Consistent KPI card structure
<Card className="border-l-4 border-l-primary">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Metric Name</CardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">Value</div>
    <div className="flex items-center pt-1">
      <TrendIcon className="h-3 w-3 mr-1" />
      <span className="text-xs">Trend Info</span>
    </div>
  </CardContent>
</Card>
```

#### Filter Components Pattern
```tsx
// Consistent filter layout
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Label:</label>
        <Select>...</Select>
      </div>
    </div>
  </CardContent>
</Card>
```

## Layout Patterns

### Grid System
```tsx
// Responsive grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* KPI Cards */}
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Charts */}
</div>
```

### Container & Spacing
```tsx
// Page container pattern
<div className="min-h-screen bg-background">
  <div className="container mx-auto px-6 py-6 space-y-6">
    {/* Content */}
  </div>
</div>
```

### Loading States
```tsx
// Consistent loading spinner
<div className="min-h-screen flex items-center justify-center bg-background">
  <div className="text-center">
    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
    <p className="text-muted-foreground">Loading message...</p>
  </div>
</div>
```

## Icon System

### Lucide React Icons
- **Consistent size**: `h-4 w-4` (16px) สำหรับ UI icons
- **Small icons**: `h-3 w-3` (12px) สำหรับ trend indicators
- **Icon colors**: `text-muted-foreground` เป็น default

### Common Icons Usage
```tsx
// Navigation & Actions
<Settings className="h-4 w-4" />
<Filter className="h-4 w-4" />

// Data & Metrics  
<CircleDollarSign className="h-4 w-4" />
<TrendingUp className="h-3 w-3" />
<TrendingDown className="h-3 w-3" />
<BarChart className="h-4 w-4" />
```

## Chart Design Standards

### Recharts Configuration
```tsx
// Consistent chart styling
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
    <XAxis tick={{ fill: 'hsl(var(--foreground))' }} />
    <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
    <Tooltip content={<CustomTooltip />} />
    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Custom Tooltip Pattern
```tsx
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold">{label}</p>
        <p className="text-primary">Value: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};
```

## Form Design Patterns

### Form Structure
```tsx
// Consistent form layout
<div className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">Field Label</label>
      <Input placeholder="Placeholder text" />
    </div>
  </div>
</div>
```

### Select Components
```tsx
// Consistent dropdown styling
<Select onValueChange={handleChange}>
  <SelectTrigger className="w-40">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

## Data Display Patterns

### Currency Formatting
```tsx
// Thai Baht formatting
฿{value.toLocaleString()}

// Million THB for charts
value / 1000000 // Convert to millions
```

### Percentage Display
```tsx
// Achievement percentages with conditional styling
<div className={`text-xs ${percentage >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
  {percentage.toFixed(1)}% of target
</div>
```

### Trend Indicators
```tsx
// Visual trend indicators
{isPositive ? (
  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
) : (
  <TrendingDown className="h-3 w-3 mr-1 text-orange-600" />
)}
```

## Interactive Elements

### Modal/Dialog Pattern
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm">
      <Settings className="h-4 w-4 mr-2" />
      Settings
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Tab Navigation
```tsx
<Tabs defaultValue="tab1">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

## State Management Patterns

### Loading States
- Spinner กลางหน้าจอสำหรับ initial load
- Skeleton components สำหรับ partial loading
- Disabled states สำหรับ form submissions

### Error States
```tsx
// Error handling with destructive styling
<div className="text-destructive">Error message</div>
```

### Success States
```tsx
// Success indicators
<div className="text-green-600">Success message</div>
```

## Responsive Design

### Breakpoints (Tailwind)
- **sm**: 640px (mobile landscape)
- **md**: 768px (tablet)
- **lg**: 1024px (desktop)
- **xl**: 1280px (large desktop)

### Mobile-First Approach
```tsx
// Mobile-first responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

## Accessibility Guidelines

### Color Contrast
- ผ่านเกณฑ์ WCAG AA (4.5:1 ratio)
- Dark mode support สำหรับ accessibility

### Focus Management
```tsx
// Focus rings using Tailwind
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
```

### Screen Reader Support
- Semantic HTML elements
- Proper heading hierarchy
- Alt text สำหรับ images/icons

## Best Practices

### Component Organization
```
src/components/
├── ui/                 # Base Shadcn components
├── [BusinessLogic].tsx # Business-specific components
```

### Naming Conventions
- **Components**: PascalCase (KPISummary)
- **Props**: camelCase (onFilterChange)
- **CSS Classes**: kebab-case via Tailwind

### Code Quality
- TypeScript interfaces สำหรับทุก props
- React.forwardRef สำหรับ reusable components
- CVA สำหรับ component variants

### Performance
- React.lazy สำหรับ code splitting
- useMemo/useCallback สำหรับ expensive computations
- Optimized bundle size ด้วย Vite

## Installation & Setup

### Core Dependencies
```json
{
  "@radix-ui/react-*": "^1.x.x",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "lucide-react": "^0.462.0",
  "tailwind-merge": "^2.5.2",
  "tailwindcss-animate": "^1.0.7"
}
```

### Configuration Files
```bash
# Shadcn/ui setup
components.json          # Component configuration
tailwind.config.ts      # Tailwind + Shadcn theme
src/index.css           # CSS variables + base styles
```

### Project Structure
```
src/
├── components/
│   ├── ui/            # Shadcn base components
│   └── *.tsx          # Business components
├── lib/
│   └── utils.ts       # cn() utility function
├── hooks/             # Custom React hooks
└── types/             # TypeScript definitions
```

## 📦 Missing Components & Loading States

### Existing Components
```tsx
// Loading Components
<div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
<Skeleton className="animate-pulse rounded-md bg-muted" />
<Loader2 className="h-4 w-4 animate-spin" />

// Loading State Pattern
{isLoading ? (
  <div className="text-center">
    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
    <p className="text-muted-foreground">Loading message...</p>
  </div>
) : (
  <Content />
)}
```

### Navigation Components
```tsx
// Back Button Pattern
<Button variant="ghost" size="sm">
  <ArrowLeft className="h-4 w-4 mr-2" />
  Back to Dashboard
</Button>

// Header Navigation
<div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <Logo />
    <Title />
  </div>
  <div className="flex gap-2">
    <ActionButtons />
  </div>
</div>
```

## 🎬 Animation & Micro-interactions

### Animation Library Setup
```bash
# Dependencies
"tailwindcss-animate": "^1.0.7"
```

### Built-in Animations
```css
/* Tailwind Config - keyframes */
keyframes: {
  'accordion-down': {
    from: { height: '0' },
    to: { height: 'var(--radix-accordion-content-height)' }
  },
  'accordion-up': {
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: '0' }
  }
}

animation: {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up': 'accordion-up 0.2s ease-out'
}
```

### Animation Patterns
```tsx
// Modal/Dialog Animations
"data-[state=open]:animate-in data-[state=closed]:animate-out 
 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"

// Hover Transitions
"transition-shadow hover:shadow-md"
"transition-colors hover:bg-accent"
"transition-all duration-200"

// Loading Animations
"animate-spin"     // Spinner
"animate-pulse"    // Skeleton loading
"animate-caret-blink" // Input cursor

// Slide Animations
"data-[side=bottom]:slide-in-from-top-2"
"data-[side=left]:slide-in-from-right-2"

// Transform Transitions
"transition-transform data-[state=checked]:translate-x-5"
```

### Animation Timing Standards
```tsx
// Duration Standards (from existing code)
duration-200    // Fast interactions (hover, focus)
duration-300    // Medium transitions (modal close)
duration-500    // Slow entrances (modal open)

// Easing Functions
ease-linear     // Progress bars, loading
ease-out        // Entrances, slide-ins  
ease-in-out     // General transitions
```

## ⚡ Performance Standards

### Build Optimization
```typescript
// Vite Configuration
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),                    // React SWC for faster builds
    mode === 'development' &&
    componentTagger(),         // Development only plugin
  ].filter(Boolean),
}));
```

### React Performance Patterns
```tsx
// useCallback Examples (from existing code)
const onSelect = React.useCallback((api: CarouselApi) => {
  // Callback logic
}, [dependencies]);

const toggleSidebar = React.useCallback(() => {
  setOpen((open) => !open)
}, [setOpen]);

// useMemo Examples  
const tooltipLabel = React.useMemo(() => {
  return computeTooltipLabel(data)
}, [data]);

const contextValue = React.useMemo<SidebarContext>(() => ({
  state: { open, openMobile, isMobile },
  // ... other context values
}), [open, openMobile, isMobile]);
```

### Memory Management
```tsx
// State Management Pattern (from toast hook)
let memoryState: State = { toasts: [] }

const dispatch = (action: Action) => {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}
```

## 🔧 Development Tools & Standards

### TypeScript Configuration
```json
// tsconfig.json
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/*"]
  },
  "noImplicitAny": false,
  "noUnusedParameters": false,
  "skipLibCheck": true,
  "strictNullChecks": false
}
```

### ESLint Configuration
```javascript
// eslint.config.js
export default tseslint.config(
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn"],
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
```

### Component Development Standards
```tsx
// Component Pattern with forwardRef
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
```

### Design Token Management
```css
/* CSS Variables as Design Tokens */
:root {
  --background: 0 0% 100%;
  --foreground: 210 20% 20%;
  --primary: 207 90% 45%;
  --radius: 0.5rem;
}

/* Usage in Components */
.component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border-radius: var(--radius);
}
```

---

## ❌ Missing Components Checklist

### 📦 **Navigation & Layout**
- [ ] Breadcrumb navigation component
- [ ] Sidebar/drawer navigation
- [ ] Multi-level menu navigation
- [ ] Pagination component
- [ ] Search/filter bar component
- [ ] Tag/chip input component

### 📊 **Data Display**  
- [ ] Advanced data table (sorting, pagination, filtering)
- [ ] Tree view component
- [ ] Timeline component
- [ ] Kanban board layout
- [ ] Virtual scrolling for large lists
- [ ] Data grid with cell editing

### 📝 **Forms & Inputs**
- [ ] File upload component with drag & drop
- [ ] Multi-step form wizard
- [ ] Rich text editor integration
- [ ] Date range picker
- [ ] Color picker
- [ ] Rating/stars component
- [ ] Multi-select with tags

### 🎨 **Media & Content**
- [ ] Image gallery/carousel
- [ ] Video player component
- [ ] Avatar with upload functionality
- [ ] Empty states illustrations
- [ ] Error boundary components

### 🔔 **Feedback & Notifications**
- [ ] Toast notifications system (infrastructure exists, needs implementation)
- [ ] Progress stepper component
- [ ] Loading skeleton variations
- [ ] Confirmation modals
- [ ] Tooltip variations
- [ ] Banner/alert variations

### 📱 **Mobile & Responsive**
- [ ] Bottom sheet component
- [ ] Pull-to-refresh
- [ ] Swipe actions
- [ ] Mobile menu hamburger
- [ ] Touch-friendly components

## 🎬 **Missing Animation Features**

### **Advanced Animations**
- [ ] Page transition animations
- [ ] Parallax scrolling effects  
- [ ] SVG animations
- [ ] Loading state animations (skeleton variations)
- [ ] Gesture-based animations (swipe, drag)
- [ ] Stagger animations for lists

### **Micro-interactions**
- [ ] Button ripple effects
- [ ] Form validation feedback animations
- [ ] Progress bar animations
- [ ] Chart enter/exit animations
- [ ] Hover state micro-animations

## ⚡ **Missing Performance Features**

### **Code Splitting & Lazy Loading**
- [ ] React.lazy implementation
- [ ] Route-based code splitting  
- [ ] Component lazy loading
- [ ] Image lazy loading
- [ ] Bundle analysis tools

### **Optimization**
- [ ] React.memo for expensive components
- [ ] Virtual scrolling for large datasets
- [ ] Image optimization pipeline
- [ ] Service worker for caching
- [ ] Performance monitoring

## 🔧 **Missing Development Tools**

### **Testing Infrastructure**
- [ ] Unit testing setup (Jest + Testing Library)
- [ ] Component testing standards
- [ ] E2E testing (Playwright/Cypress)
- [ ] Visual regression testing
- [ ] Performance testing

### **Documentation & Design System**
- [ ] Storybook for component documentation
- [ ] Design system documentation site
- [ ] Component API documentation
- [ ] Usage examples and guidelines
- [ ] Design token documentation

### **Development Workflow**
- [ ] Pre-commit hooks
- [ ] Automated component generation
- [ ] Design system versioning
- [ ] Component usage analytics
- [ ] Performance budgets

---

## สรุปจุดเด่นของ Design System

1. **Consistency**: ใช้ design tokens (CSS variables) อย่างสม่ำเสมอ
2. **Flexibility**: Support dark mode และ responsive design
3. **Type Safety**: TypeScript + CVA สำหรับ component variants
4. **Performance**: Optimized bundle size และ tree-shaking
5. **Accessibility**: Built-in accessibility features จาก Radix UI
6. **Developer Experience**: Hot reload, TypeScript intellisense
7. **Scalability**: Modular component architecture
8. **Visual Hierarchy**: Clear typography และ spacing system
9. **Animation Framework**: Built-in animation library ด้วย Tailwind CSS
10. **Performance Patterns**: React optimization hooks และ build tools

---

*เอกสารนี้สามารถนำไปใช้เป็นพื้นฐานสำหรับโครงการใหม่ โดยคงมาตรฐานการออกแบบและการใช้งานเดียวกัน รวมถึง roadmap สำหรับการพัฒนาต่อ*