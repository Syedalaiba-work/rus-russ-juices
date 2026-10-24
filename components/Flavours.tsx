'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { CUP_SIZE, FLAVOURS, MENU, cardImage, cupImage, drinkImage, hasCardArt } from '@/lib/data'
import { flavour, useCupIsLive, useFlavour } from '@/lib/flavour'
import { Placeholder, SHOW_PLACEHOLDERS } from '@/lib/placeholder'
import { Doodle, type DoodleName } from '@/components/Doodles'

const pad2 = (n: number) => String(n).padStart(2, '0')
// where each loose fruit floats, as a fraction of the stage, and how deep it is (bigger moves more)
const FLOATERS = [
  { src: 'strawberry', w: 216, h: 234, x: '14%', y: '34%', s: 1.0, r: -14, d: 3 },
  { src: 'blueberry-1', w: 180, h: 180, x: '26%', y: '62%', s: 0.7, r: 10, d: -2 },
  { src: 'blueberry-2', w: 180, h: 192, x: '70%', y: '28%', s: 0.8, r: -6, d: 2 },
  { src: 'blackberry', w: 162, h: 132, x: '78%', y: '64%', s: 0.9, r: 12, d: -3 },
  { src: 'ice', w: 192, h: 192, x: '64%', y: '76%', s: 0.8, r: 20, d: 4 },
  { src: 'leaf', w: 186, h: 180, x: '22%', y: '18%', s: 0.9, r: -20, d: 1 },
]
// what the doodle beside each drink is, from the fruit the range guesses (lib/data.ts)
const FRUIT_DOODLE: Record<string, DoodleName> = { strawberry: 'strawberry', blueberry: 'blueberry', mango: 'mango', tropical: 'pineapple' }

// The hand-written flavour name with an arrow, pointing at the hero product.
export function HeroLabel() {
  const f = FLAVOURS[useFlavour()]
  return (
    <p className="hero__label marker" aria-hidden="true" translate="no">
      <span key={f.id}>{f.name}</span>
      <svg viewBox="0 0 40 60" fill="none" aria-hidden="true">
        <path d="M30 4C22 20 16 34 18 54m0 0-9-10m9 10 11-8" pathLength={1} stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </p>
  )
}

// The photograph of the picked cup. It is what loads first, what shows when WebGL or motion
// is off, and what the live 3D cup fades in over.
// `drink` is the cup alone: the realistic rabbit sits in it in the hero and nowhere else.
export function CupImage({ sizes, priority = false, drink = false }: { sizes: string; priority?: boolean; drink?: boolean }) {
  const active = useFlavour()
  const live = useCupIsLive()
  // while the 3D cup is showing, the photograph underneath stays as it was
  const shown = useRef(active)
  if (!live) shown.current = active
  const f = FLAVOURS[active]
  return (
    <Image
      className="cup-img"
      src={(drink ? drinkImage : cupImage)(FLAVOURS[shown.current].id)}
      width={CUP_SIZE.width}
      height={CUP_SIZE.height}
      sizes={sizes}
      priority={priority}
      alt={drink ? `A cup of ${f.name}` : `A cup of ${f.name} with the RUS RUSS rabbit sitting in the ice`}
    />
  )
}

// The four cards under the hero. The range itself is placeholder (see lib/data.ts). Each is a real link (?flavour=…#products), so it can be
// opened in a new tab or shared; a plain click picks the flavour and the page glides there.
export function FlavourCards() {
  const active = useFlavour()
  useEffect(() => flavour.hydrate(), [])

  return (
    <ul className="cards" aria-label="Flavours">
      {FLAVOURS.map((f, i) => (
        <li key={f.id} data-enter>
          <a className="card" href={`?flavour=${f.id}#products`} style={{ '--soft': f.soft } as CSSProperties} aria-current={i === active ? 'true' : undefined} onClick={() => flavour.set(i)}>
            {/* authored card art fills its column; the stand-in still is the whole hero frame, so it is enlarged */}
            <Image className={hasCardArt(f.id) ? 'card__art' : 'card__cup'} src={cardImage(f.id)} width={CUP_SIZE.width} height={CUP_SIZE.height} sizes="(max-width: 760px) 24vw, 12vw" alt="" />
            <span>
              <span className="card__name">
                {f.name.split(' ').map((word) => (
                  <span key={word} style={{ display: 'block' }}>
                    {word}
                  </span>
                ))}
              </span>
              <span className="card__go" aria-hidden="true">
                <ArrowRight size={18} weight="bold" />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

// The menu, laid out the way a juice bar's ordering page is: a bar of categories that
// sticks under the nav, then each category as a grid of wide cards (picture tile, name,
// what is in it, price, a round arrow). The structure was studied from Joe & the Juice's
// store page; the look is RUS RUSS. Prices, ingredients and tags show only when the data
// has them. Choosing an item picks that flavour and takes you up to the cup.
export function Menu() {
  const active = useFlavour()

  return (
    // The stall table under the awning: the four drinks standing on the blue gingham, each with
    // its hand-written name, a doodle of its fruit and a kraft label, the chalkboard at the end.
    <section className="drinks" id="menu" aria-labelledby="menu-title">
      {/* the collection: one strong heading, then the four drinks, large, with room round them */}
      <header className="drinks__intro">
        <h2 id="menu-title" data-lines>
          <span className="line">
            <span>Take</span>
          </span>
          <span className="line">
            <span className="blue">your pick.</span>
          </span>
        </h2>
      </header>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="drinks__edge drinks__edge--left" src="/assets/market/edge-stall-left.webp" width={200} height={430} alt="" aria-hidden="true" loading="lazy" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="drinks__edge drinks__edge--right" src="/assets/market/edge-stall-right.webp" width={206} height={430} alt="" aria-hidden="true" loading="lazy" />
      <Placeholder what="the range: names, colours and descriptions are not verified">{null}</Placeholder>
      {MENU.length > 1 && (
        <nav className="drinks__bar" aria-label="Menu categories">
          {MENU.map((c) => (
            <a key={c.id} href={`#menu-${c.id}`}>
              {c.name}
            </a>
          ))}
        </nav>
      )}
      {MENU.map((category) => (
        <div className="drinks__group" id={`menu-${category.id}`} key={category.id}>
          {MENU.length > 1 && <h3 className="label drinks__category">{category.name}</h3>}
          <ul className="drinks__grid">
            {category.items.map((item) => {
              const i = FLAVOURS.findIndex((f) => f.id === item.flavour)
              const f = FLAVOURS[i]
              return (
                <li key={f.id}>
                  <a className="dish" href={`?flavour=${f.id}#products`} aria-current={i === active ? 'true' : undefined} onClick={(e) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && flavour.set(i)}>
                    <span className="dish__hand marker" aria-hidden="true" translate="no">
                      {f.name.split(' ').map((word) => (
                        <span key={word}>{word}</span>
                      ))}
                      <svg viewBox="0 0 30 40" fill="none">
                        <path d="M6 4c8 8 12 16 12 32m0 0-8-8m8 8 8-7" pathLength={1} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <Doodle name={FRUIT_DOODLE[f.fruit] ?? 'lemon'} className="dish__doodle" />
                    <span className="dish__tile">
                      <Image src={cardImage(f.id)} width={900} height={900} sizes="(max-width: 760px) 44vw, 22vw" alt="" />
                    </span>
                    <span className="dish__text">
                      <span className="dish__name" translate="no">{f.name}</span>
                      {/* a confirmed description shows always; the stand-in line only in review builds */}
                      {(item.ingredients || SHOW_PLACEHOLDERS) && <span className="dish__ingredients">{item.ingredients ?? f.line}</span>}
                      {item.tag && <span className="dish__tag">{item.tag}</span>}
                      {item.price && <span className="dish__price">{item.price}</span>}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      <div className="stall" aria-hidden="true">
        <div className="stall__cloth" />
      </div>
    </section>
  )
}

// The juice tour: a scroll-driven walk through the range. The section sticks while you scroll
// and each stretch of scroll brings the next flavour: the list steps on, the room changes
// tint and the cup (the same one) changes with it. Motion.tsx maps scroll to flavour.
// With reduced motion there is nothing to scrub, so it is a plain row of the four instead.
export function Tour() {
  const active = useFlavour()

  return (
    <div className="tour-wrap">
      <section className="tour" aria-labelledby="tour-title">
        <div className="tour__copy">
          <h2 className="tour__title" id="tour-title">
            Keep scrolling. Meet the range.
          </h2>
          {/* display type; the same information is given to assistive tech just below */}
          <ol className="tour__steps" aria-hidden="true" translate="no">
            {FLAVOURS.map((f, i) => (
              <li key={f.id} data-current={i === active}>
                {f.name}
              </li>
            ))}
          </ol>
          <p className="sr-only tour__now">
            {FLAVOURS[active].name}, {active + 1} of {FLAVOURS.length}
          </p>
        </div>
        <div className="cup-slot tour__slot">
          <CupImage sizes="(max-width: 760px) 80vw, 44vw" drink />
        </div>
        <ul className="tour__grid">
          {FLAVOURS.map((f) => (
            <li key={f.id} style={{ '--soft': f.soft } as CSSProperties}>
              <Image src={drinkImage(f.id)} width={CUP_SIZE.width} height={CUP_SIZE.height} sizes="(max-width: 760px) 44vw, 22vw" alt="" />
              <span>{f.name}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// The flavour stage: one cup, centre frame. Picking a flavour changes the name behind it,
// the tint of the room and (in lib/cupScene.ts) the juice, the fruit and the splash together.
export function Stage() {
  const active = useFlavour()
  const f = FLAVOURS[active]
  // a link can open on a flavour (?flavour=…): read it once, after hydration
  useEffect(() => flavour.hydrate(), [])

  return (
    // The wrapper is taller than the stage; the stage sticks inside it, which is what holds
    // it on screen for a while. Plain CSS, so nothing jumps when the hold starts or ends.
    <div className="stage-wrap" id="products">
      <section className="stage" aria-labelledby="stage-title">
        <h2 className="stage__title" id="stage-title">
          Flavours that hit different.
        </h2>
        <p className="stage__name" aria-hidden="true" key={f.id} translate="no">
          {f.name.split(' ').map((word) => (
            <span key={word}>{word}</span>
          ))}
        </p>
        <div className="cup-slot stage__slot">
          <CupImage sizes="(max-width: 760px) 72vw, 42vw" drink />
        </div>
        {/* loose fruit round the cup: it drifts with the pointer and the scroll, at different depths */}
        <div className="stage__fruit" aria-hidden="true">
          {FLOATERS.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f.src} className="floater" src={`/assets/market/fruit/${f.src}.webp`} width={f.w} height={f.h} alt="" loading="lazy" style={{ '--x': f.x, '--y': f.y, '--s': f.s, '--r': `${f.r}deg` } as CSSProperties} data-depth={f.d} />
          ))}
        </div>
        <div className="stage__info" aria-live="polite">
          <div className="stage__swap" key={f.id}>
            <p className="label stage__count">
              {pad2(active + 1)} / {pad2(FLAVOURS.length)}
            </p>
            <h3 className="stage__flavour" translate="no">{f.name}</h3>
            <Placeholder what="flavour description, not verified">
            <p className="stage__line">{f.line}</p>
          </Placeholder>
          </div>
        </div>
        <div className="stage__chips" role="group" aria-label="Choose a flavour">
          {FLAVOURS.map((item, i) => (
            <button type="button" className="chip" key={item.id} translate="no" aria-pressed={i === active} onClick={() => flavour.set(i)}>
              {item.name}
            </button>
          ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="stage__board" src="/assets/market/chalkboard.webp" width={228} height={267} alt="" aria-hidden="true" loading="lazy" />
        <div className="stage__arrows">
          <button type="button" className="round" aria-label="Previous flavour" onClick={() => flavour.set(active - 1)}>
            <ArrowLeft size={22} weight="bold" aria-hidden="true" />
          </button>
          <button type="button" className="round" aria-label="Next flavour" onClick={() => flavour.set(active + 1)}>
            <ArrowRight size={22} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  )
}
