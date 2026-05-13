import { HorizontalScrollContainer } from "../components/home/HorizontalScrollContainer.client";
import { HorizontalSection } from "../components/home/HorizontalSection";
import { PlaceholderGrid } from "../components/home/PlaceholderGrid";
import { LOREM_MEDIUM, LOREM_SHORT } from "../components/home/constants";

export default function Home() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 lg:min-h-0">
      <div className="pointer-events-none fixed inset-y-0 right-0 z-20 hidden w-40 lg:block">
        <div className="absolute inset-y-0 right-0 w-40 bg-linear-to-l from-background to-transparent" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          <div className="flex items-center gap-2 rounded-full border border-zinc-300/60 bg-background/80 px-3 py-1 text-xs font-medium text-zinc-700 backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-950/70 dark:text-zinc-200 motion-safe:animate-pulse">
            <span>Scroll</span>
            <span aria-hidden>→</span>
          </div>
        </div>
      </div>
      <HorizontalScrollContainer
        className="flex min-h-0 flex-1 flex-col lg:flex-row lg:flex-nowrap lg:overflow-x-auto lg:overflow-y-hidden"
        aria-label="Sezioni portfolio"
      >
        <HorizontalSection id="intro" eyebrow="Overview" title="Roberto Gianocca" span={9}>
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
              <div className="lg:col-span-6">
                <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {LOREM_SHORT} {LOREM_MEDIUM}
                </p>
              </div>
              <div className="lg:col-span-6">
                <PlaceholderGrid variant="hero" />
              </div>
            </div>
          </div>
        </HorizontalSection>

        <HorizontalSection id="photography" eyebrow="Sezione" title="Photography" span={8}>
          <div className="flex h-full flex-col gap-6">
            <p className="max-w-prose text-zinc-600 dark:text-zinc-400">{LOREM_SHORT}</p>
            <PlaceholderGrid variant="mixed" />
          </div>
        </HorizontalSection>

        <HorizontalSection id="video" eyebrow="Sezione" title="Video" span={6}>
          <div className="flex h-full flex-col gap-6">
            <p className="max-w-prose text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {LOREM_MEDIUM}
            </p>
            <PlaceholderGrid variant="row" />
          </div>
        </HorizontalSection>

        <HorizontalSection id="graphic-design" eyebrow="Sezione" title="Graphic design" span={10}>
          <div className="flex h-full flex-col gap-6">
            <p className="max-w-prose text-zinc-600 dark:text-zinc-400">{LOREM_SHORT}</p>
            <PlaceholderGrid variant="mixed" />
          </div>
        </HorizontalSection>

        <HorizontalSection id="contact" eyebrow="Prossimo passo" title="Contatti" span={4}>
          <div className="flex h-full flex-col justify-between gap-8">
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {LOREM_SHORT}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-square rounded-lg border border-dashed border-zinc-400/60 bg-zinc-200/80 dark:border-zinc-600 dark:bg-zinc-800/80" />
              <div className="aspect-square rounded-lg border border-dashed border-zinc-400/60 bg-zinc-200/80 dark:border-zinc-600 dark:bg-zinc-800/80" />
            </div>
          </div>
        </HorizontalSection>
      </HorizontalScrollContainer>
    </div>
  );
}
