import { Ref } from "@typegoose/typegoose";
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

// must check before if postID and userID both are valid and corresponds
export async function addPostToUserOwnedPosts(userID: string, postID: string) {
 
}

export async function addPostToUserSavedPosts(userID: string, postID: string) {

}
