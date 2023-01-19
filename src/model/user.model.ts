import {
  getModelForClass,
  modelOptions,
  prop,
  Severity,
  pre,
  DocumentType,
  index,
  Ref,
} from "@typegoose/typegoose";
import { nanoid } from "nanoid";
import argon2 from "argon2";
import log from "../utils/logger";
import { Post } from "./post.model";

// stuff we do not want to send to public
export const userPrivateFields = [
  "password",
  "__v",
  "verificationCode",
  "passwordResetCode",
  "verified",
  "savedPosts",
  "email",
];

// stuff we do not want to send, even to the user
export const userCrucialFields = [
  "password",
  "__v",
  "verificationCode",
  "passwordResetCode",
  "verified",
]

// presaved hook, to hash the password before putting it in the database
@pre<User>("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  // todo add also salt in the future
  const hash = await argon2.hash(this.password);
  this.password = hash;

  return;
})

// adding an index to find quicker when looking up by email addresses
@index({ email: 1 })

// default by @typegoose
@modelOptions({
  schemaOptions: {
    timestamps: true, // created_at / updated_at -> added to our model
  },
  options: {
    allowMixed: Severity.ALLOW, // so when password reset -> we set it back to null, so cannot reset with old code
  },
})

/* Class User - in MongoDB */
export class User {

  // email must be lowercase, unique and all user must have an email address
  // set experimentalDecorator: true and strictPropertyInitialization: false in tsconfig.json
  @prop({ lowercase: true, required: true, unique: true })
  email: string;

  @prop({ required: true })
  firstName: string;

  @prop({ required: true })
  lastName: string;

  @prop({ required: false, default: '' })
  avatar: string;

  @prop({ required: false, default: '' })
  status: string;

  @prop({ required: false, default: '' })
  bio: string;

  @prop({ required: false, default: [] })
  ownedPosts: Ref<Post>[];

  @prop({ required: false, default: [] })
  savedPosts: Ref<Post>[];

  @prop({ required: true })
  password: string;

  @prop({ required: true, default: () => nanoid() })
  verificationCode: string;

  // no props becaus no need to set until someone request 
  @prop()
  passwordResetCode: string | null;

  // when first register, this is false, once they verify, this is set to true
  @prop({ default: false })
  verified: boolean;

  // methods of the class ---

  // validate if password given corresponds to password in the database
  async validatePassword(this: DocumentType<User>, candidatePassword: string) {
    try {
      // verify hashed password against the candidatePassword
      return await argon2.verify(this.password, candidatePassword);
    } catch (e) {
      log.error(e, "Could not validate password");
      return false;
    }
  }
}

// exported using @typegoose
const UserModel = getModelForClass(User);

export default UserModel;
