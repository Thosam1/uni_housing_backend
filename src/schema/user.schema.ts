/* server side validation */
import { object, string, TypeOf } from "zod"; // for validation

const MIN_NAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 6;
const MIN_STATUS_LENGTH = 5;
const MAX_STATUS_LENGTH = 20;
const MIN_BIO_LENGTH = 10;
const MAX_BIO_LENGTH = 200;

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
export const changeFirstNameSchema = object({
  body: object({
    id: string(),
    newFirstName: string({
      required_error: "First name is required",
    }).min(MIN_NAME_LENGTH, `First name is too shord - should be min ${MIN_NAME_LENGTH} chars`),
  }),
});

export const changeLastNameSchema = object({
  body: object({
    id: string(),
    newLastName: string({
      required_error: "Last name is required",
    }).min(MIN_NAME_LENGTH, `Last name is too shord - should be min ${MIN_NAME_LENGTH} chars`),
  }),
});

export const changeStatusSchema = object({
  body: object({
    id: string(),
    newStatus: string({
      required_error: "New status is required",
    }).min(MIN_STATUS_LENGTH, `Status is too shord - should be min ${MIN_STATUS_LENGTH} chars`),
  }),
});

export const changeBioSchema = object({
  body: object({
    id: string(),
    newBio: string({
      required_error: "New bio is required",
    }).min(MIN_BIO_LENGTH, `Bio is too shord - should be min ${MIN_BIO_LENGTH} chars`),
  }),
});


// With zod, we can export the Schemas as interfaces !!!
export type CreateUserInput = TypeOf<typeof createUserSchema>["body"];

export type VerifyUserInput = TypeOf<typeof verifyUserSchema>["params"];

export type ForgotPasswordInput = TypeOf<typeof forgotPasswordSchema>["body"];

export type ResetPasswordInput = TypeOf<typeof resetPasswordSchema>; // has params and body !

export type ChangeFirstNameInput = TypeOf<typeof changeFirstNameSchema>["body"];

export type ChangeLastNameInput = TypeOf<typeof changeLastNameSchema>["body"];

export type ChangeStatusInput = TypeOf<typeof changeStatusSchema>["body"];

export type ChangeBioInput = TypeOf<typeof changeBioSchema>["body"];


