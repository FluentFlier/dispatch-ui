'use client';

import Image from 'next/image';
import { useRef } from 'react';
import {
  Check,
  MessageCircle,
  PenLine,
  Radar,
  Search,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { ArcherContainer, ArcherElement } from 'react-archer';

const EASE = [0.16, 1, 0.3, 1] as const;

function VoiceComposer() {
  return (
    <div className="w-full max-w-[520px] rotate-[1.5deg] rounded-[18px] border-[3px] border-ink bg-surface p-3 shadow-[14px_16px_0_oklch(18%_0.012_55)] sm:p-4">
      <div className="flex items-center justify-between border-b-2 border-ink/15 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-blue text-paper">
            <PenLine className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div>
            <p className="m-0 text-xs font-bold text-ink">Composer</p>
            <p className="m-0 text-[10px] text-ink3">LinkedIn post</p>
          </div>
        </div>
        <span className="rounded-[7px] border border-ink/15 px-2 py-1 text-[10px] font-semibold text-ink2">
          Voice QA on
        </span>
      </div>

      <div className="mt-3 rounded-[12px] border-2 border-ink bg-paper p-4">
        <p className="m-0 text-[10px] font-bold uppercase tracking-[0.1em] text-ink3">Behind the scenes</p>
        <p className="m-0 mt-3 text-sm font-medium leading-6 text-ink sm:text-base">
          We&apos;re launching something new this June. Can&apos;t wait to share it with you.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {['Founder story', 'Clear point of view', 'Warm + direct'].map((item) => (
            <span key={item} className="rounded-[7px] border border-ink/15 bg-surface px-2 py-1 text-[10px] font-semibold text-ink2">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ['Brand voice', 'On-brand'],
          ['Audience', 'Founder-creators'],
          ['Intent', 'Thought leadership'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[10px] border border-ink/15 bg-paper p-2.5">
            <p className="m-0 text-[9px] text-ink3">{label}</p>
            <p className="m-0 mt-1 text-[10px] font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoiceGauge({ rotation }: { rotation: number | MotionValue<number> }) {
  return (
    <div className="relative w-[190px] rounded-[18px] border-[3px] border-ink bg-lime p-4 text-ink shadow-[8px_10px_0_oklch(18%_0.012_55)]">
      <p className="m-0 text-center text-xs font-black uppercase tracking-[0.1em]">Voice QA</p>
      <div className="relative mx-auto mt-4 h-20 w-36 overflow-hidden">
        <div className="absolute left-1/2 top-3 h-28 w-28 -translate-x-1/2 rounded-full border-[12px] border-ink bg-surface" />
        <div className="absolute left-1/2 top-3 h-28 w-28 -translate-x-1/2 rounded-full border-[12px] border-flame [clip-path:polygon(0_0,50%_0,50%_50%,0_50%)]" />
        <motion.span
          style={{ rotate: rotation }}
          className="absolute bottom-0 left-1/2 h-2 w-14 origin-left -translate-x-1 rounded-full bg-ink"
        />
        <span className="absolute bottom-[-2px] left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-ink bg-surface" />
      </div>
      <div className="mt-3 space-y-1.5">
        {['Clarity', 'Warmth', 'Authenticity'].map((item) => (
          <div key={item} className="flex items-center justify-between text-[11px] font-bold">
            <span>{item}</span>
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

function VoicePoster() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const dialRotation = useTransform(scrollYProgress, [0.18, 0.72], [-24, 22]);
  const composerY = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 0 : 50, reduceMotion ? 0 : -24]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-b-[3px] border-ink bg-[radial-gradient(circle_at_72%_22%,#ff9a87_0%,#ff694e_42%,#f45840_100%)] text-ink"
    >
      <div className="relative mx-auto grid min-h-[860px] max-w-[1400px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-12 lg:py-32">
        <div className="relative z-10">
          <motion.h2
            initial={reduceMotion ? false : { opacity: 0, y: 46 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.72, ease: EASE }}
            className="m-0 mt-6 max-w-[8ch] text-[clamp(4.6rem,9vw,9.5rem)] font-black uppercase leading-[0.76] tracking-[-0.075em]"
          >
            <span className="block text-paper">Your voice</span>
            <span className="block">before</span>
            <span className="block">you edit.</span>
          </motion.h2>
          <p className="m-0 mt-9 max-w-sm text-base font-medium leading-7">
            Creator Brain learns from your posts, emails, and stories. Voice QA checks every draft
            before it reaches your queue.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Story Bank', 'Creator Brain', 'Voice QA'].map((item, index) => (
              <motion.span
                key={item}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.12 + index * 0.08, ease: EASE }}
                className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold"
              >
                {item}
              </motion.span>
            ))}
          </div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.62, delay: 0.24, ease: EASE }}
            className="mt-8 w-[330px] max-w-[72vw]"
          >
            <Image
              src="/images/illustrations/voice-character-clean.png"
              alt="An illustrated creator tuning the Content OS voice machine."
              width={455}
              height={600}
              className="h-auto w-full"
            />
          </motion.div>
        </div>

        <motion.div
          style={{ y: composerY }}
          className="relative z-10 flex min-h-[500px] items-center justify-center"
        >
          <div className="relative z-10">
            <VoiceComposer />
          </div>
          <div className="absolute -right-4 -top-10 z-20 hidden lg:block">
            <VoiceGauge rotation={reduceMotion ? 8 : dialRotation} />
          </div>
          <motion.div
            aria-hidden
            className="absolute -right-5 top-0 z-20 grid h-20 w-20 place-items-center rounded-full border-[3px] border-ink bg-lilac"
            animate={reduceMotion ? undefined : { rotate: [0, 8, 0], y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-8 w-8" strokeWidth={2.2} />
          </motion.div>
        </motion.div>

        <div className="lg:hidden">
          <VoiceGauge rotation={8} />
        </div>
      </div>
    </section>
  );
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

function DistributionPoster() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const calendarY = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 0 : 70, reduceMotion ? 0 : -30]);

  return (
    <section ref={ref} className="relative overflow-hidden border-b-[3px] border-ink bg-[#fbfbfb] text-ink">
      <div className="mx-auto grid min-h-[900px] max-w-[1400px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-12 lg:py-32">
        <div className="relative z-20">
          <motion.h2
            initial={reduceMotion ? false : { opacity: 0, x: -44 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.72, ease: EASE }}
            className="m-0 mt-6 text-[clamp(5rem,9vw,9.2rem)] font-black uppercase leading-[0.78] tracking-[-0.075em]"
          >
            Repurpose
            <span className="block text-blue">once.</span>
          </motion.h2>
          <p className="m-0 mt-8 max-w-sm text-base leading-7 text-ink2">
            One source idea becomes a native LinkedIn post and X thread, scheduled from the same
            calendar.
          </p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
            className="mt-9 w-[270px] max-w-[68vw]"
          >
            <Image
              src="/images/illustrations/distribution-character.png"
              alt="An illustrated creator carrying an idea toward the publishing calendar."
              width={493}
              height={363}
              className="h-auto w-full"
            />
          </motion.div>
        </div>

        <motion.div style={{ y: calendarY }} className="relative">
          <ArcherContainer
            className="relative min-h-[580px] lg:min-h-[690px]"
            strokeColor="#171512"
            strokeWidth={5}
            strokeDasharray="12 11"
            lineStyle="curve"
            offset={8}
            svgContainerStyle={{ zIndex: 10 }}
          >
            <div className="absolute inset-x-[-12%] top-[8%] rotate-[5deg] rounded-[24px] border-[3px] border-ink bg-blue p-4 shadow-[14px_18px_0_oklch(18%_0.012_55)] sm:p-6 lg:inset-x-[-4%]">
              <div className="flex items-center justify-between text-paper">
                <p className="m-0 text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl">May</p>
                <span className="rounded-[8px] border border-paper/35 px-3 py-1 text-xs font-bold">Publishing calendar</span>
              </div>
              <div className="mt-5 grid grid-cols-5 overflow-hidden rounded-[14px] border-2 border-ink bg-paper">
                {DAYS.map((day, index) => (
                  <div key={day} className="min-h-[280px] border-r border-ink/15 p-2 last:border-r-0 sm:p-3">
                    <p className="m-0 text-[9px] font-black tracking-[0.1em] text-ink3">{day}</p>
                    <p className="m-0 mt-1 text-lg font-black text-ink">{26 + index}</p>
                    {index === 2 && (
                      <div className="mt-12 h-24 rounded-[10px] border-2 border-ink bg-flame p-2 text-[9px] font-bold text-ink shadow-[4px_5px_0_oklch(18%_0.012_55)]">
                        Founder lesson
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <ArcherElement
              id="distribution-source"
              relations={[
                {
                  targetId: 'distribution-linkedin',
                  sourceAnchor: 'bottom',
                  targetAnchor: 'top',
                  className: 'kinetic-connector',
                },
                {
                  targetId: 'distribution-x',
                  sourceAnchor: 'bottom',
                  targetAnchor: 'top',
                  className: 'kinetic-connector kinetic-connector--delayed',
                },
              ]}
            >
              <div className="absolute left-[4%] top-[4%] z-20 w-44">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, x: -28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
                  className="-rotate-3 rounded-[14px] border-[3px] border-ink bg-flame p-3 shadow-[6px_7px_0_oklch(18%_0.012_55)]"
                >
                  <p className="m-0 text-[9px] font-black uppercase tracking-[0.1em]">One source</p>
                  <p className="m-0 mt-2 text-xs font-bold">Behind the scenes: shipping with customers</p>
                </motion.div>
              </div>
            </ArcherElement>

            <ArcherElement id="distribution-linkedin">
              <div className="absolute bottom-[4%] left-[5%] z-20 w-[42%]">
                <div className="-rotate-2 rounded-[16px] border-[3px] border-ink bg-surface p-3 shadow-[7px_8px_0_oklch(18%_0.012_55)] sm:p-4">
                  <div className="flex items-center gap-2">
                    <Image src="/images/brands/linkedin.png" alt="" width={24} height={24} className="h-6 w-6" />
                    <span className="text-xs font-black">LinkedIn post</span>
                  </div>
                  <p className="m-0 mt-4 text-xs font-semibold leading-5 sm:text-sm">Build repeatable authority without rewriting the idea.</p>
                </div>
              </div>
            </ArcherElement>

            <ArcherElement id="distribution-x">
              <div className="absolute bottom-0 right-[2%] z-20 w-[42%]">
                <div className="rotate-2 rounded-[16px] border-[3px] border-ink bg-surface p-3 shadow-[7px_8px_0_oklch(18%_0.012_55)] sm:p-4">
                  <div className="flex items-center gap-2">
                    <Image src="/images/brands/x.png" alt="" width={22} height={22} className="h-[22px] w-[22px] rounded-[3px]" />
                    <span className="text-xs font-black">X thread</span>
                  </div>
                  <p className="m-0 mt-4 text-xs font-semibold leading-5 sm:text-sm">Turn the same source into a channel-native thread.</p>
                </div>
              </div>
            </ArcherElement>
          </ArcherContainer>
        </motion.div>
      </div>
    </section>
  );
}

const SIGNALS = [
  { title: 'Warm contact identified', detail: 'Commented on your founder-led sales post', color: 'bg-lilac', icon: UserRoundCheck },
  { title: 'ICP match', detail: 'Role, company size, and industry align', color: 'bg-lilac', icon: Radar },
  { title: 'Research', detail: 'Recent posts and company context gathered', color: 'bg-lime', icon: Search },
  { title: 'Warm reply', detail: 'Appreciate the reach. Let’s connect.', color: 'bg-lime', icon: MessageCircle },
] as const;

function LeadsPoster() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b-[3px] border-ink bg-ink text-paper">
      <div className="mx-auto grid min-h-[920px] max-w-[1400px] gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:px-12 lg:py-32">
        <div className="relative z-20">
          <motion.h2
            initial={reduceMotion ? false : { opacity: 0, y: 44 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.72, ease: EASE }}
            className="m-0 mt-6 text-[clamp(4.6rem,8.5vw,8.7rem)] font-black uppercase leading-[0.78] tracking-[-0.075em]"
          >
            <span className="block text-paper">Attention</span>
            <span className="block text-lilac">into</span>
            <span className="block text-paper">conversation.</span>
          </motion.h2>
          <p className="m-0 mt-8 max-w-sm text-base leading-7 text-paper/65">
            Replies, network context, and ICP signals become researched warm contacts with drafts
            ready to send. The outcome feeds your next signal.
          </p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -22 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.62, delay: 0.2, ease: EASE }}
            className="mt-8 w-[185px] max-w-[48vw]"
          >
            <Image
              src="/images/illustrations/signal-character-padded.png"
              alt="An illustrated signal scout following a promising conversation."
              width={388}
              height={472}
              className="h-auto w-full"
            />
          </motion.div>
        </div>

        <ArcherContainer
          className="relative -ml-[10%] min-h-[700px] w-[120%]"
          strokeColor="#c9ff49"
          strokeWidth={5}
          strokeDasharray="12 12"
          lineStyle="curve"
          offset={8}
          svgContainerStyle={{ zIndex: 5 }}
        >
          {SIGNALS.map(({ title, detail, color, icon: Icon }, index) => {
            const positions = [
              'left-[8%] top-[0] rotate-[-2deg]',
              'right-[8%] top-[15%] rotate-[2deg]',
              'right-[0] bottom-[0] rotate-[-2deg]',
              'left-[0] bottom-[15%] rotate-[2deg]',
            ];
            const width = index >= 2 ? 'w-[43%]' : 'w-[40%]';
            const relations =
              index === 0 || index === 1
                ? [
                    {
                      targetId: index === 0 ? 'signal-3' : 'signal-2',
                      sourceAnchor: 'bottom' as const,
                      targetAnchor: 'top' as const,
                      className:
                        index === 0
                          ? 'kinetic-connector'
                          : 'kinetic-connector kinetic-connector--delayed',
                    },
                  ]
                : [];
            return (
              <ArcherElement
                key={title}
                id={`signal-${index}`}
                relations={relations}
              >
                <div className={`absolute z-10 ${width} ${positions[index]}`}>
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.86, y: 24 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    whileHover={reduceMotion ? undefined : { y: -7, rotate: 0 }}
                    viewport={{ once: true, margin: '-12%' }}
                    transition={{ duration: 0.55, delay: index * 0.1, ease: EASE }}
                    className={`min-h-[154px] rounded-[18px] border-[3px] border-paper p-4 text-ink shadow-[8px_9px_0_oklch(99.2%_0.002_85)] sm:min-h-[166px] sm:p-5 ${color}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] border-2 border-ink bg-paper">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
                      </span>
                      <p className="m-0 min-w-0 flex-1 text-[13px] font-black leading-[1.15] tracking-[-0.015em] sm:text-sm">
                        {title}
                      </p>
                    </div>
                    <p className="m-0 mt-4 border-t border-ink/15 pt-3 text-[11px] font-semibold leading-[1.45] text-ink/70 sm:text-xs sm:leading-[1.5]">
                      {detail}
                    </p>
                  </motion.div>
                </div>
              </ArcherElement>
            );
          })}
        </ArcherContainer>
      </div>
    </section>
  );
}

export default function KineticPosterSections() {
  return (
    <div id="loop">
      <VoicePoster />
      <DistributionPoster />
      <LeadsPoster />
    </div>
  );
}
