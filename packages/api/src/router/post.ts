import { z } from "zod";

import { CreatePostSchema } from "@acme/validators";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.post.findMany({
      orderBy: {
        id: "desc",
      },
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.post.findUnique({
        where: {
          id: input.id,
        },
      });
    }),

  create: publicProcedure.input(CreatePostSchema).mutation(({ ctx, input }) => {
    return ctx.db.post.create({
      data: {
        title: input.title,
        content: input.content,
      },
    });
  }),

  delete: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.post.delete({
      where: {
        id: input,
      },
    });
  }),
});
