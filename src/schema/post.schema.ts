/* server side validation */
import { object, string, TypeOf } from "zod"; // for validation

const MAX_TITLE_LENGTH = 30;
const MAX_DESCRIPTiON_LENGTH = 10000;

export const createPostSchema = object({
  body: object({
    user: string({
      required_error: "Owner id is required",
    }),
    title: string({
      required_error: "Title is required",
    }).max(
      MAX_TITLE_LENGTH,
      `Title is too long - should be max ${MAX_TITLE_LENGTH} chars`
    ),

    city: string({
      required_error: "City is required",
    }),
    country: string({
      required_error: "Country is required",
    }),

    startDate: string({
      required_error: "Start date is required",
    }),
    endDate: string({
      required_error: "End date is required",
    }),

    description: string({
      required_error: "Description confirmation is required",
    }).max(
      MAX_DESCRIPTiON_LENGTH,
      `Description is too long - should be max ${MAX_DESCRIPTiON_LENGTH} chars`
    ),
    price: string({
      required_error: "Price is required",
    }),
  }),
});

export const editPostSchema = object({
  params: object({
    id: string({
      required_error: "Post id is required",
    }),
  }),
  body: object({
    user_id: string({
      required_error: "Owner id is required",
    }),
    title: string({
      required_error: "Title is required",
    }).max(
      MAX_TITLE_LENGTH,
      `Title is too long - should be max ${MAX_TITLE_LENGTH} chars`
    ),
    city: string({
      required_error: "City is required",
    }),
    country: string({
      required_error: "Country is required",
    }),
    startDate: string({
      required_error: "Start date is required",
    }),
    endDate: string({
      required_error: "End date is required",
    }),
    description: string({
      required_error: "Description confirmation is required",
    }).max(
      MAX_DESCRIPTiON_LENGTH,
      `Description is too long - should be max ${MAX_DESCRIPTiON_LENGTH} chars`
    ),
    price: string({
      required_error: "Price is required",
    }),
  }),
});

export const editImagesSchema = object({
  params: object({
    id: string({
      required_error: "Post id is required",
    }),
  }),
});

export const deletePostSchema = object({
  params: object({
    id: string({
      required_error: "Post id is required",
    }),
  }),
});

export const saveUnsavePostSchema = object({
  params: object({
    id: string(),
  }),
});

export const getPostSchema = object({
  params: object({
    id: string(),
  }),
});

// export const getAllPostsSchema = object({}); // no need, should be able to get everything as long as the user has an access token

export type createPostInput = TypeOf<typeof createPostSchema>["body"];

export type editImagesInput = TypeOf<typeof editImagesSchema>["params"];

export type editPostInput = TypeOf<typeof editPostSchema>;

export type deletePostInput = TypeOf<typeof deletePostSchema>["params"];

export type getPostInput = TypeOf<typeof getPostSchema>["params"];

export type saveUnsavePostInput = TypeOf<typeof saveUnsavePostSchema>["params"];
