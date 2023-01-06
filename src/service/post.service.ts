import PostModel, { Post } from "../model/post.model";

export async function createPost(input: {
  user: string;
  title: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  description: string;
  price: string;
}) {
  return PostModel.create(input);
}

export async function findPostById(id: string) {
    return PostModel.findById(id);
}

export async function deletePostById(id: string) {
    return PostModel.deleteOne({ _id: id });
}

// this one we create a route with a handler
// export async function addPostToUserSavedPosts(postID: string, userID: string) {
    
// }
