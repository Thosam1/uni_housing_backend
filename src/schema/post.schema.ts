/* server side validation */
import { object, string, TypeOf } from "zod"; // for validation

export const createPostSchema = object({
  body: object({
    user: string({
      required_error: "Owner id is required",
    }),
    title: string({
      required_error: "Title is required",
    }),
    location: string({
      required_error: "Location is required",
    }),
    description: string({
      required_error: "Description confirmation is required",
    }),
    price: string({
      required_error: "Price is required",
    }),
  }),
});

export const editPostSchema = object({
  body: object({
    post_id: string({
      required_error: "Post id is required",
    }),
    user_id: string({
      required_error: "Owner id is required",
    }),
    title: string({
      required_error: "Title is required",
    }),
    location: string({
      required_error: "Location is required",
    }),
    description: string({
      required_error: "Description confirmation is required",
    }),
    price: string({
      required_error: "Price is required",
    }),
  }),
});

export const deletePostSchema = object({
  body: object({
    post_id: string({
      required_error: "Post id is required",
    }),
    user_id: string({
      required_error: "Owner id is required",
    }),
  }),
});

export const saveUnsavePostSchema = object({
  body: object({
    user_id: string({
      required_error: "User id is required",
    }),
    post_id: string({
      required_error: "Post id is required",
    }),
  }),
});

export const getPostSchema = object({
  params: object({
    id: string(),
  }),
});

// export const getAllPostsSchema = object({}); // no need, should be able to get everything as long as the user has an access token

export type createPostInput = TypeOf<typeof createPostSchema>["body"];

export type editPostInput = TypeOf<typeof editPostSchema>["body"];

export type deletePostInput = TypeOf<typeof deletePostSchema>["body"];

export type getPostInput = TypeOf<typeof getPostSchema>["params"];

export type saveUnsavePostInput = TypeOf<typeof saveUnsavePostSchema>["body"];

