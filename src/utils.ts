import { User } from "./types";

export function sortUsers(array: User[]) {
  return array.sort((user1: User, user2: User) => {
    const a = user1.name.toUpperCase();
    const b = user2.name.toUpperCase();

    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
}
