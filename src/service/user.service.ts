import UserModel, { User } from "../model/user.model";

export function createUser(input: Partial<User>) {
  return UserModel.create(input);
}

export function findUserById(id: string) {
  return UserModel.findById(id);
}

export function findUserByEmail(email: string) {
  return UserModel.findOne({ email });
}

// export function changeFirstName(id: string, firstName: string) {
//   return UserModel.findByIdAndUpdate(id, { firstName: firstName })
// }

// export function changeLastName(id: string, lastName: string) {
//   UserModel.findByIdAndUpdate(id, { lastName: lastName })
// }

// export function changeStatus(id: string, status: string) {
//   UserModel.findByIdAndUpdate(id, { status: status})
// }

export function changeBio(id: string, bio: string) {
  UserModel.findByIdAndUpdate(id, { bio: bio })
}
