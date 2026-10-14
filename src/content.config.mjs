// Blog posts live in /_posts at the repo root (the existing publishing workflow writes there).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { postSlug } from '../tools/post-slug.js';

const posts = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './_posts',
    generateId: ({ entry }) => postSlug(entry),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string().trim()).default([]),
  }),
});

export const collections = { posts };
