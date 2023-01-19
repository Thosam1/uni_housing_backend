import { getModelForClass, pre, prop, Ref } from "@typegoose/typegoose";
import { model } from "mongoose";
import UserModel, { User } from "./user.model";

// stuff we do not want to send to the client
export const postPrivateFields = ["__v", "savedBy"];

export const postPreview = ["__v", "savedBy", "description", "shareLink"]

type Location = {
  city: string;
  country: string;
}

type Date = {
  start: string;
  end: string;
}

export class Post {
  @prop({ ref: () => User }) // owner
  user: Ref<User>; // typescript -> reference -> id

  @prop({ required: true })
  title: string;

  @prop({ required: true })
  city: string;
  
  @prop({ required: true })
  country: string;

  @prop({ required: true })
  startDate: string;

  @prop({ required: true })
  endDate: string;

  @prop({ required: true })
  description: string;

  @prop({ required: true })
  price: string;

  @prop({ required: false, default: [] })
  images: string[];

  @prop({ required: false, default: [] })
  savedBy: Ref<User>[];

  @prop({ required: false, default: "" })
  shareLink: string;
}

// exported using @typegoose
const PostModel = getModelForClass(Post, {
  schemaOptions: {
    timestamps: true,
  },
});

export default PostModel;
