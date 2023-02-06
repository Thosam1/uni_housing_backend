/* server side validation */
import { object, string, TypeOf } from "zod"; // for validation

const MIN_NAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 6;
const MIN_STATUS_LENGTH = 5;
const MAX_STATUS_LENGTH = 50;
const MIN_BIO_LENGTH = 10;
const MAX_BIO_LENGTH = 1000;

export const createUserSchema = object({
  body: object({
    firstName: string({
      required_error: "First name is required",
    }),
    lastName: string({
      required_error: "Last name is required",
    }),
    password: string({
      required_error: "Password is required",
    }).min(MIN_PASSWORD_LENGTH, `Password is too short - should be min ${MIN_PASSWORD_LENGTH} chars`),
    confirmPassword: string({
      required_error: "Password confirmation is required",
    }),
    email: string({
      required_error: "Email is required",
    }).email("Not a valid email"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});

export const verifyUserSchema = object({
  params: object({
    id: string(),
    verificationCode: string(),
  }),
});

export const forgotPasswordSchema = object({
  body: object({
    email: string({
      required_error: "Email is required",
    }).email("Not a valid email"),
  }),
});

export const resetPasswordSchema = object({
  params: object({
    id: string(),
    passwordResetCode: string(),
  }),
  body: object({
    password: string({
      required_error: "Password is required",
    }).min(MIN_PASSWORD_LENGTH, `Password is too short - should be min ${MIN_PASSWORD_LENGTH} chars`),
    confirmPassword: string({
      required_error: "Password confirmation is required",
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});

// settings ---
export const editProfileSchema = object({
  body: object({
    id: string(),
    newFirstName: string({
      required_error: "First name is required",
    }).min(MIN_NAME_LENGTH, `First name is too shord - should be min ${MIN_NAME_LENGTH} chars`),
    newLastName: string({
      required_error: "Last name is required",
    }).min(MIN_NAME_LENGTH, `Last name is too shord - should be min ${MIN_NAME_LENGTH} chars`),
    newStatus: string().max(MAX_STATUS_LENGTH, `Status is too long - should be max ${MAX_STATUS_LENGTH} chars`),
    newBio: string().max(MAX_BIO_LENGTH, `Bio is too long - should be max ${MAX_BIO_LENGTH} chars`),
  }),
});

export const getOwnedPostsSchema = object({
  body: object({
    id: string() // user id
  }),
});

export const getSavedPostsSchema = object({
  body: object({
    id: string() // user id
  }),
});

export const getPublicUserSchema = object({
  params: object({
    id: string(),
  }),
})




// With zod, we can export the Schemas as interfaces !!!
export type CreateUserInput = TypeOf<typeof createUserSchema>["body"];

export type VerifyUserInput = TypeOf<typeof verifyUserSchema>["params"];

export type ForgotPasswordInput = TypeOf<typeof forgotPasswordSchema>["body"];

export type ResetPasswordInput = TypeOf<typeof resetPasswordSchema>; // has params and body !

export type EditProfileInput = TypeOf<typeof editProfileSchema>["body"];

export type getOwnedPostsInput = TypeOf<typeof getOwnedPostsSchema>["body"];

export type getSavedPostsInput = TypeOf<typeof getSavedPostsSchema>["body"];

export type getPublicUserInput = TypeOf<typeof getPublicUserSchema>["params"];


