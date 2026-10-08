import {
  ArrowLeftRight, ArrowUpCircle, Atom, Award, BadgePercent, BarChart2, Binary, Blocks, BookOpen, Box, Brain, Calculator,
  CalendarCheck, CalendarDays, CalendarHeart, ChartColumn, CheckCheck, ChevronsLeftRight, Circle, ClipboardCheck, Clock,
  Combine, Compass, Crosshair, Crown, Dices, Divide, Dot, Equal, Eraser, Flame, Footprints, Gem, GitCompare, GraduationCap,
  Grid3x3, Hash, Heart, Infinity as InfinityIcon, Layers, Library, Lightbulb, ListOrdered, Medal, Merge, Minus, MinusCircle,
  Moon, Percent, PieChart, Plus, Radical, Ratio, RectangleHorizontal, Repeat, Rocket, RotateCcw, Rows3, Ruler, Scale,
  Shrink, Sigma, Sparkle, Sparkles, Spline, Split, Square, Star, Sunrise, Superscript, Swords, Tag, Target, Timer,
  TrendingUp, Triangle, Trophy, Variable, Waves, Workflow, Wrench, X, Zap,
  BarChart3, Dumbbell, FunctionSquare, House, Languages, Maximize2, NotebookPen, NotebookText, Play, Settings, SunMoon, Info, Volume2, Bell, Keyboard, Database, Palette, Download, Upload, Trash2, Search, Check, ChevronRight, ChevronLeft, Lock, Flag, Pause, Shuffle, Eye, Bookmark, BookmarkCheck, Undo2,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  ArrowLeftRight, ArrowUpCircle, Atom, Award, BadgePercent, BarChart2, Binary, Blocks, BookOpen, Box, Brain, Calculator,
  CalendarCheck, CalendarDays, CalendarHeart, ChartColumn, CheckCheck, ChevronsLeftRight, Circle, ClipboardCheck, Clock,
  Combine, Compass, Crosshair, Crown, Dices, Divide, Dot, Equal, Eraser, Flame, Footprints, Gem, GitCompare, GraduationCap,
  Grid3x3, Hash, Heart, Infinity: InfinityIcon, Layers, Library, Lightbulb, ListOrdered, Medal, Merge, Minus, MinusCircle,
  Moon, Percent, PieChart, Plus, Radical, Ratio, RectangleHorizontal, Repeat, Rocket, RotateCcw, Rows3, Ruler, Scale,
  Shrink, Sigma, Sparkle, Sparkles, Spline, Split, Square, Star, Sunrise, Superscript, Swords, Tag, Target, Timer,
  TrendingUp, Triangle, Trophy, Variable, Waves, Workflow, Wrench, X, Zap,
  BarChart3, Dumbbell, FunctionSquare, House, Languages, Maximize2, NotebookPen, NotebookText, Play, Settings, SunMoon, Info, Volume2, Bell, Keyboard, Database, Palette, Download, Upload, Trash2, Search, Check, ChevronRight, ChevronLeft, Lock, Flag, Pause, Shuffle, Eye, Bookmark, BookmarkCheck, Undo2,
};

/** Renders a lucide icon given its name (as stored in content files). Unknown names fall back to a sparkle. */
export function NamedIcon({ name, size = 20, className, strokeWidth = 1.9 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = ICONS[name] ?? Sparkles;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export const knownIconNames = (): string[] => Object.keys(ICONS);
