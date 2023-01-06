import { Ref } from "@typegoose/typegoose";
import { Post } from "../model/post.model";

import UserModel, { User } from "../model/user.model";

export async function createUser(input: Partial<User>) {
  return UserModel.create(input);
}

export async function findUserById(id: string) {
  return UserModel.findById(id);
}

export async function findUserByRef(ref: Ref<User>) {
  // if(ref === undefined){ return; }
  return UserModel.findById(ref) // todo check ???
}

export async function findUserByEmail(email: string) {
  return UserModel.findOne({ email });
}


