import type { CSSProperties } from 'react'
import Image from 'next/image'
import { ArrowRight, List } from '@phosphor-icons/react/dist/ssr'
import { Backdrop } from '@/components/Backdrop'
import { Doodle } from '@/components/Doodles'
import { CupImage, HeroLabel, Menu, Stage, Tour } from '@/components/Flavours'
import { Motion } from '@/components/Motion'
import { Scene } from '@/components/Scene'
import { BRAND, FLAVOURS, NAV, PHOTOS, PLACES, POSES, STATS, STORY, STORY_BEATS, cardImage, rabbit } from '@/lib/data'
import { HERO_ASSETS, heroAsset } from '@/lib/heroAssets'
import { Placeholder } from '@/lib/placeholder'


// The twelve poses: plates of different sizes, heights and fills.
const TILES = [
  { bg: '#fff', sticker: false },
  { bg: 'var(--blue-soft)', sticker: false },
  { bg: 'var(--ink)', sticker: true },
  { bg: '#fdf0c6', sticker: false },
  { bg: '#fde1e6', sticker: false },
]
const SHAPES = [
  { w: '23vw', ratio: '4 / 5', align: 'flex-start' },
  { w: '30vw', ratio: '5 / 4', align: 'flex-end' },
  { w: '19vw', ratio: '3 / 4', align: 'center' },
  { w: '26vw', ratio: '1 / 1', align: 'flex-start' },
  { w: '21vw', ratio: '4 / 5', align: 'flex-end' },
]

export default function Home() {
  const drink = rabbit('drink', true)
  const stand = rabbit('stand')
  const run = rabbit('run', true)
  const pounce = rabbit('pounce', true)
  const back = rabbit('back')
  const wordmarkWhite = heroAsset(HERO_ASSETS.wordmark.white)
  const lockup = heroAsset(HERO_ASSETS.wordmark.cup ?? HERO_ASSETS.wordmark.black)

  return (
    <>
      <Backdrop />

      <header className="nav">
        {/* SLOT wordmark: the brand's own artwork when supplied, the stand-in lettering until then */}
        {heroAsset(HERO_ASSETS.wordmark.black) ? (
          <a className="nav__logo nav__logo--art" href="#top" translate="no" aria-label="RUS RUSS Juices, back to top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroAsset(HERO_ASSETS.wordmark.black)!} width={131} height={24} alt="" />
          </a>
        ) : (
          <a className="nav__logo" href="#top" translate="no" aria-label="RUS RUSS Juices, back to top">
            <span>RUS</span>
            <span>RUSS</span>
          </a>
        )}
        <nav className="nav__links" aria-label="Primary">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="nav__end">
          <a className="btn btn--blue" href="#locations">
            Get Juice <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </a>
          <details className="menu">
            <summary aria-label="Menu">
              <List size={22} weight="bold" aria-hidden="true" />
            </summary>
            <nav className="menu__panel" aria-label="Menu">
              {NAV.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </header>

      <Scene />

      <main id="main" tabIndex={-1}>
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero__copy">
            <h1 className="hero__title" id="hero-title">
              <span className="line">
                <span>
                  UK’s
                  <svg className="hero__crown" viewBox="0 0 60 46" fill="none" aria-hidden="true">
                    <path d="M6 40 3 12l15 14L28 4l10 22 17-16-5 30Z" pathLength={1} stroke="currentColor" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
              <span className="line">
                <span className="blue">Juice</span>
              </span>
              <span className="line">
                <span>Brand</span>
              </span>
            </h1>
            <p className="hero__sub" data-enter>
              {BRAND.sub}
              {/* the brush underline from the reference, drawn in */}
              <svg className="hero__underline" viewBox="0 0 300 14" fill="none" aria-hidden="true" preserveAspectRatio="none">
                <path d="M3 9c60-5 130-6 200-4 40 1 70 2 94 1" pathLength={1} stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
              </svg>
            </p>
            <a className="btn btn--ink" href="#products" data-enter>
              Explore Flavours <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </a>
            <Placeholder what="stats from the concept, not verified">
              <ul className="hero__stats">
                {STATS.map((stat) => (
                  <li className="stat" key={stat.label} data-enter>
                    <b>{stat.strong}</b>
                    {stat.label}
                  </li>
                ))}
              </ul>
            </Placeholder>
          </div>

          <div className="hero__visual">
            <div className="cup-slot hero__slot" data-enter>
              <CupImage sizes="(max-width: 760px) 90vw, 46vw" priority />
            </div>
            <HeroLabel />
            {/* the marker note from the reference, with its dash marks */}
            <p className="hero__note marker" data-enter>
              <svg className="hero__dash" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <path d="M4 14 12 8M6 22l10-2M14 27l6-6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
              More
              <br />
              than
              <br />
              just
              <br />
              juice.
            </p>
          </div>

          {/* The market in a field, built in depth: the meadow far away and out of focus, a produce
              stall softly behind the product, sunlight from the top right, and sharp grass in front
              that the product stands in. All free Pexels photographs, credited in DESIGN.md. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero__photo" src="/assets/market/field-hero.webp" srcSet="/assets/market/field-hero-900.webp 900w, /assets/market/field-hero.webp 1800w" sizes="100vw" width={1800} height={1200} alt="" aria-hidden="true" fetchPriority="high" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero__stall" src="/assets/market/stall-bokeh.webp" width={1200} height={800} alt="" aria-hidden="true" decoding="async" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero__grass" src="/assets/market/grass.webp" srcSet="/assets/market/grass-900.webp 900w, /assets/market/grass.webp 2000w" sizes="100vw" width={2000} height={1500} alt="" aria-hidden="true" decoding="async" />
          {/* the market at the edges of the picture, softly out of focus */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero__edge hero__edge--left" src="/assets/market/edge-hero-left.webp" width={205} height={542} alt="" aria-hidden="true" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero__edge hero__edge--right" src="/assets/market/edge-hero-right.webp" width={254} height={532} alt="" aria-hidden="true" loading="lazy" />

          {/* the stall's awning closes the hero and opens the flavours, with the "Juices" sign hanging from it */}
          <div className="awning hero__awning" aria-hidden="true">
            <div />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="awning__sign" src="/assets/market/sign-juices.webp" width={285} height={110} alt="" />
          </div>

        </section>

        <Stage />

        <Menu />

        {/* OUR STORY as a walk through the market: FRUIT, MARKET, JUICE, RUS RUSS. The word on the
            left changes as each beat on the right scrolls past (Motion.tsx); without JS all four show. */}
        <section className="story" id="story" aria-labelledby="story-title">
          <div className="story__side">
            <p className="label">Our story</p>
            <h2 id="story-title" data-lines>
              <span className="line">
                <span>More than</span>
              </span>
              <span className="line">
                <span className="blue">just juice.</span>
              </span>
            </h2>
            <ol className="story__words" aria-hidden="true">
              {STORY_BEATS.map((beat, i) => (
                <li key={beat.word} className="story__word marker" data-beat={i} translate={beat.brand ? 'no' : undefined}>
                  {beat.word}
                </li>
              ))}
            </ol>
            <Placeholder what="company description from the concept">
              <p className="story__text">{STORY}</p>
            </Placeholder>
          </div>
          <ol className="story__beats">
            <li className="beat beat--fruit" data-beat="0">
              <figure>
                <div className="beat__frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="beat__photo" src="/assets/market/fruit-bokeh.webp" width={600} height={376} alt="" aria-hidden="true" loading="lazy" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="beat__fruit beat__fruit--a" src="/assets/market/fruit/strawberry.webp" width={216} height={234} alt="" aria-hidden="true" loading="lazy" data-depth="3" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="beat__fruit beat__fruit--b" src="/assets/market/fruit/blueberry-1.webp" width={180} height={180} alt="" aria-hidden="true" loading="lazy" data-depth="-2" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="beat__fruit beat__fruit--c" src="/assets/market/fruit/leaf.webp" width={198} height={192} alt="" aria-hidden="true" loading="lazy" data-depth="2" />
                  <Doodle name="strawberry" plain className="beat__doodle" />
                </div>
                <figcaption className="beat__caption">
                  <span className="marker">01</span> It starts with fruit.
                </figcaption>
              </figure>
            </li>
            <li className="beat beat--market" data-beat="1">
              <figure>
                <div className="beat__frame">
                  <div className="photo">
                    <Image {...PHOTOS.storefront} sizes="(max-width: 760px) 90vw, 46vw" />
                  </div>
                  <Image className="beat__rabbit" src={drink.src} width={drink.width} height={drink.height} sizes="(max-width: 760px) 27vw, 12vw" alt="" />
                </div>
                <figcaption className="beat__caption">
                  <span className="marker">02</span> Then the market.
                </figcaption>
              </figure>
            </li>
            <li className="beat beat--juice" data-beat="2">
              <figure>
                <div className="beat__frame beat__frame--cloth">
                  <Image src={cardImage(FLAVOURS[0].id)} width={900} height={900} sizes="(max-width: 760px) 70vw, 30vw" alt="" />
                  <Doodle name="cherry" className="beat__doodle" />
                </div>
                <figcaption className="beat__caption">
                  <span className="marker">03</span> Then the juice.
                </figcaption>
              </figure>
            </li>
            <li className="beat beat--brand" data-beat="3">
              <figure>
                <div className="beat__frame beat__frame--brand">
                  {lockup ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={lockup} width={2391} height={567} alt="RUS RUSS Juices" loading="lazy" />
                  ) : (
                    <span translate="no">RUS&nbsp;RUSS Juices</span>
                  )}
                  <Image className="beat__rabbit beat__rabbit--stand" src={stand.src} width={stand.width} height={stand.height} sizes="(max-width: 760px) 30vw, 14vw" alt="" />
                </div>
                <figcaption className="beat__caption">
                  <span className="marker">04</span> Then <span translate="no">RUS&nbsp;RUSS</span>.
                </figcaption>
              </figure>
            </li>
          </ol>
        </section>

        {/* The repeated wordmark band from the branding PDF (page 1). It slides with the scroll. */}
        {wordmarkWhite && (
          <div className="band" aria-hidden="true">
            <div className="band__track">
              {Array.from({ length: 8 }, (_, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={i} src={wordmarkWhite} width={260} height={48} alt="" loading="lazy" />
              ))}
            </div>
          </div>
        )}

        {/* BRAND WORLD: the brand's own photographs and graphics, nothing staged or invented */}
        <section className="world" id="world" aria-labelledby="world-title">
          <h2 id="world-title" data-lines>
            <span className="line">
              <span>Out in</span>
            </span>
            <span className="line">
              <span className="blue">the wild.</span>
            </span>
          </h2>
          <Doodle name="pineapple" className="doodle--at" style={{ left: '46%', top: '4%', '--w': '7vw', rotate: '10deg' } as CSSProperties} />
          <Doodle name="cherry" className="doodle--at" style={{ right: '4%', bottom: '4%', '--w': '6vw', rotate: '-8deg' } as CSSProperties} />
          <div className="photo world__truck">
            <Image {...PHOTOS.truck} sizes="(max-width: 760px) 92vw, 62vw" />
            <span className="tag marker">the truck</span>
          </div>
          <div className="photo world__cup" data-speed="6">
            <Image {...PHOTOS.cup} sizes="(max-width: 760px) 56vw, 28vw" />
            <span className="tag marker">the cup</span>
          </div>
          <div className="photo world__bags" data-speed="-4">
            <Image {...PHOTOS.bags} sizes="(max-width: 760px) 70vw, 36vw" />
            <span className="tag marker">the bags</span>
          </div>
          <Image className="world__rabbit world__rabbit--a" src={run.src} width={run.width} height={run.height} sizes="(max-width: 760px) 30vw, 15vw" alt="" data-speed="10" />
          <Image className="world__rabbit world__rabbit--b" src={pounce.src} width={pounce.width} height={pounce.height} sizes="(max-width: 760px) 26vw, 13vw" alt="" data-speed="-8" />
        </section>

        <Tour />

        <section className="moods" aria-labelledby="moods-title">
          <div className="moods__pin">
            <header className="moods__head">
              <h2 id="moods-title" data-lines>
                <span className="line">
                  <span>One rabbit.</span>
                </span>
                <span className="line">
                  <span className="blue">Twelve poses.</span>
                </span>
              </h2>
              <p className="moods__lede">Spot them on the cups, the bags and the side of the truck.</p>
            </header>
            <div className="moods__window">
            <ol className="moods__track" aria-label="The twelve poses">
              {POSES.map((pose, i) => {
                const tile = TILES[i % TILES.length]
                const shape = SHAPES[i % SHAPES.length]
                const art = rabbit(pose, tile.sticker)
                const style = { '--w': shape.w, '--ratio': shape.ratio, '--align': shape.align, '--bg': tile.bg } as CSSProperties
                return (
                  <li className="mood" key={pose} style={style}>
                    <figure>
                      <div className="mood__tile">
                        <Image src={art.src} width={art.width} height={art.height} sizes="(max-width: 760px) 50vw, 24vw" alt={`The RUS RUSS rabbit, pose ${i + 1} of ${POSES.length}`} />
                      </div>
                    </figure>
                  </li>
                )
              })}
            </ol>
            </div>
          </div>
        </section>

        <section className="locations" id="locations" aria-labelledby="locations-title">
          <div className="locations__panel">
            <h2 id="locations-title" data-lines>
              <span className="line">
                <span>Find</span>
              </span>
              <span className="line">
                <span className="blue">the truck.</span>
              </span>
            </h2>
            {PLACES.length ? (
              <ul className="locations__list">
                {PLACES.map((place) => (
                  <li key={place.name}>
                    <b>{place.name}</b>
                    <span>{place.address}</span>
                    <span>{place.hours}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="locations__soon marker">Coming soon</p>
            )}
            <Doodle name="orange" className="doodle--at doodle--blue" style={{ left: '38%', top: '10%', '--w': '5vw', rotate: '-14deg' } as CSSProperties} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="locations__photo" src="/assets/market/field-pasture.webp" srcSet="/assets/market/field-pasture-900.webp 900w, /assets/market/field-pasture.webp 1600w" sizes="100vw" width={1600} height={1200} alt="" aria-hidden="true" loading="lazy" />
            {/* a hand-drawn UK. No pins: there are no confirmed locations to point at. */}
            <svg className="locations__map" viewBox="0 0 300 430" fill="none" aria-hidden="true">
              <path
                d="M150 22c14-4 30 2 42 10 8 10 10 24 6 38-6 8-14 14-10 26 10 6 22 10 26 24-4 14-12 26-8 40 6 14 2 30 8 44 4 14 18 22 22 36-2 16 6 30 16 42-4 12-12 22-10 36 2 12-6 22-16 24-20-2-40 4-60 2-16-2-32 4-48 4-10-4-24-8-38 0-10-4-16-16-10-28 14-6 26-14 30-28-10-10-22-18-20-34 8-8 18-16 16-30-10-4-20-8-18-22 8-10 20-14 24-28-8-10-22-14-22-28 4-14 14-24 16-40-4-14-14-24-8-40 8-8 22-6 32-12 10-4 20-10 30-12Z"
                pathLength={1}
              />
              <path d="M44 174c12-6 26-8 38-2 6 10 8 22 2 32-10 8-24 10-36 4-10-8-12-22-4-34Z" pathLength={1} />
              {/* the truck's route, not drawn yet */}
              <path className="locations__route" d="M70 380C110 330 90 280 140 250s70-60 60-120" pathLength={1} />
            </svg>
            <Image className="locations__rabbit" src={back.src} width={back.width} height={back.height} sizes="(max-width: 760px) 30vw, 16vw" alt="" />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="awning footer__awning" aria-hidden="true">
          <div />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="footer__photo" src="/assets/market/field-pasture-900.webp" width={900} height={675} alt="" aria-hidden="true" loading="lazy" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="footer__edge footer__edge--left" src="/assets/market/edge-stall-left.webp" width={200} height={430} alt="" aria-hidden="true" loading="lazy" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="footer__edge footer__edge--right" src="/assets/market/edge-hero-right.webp" width={254} height={532} alt="" aria-hidden="true" loading="lazy" />
        <div className="footer__top">
          {/* FINAL CTA. The line is from the concept sheet, not the approved tile or the brand PDF: see DESIGN.md appendix C. */}
          <p className="footer__motto">
            <span className="line">
              <span>Come get</span>
            </span>
            <span className="line">
              <span>your juice.</span>
            </span>
          </p>
          <Doodle name="watermelon" className="doodle--at" style={{ right: '4%', top: '2%', '--w': '7vw', rotate: '16deg' } as CSSProperties} />
          <Doodle name="kiwi" className="doodle--at" style={{ right: '17%', top: '20%', '--w': '4.5vw', rotate: '-10deg' } as CSSProperties} />
          <Image className="footer__rabbit" src={stand.src} width={stand.width} height={stand.height} sizes="(max-width: 760px) 22vw, 11vw" alt="" />
          <a className="btn btn--blue footer__cta" href="#products">
            Explore Flavours <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </a>
        </div>
        <div className="footer__cols">
          <p>
            <span translate="no">RUS&nbsp;RUSS</span> Juices
            <br />
            UK’s Juice Brand
          </p>
          <nav aria-label="Footer">
            <ul>
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <p>
            <span translate="no">{BRAND.motto}</span>
          </p>
        </div>
        {/* the official lockup when supplied; it is assembled in three beats: RUS, RUSS, Juices */}
        {lockup ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="footer__lockup" src={lockup} width={2391} height={567} alt="" aria-hidden="true" loading="lazy" />
        ) : (
          <p className="footer__word" aria-hidden="true" translate="no">
            RUS RUSS
          </p>
        )}
      </footer>

      <Motion />
    </>
  )
}
