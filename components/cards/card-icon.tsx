import {
  BadgeCheck,
  CirclePause,
  ClipboardCheck,
  CloudFog,
  Compass,
  DraftingCompass,
  Focus,
  GitBranch,
  GraduationCap,
  Hammer,
  Handshake,
  Landmark,
  Magnet,
  Palette,
  RadioTower,
  RefreshCw,
  Rocket,
  Siren,
  Sparkles,
  Sunset,
  Timer,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const CARD_ICONS: Record<string, LucideIcon> = {
  "The Spark": Sparkles,
  "The Builder": Hammer,
  "The Signal": RadioTower,
  "The Studio": Palette,
  "The Architect": DraftingCompass,
  "The Mentor": GraduationCap,
  "The Co-Founder": Handshake,
  "The Sprint": Timer,
  "The Operator": Workflow,
  "The Deep Work": Focus,
  "The Pivot": GitBranch,
  "The Standard": BadgeCheck,
  "The Pause": CirclePause,
  "The Sunset": Sunset,
  "The Iteration": RefreshCw,
  "The Trap": Magnet,
  "The Outage": Siren,
  "The North Star": Compass,
  "The Fog": CloudFog,
  "The Launch": Rocket,
  "The Reckoning": ClipboardCheck,
  "The Legacy": Landmark,
};

export function CardIcon({
  cardName,
  className,
  strokeWidth = 2.5,
}: {
  cardName: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = CARD_ICONS[cardName] ?? Sparkles;

  return <Icon aria-hidden="true" className={cn("text-[#f1eee7]", className)} strokeWidth={strokeWidth} />;
}
