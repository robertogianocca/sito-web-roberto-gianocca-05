import { ContactForm } from "../components/contact/ContactForm.client";
import { HomeIntroNav } from "../components/home/HomeIntroNav";
import { HorizontalScrollContainer } from "../components/home/HorizontalScrollContainer.client";
import { HorizontalSection } from "../components/home/HorizontalSection";
import { PlaceholderGrid } from "../components/home/PlaceholderGrid";
import { LOREM_MEDIUM, LOREM_SHORT } from "../components/home/constants";

export default function Home() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 lg:min-h-0">
      <HorizontalScrollContainer
        showScrollHints
        className="flex min-h-0 flex-1 flex-col lg:flex-row lg:flex-nowrap lg:overflow-x-auto lg:overflow-y-hidden"
        aria-label="Sezioni portfolio"
      >
        <HorizontalSection id="intro" title="Roberto Gianocca" span={9}>
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
              <div className="lg:col-span-6">
                <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {LOREM_SHORT} {LOREM_MEDIUM}
                </p>
                <HomeIntroNav />
              </div>
              <div className="lg:col-span-6">
                <PlaceholderGrid variant="hero" />
              </div>
            </div>
          </div>
        </HorizontalSection>

        <HorizontalSection
          id="photography"
          title="Photography"
          span={8}
          titleHref="/photography"
          titleHrefAriaLabel="Apri la pagina Photography"
        >
          <div className="flex h-full flex-col gap-6">
            <p className="max-w-prose text-zinc-600 dark:text-zinc-400">{LOREM_SHORT}</p>
            <PlaceholderGrid variant="mixed" />
          </div>
        </HorizontalSection>

        <HorizontalSection
          id="video"
          title="Video"
          span={6}
          titleHref="/video"
          titleHrefAriaLabel="Apri la pagina Video"
        >
          <div className="flex h-full flex-col gap-6">
            <p className="max-w-prose text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {LOREM_MEDIUM}
            </p>
            <PlaceholderGrid variant="row" />
          </div>
        </HorizontalSection>

        <HorizontalSection id="graphic-design" title="Graphic design" span={10}>
          <div className="flex h-full flex-col gap-6">
            <p className="max-w-prose text-zinc-600 dark:text-zinc-400">{LOREM_SHORT}</p>
            <PlaceholderGrid variant="mixed" />
          </div>
        </HorizontalSection>

        <HorizontalSection id="contact" title="Contatti" span={4}>
          <div className="flex h-full min-h-0 flex-col gap-4">
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Per collaborazioni, commissioni o domande, compila il form: ti risponderò via email.
            </p>
            <ContactForm />
          </div>
        </HorizontalSection>
      </HorizontalScrollContainer>
    </div>
  );
}
