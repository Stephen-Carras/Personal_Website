// Content collections. Every YAML file in src/data/ is validated here, so a typo
// or a missing field fails the build instead of shipping a broken page.
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { imageFiles } from './lib/image-files';

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');
const image = z.enum(imageFiles);
const text = z.string().min(1);

const profile = defineCollection({
  loader: file('src/data/profile.yaml'),
  schema: z.object({
    name: text,
    linkedin: z.object({ url: z.url(), label: text }),
    email: z.object({ user: text, domain: text, subject: text }),
    nav: z.array(z.object({ label: text, href: z.string().startsWith('#') })),
    headings: z.object({
      results: text,
      experience: text,
      education: text,
      recommendations: text,
      recommendationsHint: text,
    }),
    hero: z.object({
      headline: z.array(text).min(1),
      sub: z.array(text).length(3),
      button: text,
      location: text,
      educationLink: text,
      banner: image,
      headshot: image,
      experienceLead: text,
      experienceList: z.array(text),
    }),
    about: z.object({
      heading: text,
      lead: text,
      body: text,
      more: z.array(text).min(1),
      moreLabel: text,
      lessLabel: text,
    }),
    contactPopup: z.object({
      heading: text,
      intro: text,
      linkedinLabel: text,
      emailLabel: text,
      copyLabel: text,
      copiedLabel: text,
      replyNote: text,
    }),
    contact: z.object({
      heading: text,
      intro: text,
      emailButton: text,
      linkedinButton: text,
      rows: z.object({
        openTo: z.object({ label: text, value: text }),
        replyTime: z.object({ label: text, value: text }),
        where: z.object({
          label: text,
          places: z.array(z.object({ state: z.string().length(2), cities: z.array(text).min(1) })),
          also: text,
        }),
      }),
    }),
    footer: z.array(text),
  }),
});

const results = defineCollection({
  loader: file('src/data/results.yaml'),
  schema: z.object({ value: text, label: text, source: text }),
});

const competencies = defineCollection({
  loader: file('src/data/competencies.yaml'),
  schema: z
    .object({
      heading: text,
      highlighted: z.array(text),
      groups: z.array(z.object({ name: text, items: z.array(text).min(1) })),
      showAllLabel: text.includes('{n}'),
      showFewerLabel: text,
    })
    .refine(
      (c) => c.highlighted.every((h) => c.groups.some((g) => g.items.includes(h))),
      'Every highlighted competency must also appear in a group',
    ),
});

const role = z.object({
  id: text,
  title: text,
  start: yearMonth,
  end: yearMonth.nullable(),
  location: text.optional(),
  workplace: z.enum(['On-site', 'Hybrid', 'Remote']).optional(),
  lead: text.optional(),
  summary: text,
  bullets: z.array(text).optional(),
  skills: z.array(text).optional(),
});

const roles = defineCollection({
  loader: file('src/data/roles.yaml'),
  schema: z
    .object({
      name: text,
      logo: image.optional(),
      initials: z.string().max(3).optional(),
      pills: z
        .array(
          z.object({
            label: text,
            kind: z.enum(['neutral', 'acquired', 'award']),
            href: z.url().optional(),
          }),
        )
        .optional(),
      roles: z.array(role).min(1),
    })
    .refine((c) => c.logo || c.initials, 'A company needs a logo or initials'),
});

const education = defineCollection({
  loader: file('src/data/education.yaml'),
  schema: z.object({
    school: text,
    logo: image,
    degrees: z.array(
      z.object({
        id: text,
        title: text,
        detail: text.optional(),
        note: text.optional(),
        coursework: z.array(text).optional(),
      }),
    ),
  }),
});

const recommendations = defineCollection({
  loader: file('src/data/recommendations.yaml'),
  schema: z.object({
    name: text,
    title: text,
    linkedin: z.url(),
    photo: image,
    date: z.coerce.date(),
    relation: text,
    quote: text,
  }),
});

const howIWork = defineCollection({
  loader: file('src/data/howIWork.yaml'),
  schema: z.object({
    heading: text,
    lead: text,
    items: z.array(z.object({ title: text, text })),
  }),
});

const trips = defineCollection({
  loader: file('src/data/trips.yaml'),
  schema: z.object({ place: text, country: text, photo: image }),
});

const gallery = defineCollection({
  loader: file('src/data/gallery.yaml'),
  schema: z.object({
    portrait: image,
    heading: text,
    text,
    caption: text,
    photos: z.array(image).min(2),
  }),
});

const labelled = (item: z.ZodType) => z.object({ heading: text, items: z.array(item).min(1) });

const beyond = defineCollection({
  loader: file('src/data/beyond.yaml'),
  schema: z.object({
    heading: text,
    intro: text,
    tripsHeading: text,
    hobbies: labelled(text),
    books: labelled(z.object({ title: text, author: text })),
    music: labelled(text).extend({ playlist: z.url().optional() }),
    askMeAbout: labelled(text),
    now: labelled(z.object({ label: text, text })),
  }),
});

const search = defineCollection({
  loader: file('src/data/search.yaml'),
  schema: z.object({
    inputLabel: text,
    placeholder: text,
    closeLabel: text,
    closeText: text,
    jumpHeading: text,
    resultsHeading: text,
    noResults: text.includes('{q}'),
    suggestions: z.array(text).min(1),
    jumpTo: z.array(
      z
        .object({
          title: text,
          sub: text.optional(),
          target: text.optional(),
          action: z.enum(['contact', 'linkedin']).optional(),
        })
        .refine((j) => !!j.target !== !!j.action, 'Give a jump either a target or an action'),
    ),
    about: z.object({ title: text, sub: text }),
    recognition: z.object({ company: text, sub: text, keywords: text }),
    education: z.object({
      school: z.object({ sub: text, keywords: text }),
      degrees: z.record(z.string(), z.object({ sub: text, coursework: text.optional() })),
    }),
    contact: z.object({ keywords: text }),
  }),
});

export const collections = {
  search,
  profile,
  results,
  competencies,
  roles,
  education,
  recommendations,
  howIWork,
  trips,
  gallery,
  beyond,
};
