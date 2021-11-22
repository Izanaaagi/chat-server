import { define } from 'typeorm-seeding';
import User from '../entities/user.entity';
import Faker from 'faker';
import * as bcrypt from 'bcrypt';

define(User, (faker: typeof Faker) => {
  const email: string = faker.internet.email();
  const name: string = faker.name.firstName();
  const password = bcrypt.hashSync('12345678', 10);

  const user: User = new User();
  user.name = name;
  user.email = email;
  user.password = password;
  return user;
});
