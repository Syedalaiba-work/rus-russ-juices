'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { FLAVOURS } from '@/lib/data'
import { flavour } from '@/lib/flavour'

// All DOM scroll choreography. The markup is server-rendered and complete without this;
// every effect has a static end state, and none of it runs under reduced motion.
// (The 3D cup has its own component, Scene.)
export function Motion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const root = document.documentElement
    const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!
    const $$ = <T extends HTMLElement>(s: string) => [...document.querySelectorAll<T>(s)]
    const mm = gsap.matchMedia()
    let lenis: Lenis | null = null

    // ---------------------------------------------------------------- nav
    const nav = $('.nav')
    const navTrigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll()
        nav.classList.toggle('is-stuck', y > 40)
        nav.classList.toggle('is-hidden', self.direction === 1 && y > 160)
      },
    })

    // The link for the section in view is marked current.
    const links = $$('.nav__links a')
    const inView = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          links.forEach((a) => (a.getAttribute('href') === `#${entry.target.id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')))
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    $$('#top, #products, #story, #locations').forEach((el) => inView.observe(el))

    // In-page links: smooth when motion is allowed, and focus always lands on the target.
    const onAnchor = (e: MouseEvent) => {
      const link = (e.target as Element).closest<HTMLAnchorElement>('a[href]')
      if (!link || !link.hash || link.pathname !== window.location.pathname) return
      const target = document.querySelector<HTMLElement>(link.hash)
      if (!target || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      link.closest('details')?.removeAttribute('open')
      if (lenis) lenis.scrollTo(link.hash === '#top' ? 0 : target)
      else target.scrollIntoView()
      history.pushState(null, '', link.getAttribute('href'))
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }
    document.addEventListener('click', onAnchor)

    // A blue word is inked in from left to right: it starts in black and the blue runs
    // across it. Returns the tween so it can be placed on a timeline.
    const wipe = (el: HTMLElement | null, duration: number) => {
      if (!el) return gsap.to({}, { duration: 0 })
      el.classList.add('is-inking')
      return gsap.fromTo(el, { '--ink-at': 0 }, { '--ink-at': 100, duration, ease: 'power2.inOut', onComplete: () => el.classList.remove('is-inking') })
    }

    // ---------------------------------------------------------------- motion
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const smooth = new Lenis({ lerp: 0.11 })
      lenis = smooth
      smooth.on('scroll', ScrollTrigger.update)
      const raf = (time: number) => smooth.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)

      // hero: the headline rises line by line, the crown is drawn, the cup lands, the note is
      // scribbled on, the cards deal in.
      root.classList.add('is-ready')
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        // the wordmark is laid down first, one word at a time: RUS, then RUSS
        .fromTo('.nav__logo--art img', { clipPath: 'inset(0% 100% 0% 0%)', rotate: -5, y: 6 }, { clipPath: 'inset(0% 60% 0% 0%)', rotate: -2, y: 2, duration: 0.45, ease: 'power3.out' }, 0)
        .to('.nav__logo--art img', { clipPath: 'inset(0% 0% 0% 0%)', rotate: 0, y: 0, duration: 0.6, ease: 'back.out(1.6)' }, 0.42)
        // then the headline: each line is pushed up into place slightly crooked and settles straight
        .from('.hero__title .line > span', { yPercent: 118, rotate: (i) => (i % 2 ? -5 : 6), duration: 1.0, stagger: 0.13, ease: 'back.out(1.25)' }, 0.1)
        .add(wipe($('.hero__title .blue'), 0.6), 0.62)
        .from('.hero__crown path', { strokeDashoffset: 1, duration: 0.6, ease: 'power2.inOut' }, 0.85)
        .fromTo('.hero__crown', { rotate: -14, scale: 0.7 }, { rotate: 10, scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)' }, 1.0)
        .from('.hero__slot', { yPercent: 10, scale: 0.9, opacity: 0, duration: 1.2, ease: 'back.out(1.3)' }, 0.2)
        .from('.hero__sub, .hero__copy .btn, .hero__stats li', { y: 22, opacity: 0, duration: 0.8, stagger: 0.07 }, 0.55)
        .from('.hero__underline path', { strokeDashoffset: 1, duration: 0.5, ease: 'power2.inOut' }, 1.0)
        .from('.hero__edge', { opacity: 0, x: (i) => (i ? 40 : -40), duration: 1.2, ease: 'power3.out' }, 0.3)
        .from('.hero__note, .hero__label', { scale: 0.4, opacity: 0, rotate: -20, duration: 0.7, stagger: 0.12, ease: 'back.out(2)' }, 1)
        .from('.hero__label path', { strokeDashoffset: 1, duration: 0.5, ease: 'power2.inOut' }, 1.3)

      // Headlines elsewhere are set the same way as they arrive: line by line, a little
      // crooked, settling straight, and the blue line is inked in from the left.
      $$('[data-lines]').forEach((el) => {
        const blue = el.querySelector<HTMLElement>('.blue')
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 86%' } })
        tl.from(el.querySelectorAll('.line > span'), { yPercent: 118, rotate: (i) => (i % 2 ? -4 : 5), duration: 0.95, stagger: 0.13, ease: 'back.out(1.25)' })
        if (blue) tl.add(wipe(blue, 0.55), 0.4)
      })

      // fruit doodles are drawn in with the pen, then the colour is printed under the line
      $$('.doodle').forEach((el) => {
        const onTable = !!el.closest('.stall')
        const tl = gsap.timeline({ scrollTrigger: { trigger: onTable ? '.stall' : el, start: 'top 92%' }, delay: onTable ? [...el.parentElement!.children].indexOf(el) * 0.07 : 0 })
        tl.from(el.querySelectorAll('path:not(.doodle__fill)'), { strokeDashoffset: 1, duration: 0.7, stagger: 0.1, ease: 'power2.inOut' })
        const fill = el.querySelector('.doodle__fill')
        if (fill) tl.from(fill, { opacity: 0, duration: 0.4 }, 0.4)
      })
      // the awning is let down over the menu
      $$('.awning').forEach((awning) => gsap.from(awning.firstElementChild, { yPercent: -100, duration: 0.9, ease: 'back.out(1.4)', scrollTrigger: { trigger: awning, start: 'top 95%' } }))
      gsap.from('.awning__sign', { rotate: -10, y: -40, opacity: 0, duration: 1.0, ease: 'elastic.out(1, 0.5)', scrollTrigger: { trigger: '.awning__sign', start: 'top 95%' } })
      gsap.from('.stage__board', { rotate: 6, y: 40, opacity: 0, duration: 0.8, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.stage-wrap', start: 'top 60%' } })
      // the stall's hand-written names and arrows are written as the table comes into view
      $$('.dish').forEach((dish, i) => {
        gsap.from(dish.querySelectorAll('.dish__hand path'), { strokeDashoffset: 1, duration: 0.5, delay: i * 0.12, ease: 'power2.inOut', scrollTrigger: { trigger: '.drinks__grid', start: 'top 85%' } })
        gsap.from(dish.querySelector('.dish__tile'), { y: 40, opacity: 0, duration: 0.8, delay: i * 0.1, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.drinks__grid', start: 'top 85%' } })
      })

      // HERO TO STALL, one journey: as the cup travels down, the table slides in under it and the
      // loose fruit gathers round where it will land. All tied to the same stretch of scroll.
      gsap.fromTo('.stage', { '--arrive': 0 }, { '--arrive': 1, ease: 'none', scrollTrigger: { trigger: '.stage-wrap', start: 'top 85%', end: 'top 15%', scrub: 0.6 } })
      gsap.from('.floater', { scale: 0, opacity: 0, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '.stage-wrap', start: 'top 50%', end: 'top 0%', scrub: 0.6 } })
      // FLAVOUR CHANGE: the fruit round the cup jumps with it, on the same beat as the cup's flip
      const offFlavour = flavour.subscribe(() => {
        gsap.fromTo('.floater', { '--pop': 0.5 }, { '--pop': 1, duration: 0.9, delay: 0.45, ease: 'elastic.out(1, 0.5)', stagger: 0.04, overwrite: 'auto' })
        gsap.fromTo('.stage', { '--bump': 1 }, { '--bump': 0, duration: 0.7, delay: 0.45, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
      })

      // the story: the word on the left follows the beat that is in the middle of the screen
      $$('.beat').forEach((beat) => {
        ScrollTrigger.create({
          trigger: beat,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => {
            if (!self.isActive) return
            $$('.story__word').forEach((w) => w.classList.toggle('is-on', w.dataset.beat === beat.dataset.beat))
          },
        })
        gsap.from(beat.querySelector('.beat__frame'), { y: 60, scale: 0.94, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: beat, start: 'top 85%' } })
      })
      $$('.story__word').forEach((w, i) => i === 0 && w.classList.add('is-on'))

      // loose fruit, in the stage and the story: drifts with the scroll at its depth, and leans
      // away from the pointer
      $$('[data-depth]').forEach((el) => {
        const depth = Number(el.dataset.depth)
        gsap.fromTo(el, { y: depth * -14 }, { y: depth * 14, ease: 'none', scrollTrigger: { trigger: el.closest('section, .beat') ?? el, scrub: 0.8 } })
      })
      const lean = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        $$('.stage__fruit [data-depth]').forEach((el) => {
          const depth = Number(el.dataset.depth)
          gsap.to(el, { x: nx * depth * -18, rotate: nx * depth * -4, '--lean': ny * depth * -12, duration: 1.2, ease: 'power2.out', overwrite: 'auto' })
        })
      }
      window.addEventListener('pointermove', lean, { passive: true })

      // the UK is drawn in, then the route
      gsap.from('.locations__map path', { strokeDashoffset: 1, duration: 1.4, stagger: 0.3, ease: 'power2.inOut', scrollTrigger: { trigger: '.locations', start: 'top 70%' } })

      // the repeated wordmark band slides with the scroll, as if pulled across
      gsap.fromTo('.band__track', { xPercent: -4 }, { xPercent: -24, ease: 'none', scrollTrigger: { trigger: '.band', scrub: 0.6 } })

      // the closing lockup is assembled in three beats: RUS, then RUSS, then Juices
      if (document.querySelector('.footer__lockup')) {
        gsap
          .timeline({ scrollTrigger: { trigger: '.footer__lockup', start: 'top 92%' } })
          .fromTo('.footer__lockup', { clipPath: 'inset(0% 100% 23% 0%)', rotate: -2, y: 30 }, { clipPath: 'inset(0% 60% 23% 0%)', y: 12, duration: 0.5, ease: 'power3.out' })
          .to('.footer__lockup', { clipPath: 'inset(0% 0% 23% 0%)', rotate: 0, y: 0, duration: 0.7, ease: 'back.out(1.4)' }, 0.45)
          .to('.footer__lockup', { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'power2.out' }, 1.05)
      }

      // Photographs open like a shutter and drift inside their frames.
      $$('.photo').forEach((photo) => {
        gsap.from(photo, { clipPath: 'inset(100% 0% 0% 0% round 28px)', duration: 1.3, ease: 'power4.inOut', scrollTrigger: { trigger: photo, start: 'top 90%' } })
        gsap.fromTo(photo.querySelector('img'), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: photo, scrub: true } })
      })
      // story: the rabbits hop onto their pictures
      $$('.beat__rabbit').forEach((r) => gsap.from(r, { y: 80, rotate: 24, scale: 0.6, ease: 'none', scrollTrigger: { trigger: r.closest('.beat'), start: 'top 80%', end: 'top 25%', scrub: 0.6 } }))

      // brand world: the truck drives in; everything else drifts at its own depth
      gsap.from('.world__truck', { xPercent: -30, rotate: -2, ease: 'none', scrollTrigger: { trigger: '.world', start: 'top bottom', end: 'top 20%', scrub: 0.7 } })
      $$('.world [data-speed]').forEach((el) => {
        const speed = Number(el.dataset.speed)
        gsap.fromTo(el, { y: speed * 9 }, { y: speed * -9, ease: 'none', scrollTrigger: { trigger: el, scrub: 0.6 } })
      })

      // juice tour: each quarter of the scroll through it is one flavour
      ScrollTrigger.create({
        trigger: '.tour-wrap',
        start: 'top top',
        end: 'bottom bottom',
        // only while the tour is actually on screen: a refresh elsewhere on the page must not change the flavour
        onUpdate: (self) => {
          if (self.isActive) flavour.set(Math.min(FLAVOURS.length - 1, Math.floor(self.progress * FLAVOURS.length)), { url: false })
        },
      })

      // locations: the rabbit walks off toward wherever the truck is
      gsap.from('.locations__rabbit', { xPercent: -60, ease: 'none', scrollTrigger: { trigger: '.locations', start: 'top 80%', end: 'center center', scrub: 0.6 } })

      // footer: the two halves of the motto close in on each other
      gsap.fromTo('.footer__motto .line:nth-child(1) > span', { xPercent: -10 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 30%', scrub: 0.5 } })
      gsap.fromTo('.footer__motto .line:nth-child(2) > span', { xPercent: 10 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 30%', scrub: 0.5 } })
      gsap.from('.footer__rabbit', { yPercent: 60, rotate: -14, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'top 25%', scrub: 0.5 } })
      if (document.querySelector('.footer__word')) gsap.from('.footer__word', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.footer__word', start: 'top bottom', end: 'bottom bottom', scrub: true } })

      return () => {
        offFlavour()
        window.removeEventListener('pointermove', lean)
        gsap.ticker.remove(raf)
        smooth.destroy()
        lenis = null
      }
    })

    // moods: on larger screens the lookbook pans sideways while the page is pinned
    const track = $('.moods__track')
    mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
      const head = $('.moods__head')
      const distance = () => Math.max(0, track.scrollWidth - (window.innerWidth - head.offsetWidth))
      const pan = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: '.moods', start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.7, invalidateOnRefresh: true },
      })
      $$('.mood__tile img').forEach((img, i) => {
        gsap.fromTo(
          img,
          { xPercent: i % 2 ? -14 : 14 },
          { xPercent: i % 2 ? 14 : -14, ease: 'none', scrollTrigger: { trigger: img, containerAnimation: pan, start: 'left right', end: 'right left', scrub: true } },
        )
      })
    })
    // Everywhere else it is a plain sideways scroller, reachable from the keyboard.
    mm.add('(max-width: 760px), (prefers-reduced-motion: reduce)', () => {
      track.classList.add('is-native')
      track.tabIndex = 0
      return () => {
        track.classList.remove('is-native')
        track.removeAttribute('tabindex')
      }
    })

    const refresh = () => ScrollTrigger.refresh()
    document.fonts.ready.then(refresh)
    window.addEventListener('load', refresh)

    return () => {
      window.removeEventListener('load', refresh)
      document.removeEventListener('click', onAnchor)
      inView.disconnect()
      navTrigger.kill()
      mm.revert()
    }
  }, [])

  return null
}
