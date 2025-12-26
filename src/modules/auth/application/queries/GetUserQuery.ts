import { Query } from "../../../../core/application/Query";

export class GetUserQuery implements Query {
  constructor(public readonly userId: string) {}
}
