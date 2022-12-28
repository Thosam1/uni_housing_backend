import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import { User } from "./user.model";
 
export class Session {
  @prop({ ref: () => User }) // mongoose
  user: Ref<User>; // typescript -> reference

  @prop({ default: true }) // when logout, set to false and cannot create refresh token anymore
  valid: boolean;
}

const SessionModel = getModelForClass(Session, {
  schemaOptions: {
    timestamps: true,
  },
});

export default SessionModel;
