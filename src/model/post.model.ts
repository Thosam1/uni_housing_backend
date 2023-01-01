import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import { User } from "./user.model";
 
export class Post {
    @prop({ ref: () => User }) // owner
    user: Ref<User>; // typescript -> reference -> id

    @prop({ required: true })
    title: string;

    @prop({ required: true })
    location: string;

    @prop({ required: true })
    description: string;

    @prop({ required: true })
    price: string;

    // @prop({ required: true })
    // photos: string;
}

// exported using @typegoose
const PostModel = getModelForClass(Post);

export default PostModel;